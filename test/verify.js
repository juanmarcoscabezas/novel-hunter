import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { searchNovels, parseNovelUrl, getChapterList } from '../src/api/novel.js';
import { processGeminiContent } from '../src/translators/gemini.js';
import { translateWithGoogle } from '../src/translators/google.js';
import { decryptContent } from '../src/crypto/aes.js';
import { fetchChapter } from '../src/api/reader.js';
import { saveChapterAsTxt } from '../src/storage/writer.js';
import { mergeChaptersToTxt } from '../src/storage/merger.js';
import { exportChaptersToPdf } from '../src/storage/pdf.js';
import { repository } from '../src/db/repository.js';
import { CONFIG, saveSession, getSavedSession, clearSession } from '../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('🧪 Iniciando suite de pruebas de verificación integral de todas las funcionalidades...\n');

  // Test 1: URL Parser
  console.log('1. Probando parseNovelUrl...');
  const parsed = parseNovelUrl('https://wtr-lab.com/en/novel/112330/mortal-wonders-of-the-heavens-enjoying-eternal-life');
  assert.strictEqual(parsed.rawId, 112330);
  assert.strictEqual(parsed.slug, 'mortal-wonders-of-the-heavens-enjoying-eternal-life');
  const parsedSerie = parseNovelUrl('https://wtr-lab.com/en/serie-9779/lord-at-the-beginning');
  assert.strictEqual(parsedSerie.rawId, 9779);
  assert.strictEqual(parsedSerie.slug, 'lord-at-the-beginning');
  const parsedNum = parseNovelUrl('9779');
  assert.strictEqual(parsedNum.rawId, 9779);
  console.log('   ✓ parseNovelUrl pasó correctamente con URLs completas, formato serie e ID numérico.');

  // Test 2: Búsqueda de novelas
  console.log('\n2. Probando searchNovels("mortal")...');
  const searchResults = await searchNovels('mortal');
  assert(searchResults.length > 0, 'Debe encontrar al menos una novela');
  assert(searchResults[0].image && searchResults[0].image.startsWith('http'), 'La novela debe tener URL de portada/imagen válida');
  console.log(`   ✓ searchNovels encontró ${searchResults.length} novelas. Primera: "${searchResults[0].title}" (Portada: ${searchResults[0].image})`);

  // Test 3: Listado de capítulos
  console.log('\n3. Probando getChapterList(112330)...');
  const chapters = await getChapterList(112330);
  assert(chapters.length > 0, 'Debe devolver lista de capítulos');
  console.log(`   ✓ getChapterList devolvió ${chapters.length} capítulos.`);

  // Test 4: Procesamiento de glosario de Gemini
  console.log('\n4. Probando processGeminiContent con tokens ※N⛬...');
  const testParagraphs = [
    'Where ※0⛬ practiced cultivation with ※1⛬.',
    '[part:gemini-3.5-flash-lite]'
  ];
  const glossary = { terms: [['Lin Feng', '林枫'], ['Ancient Dao', '古道']] };
  const cleaned = processGeminiContent(testParagraphs, glossary);
  assert.strictEqual(cleaned.length, 1);
  assert.strictEqual(cleaned[0], 'Where Lin Feng practiced cultivation with Ancient Dao.');
  console.log('   ✓ Reemplazo de glosario Gemini verificado.');

  // Test 5: Descifrado nativo AES-GCM
  console.log('\n5. Probando descifrado AES-GCM con clave estática...');
  const sampleData = ['Párrafo 1 en chino', 'Párrafo 2'];
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(CONFIG.aesKey.slice(0, 32), 'utf8'), iv);
  const encryptedBuf = Buffer.concat([cipher.update(JSON.stringify(sampleData), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const encryptedPayload = `arr:${iv.toString('base64')}:${tag.toString('base64')}:${encryptedBuf.toString('base64')}`;
  
  const decrypted = await decryptContent(encryptedPayload);
  assert.deepStrictEqual(decrypted, sampleData);
  console.log('   ✓ Descifrado AES-GCM completado con éxito.');

  // Test 6: Google Translate
  console.log('\n6. Probando translateWithGoogle...');
  const translated = await translateWithGoogle(['Hello world', 'How are you?'], 'es', 'en');
  assert.strictEqual(translated.length, 2);
  console.log(`   ✓ Google Translate: "${translated[0]}" y "${translated[1]}"`);

  // Test 7: Descarga real de capítulo 1 y almacenamiento en SQLite
  console.log('\n7. Probando fetchChapter(112330, 1)...');
  const ch1 = await fetchChapter(112330, 1, { targetLang: 'en' });
  assert.strictEqual(ch1.chapterNo, 1);
  assert(ch1.paragraphs.length > 10, 'El capítulo 1 debe tener más de 10 párrafos');
  console.log(`   ✓ Capítulo 1 descargado: "${ch1.title}" (${ch1.model}) - ${ch1.paragraphs.length} párrafos.`);

  // Test 8: Guardado TXT individual
  console.log('\n8. Probando guardado en TXT...');
  const txtPath = saveChapterAsTxt('test-novel', ch1, 'Test Novel');
  assert(fs.existsSync(txtPath), 'El archivo TXT debe existir');
  console.log(`   ✓ Archivo TXT creado: ${txtPath}`);

  // Test 9: Fusión de capítulos en TXT
  console.log('\n9. Probando fusión de capítulos...');
  const ch2 = await fetchChapter(112330, 2, { targetLang: 'en' });
  const mergedTxt = mergeChaptersToTxt('test-novel', [ch1, ch2], 'Test Novel');
  assert(fs.existsSync(mergedTxt), 'El archivo fusionado TXT debe existir');
  console.log(`   ✓ Archivo fusionado creado: ${mergedTxt}`);

  // Test 10: Exportación a PDF
  console.log('\n10. Probando exportación a PDF...');
  const pdfPath = await exportChaptersToPdf('test-novel', [ch1, ch2], 'Test Novel');
  assert(fs.existsSync(pdfPath), 'El archivo PDF debe existir');
  const pdfStats = fs.statSync(pdfPath);
  assert(pdfStats.size > 1000, 'El archivo PDF debe tener tamaño válido');
  console.log(`   ✓ Archivo PDF creado: ${pdfPath} (${Math.round(pdfStats.size / 1024)} KB)`);

  // Test 11: Estadísticas de Novela (getNovelStats)
  console.log('\n11. Probando repository.getNovelStats...');
  const stats = repository.getNovelStats('lord-at-the-beginning-he-was-exiled-to-the-frontier-by-the-marquis-wife');
  assert(stats !== null, 'Debe devolver estadísticas de la novela');
  assert.strictEqual(stats.title, "Lord: At The Beginning, He Was Exiled To The Frontier By The Marquis' Wife");
  console.log(`   ✓ Estadísticas obtenidas: "${stats.title}" (idiomas: ${stats.languages.map(l => l.language).join(', ')})`);

  // Test 12: Listado detallado de capítulos descargados (getDownloadedChapters)
  console.log('\n12. Probando repository.getDownloadedChapters...');
  const dlChapters = repository.getDownloadedChapters(9779, 'en');
  assert(dlChapters.length >= 5, 'Debe tener al menos 5 capítulos descargados');
  assert.strictEqual(dlChapters[0].chapter_no, 1);
  console.log(`   ✓ ${dlChapters.length} capítulos descargados recuperados con títulos y tamaños.`);

  // Test 13: Exportación Offline desde SQLite (sin conexión a internet)
  console.log('\n13. Probando exportación Offline desde SQLite a TXT y PDF...');
  const offlineChapters = [];
  for (const item of dlChapters.slice(0, 2)) {
    const full = repository.getChapterTranslation(9779, item.chapter_no, 'en');
    assert(full !== null);
    offlineChapters.push(full);
  }
  const offlineTxt = mergeChaptersToTxt('offline-test', offlineChapters, 'Offline Novel');
  assert(fs.existsSync(offlineTxt));
  const offlinePdf = await exportChaptersToPdf('offline-test', offlineChapters, 'Offline Novel');
  assert(fs.existsSync(offlinePdf));
  console.log(`   ✓ Exportación offline TXT y PDF generada exitosamente.`);

  // Test 14: Gestión de Sesión y Cookies
  console.log('\n14. Probando gestión de sesión y cookies...');
  saveSession('wtr_test_session=abcdef123456');
  const session = getSavedSession();
  assert.strictEqual(session.cookie, 'wtr_test_session=abcdef123456');
  clearSession();
  const cleared = getSavedSession();
  assert.strictEqual(cleared, null);
  console.log('   ✓ Guardado, lectura y limpieza de sesión validados.');

  // Test 15: Exportación de PDF con Imagen de Portada incrustada y caché
  console.log('\n15. Probando exportación a PDF con imagen de portada y caché...');
  const testCoverUrl = 'https://img.wtr-lab.com/cdn/series/YfFlgEVUjTUpL8O24Fo-dSkN22f9ByCIPw3Q7FdMapY.png';
  const coverPdf = await exportChaptersToPdf('cover-test-novel', [ch1, ch2], 'Lord: At The Beginning', {
    coverUrl: testCoverUrl,
    author: 'Ya Xiao Xin'
  });
  assert(fs.existsSync(coverPdf), 'El PDF con portada debe existir');
  const coverPdfStats = fs.statSync(coverPdf);
  assert(coverPdfStats.size > 80000, `El PDF debe contener los bytes de la imagen (Tamaño: ${coverPdfStats.size} bytes)`);
  const cachedCoverPath = path.join(CONFIG.dataDir, 'covers', 'cover-test-novel.img');
  assert(fs.existsSync(cachedCoverPath), 'La portada debe quedar en caché local para uso offline');
  console.log(`   ✓ PDF con imagen de portada incrustada verificado (${Math.round(coverPdfStats.size / 1024)} KB) y portada en caché local.`);

  // Test 16: Sistema Universal de Iconos Vectoriales SVG (Cero emojis rotos)
  console.log('\n16. Verificando Sistema Universal de Iconos Vectoriales SVG...');
  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'index.html'), 'utf8');
  const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'app.js'), 'utf8');
  const stylesCssContent = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'styles.css'), 'utf8');

  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]|[\u2190-\u21ff]/g;
  const htmlEmojis = htmlContent.match(emojiRegex) || [];
  const jsEmojis = appJsContent.match(emojiRegex) || [];

  assert.strictEqual(htmlEmojis.length, 0, `index.html no debe contener emojis rotos, encontrados: ${htmlEmojis.join(', ')}`);
  assert.strictEqual(jsEmojis.length, 0, `app.js no debe contener emojis rotos, encontrados: ${jsEmojis.join(', ')}`);
  assert(htmlContent.includes('class="svg-icon"'), 'index.html debe usar clases svg-icon');
  assert(appJsContent.includes('const ICONS = {'), 'app.js debe definir diccionario de iconos ICONS');
  assert(stylesCssContent.includes('.svg-icon'), 'styles.css debe definir estilos para .svg-icon');
  assert(stylesCssContent.includes('.header-actions'), 'styles.css debe definir .header-actions con flex alignment');
  assert(stylesCssContent.includes('height: 36px'), 'styles.css debe definir altura consistente para botones .btn-sm');
  assert(stylesCssContent.includes('#quick-open-exports'), 'styles.css debe definir alineación a la izquierda para #quick-open-exports');
  assert(htmlContent.includes('<h2>Novel Hunter</h2>'), 'index.html debe mostrar el nombre Novel Hunter');
  assert(htmlContent.includes('<title>Novel Hunter</title>'), 'index.html debe tener el título Novel Hunter');
  assert(htmlContent.includes('id="lib-storage-size"'), 'index.html debe contener el contador dinámico lib-storage-size');
  assert(!htmlContent.includes('<span class="metric-value">SQLite 3NF</span>'), 'la tarjeta de métrica ya no debe ser estática SQLite 3NF');
  assert(appJsContent.includes('getStorageStats'), 'app.js debe cargar el tamaño de almacenamiento dinámico');
  console.log('   ✓ Cero emojis rotos en la interfaz, alineación vertical y métrica dinámica de almacenamiento verificadas.');

  // Test 17: Hot-Reload y Atajos de Desarrollo
  console.log('\n17. Verificando configuración de Hot-Reload y entorno de desarrollo...');
  const mainJsContent = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.js'), 'utf8');
  const preloadContent = fs.readFileSync(path.join(__dirname, '..', 'electron', 'preload.cjs'), 'utf8');
  const pkgContent = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  assert(mainJsContent.includes('setupHotReload'), 'main.js debe incluir función setupHotReload');
  assert(mainJsContent.includes('hot-reload:css'), 'main.js debe emitir hot-reload:css para actualización en vivo');
  assert(mainJsContent.includes('reloadIgnoringCache'), 'main.js debe recargar la ventana al cambiar código de renderer');
  assert(mainJsContent.includes('toggleDevTools'), 'main.js debe habilitar atajos de DevTools (F12/Ctrl+Shift+I)');
  assert(preloadContent.includes('hot-reload:css'), 'preload.cjs debe escuchar evento hot-reload:css');
  assert.strictEqual(pkgContent.scripts.dev, 'electron .', 'package.json debe incluir script npm run dev');
  assert.strictEqual(pkgContent.build.productName, 'Novel Hunter', 'package.json debe nombrar el producto como Novel Hunter');
  assert.strictEqual(mainJsContent.includes("title: 'Novel Hunter'"), true, 'main.js debe tener la ventana titulada Novel Hunter');
  console.log('   ✓ Hot-Reload para CSS en vivo, UI refresh, DevTools y renombrado a Novel Hunter verificado correctamente.');

  // Test 18: Icono personalizado de la aplicación (Novel Hunter)
  console.log('\n18. Verificando icono personalizado de la aplicación...');
  const iconPath = path.join(__dirname, '..', 'electron', 'assets', 'icon.png');
  assert(fs.existsSync(iconPath), 'El archivo electron/assets/icon.png debe existir');
  const iconStats = fs.statSync(iconPath);
  assert(iconStats.size > 50000, `El icono debe ser de alta resolución (tamaño actual: ${iconStats.size} bytes)`);

  const iconBuffer = fs.readFileSync(iconPath);
  // PNG Magic bytes: \x89 P N G \r \n \x1a \n
  const isPng = iconBuffer[0] === 0x89 && iconBuffer[1] === 0x50 && iconBuffer[2] === 0x4E && iconBuffer[3] === 0x47;
  assert(isPng, 'El icono debe ser un archivo de imagen PNG válido con transparencia');

  assert(pkgContent.build.win.icon === 'electron/assets/icon.png', 'package.json debe configurar win.icon con el icono PNG');
  assert(mainJsContent.includes("icon: path.join(__dirname, 'assets', 'icon.png')"), 'main.js debe cargar el icono en la ventana principal');
  assert(htmlContent.includes('<link rel="icon" type="image/png" href="../assets/icon.png">'), 'index.html debe tener el favicon enlazado');
  assert(htmlContent.includes('src="../assets/icon.png"'), 'index.html debe mostrar el logo en la barra de marca');
  console.log(`   ✓ Icono personalizado verificado (${Math.round(iconStats.size / 1024)} KB), cabecera PNG válida e integrado en ventana y marca.`);

  console.log('\n🎉 ¡TODAS LAS PRUEBAS (18/18) PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN LA PRUEBA:', err);
  process.exit(1);
});
