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

  // 10. Estadísticas de almacenamiento en disco (getStorageStats)
  console.log('\n10. Probando getStorageStats...');
  const storage = repo.getStorageStats();
  assert(typeof storage.bytes === 'number', 'storage.bytes debe ser un número');
  assert(storage.bytes > 0, 'storage.bytes debe ser mayor a 0');
  assert(typeof storage.formatted === 'string', 'storage.formatted debe ser un string');
  assert(storage.formatted.includes('B'), 'storage.formatted debe contener unidad de bytes (KB/MB)');
  console.log(`   ✓ getStorageStats devolvió tamaño real en disco: ${storage.formatted} (${storage.bytes} bytes).`);

  // 11. Recuperación del último capítulo leído globalmente y por novela
  console.log('\n11. Probando getGlobalLastRead y getReadingProgress...');
  repo.updateReadingProgress(1001, 2, 'es');
  const globalLast = repo.getGlobalLastRead();
  assert(globalLast !== null, 'Debe devolver el último leído');
  assert.strictEqual(globalLast.novel_id, 1001);
  assert.strictEqual(globalLast.last_read_chapter_no, 2);
  assert.strictEqual(globalLast.last_read_language, 'es');
  assert.strictEqual(globalLast.title, 'The Legendary Mechanic');

  const prog = repo.getReadingProgress(1001);
  assert(prog !== null);
  assert.strictEqual(prog.last_read_chapter_no, 2);
  assert.strictEqual(prog.last_read_language, 'es');
  console.log(`   ✓ Último capítulo leído recuperado con éxito: "${globalLast.title}" Cap. ${globalLast.last_read_chapter_no} [${globalLast.last_read_language}].`);

  // 12. Detección de capítulos en inglés no traducidos al español
  console.log('\n12. Probando getUntranslatedChapterNumbers (EN -> ES)...');
  const untranslated = repo.getUntranslatedChapterNumbers(1001, 'en', 'es');
  assert.deepStrictEqual(untranslated, [2], 'El capítulo 2 debe ser detectado como pendiente de traducir a español');
  console.log(`   ✓ getUntranslatedChapterNumbers detectó correctamente los capítulos pendientes: [${untranslated.join(', ')}].`);

  // 13. Eliminación de capítulos (deleteChapters)
  console.log('\n13. Probando deleteChapters...');
  // Borrar solo la traducción al español del capítulo 1
  const delEs = repo.deleteChapters(1001, [1], 'es');
  assert(delEs.success);
  assert.deepStrictEqual(repo.getDownloadedChapterNumbers(1001, 'es'), [], 'Ya no debe haber capítulos en español');
  assert.deepStrictEqual(repo.getDownloadedChapterNumbers(1001, 'en'), [1, 2], 'Los capítulos en inglés deben mantenerse');

  // Borrar el capítulo 2 completamente en todos los idiomas
  const delCh2 = repo.deleteChapters(1001, [2]);
  assert(delCh2.success);
  assert.deepStrictEqual(repo.getDownloadedChapterNumbers(1001, 'en'), [1], 'Solo debe quedar el capítulo 1 en inglés');

  // Verificar que el progreso de lectura se reajustó al capítulo disponible restante
  const adjustedProg = repo.getReadingProgress(1001);
  assert.strictEqual(adjustedProg.last_read_chapter_no, 1, 'El progreso de lectura debe reajustarse al capítulo restante');
  console.log('   ✓ deleteChapters validado (borrado por idioma, borrado canónico y reajuste de progreso).');

  // 14. Eliminación de novela completa (deleteNovel)
  console.log('\n14. Probando deleteNovel...');
  const delNovel = repo.deleteNovel('legendary-mechanic');
  assert(delNovel !== null);
  assert.strictEqual(delNovel.id, 1001);

  // Verificar cascada 3NF completa: novela, capítulos, traducciones, párrafos, progreso y glosario
  assert(!repo.getNovel(1001), 'La novela no debe existir');
  assert.strictEqual(repo.listLibrary().length, 0, 'La biblioteca debe quedar vacía');
  assert.strictEqual(repo.getDownloadedChapters(1001, 'en').length, 0, 'No deben quedar capítulos');
  assert.strictEqual(repo.getReadingProgress(1001), null, 'El progreso debe eliminarse por cascada');

  const termsCount = memDb.prepare('SELECT count(*) as count FROM glossary_terms WHERE novel_id = 1001').get().count;
  assert.strictEqual(termsCount, 0, 'Los términos del glosario deben eliminarse en cascada');

  const paragraphsCount = memDb.prepare('SELECT count(*) as count FROM paragraphs').get().count;
  assert.strictEqual(paragraphsCount, 0, 'Los párrafos atómicos deben eliminarse en cascada');
  console.log('   ✓ deleteNovel validado con cascada relacional 3NF completa (SQLite).');

  // 15. Probando sanitización de párrafos con espacios y líneas en blanco
  console.log('\n15. Probando sanitización de párrafos con espacios y líneas en blanco...');
  repo.upsertNovel({ rawId: 2002, slug: 'test-spaces', title: 'Spaces Test Novel' });
  repo.saveChapterTranslation(2002, 1, {
    language: 'en',
    title: 'Chapter 1: Spaces',
    model: 'Gemini',
    paragraphs: [
      '  First paragraph with   extra spaces.  ',
      '',
      '   ',
      'Second paragraph with \n\n newlines and   spaces.  ',
      '   \n\r   '
    ]
  });
  const chSpaces = repo.getChapterTranslation(2002, 1, 'en');
  assert.strictEqual(chSpaces.paragraphs.length, 2, 'Los párrafos vacíos deben ser filtrados');
  assert.strictEqual(chSpaces.paragraphs[0], 'First paragraph with extra spaces.');
  assert.strictEqual(chSpaces.paragraphs[1], 'Second paragraph with newlines and spaces.');
  repo.deleteNovel('test-spaces');
  console.log('   ✓ Párrafos vacíos eliminados y espacios normalizados correctamente en SQLite.');

  // 16. Probando opciones de ordenamiento en listLibrary
  console.log('\n16. Probando opciones de ordenamiento en listLibrary (3NF)...');
  repo.upsertNovel({ rawId: 3001, slug: 'novel-beta', title: 'Beta Novel', author: 'Zack Writer', totalChapters: 100 });
  repo.upsertNovel({ rawId: 3002, slug: 'novel-alpha', title: 'Alpha Novel', author: 'Adam Author', totalChapters: 10 });
  repo.upsertNovel({ rawId: 3003, slug: 'novel-gamma', title: 'Gamma Novel', author: 'Mary Novelist', totalChapters: 50 });

  // Guardar capítulos:
  // Alpha: 5 de 10 (50% progreso)
  for (let i = 1; i <= 5; i++) {
    repo.saveChapterTranslation(3002, i, { language: 'en', title: `Cap ${i}`, fullText: 'Alpha text' });
  }
  // Gamma: 10 de 50 (20% progreso)
  for (let i = 1; i <= 10; i++) {
    repo.saveChapterTranslation(3003, i, { language: 'en', title: `Cap ${i}`, fullText: 'Gamma text' });
  }
  // Beta: 1 de 100 (1% progreso)
  repo.saveChapterTranslation(3001, 1, { language: 'en', title: 'Cap 1', fullText: 'Beta text' });

  // Progreso de lectura: Gamma leído más recientemente que Beta
  repo.updateReadingProgress(3001, 1, 'en');
  repo.updateReadingProgress(3003, 5, 'en');
  memDb.prepare("UPDATE reading_progress SET last_read_at = '2026-01-01 10:00:00' WHERE novel_id = 3001").run();
  memDb.prepare("UPDATE reading_progress SET last_read_at = '2026-01-02 12:00:00' WHERE novel_id = 3003").run();
  repo.db.prepare("UPDATE reading_progress SET last_read_at = datetime('now', '+5 seconds') WHERE novel_id = 3003").run();

  // Test title_asc
  const byTitleAsc = repo.listLibrary('title_asc');
  assert.strictEqual(byTitleAsc[0].title, 'Alpha Novel');
  assert.strictEqual(byTitleAsc[1].title, 'Beta Novel');
  assert.strictEqual(byTitleAsc[2].title, 'Gamma Novel');

  // Test title_desc
  const byTitleDesc = repo.listLibrary('title_desc');
  assert.strictEqual(byTitleDesc[0].title, 'Gamma Novel');
  assert.strictEqual(byTitleDesc[1].title, 'Beta Novel');
  assert.strictEqual(byTitleDesc[2].title, 'Alpha Novel');

  // Test chapters_desc
  const byChaptersDesc = repo.listLibrary('chapters_desc');
  assert.strictEqual(byChaptersDesc[0].title, 'Gamma Novel'); // 10 caps
  assert.strictEqual(byChaptersDesc[1].title, 'Alpha Novel'); // 5 caps
  assert.strictEqual(byChaptersDesc[2].title, 'Beta Novel');  // 1 cap

  // Test author_asc
  const byAuthorAsc = repo.listLibrary('author_asc');
  assert.strictEqual(byAuthorAsc[0].author, 'Adam Author');
  assert.strictEqual(byAuthorAsc[1].author, 'Mary Novelist');
  assert.strictEqual(byAuthorAsc[2].author, 'Zack Writer');

  // Test progress_desc
  const byProgressDesc = repo.listLibrary('progress_desc');
  assert.strictEqual(byProgressDesc[0].title, 'Alpha Novel'); // 50%
  assert.strictEqual(byProgressDesc[1].title, 'Gamma Novel'); // 20%
  assert.strictEqual(byProgressDesc[2].title, 'Beta Novel');  // 1%

  // Test last_read
  const byLastRead = repo.listLibrary('last_read');
  assert.strictEqual(byLastRead[0].title, 'Gamma Novel'); // leído de último

  // Limpieza
  repo.deleteNovel('novel-beta');
  repo.deleteNovel('novel-alpha');
  repo.deleteNovel('novel-gamma');
  assert.strictEqual(repo.listLibrary().length, 0);
  console.log('   ✓ Opciones de ordenamiento en listLibrary (title_asc, title_desc, chapters_desc, author_asc, progress_desc, last_read) validadas exitosamente.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA BASE DE DATOS (16/16) PASARON EXITOSAMENTE!');
}

runDbTests().catch(err => {
  console.error('\n❌ ERROR EN PRUEBAS BD:', err);
  process.exit(1);
});
