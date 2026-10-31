#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { searchNovels, parseNovelUrl, getChapterList } from '../src/api/novel.js';
import { fetchChapter } from '../src/api/reader.js';
import { saveChapterAsTxt } from '../src/storage/writer.js';
import { mergeChaptersToTxt } from '../src/storage/merger.js';
import { exportChaptersToPdf } from '../src/storage/pdf.js';
import { getSavedSession, saveSession, clearSession } from '../src/config.js';
import { client } from '../src/api/client.js';
import { repository } from '../src/db/repository.js';

const program = new Command();

program
  .name('wtr')
  .description('Herramienta CLI para buscar, descargar y fusionar novelas de WTR-LAB con SQLite, Gemini, Google Translate, TXT y PDF')
  .version('1.1.0');

// Subcomando: Catálogo / Biblioteca local SQLite
program
  .command('library')
  .alias('list')
  .description('Listar todas las novelas y capítulos almacenados en la base de datos local SQLite')
  .action(() => {
    const list = repository.listLibrary();
    if (list.length === 0) {
      console.log(chalk.yellow('\nℹ Tu biblioteca local está vacía. Descarga tu primera novela con: wtr <nombre_o_url>\n'));
      return;
    }

    console.log(chalk.bold.cyan('\n=== Mi Biblioteca Local (SQLite) ===\n'));
    for (const item of list) {
      console.log(chalk.bold.white(`📖 ${item.title}`));
      console.log(chalk.dim(`   ID (raw_id): ${item.raw_id} | Slug: ${item.slug}`));
      console.log(chalk.dim(`   Autor: ${item.author || 'Desconocido'}`));
      console.log(chalk.green(`   Capítulos descargados: ${item.downloaded_chapters} / ${item.total_chapters || '?'}`));
      console.log(chalk.blue(`   Idiomas disponibles: ${item.languages || 'ninguno'}`));
      if (item.last_read_chapter_no) {
        console.log(chalk.magenta(`   Último leído: Capítulo ${item.last_read_chapter_no}`));
      }
      console.log('');
    }
  });

// Subcomando: Exportar directamente desde la base de datos SQLite (Offline)
program
  .command('export <novel>')
  .description('Exportar capítulos a TXT o PDF directamente desde la base de datos local sin conexión')
  .option('-c, --chapters <range>', 'Rango de capítulos a exportar (ej: "1-50", "all")', 'all')
  .option('-l, --lang <language>', 'Idioma a exportar ("en" o "es")', 'en')
  .option('-m, --merge', 'Fusionar los capítulos exportados en un solo archivo compilado')
  .option('-p, --pdf', 'Generar versión en documento PDF')
  .action(async (novelIdentifier, options) => {
    try {
      const novel = repository.getNovel(novelIdentifier);
      if (!novel) {
        console.log(chalk.red(`\n✖ No se encontró la novela "${novelIdentifier}" en la base de datos local.`));
        console.log(chalk.dim('Usa "wtr library" para ver las novelas guardadas.\n'));
        return;
      }

      const downloadedNumbers = repository.getDownloadedChapterNumbers(novel.id, options.lang);
      if (downloadedNumbers.length === 0) {
        console.log(chalk.yellow(`\nℹ No hay capítulos descargados en idioma [${options.lang.toUpperCase()}] para "${novel.title}".\n`));
        return;
      }

      const requestedNumbers = parseChapterSpec(options.chapters, Math.max(...downloadedNumbers));
      const targetNumbers = requestedNumbers.filter(num => downloadedNumbers.includes(num));

      if (targetNumbers.length === 0) {
        console.log(chalk.red('\n✖ Ninguno de los capítulos solicitados se encuentra en la base de datos local.\n'));
        return;
      }

      console.log(chalk.cyan(`\nExportando ${targetNumbers.length} capítulos desde SQLite en idioma [${options.lang.toUpperCase()}]...`));

      const chapters = [];
      for (const num of targetNumbers) {
        const ch = repository.getChapterTranslation(novel.id, num, options.lang);
        if (ch) {
          saveChapterAsTxt(novel.slug, ch, novel.title);
          chapters.push(ch);
          if (options.pdf && !options.merge) {
            await exportChaptersToPdf(novel.slug, [ch], novel.title);
          }
        }
      }

      if (options.merge && chapters.length > 1) {
        const mergedTxt = mergeChaptersToTxt(novel.slug, chapters, novel.title);
        console.log(chalk.green(`✓ Archivo fusionado TXT creado:`));
        console.log(chalk.dim(`  ${mergedTxt}`));

        if (options.pdf) {
          const mergedPdf = await exportChaptersToPdf(novel.slug, chapters, novel.title);
          console.log(chalk.green(`✓ Archivo fusionado PDF creado:`));
          console.log(chalk.dim(`  ${mergedPdf}`));
        }
      }

      console.log(chalk.bold.green(`\n✓ ¡Exportación completada con éxito desde la base de datos!\n`));
    } catch (err) {
      console.error(chalk.red('\n✖ Error al exportar:'), err.message);
    }
  });

// Subcomando: Autenticación / Guardado de Cookies
program
  .command('auth')
  .description('Configurar cookies de sesión de tu cuenta de WTR-LAB para acceso autenticado y bypass de Cloudflare')
  .option('-c, --cookie <string>', 'Cadena de cookies completa (obtenida de tu navegador)')
  .option('--clear', 'Borrar la sesión guardada actualmente')
  .action(async (options) => {
    if (options.clear) {
      clearSession();
      console.log(chalk.green('✓ Sesión eliminada correctamente.'));
      return;
    }

    let cookie = options.cookie;
    if (!cookie) {
      const response = await prompts({
        type: 'password',
        name: 'cookie',
        message: 'Pega tu cookie de sesión de WTR-Lab (de DevTools -> Application -> Cookies o cabecera Cookie):'
      });
      cookie = response.cookie;
    }

    if (cookie && cookie.trim()) {
      saveSession(cookie.trim());
      console.log(chalk.green('✓ Sesión y cookies guardadas con éxito en .wtr-session.json'));
    } else {
      console.log(chalk.yellow('No se proporcionaron cookies.'));
    }
  });

// Subcomando: Estado de la sesión
program
  .command('status')
  .description('Verificar el estado de la sesión guardada')
  .action(() => {
    const session = getSavedSession();
    if (session && session.cookie) {
      console.log(chalk.green('✓ Hay una sesión activa configurada.'));
      console.log(chalk.dim(`Longitud de la cookie: ${session.cookie.length} caracteres`));
    } else {
      console.log(chalk.yellow('ℹ No hay sesión configurada. Las descargas se realizarán como usuario invitado público.'));
      console.log(chalk.dim('Puedes configurar tu cuenta con: wtr auth'));
    }
  });

// Comando principal de descarga y búsqueda (por defecto)
program
  .command('download [query]', { isDefault: true })
  .description('Buscar y descargar capítulos de WTR-Lab (por defecto si no se especifica subcomando)')
  .option('-c, --chapters <range>', 'Rango o lista de capítulos a descargar (ej: "1-10", "5", "1,3,7-9", "all")')
  .option('-l, --lang <language>', 'Idioma de traducción ("en" o "es")', 'en')
  .option('-m, --merge', 'Fusionar los capítulos descargados en un único archivo')
  .option('-p, --pdf', 'Exportar además a formato PDF')
  .action(async (query, options) => {
    try {
      await runDownloader(query, options);
    } catch (err) {
      console.error(chalk.red('\n✖ Error:'), err.message);
      process.exit(1);
    }
  });

/**
 * Función principal que orquesta la búsqueda, selección y descarga.
 */
async function runDownloader(query, options) {
  console.log(chalk.bold.cyan('\n=== WTR-LAB Novel Downloader ===\n'));

  let novelInfo = null;

  // 1. Si no hay query en los argumentos, preguntar interactivamente
  let input = query;
  if (!input) {
    const res = await prompts({
      type: 'text',
      name: 'input',
      message: 'Ingresa el nombre de la novela o su URL de WTR-Lab:'
    });
    input = res.input;
  }

  if (!input || !input.trim()) {
    console.log(chalk.yellow('Operación cancelada.'));
    return;
  }

  input = input.trim();

  // 2. Comprobar si es una URL
  const parsedUrl = parseNovelUrl(input);
  if (parsedUrl) {
    console.log(chalk.blue(`ℹ URL detectada: raw_id = ${parsedUrl.rawId}, slug = ${parsedUrl.slug}`));
    novelInfo = {
      rawId: parsedUrl.rawId,
      slug: parsedUrl.slug,
      title: parsedUrl.slug.replace(/-/g, ' ').toUpperCase()
    };
  } else {
    // 3. Buscar por nombre
    console.log(chalk.dim(`Buscando novelas con el término "${input}"...`));
    const results = await searchNovels(input);

    if (results.length === 0) {
      console.log(chalk.red(`No se encontraron novelas para "${input}". Intenta con otra palabra clave o la URL directa.`));
      return;
    }

    if (results.length === 1) {
      novelInfo = results[0];
      console.log(chalk.green(`✓ Novela encontrada: ${novelInfo.title}`));
    } else if (!process.stdout.isTTY) {
      // En modo no interactivo (o scripts), seleccionar la primera coincidencia
      novelInfo = results[0];
      console.log(chalk.yellow(`ℹ Múltiples resultados (${results.length}). Seleccionando automáticamente la primera: "${novelInfo.title}"`));
    } else {
      // Selección interactiva entre los resultados
      const choices = results.map(n => ({
        title: `${n.title} (${n.chapterCount} capítulos) - ${n.author}`,
        value: n
      }));

      const selection = await prompts({
        type: 'select',
        name: 'novel',
        message: 'Selecciona una novela:',
        choices
      });

      if (!selection.novel) {
        console.log(chalk.yellow('Selección cancelada.'));
        return;
      }
      novelInfo = selection.novel;
    }
  }

  // 4. Obtener listado de capítulos
  console.log(chalk.dim(`\nCargando listado de capítulos para "${novelInfo.title}"...`));
  const chapters = await getChapterList(novelInfo.rawId);
  console.log(chalk.green(`✓ Total de capítulos disponibles: ${chapters.length}`));

  // 5. Determinar qué capítulos descargar
  let chapterSpec = options.chapters;
  if (!chapterSpec) {
    const promptRes = await prompts({
      type: 'text',
      name: 'chapters',
      message: `¿Qué capítulos deseas descargar? (Ej: "1-10", "5", "1,3,5-8", o "all" para todos [1-${chapters.length}]):`,
      initial: '1-5'
    });
    chapterSpec = promptRes.chapters;
  }

  if (!chapterSpec || !chapterSpec.trim()) {
    console.log(chalk.yellow('No se especificaron capítulos. Saliendo...'));
    return;
  }

  const selectedOrders = parseChapterSpec(chapterSpec.trim(), chapters.length);
  if (selectedOrders.length === 0) {
    console.log(chalk.red('La especificación de capítulos no arrojó ningún capítulo válido.'));
    return;
  }

  // 6. Opciones de idioma, fusión y PDF (si no fueron pasadas por flag)
  let targetLang = options.lang || 'en';
  if (!options.lang && process.stdout.isTTY) {
    const langRes = await prompts({
      type: 'select',
      name: 'lang',
      message: 'Selecciona el idioma deseado:',
      choices: [
        { title: 'Inglés (Nativo Gemini / WTR-Lab)', value: 'en' },
        { title: 'Español (Traducción al español)', value: 'es' }
      ],
      initial: 0
    });
    if (langRes.lang) targetLang = langRes.lang;
  }

  const isInteractive = !query && !options.chapters && process.stdout.isTTY;

  let shouldMerge = !!options.merge;
  if (options.merge === undefined && selectedOrders.length > 1 && isInteractive) {
    const mergeRes = await prompts({
      type: 'confirm',
      name: 'merge',
      message: `¿Deseas fusionar los ${selectedOrders.length} capítulos en un único archivo compilado?`,
      initial: true
    });
    shouldMerge = !!mergeRes.merge;
  }

  let shouldExportPdf = !!options.pdf;
  if (options.pdf === undefined && isInteractive) {
    const pdfRes = await prompts({
      type: 'confirm',
      name: 'pdf',
      message: '¿Deseas generar además una copia en PDF?',
      initial: false
    });
    shouldExportPdf = !!pdfRes.pdf;
  }

  console.log(chalk.cyan(`\nIniciando descarga de ${selectedOrders.length} capítulos en idioma [${targetLang.toUpperCase()}]...\n`));

  const downloadedChapters = [];

  for (let i = 0; i < selectedOrders.length; i++) {
    const chNum = selectedOrders[i];
    process.stdout.write(chalk.dim(`[${i + 1}/${selectedOrders.length}] Descargando capítulo ${chNum}... `));

    try {
      const chapterData = await fetchChapter(novelInfo.rawId, chNum, {
        targetLang,
        novelMeta: novelInfo
      });
      const txtPath = saveChapterAsTxt(novelInfo.slug, chapterData, novelInfo.title);
      downloadedChapters.push(chapterData);

      // Registrar progreso de lectura en SQLite
      repository.updateReadingProgress(novelInfo.rawId, chNum);

      const sourceLabel = chapterData.fromDb
        ? chalk.magenta('[Caché SQLite]')
        : chalk.cyan(`[${chapterData.model}]`);

      console.log(chalk.green(`✓ ${sourceLabel} "${chapterData.title}"`));

      // Si se solicitó PDF individual sin merge
      if (shouldExportPdf && !shouldMerge) {
        await exportChaptersToPdf(novelInfo.slug, [chapterData], novelInfo.title);
      }

      // Si vino de la red y no de la BD local, aplicar pausa de cortesía anti-detección
      if (!chapterData.fromDb && i < selectedOrders.length - 1) {
        await client.delay(900, 1900);
      }
    } catch (err) {
      console.log(chalk.red(`✖ Error: ${err.message}`));
    }
  }

  console.log(chalk.bold.green(`\n✓ Descarga completada: ${downloadedChapters.length} de ${selectedOrders.length} capítulos guardados.`));

  // 7. Fusión de capítulos si fue solicitado
  if (shouldMerge && downloadedChapters.length > 1) {
    console.log(chalk.dim('\nFusionando capítulos en un documento consolidado...'));
    const mergedTxtPath = mergeChaptersToTxt(novelInfo.slug, downloadedChapters, novelInfo.title);
    console.log(chalk.green(`✓ Archivo fusionado generado:`));
    console.log(chalk.cyan(`  ${mergedTxtPath}`));

    if (shouldExportPdf) {
      console.log(chalk.dim('Generando compilación en PDF...'));
      const mergedPdfPath = await exportChaptersToPdf(novelInfo.slug, downloadedChapters, novelInfo.title);
      console.log(chalk.green(`✓ Archivo PDF generado:`));
      console.log(chalk.cyan(`  ${mergedPdfPath}`));
    }
  } else if (shouldExportPdf && downloadedChapters.length > 0 && !shouldMerge) {
    console.log(chalk.green(`✓ Archivos PDF individuales generados en la carpeta de la novela.`));
  }

  console.log(chalk.bold.cyan('\n¡Proceso finalizado con éxito!\n'));
}

/**
 * Parsea especificaciones de capítulos como:
 * - "all" -> 1 hasta total
 * - "1-10" -> 1 al 10
 * - "5" -> [5]
 * - "1, 3, 5-8" -> [1, 3, 5, 6, 7, 8]
 */
function parseChapterSpec(spec, totalChapters) {
  if (spec.toLowerCase() === 'all') {
    return Array.from({ length: totalChapters }, (_, i) => i + 1);
  }

  const set = new Set();
  const parts = spec.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalChapters, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          set.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalChapters) {
        set.add(num);
      }
    }
  }

  return Array.from(set).sort((a, b) => a - b);
}

program.parse(process.argv);
