import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config.js';
import { sanitizeFilename } from './writer.js';

/**
 * Fusiona varios capítulos en un único documento de texto (.txt).
 * 
 * @param {string} novelSlug Slug identificador de la novela
 * @param {Array<object>} chapters Lista de capítulos ordenados { chapterNo, title, model, paragraphs }
 * @param {string} novelTitle Título descriptivo de la novela
 * @returns {string} Ruta absoluta del archivo fusionado
 */
export function mergeChaptersToTxt(novelSlug, chapters, novelTitle = '') {
  if (!chapters || chapters.length === 0) {
    throw new Error('No hay capítulos para fusionar');
  }

  const safeSlug = sanitizeFilename(novelSlug);
  const targetDir = path.join(CONFIG.downloadsDir, safeSlug);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const firstNo = chapters[0].chapterNo;
  const lastNo = chapters[chapters.length - 1].chapterNo;
  const fileName = `${safeSlug}_Capitulos_${firstNo}-${lastNo}.txt`;
  const filePath = path.join(targetDir, fileName);

  const sections = [];

  // Portada e índice general
  sections.push([
    `============================================================`,
    `NOVELA: ${novelTitle || novelSlug.toUpperCase()}`,
    `COMPILACIÓN DE CAPÍTULOS: ${firstNo} al ${lastNo}`,
    `Total de Capítulos: ${chapters.length}`,
    `Generado: ${new Date().toLocaleString()}`,
    `============================================================\n`,
    `--- ÍNDICE ---`
  ].join('\n'));

  for (const ch of chapters) {
    sections.push(`  • Capítulo ${ch.chapterNo}: ${ch.title} [${ch.model}]`);
  }

  sections.push('\n\n============================================================\n');

  // Contenido de cada capítulo
  for (const ch of chapters) {
    sections.push([
      `\n\n############################################################`,
      `# CAPÍTULO ${ch.chapterNo}: ${ch.title}`,
      `# Motor: ${ch.model}`,
      `############################################################\n\n`,
      ch.paragraphs.join('\n\n')
    ].join('\n'));
  }

  fs.writeFileSync(filePath, sections.join('\n'), 'utf8');
  return filePath;
}
