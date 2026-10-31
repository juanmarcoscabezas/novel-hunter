import { repository } from '../db/repository.js';
import { translateWithGoogle } from '../translators/google.js';
import { fetchChapter } from '../api/reader.js';
import { saveChapterAsTxt } from '../storage/writer.js';
import { getGeminiApiKey } from '../config.js';

/**
 * Traduce una lista de párrafos al idioma objetivo.
 * Si el usuario configuró una clave de Gemini AI, intenta traducirlos con Gemini 1.5 Flash.
 * Si falla o no hay clave, recurre a Google Translate (gratuito, sin clave y de alta velocidad).
 * 
 * @param {Array<string>|string} paragraphs Párrafos a traducir
 * @param {string} targetLang Idioma destino ('es')
 * @param {string} sourceLang Idioma origen ('en')
 * @returns {Promise<Array<string>>} Párrafos traducidos
 */
export async function translateText(paragraphs, targetLang = 'es', sourceLang = 'en') {
  const pList = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
  if (pList.length === 0) return [];

  const apiKey = getGeminiApiKey();

  // 1. Si hay clave de Gemini disponible, intentar con Gemini AI
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const geminiResult = await translateWithGemini(pList, targetLang, sourceLang, apiKey.trim());
      if (geminiResult && geminiResult.length > 0) {
        return geminiResult;
      }
    } catch (geminiErr) {
      console.warn('Fallo en traducción con Gemini AI, recurriendo a Google Translate:', geminiErr.message);
    }
  }

  // 2. Google Translate como motor estándar de alta confiabilidad
  return await translateWithGoogle(pList, targetLang, sourceLang);
}

/**
 * Traduce un lote de párrafos usando el modelo Gemini de Google.
 */
async function translateWithGemini(paragraphs, targetLang, sourceLang, apiKey) {
  const DELIMITER = '\n\n[[--9999--]]\n\n';
  const joinedText = paragraphs.join(DELIMITER);

  const langNames = {
    es: 'Spanish (Español)',
    en: 'English'
  };
  const targetName = langNames[targetLang] || targetLang;
  const sourceName = langNames[sourceLang] || sourceLang;

  const prompt = `You are a professional literary novel translator.
Translate the following novel paragraphs from ${sourceName} into natural, fluent, and immersive ${targetName}.
Rules:
1. Maintain the exact same number of paragraphs and order.
2. Separate every paragraph with the exact token: [[--9999--]]
3. Do not add introductions, explanations, summaries, or conversational filler.
4. Output only the translated paragraphs separated by the delimiter.

Text to translate:
${joinedText}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API respondió con código HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawOutput) {
    throw new Error('Gemini API no devolvió contenido.');
  }

  const splitResult = rawOutput
    .split(/\[\[\s*--\s*9999\s*--\s*\]\]/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (splitResult.length === paragraphs.length) {
    return splitResult;
  }

  // Si los párrafos no concuerdan exactamente, retornar lo obtenido si es razonable
  return splitResult.length > 0 ? splitResult : paragraphs;
}

/**
 * Traduce un capítulo existente al español.
 * Si ya se encuentra en inglés en SQLite, traduce el texto localmente sin necesidad de re-descargar de WTR-Lab.
 * Si no está en SQLite, descarga y traduce el capítulo.
 * Guarda el resultado en SQLite bajo el idioma 'es' y en el archivo TXT correspondiente.
 * 
 * @param {number|string} novelId ID de la novela
 * @param {number} chapterNo Número de capítulo
 * @param {object} options Opciones ({ force: boolean })
 * @returns {Promise<object>} Capítulo traducido al español
 */
export async function translateChapterToSpanish(novelId, chapterNo, options = {}) {
  const numericId = Number(novelId);
  const numChapter = Number(chapterNo);
  const novel = repository.getNovel(numericId);

  // 1. Si ya existe en español en SQLite y no se fuerza, retornar directamente
  if (!options.force) {
    const existingEs = repository.getChapterTranslation(numericId, numChapter, 'es');
    if (existingEs && existingEs.paragraphs && existingEs.paragraphs.length > 0) {
      return existingEs;
    }
  }

  // 2. Comprobar si existe la versión en inglés en SQLite
  const existingEn = repository.getChapterTranslation(numericId, numChapter, 'en');

  if (existingEn && existingEn.paragraphs && existingEn.paragraphs.length > 0) {
    // Traducir los párrafos desde el texto en inglés ya almacenado
    const translatedParagraphs = await translateText(existingEn.paragraphs, 'es', 'en');

    // Traducir el título
    let translatedTitle = existingEn.title || `Capítulo ${numChapter}`;
    try {
      const [tTitle] = await translateWithGoogle([translatedTitle], 'es', 'en');
      if (tTitle && tTitle.trim().length > 0) {
        translatedTitle = tTitle.trim();
      }
    } catch {
      // Conservar el título original si falla
    }

    const esChapter = {
      chapterNo: numChapter,
      title: translatedTitle,
      rawTitle: existingEn.rawTitle,
      model: `${existingEn.model || 'Gemini AI'} + Google Translate`,
      source: 'google-translate',
      language: 'es',
      paragraphs: translatedParagraphs
    };

    // Persistir en SQLite (3NF)
    repository.saveChapterTranslation(numericId, numChapter, esChapter, novel);

    // Guardar archivo individual TXT en la carpeta de la novela
    if (novel && novel.slug) {
      try {
        saveChapterAsTxt(novel.slug, esChapter, novel.title);
      } catch (txtErr) {
        console.warn('Aviso al guardar TXT en español:', txtErr.message);
      }
    }

    return esChapter;
  }

  // 3. Si no existe en SQLite, descargarlo directamente en español
  const fetched = await fetchChapter(numericId, numChapter, {
    targetLang: 'es',
    novelMeta: novel
  });

  if (novel && novel.slug && fetched) {
    try {
      saveChapterAsTxt(novel.slug, fetched, novel.title);
    } catch (txtErr) {
      console.warn('Aviso al guardar TXT en español:', txtErr.message);
    }
  }

  return fetched;
}

/**
 * Traduce en lote una serie de capítulos de una novela al español con soporte para reportar progreso.
 * 
 * @param {number|string} novelId ID de la novela
 * @param {object} options Opciones ({ chapterNumbers: Array<number>, force: boolean })
 * @param {Function} onProgress Callback de progreso: ({ current, total, percent, chapterNo, status, cancelled, finished })
 * @param {Function} abortCheck Función que devuelve true si la operación debe cancelarse
 * @returns {Promise<object>} Estadísticas de la traducción
 */
export async function batchTranslateNovelToSpanish(novelId, options = {}, onProgress = null, abortCheck = null) {
  const numericId = Number(novelId);
  const chapterNumbers = options.chapterNumbers && options.chapterNumbers.length > 0
    ? options.chapterNumbers.map(Number)
    : repository.getUntranslatedChapterNumbers(numericId, 'en', 'es');

  const total = chapterNumbers.length;
  const results = {
    total,
    translatedCount: 0,
    failedCount: 0,
    cancelled: false,
    chapters: []
  };

  if (total === 0) {
    if (onProgress) {
      onProgress({
        current: 0,
        total: 0,
        percent: 100,
        status: 'Todos los capítulos descargados ya están en español.',
        finished: true
      });
    }
    return results;
  }

  for (let i = 0; i < total; i++) {
    if (abortCheck && abortCheck()) {
      results.cancelled = true;
      if (onProgress) {
        onProgress({
          current: i,
          total,
          percent: Math.round((i / total) * 100),
          status: 'Traducción cancelada por el usuario.',
          cancelled: true
        });
      }
      break;
    }

    const chapterNo = chapterNumbers[i];
    const percent = Math.round((i / total) * 100);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percent,
        chapterNo,
        status: `Traduciendo Capítulo ${chapterNo} a Español (${i + 1}/${total})...`
      });
    }

    try {
      const translated = await translateChapterToSpanish(numericId, chapterNo, { force: options.force });
      if (translated) {
        results.translatedCount++;
        results.chapters.push(translated);
      }
    } catch (err) {
      console.error(`Error al traducir capítulo ${chapterNo}:`, err.message);
      results.failedCount++;
    }

    // Pausa preventiva de cortesía
    await new Promise(r => setTimeout(r, 120));
  }

  if (onProgress && !results.cancelled) {
    onProgress({
      current: total,
      total,
      percent: 100,
      status: `¡Traducción completada! ${results.translatedCount} de ${total} capítulos traducidos a Español.`,
      finished: true
    });
  }

  return results;
}
