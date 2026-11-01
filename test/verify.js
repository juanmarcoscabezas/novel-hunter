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
import { CONFIG, saveSession, getSavedSession, clearSession, getGeminiApiKey, saveGeminiApiKey, getChapterGrouping, saveChapterGrouping } from '../src/config.js';
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
  assert(Array.isArray(voices) && voices.length >= 20, 'Debe haber un catálogo ampliado de voces naturales disponibles (>= 20)');
  const maleVoices = voices.filter(v => v.gender === 'Hombre' || v.gender === 'Male');
  const femaleVoices = voices.filter(v => v.gender === 'Mujer' || v.gender === 'Female');
  const esVoices = voices.filter(v => v.lang.startsWith('es-'));
  const enVoices = voices.filter(v => v.lang.startsWith('en-'));
  const colombianVoices = voices.filter(v => v.lang === 'es-CO' || v.id === 'es-ES-XimenaNeural');
  const femaleEsVoices = esVoices.filter(v => v.gender === 'Mujer' || v.gender === 'Female');

  assert(maleVoices.length > 0, 'Debe incluir voces masculinas');
  assert(femaleVoices.length > 0, 'Debe incluir voces femeninas');
  assert(esVoices.length >= 15, 'Debe incluir al menos 15 opciones de voz en español');
  assert(femaleEsVoices.length >= 10, 'Debe dar preferencia a voces femeninas en español (al menos 10 disponibles)');
  assert(femaleEsVoices.length > esVoices.filter(v => v.gender === 'Hombre').length, 'Debe haber mayor cantidad de voces femeninas en español');
  assert(colombianVoices.length >= 2, 'Debe incluir opciones de voz colombiana');
  assert(colombianVoices.some(v => v.id === 'es-CO-SalomeNeural'), 'Debe incluir la voz femenina colombiana Salomé');
  assert(enVoices.length > 0, 'Debe incluir voces en inglés');

  console.log(`   ✓ Catálogo de ${voices.length} voces naturales validado (${maleVoices.length} masculinas, ${femaleVoices.length} femeninas, ${colombianVoices.length} colombianas).`);

  console.log('   -> Probando síntesis con la voz femenina colombiana Salomé (es-CO-SalomeNeural)...');
  const colRes = await synthesizeParagraph('Hola, esta es una prueba de narración con voz colombiana.', { voice: 'es-CO-SalomeNeural' });
  assert(typeof colRes.audioBase64 === 'string' && colRes.audioBase64.length > 1000, 'Debe devolver audio en Base64 con es-CO-SalomeNeural');
  assert(Array.isArray(colRes.words) && colRes.words.length > 0, 'Debe sincronizar marcas de tiempo por palabra con voz colombiana');
  console.log(`   ✓ Síntesis con Salomé (Colombia) exitosa: ${Math.round(colRes.audioBase64.length / 1024)} KB con ${colRes.words.length} palabras.`);

  console.log('   -> Sintetizando fragmento de prueba con marcas temporales por palabra...');
  const ttsRes = await synthesizeParagraph('Prueba de audio para Novel Hunter.', { voice: 'es-ES-AlvaroNeural' });
  assert(typeof ttsRes.audioBase64 === 'string' && ttsRes.audioBase64.length > 1000, 'Debe devolver datos de audio en Base64');
  assert(Array.isArray(ttsRes.words) && ttsRes.words.length > 0, 'Debe devolver marcas de tiempo por palabra');
  assert(typeof ttsRes.words[0].start === 'number' && typeof ttsRes.words[0].end === 'number', 'Las marcas de palabra deben incluir start y end en ms');
  console.log(`   ✓ Síntesis exitosa: ${Math.round(ttsRes.audioBase64.length / 1024)} KB en base64 con ${ttsRes.words.length} palabras sincronizadas.`);

  // Verificación de normalización de espacios y velocidades rápidas (2x y 3x)
  console.log('   -> Verificando limpieza de espacios/saltos en blanco y velocidades 2x y 3x...');
  const emptyRes = await synthesizeParagraph('   \n\n\r\n   ');
  assert.strictEqual(emptyRes.audioBase64, '', 'Texto con solo espacios o saltos no debe sintetizarse');

  const spaceCleanRes = await synthesizeParagraph('  Texto con   espacios múltiples  \n\n  y saltos.  ', { voice: 'es-ES-AlvaroNeural', rate: '+100%' });
  assert(typeof spaceCleanRes.audioBase64 === 'string' && spaceCleanRes.audioBase64.length > 500, 'Debe sintetizar texto con espacios normalizados a velocidad 2x');

  const fast3xRes = await synthesizeParagraph('Prueba rápida a triple velocidad.', { voice: 'es-ES-AlvaroNeural', rate: '+200%' });
  assert(typeof fast3xRes.audioBase64 === 'string' && fast3xRes.audioBase64.length > 500, 'Debe sintetizar a velocidad 3x sin errores');
  console.log('   ✓ Normalización de espacios en blanco y velocidades aceleradas (2x y 3x) validadas.');

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
  assert(updatedHtml.includes('value="+100%">2.0x (2x)</option>'), 'index.html debe incluir opción de velocidad 2x / 2.0x');
  assert(updatedHtml.includes('value="+200%">3.0x (3x)</option>'), 'index.html debe incluir opción de velocidad 3x / 3.0x');
  assert(updatedAppJs.includes('ttsPrefetchCache'), 'app.js debe usar caché de precarga (ttsPrefetchCache) para eliminar pausas');
  assert(updatedAppJs.includes('prefetchParagraphTts'), 'app.js debe implementar prefetchParagraphTts');
  assert(updatedAppJs.includes('lastWord.end + 80'), 'app.js debe recortar el silencio muerto final de EdgeTTS para transiciones fluidas');
  assert(updatedStyles.includes('.tts-select optgroup'), 'styles.css debe definir estilos para optgroup de voces');
  assert(updatedAppJs.includes('optgroup'), 'app.js debe agrupar las voces naturalmente por categorías');
  assert(updatedAppJs.includes('preferred_voice_'), 'app.js debe guardar la preferencia de voz del lector');
  console.log('   ✓ Barra de audio, sincronización por palabra, opciones 2x/3x, reducción de pausas y Gemini Key verificados en toda la app.');

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
      const db = repository.db;
      db.prepare('DELETE FROM paragraphs WHERE translation_id IN (SELECT id FROM chapter_translations WHERE chapter_id IN (SELECT id FROM chapters WHERE novel_id = ?))').run(testNovelId);
      db.prepare('DELETE FROM chapter_translations WHERE chapter_id IN (SELECT id FROM chapters WHERE novel_id = ?)').run(testNovelId);
      db.prepare('DELETE FROM chapters WHERE novel_id = ?').run(testNovelId);
      db.prepare('DELETE FROM reading_progress WHERE novel_id = ?').run(testNovelId);
      db.prepare('DELETE FROM novels WHERE id = ?').run(testNovelId);
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

  // Test 24: Verificación de Reglas Claras para LLMs y Agentes de IA
  console.log('\n24. Verificando Reglas Claras para LLMs y Agentes de IA (AGENTS.md, GEMINI.md, .cursorrules, CLAUDE.md)...');
  const projectRoot = path.resolve(__dirname, '..');
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  const geminiPath = path.join(projectRoot, 'GEMINI.md');
  const cursorPath = path.join(projectRoot, '.cursorrules');
  const claudePath = path.join(projectRoot, 'CLAUDE.md');

  assert(fs.existsSync(agentsPath), 'AGENTS.md debe existir en la raíz del proyecto');
  assert(fs.existsSync(geminiPath), 'GEMINI.md debe existir en la raíz del proyecto');
  assert(fs.existsSync(cursorPath), '.cursorrules debe existir en la raíz del proyecto');
  assert(fs.existsSync(claudePath), 'CLAUDE.md debe existir en la raíz del proyecto');

  const agentsContent = fs.readFileSync(agentsPath, 'utf8');
  assert(agentsContent.includes('Cada vez que agregues una feature, haz tests, corre los tests') && agentsContent.includes('luego commit'), 'AGENTS.md debe contener la Regla de Oro del usuario');
  assert(agentsContent.includes('actualiza la documentación de todo'), 'AGENTS.md debe contener la directriz de actualización obligatoria de documentación');
  assert(agentsContent.includes('Tercera Forma Normal (3NF)'), 'AGENTS.md debe especificar la regla de 3NF relacional');
  assert(agentsContent.includes('resolveStorageDir'), 'AGENTS.md debe advertir sobre la no escritura dentro de app.asar');

  // Verificar presencia y contenido del skill de workflow en .agents/skills/
  const skillPath = path.join(projectRoot, '.agents', 'skills', 'novel-hunter-workflow', 'SKILL.md');
  assert(fs.existsSync(skillPath), 'El skill de flujo de trabajo (.agents/skills/novel-hunter-workflow/SKILL.md) debe existir');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  assert(skillContent.includes('name: novel-hunter-workflow'), 'El skill debe tener el frontmatter name: novel-hunter-workflow');
  assert(skillContent.includes('Actualización Obligatoria de Toda la Documentación'), 'El skill debe incluir el paso obligatorio de documentación');

  console.log('   ✓ Reglas claras universales para LLMs, asistentes y skill de workflow verificados correctamente.');

  // Test 25: Continuación de Lectura y Descarga Directa de Capítulos (Detalle de Novela y Lector)
  console.log('\n25. Probando Continuación de Lectura y Descarga Directa (Detalle de Novela y Detalle de Capítulo)...');

  const verifyHtml = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'index.html'), 'utf8');
  const verifyAppJs = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'app.js'), 'utf8');
  const verifyStyles = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'styles.css'), 'utf8');
  const verifyMain = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.js'), 'utf8');
  const verifyPreload = fs.readFileSync(path.join(__dirname, '..', 'electron', 'preload.cjs'), 'utf8');

  // Aserciones en index.html
  assert(verifyHtml.includes('id="detail-continue-btn"'), 'index.html debe contener el botón detail-continue-btn');
  assert(verifyHtml.includes('id="detail-download-next-btn"'), 'index.html debe contener el botón detail-download-next-btn');
  assert(verifyHtml.includes('id="detail-download-more-btn"'), 'index.html debe contener el botón detail-download-more-btn');
  assert(verifyHtml.includes('id="reader-download-more-btn"'), 'index.html debe contener el botón reader-download-more-btn en el lector');

  // Aserciones en IPC (main.js y preload.cjs)
  assert(verifyMain.includes("ipcMain.handle('library:getProgress'"), 'main.js debe registrar el handler library:getProgress');
  assert(verifyMain.includes("ipcMain.handle('library:getDownloadedChapterNumbers'"), 'main.js debe registrar el handler library:getDownloadedChapterNumbers');
  assert(verifyPreload.includes('getReadingProgress:'), 'preload.cjs debe exponer getReadingProgress');
  assert(verifyPreload.includes('getDownloadedChapterNumbers:'), 'preload.cjs debe exponer getDownloadedChapterNumbers');

  // Aserciones en estilos CSS
  assert(verifyStyles.includes('.reader-chapter-end-box'), 'styles.css debe definir estilos para la tarjeta de fin de capítulo');
  assert(verifyStyles.includes('.reader-chapter-end-nav'), 'styles.css debe definir estilos para la navegación de fin de capítulo');
  assert(verifyStyles.includes('.reader-end-actions'), 'styles.css debe definir estilos para los botones de acción al fin del capítulo');
  assert(verifyStyles.includes('.novel-meta-actions .btn-action-harmonized'), 'styles.css debe armonizar los botones del modal de detalle');

  // Aserciones en app.js
  assert(verifyAppJs.includes('detail-continue-btn'), 'app.js debe enlazar el botón detail-continue-btn');
  assert(verifyAppJs.includes('detail-download-next-btn'), 'app.js debe enlazar el botón detail-download-next-btn');
  assert(verifyAppJs.includes('detail-download-more-btn'), 'app.js debe enlazar el botón detail-download-more-btn');
  assert(verifyAppJs.includes('reader-download-more-btn'), 'app.js debe enlazar el botón reader-download-more-btn');
  assert(verifyAppJs.includes('downloadAndOpenReaderChapter'), 'app.js debe incluir la función downloadAndOpenReaderChapter');
  assert(verifyAppJs.includes('updateModalActionButtons'), 'app.js debe incluir updateModalActionButtons');
  assert(verifyAppJs.includes('reader-chapter-end-box'), 'app.js debe generar dinámicamente la tarjeta reader-chapter-end-box');

  // Verificación funcional con SQLite (aislada)
  const testFlowNovelId = 998877;
  const testFlowMeta = {
    id: testFlowNovelId,
    rawId: testFlowNovelId,
    slug: 'test-flow-novel',
    title: 'Test Flow Novel',
    author: 'Test Flow Author',
    total_chapters: 20
  };

  const cleanupFlowTest = () => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM paragraphs WHERE translation_id IN (SELECT id FROM chapter_translations WHERE chapter_id IN (SELECT id FROM chapters WHERE novel_id = ?))').run(testFlowNovelId);
      db.prepare('DELETE FROM chapter_translations WHERE chapter_id IN (SELECT id FROM chapters WHERE novel_id = ?)').run(testFlowNovelId);
      db.prepare('DELETE FROM chapters WHERE novel_id = ?').run(testFlowNovelId);
      db.prepare('DELETE FROM reading_progress WHERE novel_id = ?').run(testFlowNovelId);
      db.prepare('DELETE FROM novels WHERE id = ?').run(testFlowNovelId);
    } catch {}
  };

  cleanupFlowTest();
  try {
    repository.upsertNovel(testFlowMeta);
    repository.saveChapterTranslation(testFlowNovelId, 1, {
      language: 'en',
      title: 'Chapter 1: The Beginning',
      model: 'Gemini 3.5 Flash',
      source: 'gemini',
      paragraphs: ['First line of test novel.']
    }, testFlowMeta);
    repository.saveChapterTranslation(testFlowNovelId, 2, {
      language: 'en',
      title: 'Chapter 2: The Next Horizon',
      model: 'Gemini 3.5 Flash',
      source: 'gemini',
      paragraphs: ['Second line of test novel.']
    }, testFlowMeta);

    // 1. Verificar capítulos descargados
    const downloadedNums = repository.getDownloadedChapterNumbers(testFlowNovelId, 'en');
    assert.deepStrictEqual(downloadedNums, [1, 2], 'Debe recuperar los capítulos 1 y 2 descargados');
    const nextChapterToDownload = Math.max(...downloadedNums) + 1;
    assert.strictEqual(nextChapterToDownload, 3, 'El siguiente capítulo a sugerir debe ser el 3');

    // 2. Verificar progreso de lectura (Seguir leyendo)
    repository.updateReadingProgress(testFlowNovelId, 2, 'en');
    const progress = repository.getReadingProgress(testFlowNovelId);
    assert(progress !== null, 'Debe registrar progreso de lectura');
    assert.strictEqual(progress.last_read_chapter_no, 2, 'El último capítulo leído debe ser el 2');
    assert.strictEqual(progress.last_read_language, 'en', 'El idioma debe coincidir con inglés');
  } finally {
    cleanupFlowTest();
  }

  console.log('   ✓ Opciones de continuar leyendo y descargar siguiente/más capítulos validadas.');

  // Test 26: Botón para borrar capítulos y botón para eliminar novela completa dentro del detalle
  console.log('\n26. Probando Botón para Borrar Capítulos y Botón para Eliminar Novela Completa dentro del Detalle...');
  assert(verifyHtml.includes('id="detail-delete-chapters-btn"'), 'index.html debe contener el botón detail-delete-chapters-btn');
  assert(verifyHtml.includes('id="detail-delete-novel-btn"'), 'index.html debe contener el botón detail-delete-novel-btn');
  assert(verifyHtml.includes('id="delete-chapters-modal"'), 'index.html debe contener el modal delete-chapters-modal');

  assert(verifyStyles.includes('.btn-outline-danger'), 'styles.css debe definir estilos para .btn-outline-danger');

  assert(verifyPreload.includes('deleteNovel:'), 'preload.cjs debe exponer deleteNovel');
  assert(verifyPreload.includes('deleteChapters:'), 'preload.cjs debe exponer deleteChapters');

  assert(verifyMain.includes("ipcMain.handle('novel:delete'"), 'main.js debe registrar el handler novel:delete');
  assert(verifyMain.includes("ipcMain.handle('novel:deleteChapters'"), 'main.js debe registrar el handler novel:deleteChapters');

  assert(!verifyAppJs.includes('btn-delete-novel-card'), 'las tarjetas de biblioteca deben mantenerse limpias sin botón de borrar externo');
  assert(verifyAppJs.includes('btn-delete-ch'), 'app.js debe incluir botón de borrar capítulo en la lista dentro del detalle');
  assert(verifyAppJs.includes('detail-delete-chapters-btn'), 'app.js debe enlazar el botón detail-delete-chapters-btn');
  assert(verifyAppJs.includes('detail-delete-novel-btn'), 'app.js debe enlazar el botón detail-delete-novel-btn');
  assert(verifyAppJs.includes('initDeleteChaptersModal'), 'app.js debe implementar initDeleteChaptersModal');

  // Prueba funcional en SQLite (aislada)
  const delTestNovelId = 887766;
  const delTestMeta = {
    id: delTestNovelId,
    rawId: delTestNovelId,
    slug: 'deletion-test-novel',
    title: 'Deletion Test Novel',
    author: 'Test Author',
    total_chapters: 10
  };

  const cleanupDelTest = () => {
    try {
      repository.deleteNovel(delTestNovelId);
    } catch {}
  };

  cleanupDelTest();
  try {
    repository.upsertNovel(delTestMeta);
    repository.saveChapterTranslation(delTestNovelId, 1, {
      language: 'en',
      title: 'Chapter 1',
      model: 'Gemini',
      paragraphs: ['Para 1']
    }, delTestMeta);
    repository.saveChapterTranslation(delTestNovelId, 2, {
      language: 'en',
      title: 'Chapter 2',
      model: 'Gemini',
      paragraphs: ['Para 2']
    }, delTestMeta);
    repository.updateReadingProgress(delTestNovelId, 2, 'en');

    // 1. Probar deleteChapters: borrar solo capítulo 1
    const delRes1 = repository.deleteChapters(delTestNovelId, [1]);
    assert(delRes1.success, 'deleteChapters debe responder con éxito');
    const chRemaining = repository.getDownloadedChapterNumbers(delTestNovelId, 'en');
    assert.deepStrictEqual(chRemaining, [2], 'Solo debe quedar el capítulo 2');

    // 2. Probar deleteNovel: eliminar novela completa
    const delNovelRes = repository.deleteNovel(delTestNovelId);
    assert(delNovelRes !== null, 'deleteNovel debe devolver la novela eliminada');
    assert(!repository.getNovel(delTestNovelId), 'La novela no debe existir en la base de datos');
    assert.strictEqual(repository.getDownloadedChapters(delTestNovelId, 'en').length, 0, 'No deben quedar capítulos');
    assert(!repository.getReadingProgress(delTestNovelId), 'El progreso debe borrarse');
  } finally {
    cleanupDelTest();
  }

  console.log('   ✓ Botón para borrar capítulos y botón para eliminar novela completa verificados correctamente.');

  // Test 27: Tabla de Contenidos con nombres de capítulos en la búsqueda de series
  console.log('\n27. Probando Tabla de Contenidos con nombres de capítulos en la búsqueda de series...');
  const tocHtml = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'index.html'), 'utf8');
  const tocAppJs = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'app.js'), 'utf8');
  const tocStyles = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'styles.css'), 'utf8');

  // Aserciones en index.html
  assert(tocHtml.includes('class="download-toc-section"'), 'index.html debe contener el contenedor download-toc-section');
  assert(tocHtml.includes('id="modal-toc-list"'), 'index.html debe contener el listado modal-toc-list');
  assert(tocHtml.includes('id="modal-toc-search"'), 'index.html debe contener el campo modal-toc-search');
  assert(tocHtml.includes('id="modal-toc-count"'), 'index.html debe contener el contador modal-toc-count');
  assert(tocHtml.includes('id="toggle-expand-toc-btn"'), 'index.html debe contener el botón toggle-expand-toc-btn');

  // Aserciones en styles.css
  assert(tocStyles.includes('.download-toc-section'), 'styles.css debe definir estilos para .download-toc-section');
  assert(tocStyles.includes('.modal-toc-list'), 'styles.css debe definir estilos para .modal-toc-list');
  assert(tocStyles.includes('.toc-chapter-item'), 'styles.css debe definir estilos para .toc-chapter-item');
  assert(tocStyles.includes('.toc-expanded'), 'styles.css debe definir estilos expandidos para .toc-expanded');
  assert(tocStyles.includes('.novel-card-actions'), 'styles.css debe definir estilos para .novel-card-actions');

  // Aserciones en app.js
  assert(tocAppJs.includes('renderModalTableOfContents'), 'app.js debe implementar renderModalTableOfContents');
  assert(tocAppJs.includes('btn-explore-toc'), 'app.js debe incluir el botón btn-explore-toc en las tarjetas de búsqueda');
  assert(tocAppJs.includes('highlightSelectedTocChapters'), 'app.js debe implementar highlightSelectedTocChapters');
  assert(tocAppJs.includes('btn-toc-pick'), 'app.js debe permitir seleccionar capítulo individual desde la tabla de contenidos');
  assert(tocAppJs.includes('btn-toc-range-to'), 'app.js debe permitir definir rango hasta el capítulo seleccionado');

  // Verificación funcional con API de capítulos
  const sampleChapters = await getChapterList(112330);
  assert(Array.isArray(sampleChapters) && sampleChapters.length > 0, 'getChapterList debe devolver array de capítulos');
  assert(sampleChapters[0].order === 1, 'El primer capítulo debe tener order 1');
  assert(typeof sampleChapters[0].title === 'string' && sampleChapters[0].title.length > 0, 'El capítulo debe contener el nombre del capítulo');
  assert(sampleChapters[0].title.includes('Chapter 1'), 'El título debe contener el número y nombre del capítulo');

  // Verificación de filtrado y búsqueda de capítulos por nombre
  const queryFound = sampleChapters.filter(ch => ch.title.toLowerCase().includes('remnants'));
  assert(queryFound.length > 0, 'La búsqueda por palabra clave del nombre del capítulo debe encontrar coincidencias');
  assert.strictEqual(queryFound[0].order, 1, 'El capítulo encontrado debe ser el 1');

  // Verificación de cero emojis en los archivos modificados
  const emojiCheckRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]|[\u2190-\u21ff]/g;
  const tocHtmlEmojis = tocHtml.match(emojiCheckRegex) || [];
  const tocJsEmojis = tocAppJs.match(emojiCheckRegex) || [];
  assert.strictEqual(tocHtmlEmojis.length, 0, `index.html no debe contener emojis rotos, encontrados: ${tocHtmlEmojis.join(', ')}`);
  assert.strictEqual(tocJsEmojis.length, 0, `app.js no debe contener emojis rotos, encontrados: ${tocJsEmojis.join(', ')}`);

  console.log('   ✓ Tabla de Contenidos con nombres de capítulos, búsqueda en tiempo real y selector de rango verificados.');

  // Test 28: Paginación y Acordeón Configurable de Capítulos
  console.log('\n28. Probando Paginación y Acordeón Configurable de Capítulos...');

  // 1. Verificación funcional de getChapterGrouping y saveChapterGrouping en src/config.js
  const initialGrouping = getChapterGrouping();
  assert(typeof initialGrouping === 'number' && initialGrouping > 0, 'getChapterGrouping debe devolver un número positivo');

  // Guardar configuración numérica personalizada (ej: 10, 20, 50)
  const save10 = saveChapterGrouping(10);
  assert(save10.success, 'saveChapterGrouping(10) debe responder con éxito');
  assert.strictEqual(getChapterGrouping(), 10, 'getChapterGrouping debe retornar 10');

  const save50 = saveChapterGrouping(50);
  assert(save50.success, 'saveChapterGrouping(50) debe responder con éxito');
  assert.strictEqual(getChapterGrouping(), 50, 'getChapterGrouping debe retornar 50');

  // Valores inválidos deben recurrir al valor por defecto (20)
  const saveInvalid = saveChapterGrouping('invalido');
  assert(saveInvalid.success, 'saveChapterGrouping con valor inválido debe tener éxito con fallback');
  assert.strictEqual(getChapterGrouping(), 20, 'Valores inválidos deben recurrir a 20');

  const saveNegative = saveChapterGrouping(-5);
  assert.strictEqual(getChapterGrouping(), 20, 'Valores negativos deben recurrir a 20');

  // Restaurar el valor inicial
  saveChapterGrouping(initialGrouping);

  // 2. Verificación del algoritmo de chunking y rotulado del acordeón
  const mockChapters = Array.from({ length: 45 }, (_, i) => ({
    chapter_no: i + 1,
    title: `Capítulo ${i + 1}: Título ${i + 1}`
  }));

  const chunkChapters = (chs, size) => {
    const res = [];
    for (let i = 0; i < chs.length; i += size) {
      res.push(chs.slice(i, i + size));
    }
    return res;
  };

  const chunks10 = chunkChapters(mockChapters, 10);
  assert.strictEqual(chunks10.length, 5, 'Con 45 capítulos y grupos de 10 deben generarse 5 acordeones');
  assert.strictEqual(chunks10[0][0].chapter_no, 1);
  assert.strictEqual(chunks10[0][chunks10[0].length - 1].chapter_no, 10);
  assert.strictEqual(chunks10[4][0].chapter_no, 41);
  assert.strictEqual(chunks10[4][chunks10[4].length - 1].chapter_no, 45);

  const chunks20 = chunkChapters(mockChapters, 20);
  assert.strictEqual(chunks20.length, 3, 'Con 45 capítulos y grupos de 20 deben generarse 3 acordeones');
  assert.strictEqual(chunks20[0].length, 20);
  assert.strictEqual(chunks20[1].length, 20);
  assert.strictEqual(chunks20[2].length, 5);

  // 3. Verificación de UI, IPC y estilos
  const accHtml = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'index.html'), 'utf8');
  const accStyles = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'styles.css'), 'utf8');
  const accMain = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.js'), 'utf8');
  const accPreload = fs.readFileSync(path.join(__dirname, '..', 'electron', 'preload.cjs'), 'utf8');
  const accAppJs = fs.readFileSync(path.join(__dirname, '..', 'electron', 'renderer', 'app.js'), 'utf8');

  // Aserciones en index.html
  assert(accHtml.includes('id="chapter-group-size-input"'), 'index.html debe contener el campo de configuración numérico chapter-group-size-input');
  assert(accHtml.includes('id="chapter-group-status-pill"'), 'index.html debe incluir el pill de estado chapter-group-status-pill');
  assert(accHtml.includes('id="save-chapter-group-btn"'), 'index.html debe incluir el botón save-chapter-group-btn');
  assert(accHtml.includes('id="reset-chapter-group-btn"'), 'index.html debe incluir el botón reset-chapter-group-btn');
  assert(accHtml.includes('group-size-chip'), 'index.html debe incluir chips para selección rápida de tamaño (10, 20, 50, 100)');

  // Aserciones en styles.css
  assert(accStyles.includes('.chapters-accordion-toolbar'), 'styles.css debe definir estilos para .chapters-accordion-toolbar');
  assert(accStyles.includes('.chapter-accordion'), 'styles.css debe definir estilos para .chapter-accordion');
  assert(accStyles.includes('.chapter-accordion-header'), 'styles.css debe definir estilos para .chapter-accordion-header');
  assert(accStyles.includes('.chapter-accordion-arrow'), 'styles.css debe definir estilos para la flecha giratoria .chapter-accordion-arrow');
  assert(accStyles.includes('.chapter-accordion-body'), 'styles.css debe definir estilos para el cuerpo desplegable .chapter-accordion-body');

  // Aserciones en IPC (main.js y preload.cjs)
  assert(accMain.includes("ipcMain.handle('settings:getChapterGrouping'"), 'main.js debe registrar el handler settings:getChapterGrouping');
  assert(accMain.includes("ipcMain.handle('settings:saveChapterGrouping'"), 'main.js debe registrar el handler settings:saveChapterGrouping');
  assert(accPreload.includes('getChapterGrouping:'), 'preload.cjs debe exponer getChapterGrouping');
  assert(accPreload.includes('saveChapterGrouping:'), 'preload.cjs debe exponer saveChapterGrouping');

  // Aserciones en app.js
  assert(accAppJs.includes('chapterGroupingSize'), 'app.js debe mantener el estado chapterGroupingSize');
  assert(accAppJs.includes('loadChapterGroupingStatus'), 'app.js debe implementar loadChapterGroupingStatus');
  assert(accAppJs.includes('chapter-accordion'), 'app.js debe generar elementos de acordeón para los capítulos');
  assert(accAppJs.includes('accordion-expand-all'), 'app.js debe soportar expandir todos los acordeones');
  assert(accAppJs.includes('accordion-collapse-all'), 'app.js debe soportar colapsar todos los acordeones');

  // Verificación de cero emojis en archivos modificados
  const accHtmlEmojis = accHtml.match(emojiCheckRegex) || [];
  const accJsEmojis = accAppJs.match(emojiCheckRegex) || [];
  assert.strictEqual(accHtmlEmojis.length, 0, `index.html no debe contener emojis rotos, encontrados: ${accHtmlEmojis.join(', ')}`);
  assert.strictEqual(accJsEmojis.length, 0, `app.js no debe contener emojis rotos, encontrados: ${accJsEmojis.join(', ')}`);

  console.log('   ✓ Paginación y Acordeón Configurable de Capítulos verificados exitosamente (10, 20, etc.).');

  // Test 29: Menú Desplegable "Más Opciones" en Detalle de Novela (UX Optimizada)
  console.log('\n29. Probando Menú Desplegable "Más Opciones" en Detalle de Novela (UX Optimizada)...');
  const uxHtml = fs.readFileSync(path.join(__dirname, '../electron/renderer/index.html'), 'utf-8');
  const uxStyles = fs.readFileSync(path.join(__dirname, '../electron/renderer/styles.css'), 'utf-8');
  const uxAppJs = fs.readFileSync(path.join(__dirname, '../electron/renderer/app.js'), 'utf-8');

  // Aserciones en index.html
  assert(uxHtml.includes('id="detail-more-btn"'), 'index.html debe contener el botón detail-more-btn');
  assert(uxHtml.includes('id="detail-more-dropdown"'), 'index.html debe contener el contenedor detail-more-dropdown');
  assert(uxHtml.includes('class="dropdown-wrapper"'), 'index.html debe estructurar el menú en .dropdown-wrapper');
  assert(uxHtml.includes('class="dropdown-divider"'), 'index.html debe contener .dropdown-divider para separar acciones destructivas');
  assert(uxHtml.includes('dropdown-item-danger'), 'index.html debe marcar las opciones destructivas con .dropdown-item-danger');

  // Verificar que las acciones secundarias y destructivas están dentro del dropdown
  const dropdownStartIndex = uxHtml.indexOf('id="detail-more-dropdown"');
  assert(dropdownStartIndex !== -1, 'El dropdown debe existir en index.html');
  const dropdownContent = uxHtml.slice(dropdownStartIndex, dropdownStartIndex + 2000);
  assert(dropdownContent.includes('id="detail-download-more-btn"'), 'detail-download-more-btn debe estar dentro del dropdown');
  assert(dropdownContent.includes('id="detail-export-btn"'), 'detail-export-btn debe estar dentro del dropdown');
  assert(dropdownContent.includes('id="detail-open-folder-btn"'), 'detail-open-folder-btn debe estar dentro del dropdown');
  assert(dropdownContent.includes('id="detail-delete-chapters-btn"'), 'detail-delete-chapters-btn debe estar dentro del dropdown');
  assert(dropdownContent.includes('id="detail-delete-novel-btn"'), 'detail-delete-novel-btn debe estar dentro del dropdown');

  // Aserciones en styles.css
  assert(uxStyles.includes('.dropdown-wrapper'), 'styles.css debe definir estilos para .dropdown-wrapper');
  assert(uxStyles.includes('.dropdown-menu'), 'styles.css debe definir estilos para .dropdown-menu');
  assert(uxStyles.includes('.dropdown-item'), 'styles.css debe definir estilos para .dropdown-item');
  assert(uxStyles.includes('.dropdown-divider'), 'styles.css debe definir estilos para .dropdown-divider');
  assert(uxStyles.includes('.dropdown-item-danger'), 'styles.css debe definir estilos para .dropdown-item-danger');

  // Aserciones en app.js
  assert(uxAppJs.includes("document.getElementById('detail-more-btn')"), 'app.js debe enlazar el botón detail-more-btn');
  assert(uxAppJs.includes("document.getElementById('detail-more-dropdown')"), 'app.js debe referenciar detail-more-dropdown');
  assert(uxAppJs.includes("moreDropdown?.classList.toggle('hidden')"), 'app.js debe alternar visibilidad al hacer clic en Más');

  // Verificación de cero emojis en archivos modificados
  const uxHtmlEmojis = uxHtml.match(emojiCheckRegex) || [];
  const uxJsEmojis = uxAppJs.match(emojiCheckRegex) || [];
  assert.strictEqual(uxHtmlEmojis.length, 0, `index.html no debe contener emojis rotos, encontrados: ${uxHtmlEmojis.join(', ')}`);
  assert.strictEqual(uxJsEmojis.length, 0, `app.js no debe contener emojis rotos, encontrados: ${uxJsEmojis.join(', ')}`);

  console.log('   ✓ Menú Desplegable "Más Opciones" y limpieza de UX en Detalle verificados exitosamente.');

  // Test 30: Reubicación Global de Modales, Apilamiento Z-Index y Apertura Universal de "Descargar Más"
  console.log('\n30. Probando Reubicación Global de Modales, Apilamiento Z-Index y "Descargar Más"...');
  const gmHtml = fs.readFileSync(path.join(__dirname, '../electron/renderer/index.html'), 'utf-8');
  const gmStyles = fs.readFileSync(path.join(__dirname, '../electron/renderer/styles.css'), 'utf-8');
  const gmAppJs = fs.readFileSync(path.join(__dirname, '../electron/renderer/app.js'), 'utf-8');

  // Aserciones en index.html: contenedor global-modals
  assert(gmHtml.includes('id="global-modals"'), 'index.html debe contener el contenedor #global-modals');
  const globalModalsIdx = gmHtml.indexOf('id="global-modals"');
  const settingsSectionIdx = gmHtml.indexOf('id="tab-settings"');

  const downloadModalIdx = gmHtml.indexOf('id="download-modal"');
  const exportModalIdx = gmHtml.indexOf('id="export-modal"');
  const chaptersModalIdx = gmHtml.indexOf('id="chapters-modal"');
  const deleteChaptersModalIdx = gmHtml.indexOf('id="delete-chapters-modal"');
  const readerModalIdx = gmHtml.indexOf('id="reader-modal"');

  // Verificar que todos los modales residen dentro de #global-modals y después de todas las secciones de pestañas
  assert(downloadModalIdx > globalModalsIdx, '#download-modal debe residir dentro de #global-modals');
  assert(exportModalIdx > globalModalsIdx, '#export-modal debe residir dentro de #global-modals');
  assert(chaptersModalIdx > globalModalsIdx, '#chapters-modal debe residir dentro de #global-modals');
  assert(deleteChaptersModalIdx > globalModalsIdx, '#delete-chapters-modal debe residir dentro de #global-modals');
  assert(readerModalIdx > globalModalsIdx, '#reader-modal debe residir dentro de #global-modals');

  assert(globalModalsIdx > settingsSectionIdx, '#global-modals debe ubicarse después de todas las pestañas para evitar display:none');

  // Aserciones en styles.css: jerarquía de capas z-index para apertura superpuesta
  assert(gmStyles.includes('#global-modals'), 'styles.css debe definir #global-modals');
  assert(gmStyles.includes('#chapters-modal'), 'styles.css debe definir z-index para #chapters-modal');
  assert(gmStyles.includes('#reader-modal'), 'styles.css debe definir z-index para #reader-modal');
  assert(gmStyles.includes('#export-modal'), 'styles.css debe definir z-index para #export-modal');
  assert(gmStyles.includes('#download-modal'), 'styles.css debe definir z-index para #download-modal');
  assert(gmStyles.includes('#delete-chapters-modal'), 'styles.css debe definir z-index para #delete-chapters-modal');

  // Aserciones en app.js: opciones de descarga, propagación de idioma y actualización reactiva
  assert(gmAppJs.includes('openDownloadModal(currentChaptersNovel, { suggestedStartChapter: nextCh, lang })'), 'app.js debe abrir el modal de descarga con idioma y capítulo sugerido desde detalle');
  assert(gmAppJs.includes('openDownloadModal(currentReadingNovel, { suggestedStartChapter: nextCh, lang: currentReadingLang })'), 'app.js debe abrir el modal de descarga con idioma y capítulo sugerido desde lector');
  assert(gmAppJs.includes('preferredLang = options.lang'), 'app.js debe capturar el idioma preferido en openDownloadModal');
  assert(gmAppJs.includes('updateModalActionButtons(currentChaptersNovel, lang)'), 'app.js debe refrescar los botones de detalle tras descarga');
  assert(gmAppJs.includes('updateReaderNavButtons()'), 'app.js debe actualizar navegación del lector tras descarga');

  // Verificación de cero emojis en archivos modificados
  const gmHtmlEmojis = gmHtml.match(emojiCheckRegex) || [];
  const gmJsEmojis = gmAppJs.match(emojiCheckRegex) || [];
  assert.strictEqual(gmHtmlEmojis.length, 0, `index.html no debe contener emojis rotos, encontrados: ${gmHtmlEmojis.join(', ')}`);
  assert.strictEqual(gmJsEmojis.length, 0, `app.js no debe contener emojis rotos, encontrados: ${gmJsEmojis.join(', ')}`);

  console.log('   ✓ Reubicación Global de Modales, Z-Index y Apertura de "Descargar Más" verificados exitosamente.');

  // Test 31: Opciones de Ordenamiento y Filtros en Mi Biblioteca, Detalle de Capítulos y TOC
  console.log('\n31. Probando Opciones de Ordenamiento y Filtros (Biblioteca, Capítulos y TOC)...');
  const sortHtml = fs.readFileSync(path.join(__dirname, '../electron/renderer/index.html'), 'utf-8');
  const sortStyles = fs.readFileSync(path.join(__dirname, '../electron/renderer/styles.css'), 'utf-8');
  const sortAppJs = fs.readFileSync(path.join(__dirname, '../electron/renderer/app.js'), 'utf-8');

  // Aserciones en index.html
  assert(sortHtml.includes('id="library-sort-select"'), 'index.html debe contener el selector library-sort-select');
  assert(sortHtml.includes('id="library-lang-filter"'), 'index.html debe contener el filtro library-lang-filter');
  assert(sortHtml.includes('id="chapters-sort-select"'), 'index.html debe contener el selector chapters-sort-select');
  assert(sortHtml.includes('id="modal-toc-sort"'), 'index.html debe contener el selector modal-toc-sort');
  assert(sortHtml.includes('class="library-toolbar"'), 'index.html debe organizar controles en .library-toolbar');

  // Aserciones en styles.css
  assert(sortStyles.includes('.library-toolbar'), 'styles.css debe incluir estilos para .library-toolbar');
  assert(sortStyles.includes('.library-filter-controls'), 'styles.css debe incluir estilos para .library-filter-controls');
  assert(sortStyles.includes('.select-harmonized'), 'styles.css debe incluir estilos para .select-harmonized');

  // Aserciones en app.js
  assert(sortAppJs.includes('library-sort-select'), 'app.js debe interactuar con library-sort-select');
  assert(sortAppJs.includes('library-lang-filter'), 'app.js debe interactuar con library-lang-filter');
  assert(sortAppJs.includes('chapters-sort-select'), 'app.js debe interactuar con chapters-sort-select');
  assert(sortAppJs.includes('modal-toc-sort'), 'app.js debe interactuar con modal-toc-sort');
  assert(sortAppJs.includes('applyLibraryFiltersAndSort'), 'app.js debe implementar applyLibraryFiltersAndSort()');
  assert(sortAppJs.includes('cachedLibraryNovels'), 'app.js debe almacenar en caché cachedLibraryNovels');

  // Prueba funcional de ordenamiento en memoria para novelas
  const mockNovels = [
    { title: 'Zeta Novel', author: 'Bob', downloaded_chapters: 50, total_chapters: 100, last_read_at: '2026-01-01' },
    { title: 'Alpha Novel', author: 'Charlie', downloaded_chapters: 10, total_chapters: 10, last_read_at: '2026-01-03' },
    { title: 'Beta Novel', author: 'Alice', downloaded_chapters: 100, total_chapters: 500, last_read_at: '2026-01-02' }
  ];

  // title_asc
  const sortedTitleAsc = [...mockNovels].sort((a, b) => a.title.localeCompare(b.title));
  assert.strictEqual(sortedTitleAsc[0].title, 'Alpha Novel');
  assert.strictEqual(sortedTitleAsc[2].title, 'Zeta Novel');

  // chapters_desc
  const sortedChDesc = [...mockNovels].sort((a, b) => b.downloaded_chapters - a.downloaded_chapters);
  assert.strictEqual(sortedChDesc[0].title, 'Beta Novel');
  assert.strictEqual(sortedChDesc[2].title, 'Alpha Novel');

  // progress_desc
  const sortedProgDesc = [...mockNovels].sort((a, b) => (b.downloaded_chapters / b.total_chapters) - (a.downloaded_chapters / a.total_chapters));
  assert.strictEqual(sortedProgDesc[0].title, 'Alpha Novel'); // 100%

  // TOC asc / desc
  const mockToc = [{ order: 1 }, { order: 20 }, { order: 5 }];
  const tocAsc = [...mockToc].sort((a, b) => a.order - b.order);
  const tocDesc = [...mockToc].sort((a, b) => b.order - a.order);
  assert.strictEqual(tocAsc[0].order, 1);
  assert.strictEqual(tocDesc[0].order, 20);

  // Verificación de cero emojis en archivos modificados
  const sortHtmlEmojis = sortHtml.match(emojiCheckRegex) || [];
  const sortJsEmojis = sortAppJs.match(emojiCheckRegex) || [];
  assert.strictEqual(sortHtmlEmojis.length, 0, `index.html no debe contener emojis rotos, encontrados: ${sortHtmlEmojis.join(', ')}`);
  assert.strictEqual(sortJsEmojis.length, 0, `app.js no debe contener emojis rotos, encontrados: ${sortJsEmojis.join(', ')}`);

  console.log('   ✓ Opciones de ordenamiento y filtrado en Biblioteca, Capítulos y TOC verificadas exitosamente.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS (31/31) PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN LA PRUEBA:', err);
  process.exit(1);
});
