/**
 * Traduce texto utilizando el endpoint de Google Translate RPC.
 * Admite traducción de chino/inglés a cualquier idioma objetivo (por defecto 'en' o 'es').
 * 
 * @param {string|Array<string>} textInput Texto o lista de párrafos a traducir
 * @param {string} targetLang Idioma destino ('en', 'es', etc.)
 * @param {string} sourceLang Idioma origen ('auto', 'zh-CN', 'en')
 * @returns {Promise<Array<string>>} Párrafos traducidos
 */
export async function translateWithGoogle(textInput, targetLang = 'en', sourceLang = 'auto') {
  const paragraphs = Array.isArray(textInput) ? textInput : [textInput];
  if (paragraphs.length === 0) return [];

  const translatedParagraphs = [];
  const BATCH_CHAR_LIMIT = 800; // Límite seguro para caracteres multibyte y URL de Google Translate
  let currentBatch = [];
  let currentLength = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;

    if (currentLength + p.length > BATCH_CHAR_LIMIT && currentBatch.length > 0) {
      const batchResult = await translateBatch(currentBatch, targetLang, sourceLang);
      translatedParagraphs.push(...batchResult);
      currentBatch = [];
      currentLength = 0;
      // Breve pausa para cortesía con el servicio
      await new Promise(r => setTimeout(r, 150));
    }

    currentBatch.push(p);
    currentLength += p.length;
  }

  if (currentBatch.length > 0) {
    const batchResult = await translateBatch(currentBatch, targetLang, sourceLang);
    translatedParagraphs.push(...batchResult);
  }

  return translatedParagraphs;
}

/**
 * Traduce un lote de párrafos separados por un delimitador numérico inmune a traducción.
 */
async function translateBatch(batch, targetLang, sourceLang) {
  const DELIMITER = '\n\n[[--9999--]]\n\n';
  const joinedText = batch.join(DELIMITER);

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(joinedText)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Google Translate falló con código HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data[0])) {
    return batch; // Retorno de respaldo si el formato no es el esperado
  }

  // Concatenar segmentos devueltos por Google
  const fullTranslated = data[0].map(segment => segment[0]).join('');
  const splitParagraphs = fullTranslated
    .split(/\[\[\s*--\s*9999\s*--\s*\]\]/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return splitParagraphs;
}
