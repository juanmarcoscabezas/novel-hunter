import { client } from './client.js';

/**
 * Busca novelas por nombre o término clave en WTR-Lab.
 * @param {string} keyword 
 * @returns {Promise<Array>} Lista de novelas encontradas
 */
export async function searchNovels(keyword) {
  if (!keyword || !keyword.trim()) return [];

  const res = await client.post('/api/search', { text: keyword.trim() });
  if (!res || !res.success || !Array.isArray(res.data)) {
    return [];
  }

  return res.data.map(item => ({
    id: item.id,
    rawId: item.raw_id || item.raws?.[0]?.id || item.id,
    slug: item.slug,
    title: item.data?.title || item.title || item.slug,
    author: item.data?.author || item.author || 'Desconocido',
    chapterCount: item.chapter_count || item.raw_chapter_count || 0,
    image: item.data?.image || null,
    description: item.data?.description || ''
  }));
}

/**
 * Extrae el raw_id y slug a partir de una URL de novela de WTR-LAB.
 * Formatos admitidos:
 * - https://wtr-lab.com/en/novel/112330/slug-name
 * - https://wtr-lab.com/en/novel/112330/slug-name/chapter-5
 * - /novel/112330/slug-name
 * 
 * @param {string} urlString 
 * @returns {{ rawId: number, slug: string } | null}
 */
export function parseNovelUrl(urlString) {
  if (!urlString) return null;

  const match = urlString.match(/\/novel\/(\d+)(?:\/([^\/\?#]+))?/i);
  if (match) {
    return {
      rawId: parseInt(match[1], 10),
      slug: match[2] || `novel-${match[1]}`
    };
  }

  return null;
}

/**
 * Obtiene la lista completa de capítulos de una novela por su rawId.
 * @param {number|string} rawId 
 * @returns {Promise<Array>} Lista de capítulos ordenados
 */
export async function getChapterList(rawId) {
  const res = await client.get(`/api/chapters/${rawId}`);
  if (!res || !Array.isArray(res.chapters)) {
    throw new Error(`No se pudo obtener el listado de capítulos para rawId: ${rawId}`);
  }

  return res.chapters.map(ch => ({
    id: ch.id,
    order: ch.order,
    title: ch.title || `Chapter ${ch.order}`,
    rawTitle: ch.name || '',
    updatedAt: ch.updated_at
  })).sort((a, b) => a.order - b.order);
}
