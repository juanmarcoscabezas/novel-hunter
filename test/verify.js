import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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

async function runTests() {
  console.log('🧪 Iniciando suite de pruebas de verificación integral de todas las funcionalidades...\n');

  // Test 1: URL Parser
  console.log('1. Probando parseNovelUrl...');
  const parsed = parseNovelUrl('https://wtr-lab.com/en/novel/112330/mortal-wonders-of-the-heavens-enjoying-eternal-life');
  assert.strictEqual(parsed.rawId, 112330);
  assert.strictEqual(parsed.slug, 'mortal-wonders-of-the-heavens-enjoying-eternal-life');
  console.log('   ✓ parseNovelUrl pasó correctamente.');

  // Test 2: Búsqueda de novelas
  console.log('\n2. Probando searchNovels("mortal")...');
  const searchResults = await searchNovels('mortal');
  assert(searchResults.length > 0, 'Debe encontrar al menos una novela');
  console.log(`   ✓ searchNovels encontró ${searchResults.length} novelas. Primera: "${searchResults[0].title}"`);

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

  console.log('\n🎉 ¡TODAS LAS PRUEBAS (14/14) PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN LA PRUEBA:', err);
  process.exit(1);
});
