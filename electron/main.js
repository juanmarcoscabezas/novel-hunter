import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { searchNovels, parseNovelUrl, getChapterList } from '../src/api/novel.js';
import { fetchChapter } from '../src/api/reader.js';
import { saveChapterAsTxt } from '../src/storage/writer.js';
import { mergeChaptersToTxt } from '../src/storage/merger.js';
import { exportChaptersToPdf } from '../src/storage/pdf.js';
import { CONFIG, getSavedSession, saveSession, clearSession } from '../src/config.js';
import { repository } from '../src/db/repository.js';
import { client } from '../src/api/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let activeDownloadAbort = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    title: 'WTR-Lab Novel Downloader & Library',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Manejar apertura de enlaces externos en el navegador predeterminado
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicialización de la aplicación
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Configuración de los canales de comunicación IPC
function setupIpcHandlers() {
  // 1. Búsqueda de novelas
  ipcMain.handle('novel:search', async (_event, query) => {
    try {
      if (!query || !query.trim()) return [];
      const trimmed = query.trim();

      // Verificar si es URL directa
      const parsedUrl = parseNovelUrl(trimmed);
      if (parsedUrl) {
        return [{
          id: parsedUrl.rawId,
          rawId: parsedUrl.rawId,
          slug: parsedUrl.slug,
          title: parsedUrl.slug.replace(/-/g, ' ').toUpperCase(),
          author: 'WTR-Lab',
          description: `Novela detectada por URL directa (${parsedUrl.slug})`,
          image: null,
          chapterCount: '?'
        }];
      }

      return await searchNovels(trimmed);
    } catch (err) {
      console.error('Error in novel:search:', err);
      throw new Error(err.message || 'Error al buscar novelas');
    }
  });

  // 2. Obtener lista de capítulos
  ipcMain.handle('novel:getChapters', async (_event, rawId) => {
    try {
      return await getChapterList(rawId);
    } catch (err) {
      console.error('Error in novel:getChapters:', err);
      throw new Error(err.message || 'Error al obtener la lista de capítulos');
    }
  });

  // 3. Cancelar descarga activa
  ipcMain.handle('novel:cancelDownload', () => {
    activeDownloadAbort = true;
    return { success: true };
  });

  // 4. Descargar lote de capítulos
  ipcMain.handle('novel:download', async (event, payload) => {
    const {
      novel,
      chapterNumbers,
      lang = 'en',
      merge = false,
      pdf = false
    } = payload;

    activeDownloadAbort = false;
    const total = chapterNumbers.length;
    const downloadedChapters = [];
    const results = {
      total,
      successCount: 0,
      failedCount: 0,
      savedTxtFiles: [],
      mergedTxt: null,
      mergedPdf: null,
      cancelled: false
    };

    // Asegurar que la novela y sus metadatos existan en SQLite
    if (novel) {
      try {
        repository.upsertNovel(novel);
      } catch (err) {
        console.warn('Aviso al registrar novela en SQLite:', err.message);
      }
    }

    const sender = event.sender;

    for (let i = 0; i < total; i++) {
      if (activeDownloadAbort) {
        results.cancelled = true;
        sender.send('download:progress', {
          current: i,
          total,
          percent: Math.round((i / total) * 100),
          status: 'Descarga cancelada por el usuario',
          cancelled: true
        });
        break;
      }

      const chapterNo = chapterNumbers[i];
      const percent = Math.round((i / total) * 100);

      sender.send('download:progress', {
        current: i + 1,
        total,
        percent,
        chapterNo,
        status: `Descargando Capítulo ${chapterNo} (${i + 1}/${total})...`
      });

      try {
        const chapterData = await fetchChapter(novel.rawId || novel.id, chapterNo, {
          targetLang: lang,
          novelMeta: novel
        });

        if (chapterData) {
          // Guardar archivo individual TXT
          const txtPath = saveChapterAsTxt(novel.slug, chapterData, novel.title);
          results.savedTxtFiles.push(txtPath);
          downloadedChapters.push(chapterData);
          results.successCount++;

          // Actualizar progreso de lectura
          repository.updateReadingProgress(novel.rawId || novel.id, chapterNo);

          // Exportar PDF individual si se solicitó y no es fusión
          if (pdf && !merge) {
            await exportChaptersToPdf(novel.slug, [chapterData], novel.title);
          }
        }
      } catch (err) {
        console.error(`Error downloading chapter ${chapterNo}:`, err.message);
        results.failedCount++;
      }
    }

    // Fusión de capítulos si corresponde
    if (merge && downloadedChapters.length > 1) {
      sender.send('download:progress', {
        current: total,
        total,
        percent: 95,
        status: 'Fusionando capítulos compilados...'
      });

      results.mergedTxt = mergeChaptersToTxt(novel.slug, downloadedChapters, novel.title);

      if (pdf) {
        sender.send('download:progress', {
          current: total,
          total,
          percent: 98,
          status: 'Compilando documento PDF final...'
        });
        results.mergedPdf = await exportChaptersToPdf(novel.slug, downloadedChapters, novel.title);
      }
    } else if (pdf && !merge && downloadedChapters.length > 0) {
      // Si se pidió PDF individual para todos
      sender.send('download:progress', {
        current: total,
        total,
        percent: 98,
        status: 'Generando archivos PDF individuales...'
      });
    }

    sender.send('download:progress', {
      current: total,
      total,
      percent: 100,
      status: results.cancelled ? 'Proceso cancelado' : '¡Completado con éxito!',
      finished: true
    });

    return results;
  });

  // 5. Biblioteca Local SQLite
  ipcMain.handle('library:list', async () => {
    try {
      return repository.listLibrary();
    } catch (err) {
      console.error('Error in library:list:', err);
      return [];
    }
  });

  // 6. Estadísticas e información de una novela en SQLite
  ipcMain.handle('library:getNovelStats', async (_event, slug) => {
    try {
      const novel = repository.getNovel(slug);
      if (!novel) return null;
      const stats = repository.getNovelStats(slug);
      const enNums = repository.getDownloadedChapterNumbers(novel.id, 'en');
      const esNums = repository.getDownloadedChapterNumbers(novel.id, 'es');
      return {
        novel,
        stats,
        enChapters: enNums,
        esChapters: esNums
      };
    } catch (err) {
      console.error('Error in library:getNovelStats:', err);
      return null;
    }
  });

  // 6b. Listado detallado de capítulos descargados
  ipcMain.handle('library:getChapters', async (_event, novelId, lang = 'en') => {
    try {
      return repository.getDownloadedChapters(novelId, lang);
    } catch (err) {
      console.error('Error in library:getChapters:', err);
      return [];
    }
  });

  // 6c. Leer un capítulo desde la base de datos
  ipcMain.handle('library:readChapter', async (_event, novelId, chapterNo, lang = 'en') => {
    try {
      const ch = repository.getChapterTranslation(novelId, chapterNo, lang);
      if (ch) {
        repository.updateReadingProgress(novelId, chapterNo);
      }
      return ch;
    } catch (err) {
      console.error('Error in library:readChapter:', err);
      return null;
    }
  });

  // 7. Exportar offline desde la base de datos local SQLite
  ipcMain.handle('library:export', async (event, payload) => {
    const { slug, chapterNumbers, lang = 'en', merge = false, pdf = false } = payload;
    const novel = repository.getNovel(slug);
    if (!novel) throw new Error(`Novela no encontrada en base de datos: ${slug}`);

    const chapters = [];
    const sender = event.sender;
    const total = chapterNumbers.length;

    for (let i = 0; i < total; i++) {
      const num = chapterNumbers[i];
      sender.send('download:progress', {
        current: i + 1,
        total,
        percent: Math.round(((i + 1) / total) * 70),
        status: `Extrayendo Capítulo ${num} de SQLite (${lang.toUpperCase()})...`
      });

      const ch = repository.getChapterTranslation(novel.id, num, lang);
      if (ch) {
        saveChapterAsTxt(novel.slug, ch, novel.title);
        chapters.push(ch);
        if (pdf && !merge) {
          await exportChaptersToPdf(novel.slug, [ch], novel.title);
        }
      }
    }

    let mergedTxt = null;
    let mergedPdf = null;

    if (merge && chapters.length > 1) {
      sender.send('download:progress', {
        current: total,
        total,
        percent: 85,
        status: 'Generando archivo consolidado TXT...'
      });
      mergedTxt = mergeChaptersToTxt(novel.slug, chapters, novel.title);

      if (pdf) {
        sender.send('download:progress', {
          current: total,
          total,
          percent: 95,
          status: 'Compilando libro digital PDF...'
        });
        mergedPdf = await exportChaptersToPdf(novel.slug, chapters, novel.title);
      }
    }

    sender.send('download:progress', {
      current: total,
      total,
      percent: 100,
      status: '¡Exportación completada!',
      finished: true
    });

    return {
      exportedCount: chapters.length,
      mergedTxt,
      mergedPdf
    };
  });

  // 8. Gestión de sesión y cookies
  ipcMain.handle('auth:get', () => {
    const session = getSavedSession();
    return {
      hasSession: Boolean(session && session.cookie),
      cookieLength: session?.cookie ? session.cookie.length : 0,
      cookiePreview: session?.cookie ? session.cookie.slice(0, 30) + '...' : ''
    };
  });

  ipcMain.handle('auth:save', (_event, cookieStr) => {
    if (!cookieStr || !cookieStr.trim()) {
      throw new Error('La cookie no puede estar vacía');
    }
    saveSession(cookieStr.trim());
    return { success: true };
  });

  ipcMain.handle('auth:clear', () => {
    clearSession();
    return { success: true };
  });

  ipcMain.handle('auth:test', async () => {
    try {
      const res = await client.request('/api/search', {
        method: 'POST',
        body: JSON.stringify({ text: 'test' })
      });
      return { ok: true, status: res.status };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // 9. Abrir directorios nativos en el explorador de archivos
  ipcMain.handle('shell:openFolder', async (_event, target) => {
    const folderPath = target === 'exports'
      ? CONFIG.exportsDir
      : target === 'data'
        ? CONFIG.dataDir
        : path.resolve(CONFIG.exportsDir, target || '');

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    await shell.openPath(folderPath);
    return { success: true, path: folderPath };
  });

  // 10. Ejecución de comandos en la consola integrada (Terminal Tab)
  ipcMain.handle('cli:exec', async (event, cmdLine) => {
    const sender = event.sender;
    const write = (text) => sender.send('cli:output', text);

    if (!cmdLine || !cmdLine.trim()) return;
    const raw = cmdLine.trim();

    write(`\x1b[36m$ ${raw}\x1b[0m\n`);

    try {
      await executeCliCommand(raw, write);
    } catch (err) {
      write(`\x1b[31m✖ Error: ${err.message}\x1b[0m\n\n`);
    }
  });
}

/**
 * Intérprete y ejecutor de comandos CLI para la consola integrada
 */
async function executeCliCommand(cmdLine, write) {
  const parts = splitCommandLine(cmdLine);
  if (parts.length === 0) return;

  let command = parts[0];
  let args = parts.slice(1);

  if (command === 'wtr') {
    if (args.length === 0) {
      command = 'help';
    } else {
      command = args[0];
      args = args.slice(1);
    }
  }

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      write('\x1b[1m\x1b[33mComandos disponibles en la consola:\x1b[0m\n');
      write('  \x1b[32mwtr <query> [opciones]\x1b[0m          Buscar y descargar novela\n');
      write('    -c, --chapters <rango>     Ej: 1-10, 5, all\n');
      write('    -l, --lang <en|es>         Idioma de traducción\n');
      write('    -m, --merge                Fusionar en archivo único\n');
      write('    -p, --pdf                  Exportar también a PDF\n');
      write('  \x1b[32mwtr library\x1b[0m                    Listar catálogo en SQLite\n');
      write('  \x1b[32mwtr export <novela> [opciones]\x1b[0m Exportar desde base de datos\n');
      write('  \x1b[32mwtr status\x1b[0m                     Estado de sesión de usuario\n');
      write('  \x1b[32mwtr auth -c "<cookie>"\x1b[0m         Configurar cookies de sesión\n');
      write('  \x1b[32mwtr auth --clear\x1b[0m               Borrar cookies de sesión\n');
      write('  \x1b[32mclear\x1b[0m                          Limpiar la pantalla de la consola\n\n');
      break;

    case 'clear':
    case 'cls':
      write('\x1b[2J\x1b[H');
      break;

    case 'status': {
      const session = getSavedSession();
      if (session && session.cookie) {
        write(`\x1b[32m✓ Hay una sesión activa configurada.\x1b[0m\n`);
        write(`\x1b[90mLongitud de la cookie: ${session.cookie.length} caracteres\x1b[0m\n\n`);
      } else {
        write(`\x1b[33mℹ No hay sesión configurada. Se operará como invitado público.\x1b[0m\n\n`);
      }
      break;
    }

    case 'auth': {
      if (args.includes('--clear')) {
        clearSession();
        write('\x1b[32m✓ Sesión eliminada correctamente.\x1b[0m\n\n');
      } else {
        const cIdx = args.indexOf('-c') !== -1 ? args.indexOf('-c') : args.indexOf('--cookie');
        if (cIdx !== -1 && args[cIdx + 1]) {
          saveSession(args[cIdx + 1]);
          write('\x1b[32m✓ Sesión guardada con éxito.\x1b[0m\n\n');
        } else {
          write('\x1b[33mUso: wtr auth -c "<tu_cookie_aqui>"\x1b[0m\n\n');
        }
      }
      break;
    }

    case 'library':
    case 'list': {
      const list = repository.listLibrary();
      if (list.length === 0) {
        write('\x1b[33mℹ La biblioteca local está vacía.\x1b[0m\n\n');
        return;
      }
      write('\x1b[1m\x1b[36m=== Mi Biblioteca Local (SQLite) ===\x1b[0m\n');
      for (const item of list) {
        write(`\x1b[1m📖 ${item.title}\x1b[0m\n`);
        write(`   \x1b[90mSlug: ${item.slug} | Autor: ${item.author || 'Desconocido'}\x1b[0m\n`);
        write(`   \x1b[32mCapítulos guardados: ${item.downloaded_chapters} / ${item.total_chapters || '?'}\x1b[0m\n`);
        write(`   \x1b[34mIdiomas: ${item.languages || 'ninguno'}\x1b[0m\n\n`);
      }
      break;
    }

    case 'export': {
      if (args.length === 0) {
        write('\x1b[31m✖ Falta el identificador de la novela (slug o id).\x1b[0m\n');
        write('Ejemplo: wtr export lord-at-the-beginning -c 1-5 --pdf\n\n');
        return;
      }
      const targetSlug = args[0];
      const novel = repository.getNovel(targetSlug);
      if (!novel) {
        write(`\x1b[31m✖ Novela no encontrada en SQLite: "${targetSlug}"\x1b[0m\n\n`);
        return;
      }
      const lang = getOptionValue(args, ['-l', '--lang'], 'en');
      const chapSpec = getOptionValue(args, ['-c', '--chapters'], 'all');
      const merge = args.includes('-m') || args.includes('--merge');
      const pdf = args.includes('-p') || args.includes('--pdf');

      const downloaded = repository.getDownloadedChapterNumbers(novel.id, lang);
      if (downloaded.length === 0) {
        write(`\x1b[33mℹ No hay capítulos guardados en [${lang.toUpperCase()}] para esta novela.\x1b[0m\n\n`);
        return;
      }

      write(`\x1b[36mExportando capítulos para "${novel.title}"...\x1b[0m\n`);
      const targetNumbers = chapSpec === 'all'
        ? downloaded
        : parseChapterRange(chapSpec, Math.max(...downloaded)).filter(n => downloaded.includes(n));

      const chapters = [];
      for (const n of targetNumbers) {
        const ch = repository.getChapterTranslation(novel.id, n, lang);
        if (ch) {
          saveChapterAsTxt(novel.slug, ch, novel.title);
          chapters.push(ch);
          if (pdf && !merge) {
            await exportChaptersToPdf(novel.slug, [ch], novel.title);
          }
        }
      }

      if (merge && chapters.length > 1) {
        mergeChaptersToTxt(novel.slug, chapters, novel.title);
        if (pdf) {
          await exportChaptersToPdf(novel.slug, chapters, novel.title);
        }
      }
      write(`\x1b[32m✓ ¡${chapters.length} capítulos exportados exitosamente a la carpeta exports/${novel.slug}/\x1b[0m\n\n`);
      break;
    }

    case 'download':
    default: {
      // Descarga por búsqueda o URL
      let query = command === 'download' ? args[0] : command;
      let restArgs = command === 'download' ? args.slice(1) : args;

      if (!query) {
        write('\x1b[31m✖ Ingresa el nombre o URL de la novela.\x1b[0m\n');
        write('Ejemplo: wtr "lord at the beginning" -c 1-5\n\n');
        return;
      }

      write(`\x1b[36mBuscando "${query}"...\x1b[0m\n`);
      const results = await searchNovels(query);
      if (results.length === 0) {
        write(`\x1b[31m✖ No se encontraron resultados para "${query}".\x1b[0m\n\n`);
        return;
      }

      const selected = results[0];
      write(`\x1b[32m✓ Encontrada: ${selected.title} (${selected.chapterCount} capítulos)\x1b[0m\n`);
      try {
        repository.upsertNovel(selected);
      } catch (e) {}

      const chapSpec = getOptionValue(restArgs, ['-c', '--chapters'], '1-3');
      const lang = getOptionValue(restArgs, ['-l', '--lang'], 'en');
      const merge = restArgs.includes('-m') || restArgs.includes('--merge');
      const pdf = restArgs.includes('-p') || restArgs.includes('--pdf');

      const chList = await getChapterList(selected.rawId);
      const totalAvail = chList.length || 1000;
      const targetNumbers = parseChapterRange(chapSpec, totalAvail);

      write(`\x1b[36mDescargando ${targetNumbers.length} capítulos en [${lang.toUpperCase()}]...\x1b[0m\n`);
      const downloaded = [];

      for (let i = 0; i < targetNumbers.length; i++) {
        const num = targetNumbers[i];
        write(`  [${i + 1}/${targetNumbers.length}] Descargando Capítulo ${num}...`);
        const ch = await fetchChapter(selected.rawId, num, {
          targetLang: lang,
          novelMeta: selected
        });
        if (ch) {
          saveChapterAsTxt(selected.slug, ch, selected.title);
          downloaded.push(ch);
          if (pdf && !merge) {
            await exportChaptersToPdf(selected.slug, [ch], selected.title);
          }
          write(` \x1b[32m✓ OK\x1b[0m\n`);
        } else {
          write(` \x1b[31m✖ Falló\x1b[0m\n`);
        }
      }

      if (merge && downloaded.length > 1) {
        write(`  Fusionando archivos...\n`);
        mergeChaptersToTxt(selected.slug, downloaded, selected.title);
        if (pdf) {
          await exportChaptersToPdf(selected.slug, downloaded, selected.title);
        }
      }

      write(`\x1b[1m\x1b[32m✓ ¡Descarga completada! Archivos disponibles en exports/${selected.slug}/\x1b[0m\n\n`);
      break;
    }
  }
}

function splitCommandLine(cmd) {
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const results = [];
  let match;
  while ((match = regex.exec(cmd)) !== null) {
    results.push(match[1] || match[2] || match[0]);
  }
  return results;
}

function getOptionValue(args, flags, defaultValue) {
  for (let i = 0; i < args.length; i++) {
    if (flags.includes(args[i]) && args[i + 1]) {
      return args[i + 1];
    }
  }
  return defaultValue;
}

function parseChapterRange(spec, max) {
  if (!spec || spec.toLowerCase() === 'all') {
    return Array.from({ length: max }, (_, i) => i + 1);
  }
  const result = new Set();
  const parts = spec.split(',').map(s => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = Math.min(parseInt(endStr, 10), max);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= max) result.add(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > 0 && num <= max) result.add(num);
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}
