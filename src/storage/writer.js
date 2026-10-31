import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config.js';

/**
 * Sanitiza nombres de carpetas y archivos para que sean válidos en Linux y Windows.
 * @param {string} str 
 */
export function sanitizeFilename(str) {
  return str.replace(/[\\/:*?"<>|]+/g, '_').trim();
}

/**
 * Guarda un capítulo individual en formato TXT.
 * 
 * @param {string} novelSlug Nombre/slug de la novela
 * @param {object} chapter Objeto de capítulo { chapterNo, title, model, paragraphs }
 * @param {string} novelTitle Título de la novela
 * @returns {string} Ruta absoluta del archivo creado
 */
export function saveChapterAsTxt(novelSlug, chapter, novelTitle = '') {
  const safeSlug = sanitizeFilename(novelSlug);
  const targetDir = path.join(CONFIG.downloadsDir, safeSlug);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const paddedNum = String(chapter.chapterNo).padStart(4, '0');
  const safeTitle = sanitizeFilename(chapter.title || `Capitulo_${paddedNum}`);
  const fileName = `Capitulo_${paddedNum} - ${safeTitle}.txt`;
  const filePath = path.join(targetDir, fileName);

  const header = [
    `============================================================`,
    novelTitle ? `Novela: ${novelTitle}` : null,
    `Capítulo ${chapter.chapterNo}: ${chapter.title}`,
    `Motor de Traducción: ${chapter.model}`,
    `Fecha de Descarga: ${new Date().toLocaleString()}`,
    `============================================================\n\n`
  ].filter(Boolean).join('\n');

  const content = header + chapter.paragraphs.join('\n\n') + '\n';

  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}
