import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { CONFIG } from '../config.js';
import { sanitizeFilename } from './writer.js';
import { repository } from '../db/repository.js';

/**
 * Descarga u obtiene de caché el Buffer de la imagen de portada.
 * @param {string} coverSource URL o ruta local
 * @param {string} novelSlug Slug de la novela para caché
 * @returns {Promise<Buffer|null>}
 */
async function resolveCoverBuffer(coverSource, novelSlug) {
  if (!coverSource || typeof coverSource !== 'string') return null;

  // 1. Si es archivo local existente
  if (fs.existsSync(coverSource)) {
    try {
      return fs.readFileSync(coverSource);
    } catch (e) {
      return null;
    }
  }

  // 2. Comprobar si ya está en caché local
  const safeSlug = sanitizeFilename(novelSlug);
  const cacheDir = path.join(CONFIG.dataDir, 'covers');
  const cacheFile = path.join(cacheDir, `${safeSlug}.img`);
  if (fs.existsSync(cacheFile)) {
    try {
      return fs.readFileSync(cacheFile);
    } catch (e) {}
  }

  // 3. Descargar si es URL http/https
  if (coverSource.startsWith('http://') || coverSource.startsWith('https://')) {
    try {
      const res = await fetch(coverSource, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        // Guardar en caché para futuras exportaciones offline
        try {
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          fs.writeFileSync(cacheFile, buf);
        } catch (writeErr) {}
        return buf;
      }
    } catch (err) {
      console.warn(`[PDF] Aviso al descargar portada (${coverSource}): ${err.message}`);
    }
  }

  return null;
}

/**
 * Exporta uno o varios capítulos a un documento PDF profesional con portada e imagen.
 * 
 * @param {string} novelSlug Slug de la novela
 * @param {Array<object>} chapters Lista de capítulos { chapterNo, title, model, paragraphs }
 * @param {string} novelTitle Título de la novela
 * @param {object|string} [options] Opciones ({ customFileName, coverUrl, author, coverPage }) o string con customFileName
 * @returns {Promise<string>} Ruta del archivo PDF generado
 */
export async function exportChaptersToPdf(novelSlug, chapters, novelTitle = '', options = {}) {
  if (!chapters || chapters.length === 0) {
    throw new Error('No hay capítulos para exportar a PDF');
  }

  let customFileName = null;
  let coverUrl = null;
  let author = null;
  let forceCoverPage = false;

  if (typeof options === 'string') {
    customFileName = options;
  } else if (options && typeof options === 'object') {
    customFileName = options.customFileName || null;
    coverUrl = options.coverUrl || options.image || null;
    author = options.author || null;
    forceCoverPage = Boolean(options.coverPage);
  }

  // Si no se proporcionó portada ni autor, consultar SQLite
  if (!coverUrl || !author) {
    try {
      const dbNovel = repository.getNovel(novelSlug);
      if (dbNovel) {
        if (!coverUrl) coverUrl = dbNovel.cover_url;
        if (!author) author = dbNovel.author;
        if (!novelTitle) novelTitle = dbNovel.title;
      }
    } catch (e) {}
  }

  const safeSlug = sanitizeFilename(novelSlug);
  const targetDir = path.join(CONFIG.exportsDir, safeSlug);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let fileName = customFileName;
  if (!fileName) {
    if (chapters.length === 1) {
      const paddedNum = String(chapters[0].chapterNo).padStart(4, '0');
      fileName = `Capitulo_${paddedNum}.pdf`;
    } else {
      const firstNo = chapters[0].chapterNo;
      const lastNo = chapters[chapters.length - 1].chapterNo;
      fileName = `${safeSlug}_Capitulos_${firstNo}-${lastNo}.pdf`;
    }
  }

  const filePath = path.join(targetDir, fileName);
  const writeStream = fs.createWriteStream(filePath);

  // Intentar resolver la imagen de portada antes de escribir el PDF
  const coverBuffer = await resolveCoverBuffer(coverUrl, safeSlug);

  return new Promise((resolve, reject) => {
    // Inicializar documento PDF con buffer para conteo de páginas
    const doc = new PDFDocument({
      size: 'A4',
      margin: 54, // 0.75 pulgadas
      bufferPages: true,
      info: {
        Title: novelTitle || novelSlug,
        Author: author || 'WTR-Lab Downloader',
        Subject: `Capítulos ${chapters[0].chapterNo} a ${chapters[chapters.length - 1].chapterNo}`
      }
    });

    doc.pipe(writeStream);

    // Portada si son varios capítulos o se solicitó explícitamente
    const hasCoverPage = chapters.length > 1 || forceCoverPage || Boolean(coverBuffer);
    if (hasCoverPage) {
      if (coverBuffer) {
        // Portada con imagen centrada
        doc.moveDown(1);
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a').text(novelTitle || novelSlug, { align: 'center' });

        if (author) {
          doc.moveDown(0.3);
          doc.fontSize(12).font('Helvetica').fillColor('#475569').text(`Autor: ${author}`, { align: 'center' });
        }

        doc.moveDown(0.8);
        const maxImgWidth = 220;
        const maxImgHeight = 300;
        const x = (doc.page.width - maxImgWidth) / 2;
        const y = doc.y;

        try {
          doc.image(coverBuffer, x, y, { fit: [maxImgWidth, maxImgHeight], align: 'center' });
          doc.y = y + maxImgHeight + 18;
        } catch (imgErr) {
          console.warn('[PDF] Aviso al insertar imagen en PDF:', imgErr.message);
          doc.moveDown(3);
        }

        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e293b').text(
          chapters.length === 1
            ? `Capítulo ${chapters[0].chapterNo}`
            : `Compilación de Capítulos ${chapters[0].chapterNo} al ${chapters[chapters.length - 1].chapterNo}`,
          { align: 'center' }
        );
        doc.moveDown(0.4);
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b').text(`Generado: ${new Date().toLocaleDateString()}`, { align: 'center' });
      } else {
        // Portada clásica tipográfica
        doc.moveDown(4);
        doc.fontSize(24).font('Helvetica-Bold').text(novelTitle || novelSlug, { align: 'center' });
        if (author) {
          doc.moveDown(0.5);
          doc.fontSize(13).font('Helvetica').fillColor('#475569').text(`Autor: ${author}`, { align: 'center' });
        }
        doc.moveDown(1);
        doc.fontSize(14).font('Helvetica').fillColor('#000000').text(
          chapters.length === 1
            ? `Capítulo ${chapters[0].chapterNo}`
            : `Compilación de Capítulos ${chapters[0].chapterNo} al ${chapters[chapters.length - 1].chapterNo}`,
          { align: 'center' }
        );
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text(`Generado: ${new Date().toLocaleDateString()}`, { align: 'center' });
      }

      doc.fillColor('#000000');
      doc.addPage();
    }

    // Contenido de los capítulos
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];

      if (i > 0 || hasCoverPage) {
        if (i > 0) doc.addPage();
      }

      // Título del capítulo
      doc.fontSize(18).font('Helvetica-Bold').text(`Capítulo ${ch.chapterNo}: ${ch.title}`, { align: 'left' });
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555555').text(`Motor: ${ch.model}`, { align: 'left' });
      doc.fillColor('#000000');
      doc.moveDown(1.5);

      // Párrafos del capítulo
      doc.fontSize(11).font('Helvetica').lineGap(4);

      for (const p of ch.paragraphs) {
        doc.text(p, { align: 'justify' });
        doc.moveDown(0.8);
      }
    }

    // Agregar número de página en el pie de página sin desbordar el margen inferior
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      const oldBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.fontSize(9).font('Helvetica').fillColor('#888888').text(
        `Página ${i + 1} de ${totalPages}`,
        54,
        doc.page.height - 35,
        {
          align: 'center',
          width: doc.page.width - 108,
          lineBreak: false
        }
      );
      doc.page.margins.bottom = oldBottom;
    }

    doc.end();

    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}
