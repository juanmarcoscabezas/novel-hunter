/**
 * Procesa y limpia el contenido traducido por Gemini proveniente de WTR-LAB.
 * Sustituye marcadores de glosario (ej: ※29⛬) con los términos oficiales en inglés.
 * 
 * @param {Array<string>|string} rawBody 
 * @param {object} glossaryData Objeto que contiene { terms: [ [en, raw], ... ] }
 * @returns {Array<string>} Lista de párrafos limpios
 */
export function processGeminiContent(rawBody, glossaryData = null) {
  if (!rawBody) return [];

  const paragraphs = Array.isArray(rawBody) ? rawBody : [rawBody];
  const terms = glossaryData?.terms || [];

  const cleaned = [];

  for (const paragraph of paragraphs) {
    if (!paragraph || typeof paragraph !== 'string') continue;

    // Detectar separador o etiqueta de modelo
    if (/^\[part:[\w-.\d]+\]/.test(paragraph.trim())) {
      // Ignorar o registrar si se desea
      continue;
    }

    // Reemplazo de marcadores de glosario: ※123⛬, ※123〓, ※123〘, etc.
    const replaced = paragraph.replace(/※(\d+)[⛬〓〘〙【】]?/g, (match, indexStr) => {
      const idx = parseInt(indexStr, 10);
      const termEntry = terms[idx];
      if (termEntry && termEntry[0]) {
        // termEntry[0] es la traducción en inglés del término
        return termEntry[0].replace(/_/g, ' ');
      }
      return match;
    });

    // Limpieza de espacios y caracteres redundantes
    const trimmed = replaced.replace(/\s+/g, ' ').trim();
    if (trimmed.length > 0) {
      cleaned.push(trimmed);
    }
  }

  return cleaned;
}
