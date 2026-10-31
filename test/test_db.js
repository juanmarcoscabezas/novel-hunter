import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { NovelRepository } from '../src/db/repository.js';
import { getDb, closeDb } from '../src/db/connection.js';

async function runDbTests() {
  console.log('🧪 Iniciando pruebas de Base de Datos SQLite (Normalizada 3NF)...\n');

  // Usar BD en memoria para la prueba
  const memDb = getDb(':memory:');
  const repo = new NovelRepository(memDb);

  // 1. Guardar metadatos de novela y autor
  console.log('1. Probando upsertNovel con autor...');
  repo.upsertNovel({
    rawId: 1001,
    slug: 'legendary-mechanic',
    title: 'The Legendary Mechanic',
    author: 'Chocolion',
    totalChapters: 1463,
    description: 'Transmigrated into an NPC mechanic...'
  });

  const novel = repo.getNovel(1001);
  assert.strictEqual(novel.title, 'The Legendary Mechanic');
  assert.strictEqual(novel.author, 'Chocolion');
  assert.strictEqual(novel.slug, 'legendary-mechanic');
  console.log('   ✓ Novela y autor normalizados correctamente.');

  // 2. Guardar términos de glosario
  console.log('\n2. Probando saveGlossaryTerms...');
  repo.saveGlossaryTerms(1001, [
    ['Han Xiao', '韩萧'],
    ['Black Star', '黑星']
  ], 'en');
  console.log('   ✓ Glosario guardado.');

  // 3. Guardar traducción de capítulo 1 en inglés (Gemini)
  console.log('\n3. Probando saveChapterTranslation (Inglés / Gemini)...');
  const saved1 = repo.saveChapterTranslation(1001, 1, {
    language: 'en',
    title: 'Chapter 1: Transmigration',
    model: 'Gemini (gemini-3.5-flash-lite)',
    source: 'gemini',
    rawTitle: '第1章 穿越',
    paragraphs: [
      'Han Xiao opened his eyes in a cold laboratory.',
      'He looked around at the metal walls and cables.'
    ]
  });
  assert(saved1.chapterId > 0);
  assert(saved1.translationId > 0);

  // Recuperar capítulo de la BD
  const retrieved1 = repo.getChapterTranslation(1001, 1, 'en');
  assert.strictEqual(retrieved1.chapterNo, 1);
  assert.strictEqual(retrieved1.title, 'Chapter 1: Transmigration');
  assert.strictEqual(retrieved1.paragraphs.length, 2);
  assert.strictEqual(retrieved1.paragraphs[0], 'Han Xiao opened his eyes in a cold laboratory.');
  console.log('   ✓ Capítulo en inglés recuperado con párrafos atómicos en 1NF.');

  // 4. Guardar traducción del mismo capítulo 1 en español (Google Translate)
  console.log('\n4. Probando traducción paralela en español del mismo capítulo...');
  const saved1Es = repo.saveChapterTranslation(1001, 1, {
    language: 'es',
    title: 'Capítulo 1: Transmigración',
    model: 'Google Translate',
    source: 'google',
    rawTitle: '第1章 穿越',
    paragraphs: [
      'Han Xiao abrió los ojos en un frío laboratorio.',
      'Miró a su alrededor las paredes de metal y los cables.'
    ]
  });

  const retrieved1Es = repo.getChapterTranslation(1001, 1, 'es');
  assert.strictEqual(retrieved1Es.title, 'Capítulo 1: Transmigración');
  assert.strictEqual(retrieved1Es.paragraphs[0], 'Han Xiao abrió los ojos en un frío laboratorio.');
  console.log('   ✓ Traducción en español guardada paralelamente sin duplicar el capítulo canónico.');

  // 5. Guardar capítulo 2
  console.log('\n5. Probando capítulo 2...');
  repo.saveChapterTranslation(1001, 2, {
    language: 'en',
    title: 'Chapter 2: The Interface',
    model: 'Gemini',
    paragraphs: ['A transparent virtual screen appeared before him.']
  });

  // 6. Consultar biblioteca y capítulos descargados
  console.log('\n6. Probando listLibrary y getDownloadedChapterNumbers...');
  const library = repo.listLibrary();
  assert.strictEqual(library.length, 1);
  assert.strictEqual(library[0].downloaded_chapters, 2);
  console.log(`   ✓ Biblioteca: "${library[0].title}" (${library[0].downloaded_chapters} capítulos, idiomas: ${library[0].languages})`);

  const enChapters = repo.getDownloadedChapterNumbers(1001, 'en');
  assert.deepStrictEqual(enChapters, [1, 2]);

  const esChapters = repo.getDownloadedChapterNumbers(1001, 'es');
  assert.deepStrictEqual(esChapters, [1]);
  console.log('   ✓ Filtros de capítulos por idioma validados.');

  // 7. Progreso de lectura
  console.log('\n7. Probando updateReadingProgress...');
  repo.updateReadingProgress(1001, 2);
  const updatedLib = repo.listLibrary();
  assert.strictEqual(updatedLib[0].last_read_chapter_no, 2);
  console.log('   ✓ Progreso de lectura registrado.');

  // 8. Estadísticas detalladas de la novela (getNovelStats)
  console.log('\n8. Probando getNovelStats...');
  const stats = repo.getNovelStats('legendary-mechanic');
  assert(stats !== null);
  assert.strictEqual(stats.title, 'The Legendary Mechanic');
  assert.strictEqual(stats.languages.length, 2);
  console.log('   ✓ getNovelStats devolvió estadísticas por idioma.');

  // 9. Listado detallado de capítulos para la UI (getDownloadedChapters)
  console.log('\n9. Probando getDownloadedChapters...');
  const detailedChapters = repo.getDownloadedChapters(1001, 'en');
  assert.strictEqual(detailedChapters.length, 2);
  assert.strictEqual(detailedChapters[0].chapter_no, 1);
  assert.strictEqual(detailedChapters[0].title, 'Chapter 1: Transmigration');
  assert(detailedChapters[0].char_length > 0);
  console.log('   ✓ getDownloadedChapters devolvió metadatos completos para lector y explorador.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA BASE DE DATOS PASARON EXITOSAMENTE!');
}

runDbTests().catch(err => {
  console.error('\n❌ ERROR EN PRUEBAS BD:', err);
  process.exit(1);
});
