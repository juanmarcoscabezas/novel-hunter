import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { searchNovels, parseNovelUrl, getChapterList } from '../src/api/novel.js';
import { processGeminiContent } from '../src/translators/gemini.js';
import { translateWithGoogle } from '../src/translators/google.js';
import { fetchChapter } from '../src/api/reader.js';
import { saveChapterAsTxt } from '../src/storage/writer.js';
import { mergeChaptersToTxt } from '../src/storage/merger.js';
import { exportChaptersToPdf } from '../src/storage/pdf.js';

async function runTests() {
  console.log('🧪 Iniciando suite de pruebas de verificación...\n');

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

  // Test 5: Google Translate
  console.log('\n5. Probando translateWithGoogle...');
  const translated = await translateWithGoogle(['Hello world', 'How are you?'], 'es', 'en');
  assert.strictEqual(translated.length, 2);
  console.log(`   ✓ Google Translate: "${translated[0]}" y "${translated[1]}"`);

  // Test 6: Descarga real de capítulo 1
  console.log('\n6. Probando fetchChapter(112330, 1)...');
  const ch1 = await fetchChapter(112330, 1, { targetLang: 'en' });
  assert.strictEqual(ch1.chapterNo, 1);
  assert(ch1.paragraphs.length > 10, 'El capítulo 1 debe tener más de 10 párrafos');
  console.log(`   ✓ Capítulo 1 descargado: "${ch1.title}" (${ch1.model}) - ${ch1.paragraphs.length} párrafos.`);

  // Test 7: Guardado TXT individual
  console.log('\n7. Probando guardado en TXT...');
  const txtPath = saveChapterAsTxt('test-novel', ch1, 'Test Novel');
  assert(fs.existsSync(txtPath), 'El archivo TXT debe existir');
  console.log(`   ✓ Archivo TXT creado: ${txtPath}`);

  // Test 8: Fusión de capítulos en TXT
  console.log('\n8. Probando fusión de capítulos...');
  const ch2 = await fetchChapter(112330, 2, { targetLang: 'en' });
  const mergedTxt = mergeChaptersToTxt('test-novel', [ch1, ch2], 'Test Novel');
  assert(fs.existsSync(mergedTxt), 'El archivo fusionado TXT debe existir');
  console.log(`   ✓ Archivo fusionado creado: ${mergedTxt}`);

  // Test 9: Exportación a PDF
  console.log('\n9. Probando exportación a PDF...');
  const pdfPath = await exportChaptersToPdf('test-novel', [ch1, ch2], 'Test Novel');
  assert(fs.existsSync(pdfPath), 'El archivo PDF debe existir');
  const pdfStats = fs.statSync(pdfPath);
  assert(pdfStats.size > 1000, 'El archivo PDF debe tener tamaño válido');
  console.log(`   ✓ Archivo PDF creado: ${pdfPath} (${Math.round(pdfStats.size / 1024)} KB)`);

  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN LA PRUEBA:', err);
  process.exit(1);
});
