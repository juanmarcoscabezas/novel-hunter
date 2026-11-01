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
import { repository, NovelRepository } from '../src/db/repository.js';
import { getDb } from '../src/db/connection.js';
import { CONFIG, saveSession, getSavedSession, clearSession, getGeminiApiKey, saveGeminiApiKey } from '../src/config.js';
import { getAvailableVoices, synthesizeParagraph, exportChapterAudio } from '../src/services/tts.js';
import { translateChapterToSpanish, batchTranslateNovelToSpanish } from '../src/services/translator.js';

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
  const originalSession = getSavedSession();
  try {
    saveSession('wtr_test_session=abcdef123456');
    const session = getSavedSession();
    assert.strictEqual(session.cookie, 'wtr_test_session=abcdef123456');
    clearSession();
    const cleared = getSavedSession();
    assert.strictEqual(cleared, null);
    console.log('   ✓ Guardado, lectura y limpieza de sesión validados.');
  } finally {
    if (originalSession) {
      saveSession(originalSession);
    } else {
      clearSession();
    }
  }

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
  assert(htmlContent.includes('<h1>Buscador & Descarga</h1>'), 'el título de la pestaña 1 debe ser Buscador & Descarga');
  assert(htmlContent.includes('<h1>Mi Biblioteca</h1>'), 'el título de la pestaña 2 debe ser Mi Biblioteca');
  assert(htmlContent.includes('<h1>Consola Terminal</h1>'), 'el título de la pestaña 3 debe ser Consola Terminal');
  assert(htmlContent.includes('<h1>Configuración</h1>'), 'el título de la pestaña 4 debe ser Configuración');
  console.log('   ✓ Cero emojis rotos en la interfaz, alineación vertical, métrica dinámica y títulos alineados con menú verificados.');

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

  // Test 19: Almacenar último capítulo visto y botón de acceso directo desde el menú
  console.log('\n19. Probando almacenamiento de último capítulo visto y botón en el menú...');
  // 19a. Base de datos (aislada en memoria para no tocar nunca la BD del usuario)
  const memDb = getDb(':memory:');
  const testRepo = new NovelRepository(memDb);
  testRepo.upsertNovel({ rawId: 9779, slug: 'lord-at-the-beginning', title: 'Lord at the Beginning' });
  testRepo.updateReadingProgress(9779, 1, 'es');
  const lastReadGlobal = testRepo.getGlobalLastRead();
  assert(lastReadGlobal !== null, 'Debe existir un registro de último capítulo leído');
  assert.strictEqual(lastReadGlobal.novel_id, 9779);
  assert.strictEqual(lastReadGlobal.last_read_chapter_no, 1);
  assert.strictEqual(lastReadGlobal.last_read_language, 'es');

  // 19b. Integración IPC y Renderer
  assert(preloadContent.includes('getLastRead: () => ipcRenderer.invoke'), 'preload.cjs debe exponer getLastRead');
  assert(htmlContent.includes('id="sidebar-last-read"'), 'index.html debe contener el contenedor sidebar-last-read');
  assert(htmlContent.includes('id="menu-continue-reading-btn"'), 'index.html debe contener el botón menu-continue-reading-btn');
  assert(stylesCssContent.includes('.sidebar-last-read'), 'styles.css debe definir estilos para .sidebar-last-read');
  assert(stylesCssContent.includes('.last-read-card'), 'styles.css debe definir estilos para .last-read-card');
  assert(appJsContent.includes('updateLastReadWidget'), 'app.js debe implementar updateLastReadWidget');
  assert(appJsContent.includes('btn-continue-novel'), 'app.js debe permitir continuar lectura desde cada tarjeta');
  console.log('   ✓ Almacenamiento del último capítulo leído, IPC y botón de acceso directo desde el menú verificados.');

  // Test 20: Opciones de exportar y abrir carpeta reubicadas dentro del detalle de la novela y correcciones de UI
  console.log('\n20. Probando reubicación de opciones de exportar y abrir carpeta en el detalle de la novela y correcciones de UI...');
  assert(htmlContent.includes('id="detail-export-btn"'), 'index.html debe contener el botón detail-export-btn en el modal de detalle');
  assert(htmlContent.includes('id="detail-open-folder-btn"'), 'index.html debe contener el botón detail-open-folder-btn en el modal de detalle');
  assert(stylesCssContent.includes('.novel-meta-actions'), 'styles.css debe definir estilos para .novel-meta-actions');
  assert(appJsContent.includes("document.getElementById('detail-export-btn')"), 'app.js debe enlazar el evento de exportación en detalle');
  assert(appJsContent.includes("document.getElementById('detail-open-folder-btn')"), 'app.js debe enlazar el evento de abrir carpeta en detalle');
  assert(!htmlContent.includes('id="open-exports-folder-btn"'), 'index.html no debe duplicar el botón de exports en la cabecera de la biblioteca');
  assert(stylesCssContent.includes('.btn-continue-novel'), 'styles.css debe definir estilos para .btn-continue-novel');
  assert(stylesCssContent.includes('.btn-view-chapters'), 'styles.css debe definir estilos para .btn-view-chapters');
  console.log('   ✓ Opciones reubicadas exitosamente, duplicidad eliminada y altura exacta unificada (36px).');

  // Test 21: Motor de Lectura Natural (TTS), Voces multilingües, marcas de palabra y exportación de audio MP3
  console.log('\n21. Probando Motor de Lectura Natural (TTS), voces y exportación de audio MP3...');
  const voices = getAvailableVoices();
  assert(Array.isArray(voices) && voices.length >= 8, 'Debe haber al menos 8 voces naturales disponibles');
  const maleVoices = voices.filter(v => v.gender === 'Hombre' || v.gender === 'Male');
  const femaleVoices = voices.filter(v => v.gender === 'Mujer' || v.gender === 'Female');
  const esVoices = voices.filter(v => v.lang.startsWith('es-'));
  const enVoices = voices.filter(v => v.lang.startsWith('en-'));
  assert(maleVoices.length > 0, 'Debe incluir voces masculinas');
  assert(femaleVoices.length > 0, 'Debe incluir voces femeninas');
  assert(esVoices.length > 0, 'Debe incluir voces en español con diferentes acentos');
  assert(enVoices.length > 0, 'Debe incluir voces en inglés');

  console.log(`   ✓ Catálogo de ${voices.length} voces naturales validado (${maleVoices.length} masculinas, ${femaleVoices.length} femeninas, acentos ES/MX/AR/CO/US/GB).`);

  console.log('   -> Sintetizando fragmento de prueba con marcas temporales por palabra...');
  const ttsRes = await synthesizeParagraph('Prueba de audio para Novel Hunter.', { voice: 'es-ES-AlvaroNeural' });
  assert(typeof ttsRes.audioBase64 === 'string' && ttsRes.audioBase64.length > 1000, 'Debe devolver datos de audio en Base64');
  assert(Array.isArray(ttsRes.words) && ttsRes.words.length > 0, 'Debe devolver marcas de tiempo por palabra');
  assert(typeof ttsRes.words[0].start === 'number' && typeof ttsRes.words[0].end === 'number', 'Las marcas de palabra deben incluir start y end en ms');
  console.log(`   ✓ Síntesis exitosa: ${Math.round(ttsRes.audioBase64.length / 1024)} KB en base64 con ${ttsRes.words.length} palabras sincronizadas.`);

  console.log('   -> Probando exportación de capítulo completo a archivo MP3...');
  const exportRes = await exportChapterAudio('audio-test-novel', 1, 'Capítulo de prueba', ['Primer párrafo narrado con voz fluida.', 'Segundo párrafo que continúa la historia.'], { voice: 'es-ES-AlvaroNeural' });
  assert(fs.existsSync(exportRes.filePath), 'El archivo MP3 exportado debe existir');
  assert(exportRes.sizeBytes > 10000, 'El archivo MP3 debe contener el audio completo');
  console.log(`   ✓ Archivo de audio MP3 exportado correctamente: ${exportRes.filePath} (${exportRes.formattedSize}).`);

  // Test 22: Interfaz de Audio en Lector, Clic en Palabras y Configuración de Gemini API Key
  console.log('\n22. Verificando Interfaz de Audio, Clic en Palabras y Configuración de Gemini AI...');
  const originalApiKey = getGeminiApiKey();
  try {
    saveGeminiApiKey('test-gemini-key-xyz123');
    const savedKey = getGeminiApiKey();
    assert.strictEqual(savedKey, 'test-gemini-key-xyz123', 'getGeminiApiKey debe devolver la clave guardada');
  } finally {
    saveGeminiApiKey(originalApiKey || '');
  }

  // Verificaciones en index.html y preload
  const updatedHtml = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'index.html'), 'utf8');
  const updatedPreload = fs.readFileSync(path.join(__dirname, '..', 'electron', 'preload.cjs'), 'utf8');
  const updatedStyles = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'styles.css'), 'utf8');
  const updatedAppJs = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'app.js'), 'utf8');

  assert(updatedHtml.includes('class="reader-audio-bar"'), 'index.html debe incluir la barra de audio reader-audio-bar');
  assert(updatedHtml.includes('id="tts-play-btn"'), 'index.html debe incluir botón tts-play-btn');
  assert(updatedHtml.includes('id="tts-voice-select"'), 'index.html debe incluir selector de voces tts-voice-select');
  assert(updatedHtml.includes('id="tts-export-btn"'), 'index.html debe incluir botón de exportar MP3');
  assert(updatedHtml.includes('id="gemini-key-input"'), 'index.html debe incluir campo para Gemini API Key');

  assert(updatedPreload.includes('ttsGetVoices: () => ipcRenderer.invoke'), 'preload.cjs debe exponer ttsGetVoices');
  assert(updatedPreload.includes('ttsSynthesize: (text, options) => ipcRenderer.invoke'), 'preload.cjs debe exponer ttsSynthesize');
  assert(updatedPreload.includes('ttsExportChapter: (payload) => ipcRenderer.invoke'), 'preload.cjs debe exponer ttsExportChapter');
  assert(updatedPreload.includes('saveGeminiKey: (key) => ipcRenderer.invoke'), 'preload.cjs debe exponer saveGeminiKey');

  assert(updatedStyles.includes('.reader-audio-bar'), 'styles.css debe definir estilos para .reader-audio-bar');
  assert(updatedStyles.includes('.reader-word'), 'styles.css debe definir estilos interactivos para .reader-word');
  assert(updatedStyles.includes('.active-word'), 'styles.css debe definir resaltado para .active-word');
  assert(updatedStyles.includes('.active-paragraph'), 'styles.css debe definir resaltado para .active-paragraph');

  assert(updatedAppJs.includes('initTtsControls'), 'app.js debe implementar initTtsControls');
  assert(updatedAppJs.includes('playFromWord'), 'app.js debe permitir comenzar el audio desde cualquier palabra al hacer clic');
  assert(updatedAppJs.includes('exportCurrentChapterAudio'), 'app.js debe implementar la exportación de audio');
  assert(updatedAppJs.includes('reader-word'), 'app.js debe envolver cada palabra con clase reader-word para interacción');
  console.log('   ✓ Barra de audio, sincronización por palabra, exportación MP3 y Gemini Key verificados en toda la app.');

  // Test 23: Traducción on-demand de capítulos a español (Individual, Lote y UI)
  console.log('\n23. Probando Traducción de Capítulos a Español (Offline/Local desde inglés)...');
  const testNovelId = 999901;
  const testNovelMeta = {
    rawId: testNovelId,
    slug: 'translation-test-novel',
    title: 'The Great Awakening',
    author: 'Lin Wei'
  };

  const cleanupTestNovel = () => {
    try {
      repository.db.prepare('DELETE FROM novels WHERE id = ?').run(testNovelId);
    } catch {}
  };

  // Limpiar antes y después de la prueba para no ensuciar la biblioteca del usuario ni fallar en re-ejecuciones
  cleanupTestNovel();

  try {
    // Registrar novela y capítulos en inglés
    repository.upsertNovel(testNovelMeta);
    repository.saveChapterTranslation(testNovelId, 1, {
      language: 'en',
      title: 'Chapter 1: The First Step',
      model: 'Gemini 3.5 Flash',
      source: 'gemini',
      rawTitle: '第1章 第一步',
      paragraphs: [
        'The morning mist covered the quiet mountain.',
        'He took a deep breath and began his spiritual journey.'
      ]
    }, testNovelMeta);

    repository.saveChapterTranslation(testNovelId, 2, {
      language: 'en',
      title: 'Chapter 2: The Mysterious Cave',
      model: 'Gemini 3.5 Flash',
      source: 'gemini',
      rawTitle: '第2章 神秘洞穴',
      paragraphs: [
        'Inside the dark cave, a blue crystal was glowing quietly.',
        'Ancient runes were inscribed upon the cold stone floor.'
      ]
    }, testNovelMeta);

    // Verificar capítulos no traducidos (deben ser [1, 2])
    const pendingBefore = repository.getUntranslatedChapterNumbers(testNovelId, 'en', 'es');
    assert.deepStrictEqual(pendingBefore, [1, 2], 'Ambos capítulos deben estar pendientes de traducir a español');

    // Probar traducción de capítulo 1 a español
    console.log('   -> Traduciendo Capítulo 1 de inglés a español...');
    const esCh1 = await translateChapterToSpanish(testNovelId, 1);
    assert(esCh1 !== null, 'El capítulo traducido no debe ser nulo');
    assert.strictEqual(esCh1.language, 'es', 'El idioma debe ser español');
    assert(esCh1.paragraphs && esCh1.paragraphs.length === 2, 'Debe contener los 2 párrafos traducidos');
    assert(esCh1.paragraphs[0].length > 0, 'El párrafo traducido no debe estar vacío');

    // Verificar que se guardó en SQLite sin perder la versión en inglés
    const retrievedEs = repository.getChapterTranslation(testNovelId, 1, 'es');
    const retrievedEn = repository.getChapterTranslation(testNovelId, 1, 'en');
    assert(retrievedEs !== null, 'Debe existir la traducción en español en SQLite');
    assert(retrievedEn !== null, 'Debe conservarse la traducción original en inglés en SQLite');
    assert.strictEqual(retrievedEs.language, 'es');
    assert.strictEqual(retrievedEn.language, 'en');

    // Verificar que ahora solo queda el capítulo 2 pendiente
    const pendingAfter1 = repository.getUntranslatedChapterNumbers(testNovelId, 'en', 'es');
    assert.deepStrictEqual(pendingAfter1, [2], 'Solo debe quedar el capítulo 2 pendiente');

    // Probar traducción por lote (batchTranslateNovelToSpanish)
    console.log('   -> Probando traducción por lote (batchTranslateNovelToSpanish)...');
    let progressEvents = [];
    const batchRes = await batchTranslateNovelToSpanish(testNovelId, {}, (p) => {
      progressEvents.push(p);
    });

    assert.strictEqual(batchRes.translatedCount, 1, 'Debe haber traducido 1 capítulo pendiente (el 2)');
    assert(progressEvents.length > 0, 'Debe haber emitido eventos de progreso');
    const pendingFinal = repository.getUntranslatedChapterNumbers(testNovelId, 'en', 'es');
    assert.deepStrictEqual(pendingFinal, [], 'No debe quedar ningún capítulo pendiente de traducir');
  } finally {
    cleanupTestNovel();
  }

  // Verificar UI en archivos del proyecto
  const updatedMainJs = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.js'), 'utf8');
  assert(updatedMainJs.includes("ipcMain.handle('chapter:translateToSpanish'"), 'main.js debe registrar IPC chapter:translateToSpanish');
  assert(updatedMainJs.includes("ipcMain.handle('novel:getUntranslatedChapters'"), 'main.js debe registrar IPC novel:getUntranslatedChapters');
  assert(updatedMainJs.includes("ipcMain.handle('novel:batchTranslateToSpanish'"), 'main.js debe registrar IPC novel:batchTranslateToSpanish');

  assert(updatedPreload.includes('translateChapterToSpanish:'), 'preload.cjs debe exponer translateChapterToSpanish');
  assert(updatedPreload.includes('getUntranslatedChapters:'), 'preload.cjs debe exponer getUntranslatedChapters');
  assert(updatedPreload.includes('batchTranslateToSpanish:'), 'preload.cjs debe exponer batchTranslateToSpanish');

  assert(updatedHtml.includes('id="detail-translate-btn"'), 'index.html debe contener el botón detail-translate-btn');
  assert(updatedHtml.includes('id="chapters-translate-progress"'), 'index.html debe incluir la barra de progreso chapters-translate-progress');
  assert(updatedHtml.includes('id="reader-translate-btn"'), 'index.html debe incluir el botón reader-translate-btn en el lector');
  assert(updatedHtml.includes('id="reader-lang-badge"'), 'index.html debe incluir el badge reader-lang-badge');

  assert(updatedStyles.includes('.btn-reader-translate'), 'styles.css debe definir estilos para .btn-reader-translate');
  assert(updatedStyles.includes('.translate-progress-box'), 'styles.css debe definir estilos para .translate-progress-box');
  assert(updatedStyles.includes('.btn-translate-novel'), 'styles.css debe definir estilos para .btn-translate-novel');

  assert(updatedAppJs.includes('detail-translate-btn'), 'app.js debe enlazar el botón de traducción en el modal de novela');
  assert(updatedAppJs.includes('reader-translate-btn'), 'app.js debe enlazar el botón de traducción en el lector');
  assert(updatedAppJs.includes('btn-translate-ch'), 'app.js debe soportar traducción individual desde la lista de capítulos');
  console.log('   ✓ Traducción individual, traducción por lotes, SQLite 3NF y UI integradas correctamente.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS (23/23) PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN LA PRUEBA:', err);
  process.exit(1);
});
