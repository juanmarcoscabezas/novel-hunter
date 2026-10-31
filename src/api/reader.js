import { client } from './client.js';
import { decryptContent } from '../crypto/aes.js';
import { processGeminiContent } from '../translators/gemini.js';
import { translateWithGoogle } from '../translators/google.js';
import { repository } from '../db/repository.js';

/**
 * Descarga y procesa un capítulo respetando las prioridades de traducción:
 * 1. Comprueba si ya existe en la base de datos local SQLite (Caché inteligente).
 * 2. Prioridad: Gemini (traducción AI con sustitución de glosario).
 * 3. Fallback: Web (descifrado AES-GCM + Google Translate).
 * 4. Si targetLang es 'es', traduce el resultado final al español.
 * 5. Almacena el resultado normalizado en SQLite.
 * 
 * @param {number} rawId ID crudo de la novela
 * @param {number} chapterNo Número/orden del capítulo
 * @param {object} options Opciones ({ targetLang: 'en' | 'es', ignoreCache: boolean, novelMeta: object })
 * @returns {Promise<{ chapterNo: number, title: string, model: string, paragraphs: Array<string>, source: string, fromDb?: boolean }>}
 */
export async function fetchChapter(rawId, chapterNo, options = {}) {
  const targetLang = options.targetLang || 'en';

  // 0. Comprobar si ya existe en la base de datos local
  if (!options.ignoreCache) {
    const cached = repository.getChapterTranslation(rawId, chapterNo, targetLang);
    if (cached && cached.paragraphs && cached.paragraphs.length > 0) {
      return { ...cached, fromDb: true };
    }
  }

  let result = null;

  // 1. Intentar con prioridad Gemini ('ai')
  try {
    const aiRes = await client.post('/api/reader/get', {
      raw_id: rawId,
      chapter_no: chapterNo,
      language: 'en',
      translate: 'ai'
    });

    if (aiRes && aiRes.success && aiRes.content_url) {
      const contentRes = await client.get(aiRes.content_url);
      const chapterData = contentRes?.data?.data;

      if (chapterData && chapterData.body) {
        let rawBody = chapterData.body;
        // Si por alguna razón estuviera cifrado, descifrar
        if (typeof rawBody === 'string' && (rawBody.startsWith('arr:') || rawBody.startsWith('str:'))) {
          rawBody = await decryptContent(rawBody);
        }

        // Guardar términos de glosario si vienen en la respuesta
        if (chapterData.glossary_data?.terms) {
          repository.saveGlossaryTerms(rawId, chapterData.glossary_data.terms, 'en');
        }

        // Procesar glosario y limpiar texto
        let paragraphs = processGeminiContent(rawBody, chapterData.glossary_data);
        const modelName = chapterData.model || 'Gemini 3.5 Flash';
        let title = chapterData.title || aiRes.chapter?.title || `Capítulo ${chapterNo}`;
        if (title && chapterData.glossary_data) {
          const [cleanedTitle] = processGeminiContent([title], chapterData.glossary_data);
          if (cleanedTitle) title = cleanedTitle;
        }

        // Si se solicitó español, traducir el texto en inglés al español
        if (targetLang === 'es' && paragraphs.length > 0) {
          paragraphs = await translateWithGoogle(paragraphs, 'es', 'en');
          const [translatedTitle] = await translateWithGoogle([title], 'es', 'en');
          if (translatedTitle) title = translatedTitle;
        }

        result = {
          chapterNo,
          title,
          rawTitle: aiRes.chapter?.raw_title || null,
          model: `Gemini (${modelName})`,
          paragraphs,
          source: 'gemini'
        };
      }
    }
  } catch (err) {
    // Si falla Gemini o está bloqueado, continuará al fallback
  }

  // 2. Fallback a Google Translate ('web') si no se obtuvo por Gemini
  if (!result) {
    const webRes = await client.post('/api/reader/get', {
      raw_id: rawId,
      chapter_no: chapterNo,
      language: 'en',
      translate: 'web'
    });

    if (!webRes || !webRes.success || !webRes.content_url) {
      throw new Error(`No se pudo obtener el capítulo ${chapterNo}. Código/Error: ${webRes?.code || webRes?.error || 'Desconocido'}`);
    }

    const webContentRes = await client.get(webRes.content_url);
    const webData = webContentRes?.data?.data;
    if (!webData || !webData.body) {
      throw new Error(`El capítulo ${chapterNo} no contiene cuerpo de texto.`);
    }

    // Descifrar contenido AES-GCM
    let rawBody = webData.body;
    if (typeof rawBody === 'string' && (rawBody.startsWith('arr:') || rawBody.startsWith('str:'))) {
      rawBody = await decryptContent(rawBody);
    }

    const rawParagraphs = Array.isArray(rawBody) ? rawBody : [rawBody];
    let title = webRes.chapter?.title || webData.title || `Capítulo ${chapterNo}`;

    // Traducir de chino al idioma objetivo ('en' o 'es')
    const translatedParagraphs = await translateWithGoogle(rawParagraphs, targetLang, 'zh-CN');
    
    if (targetLang === 'es' && title) {
      const [translatedTitle] = await translateWithGoogle([title], 'es', 'auto');
      if (translatedTitle) title = translatedTitle;
    }

    result = {
      chapterNo,
      title,
      rawTitle: webRes.chapter?.raw_title || null,
      model: 'Google Translate',
      paragraphs: translatedParagraphs,
      source: 'google'
    };
  }

  // 3. Persistir en la base de datos normalizada SQLite
  if (result) {
    try {
      repository.saveChapterTranslation(rawId, chapterNo, {
        language: targetLang,
        title: result.title,
        rawTitle: result.rawTitle,
        model: result.model,
        source: result.source,
        paragraphs: result.paragraphs
      }, options.novelMeta);
    } catch (dbErr) {
      console.error('Aviso al guardar en SQLite:', dbErr.message);
    }
  }

  return result;
}
