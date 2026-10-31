import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { CONFIG } from '../config.js';
import { sanitizeFilename } from './writer.js';

/**
 * Exporta uno o varios capítulos a un documento PDF profesional.
 * 
 * @param {string} novelSlug Slug de la novela
 * @param {Array<object>} chapters Lista de capítulos { chapterNo, title, model, paragraphs }
 * @param {string} novelTitle Título de la novela
 * @param {string} [customFileName] Nombre personalizado del archivo
 * @returns {Promise<string>} Ruta del archivo PDF generado
 */
export function exportChaptersToPdf(novelSlug, chapters, novelTitle = '', customFileName = null) {
  return new Promise((resolve, reject) => {
    if (!chapters || chapters.length === 0) {
      return reject(new Error('No hay capítulos para exportar a PDF'));
    }

    const safeSlug = sanitizeFilename(novelSlug);
    const targetDir = path.join(CONFIG.downloadsDir, safeSlug);

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

    // Inicializar documento PDF con buffer para conteo de páginas
    const doc = new PDFDocument({
      size: 'A4',
      margin: 54, // 0.75 pulgadas
      bufferPages: true,
      info: {
        Title: novelTitle || novelSlug,
        Author: 'WTR-Lab Downloader',
        Subject: `Capítulos ${chapters[0].chapterNo} a ${chapters[chapters.length - 1].chapterNo}`
      }
    });

    doc.pipe(writeStream);

    // Portada si son varios capítulos
    if (chapters.length > 1) {
      doc.moveDown(4);
      doc.fontSize(24).font('Helvetica-Bold').text(novelTitle || novelSlug, { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica').text(`Compilación de Capítulos ${chapters[0].chapterNo} al ${chapters[chapters.length - 1].chapterNo}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text(`Generado: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.fillColor('#000000');
      doc.addPage();
    }

    // Contenido de los capítulos
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];

      if (i > 0) {
        doc.addPage();
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

    // Agregar número de página en el pie de página
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).font('Helvetica').fillColor('#888888').text(
        `Página ${i + 1} de ${totalPages}`,
        54,
        doc.page.height - 40,
        { align: 'center', width: doc.page.width - 108 }
      );
    }

    doc.end();

    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}
