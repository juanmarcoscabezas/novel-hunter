import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Resuelve el directorio base para almacenar datos de usuario (base de datos SQLite, descargas, sesiones).
 * En desarrollo y CLI usa la raíz del proyecto.
 * En modo empaquetado (Electron asar / Windows portable / instalador), utiliza un directorio con permisos
 * de escritura reales fuera del archivo .asar para evitar errores ENOTDIR.
 */
export function resolveStorageDir() {
  if (process.versions && process.versions.electron) {
    try {
      const require = createRequire(import.meta.url);
      const electron = require('electron');
      const app = electron.app || electron?.default?.app;

      if (app) {
        // En desarrollo local (no empaquetado y fuera de app.asar), usar ROOT_DIR del proyecto
        if (!app.isPackaged && !__dirname.includes('app.asar')) {
          return ROOT_DIR;
        }

        // Si es ejecutable portable de Windows (electron-builder define PORTABLE_EXECUTABLE_DIR)
        if (process.env.PORTABLE_EXECUTABLE_DIR) {
          try {
            const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
            fs.accessSync(portableDir, fs.constants.W_OK);
            return portableDir;
          } catch {
            // Si el directorio portable no es escribible, recurrir a userData
          }
        }

        // Si está instalado o es una app empaquetada estándar, usar el directorio userData
        return app.getPath('userData');
      }
    } catch {
      // Ignorar error de importación si ocurriese
    }
  }

  // Fallback si la ruta está dentro de app.asar pero sin la API app de Electron
  if (__dirname.includes('app.asar')) {
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
      return process.env.PORTABLE_EXECUTABLE_DIR;
    }
    const fallbackBase = process.env.APPDATA || process.env.HOME || process.cwd();
    return path.join(fallbackBase, 'Novel Hunter');
  }

  // CLI estándar, scripts o suites de prueba de Node
  return ROOT_DIR;
}

export const STORAGE_DIR = resolveStorageDir();

export const CONFIG = {
  baseUrl: 'https://wtr-lab.com',
  aesKey: 'IJAFUUxjM25hyzL2AZrn0wl7cESED6Ru',
  defaultLanguage: 'en',
  sessionFile: path.join(STORAGE_DIR, '.wtr-session.json'),
  exportsDir: path.join(STORAGE_DIR, 'exports'),
  downloadsDir: path.join(STORAGE_DIR, 'exports'), // Alias retrocompatible
  dataDir: path.join(STORAGE_DIR, 'data'),
  dbPath: path.join(STORAGE_DIR, 'data', 'novels.db'),
  defaultDelayMs: 1500, // Anti-bot jitter delay
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    'Sec-Ch-Ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Referer': 'https://wtr-lab.com/en'
  }
};

/**
 * Carga las cookies de sesión guardadas si existen.
 */
export function getSavedSession() {
  try {
    if (fs.existsSync(CONFIG.sessionFile)) {
      const data = fs.readFileSync(CONFIG.sessionFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // Silently ignore corrupted session file
  }
  return null;
}

/**
 * Guarda las cookies de sesión del usuario.
 * @param {string|object} sessionData Cadena de cookies o token
 */
export function saveSession(sessionData) {
  const content = typeof sessionData === 'string' ? { cookie: sessionData } : sessionData;
  fs.writeFileSync(CONFIG.sessionFile, JSON.stringify(content, null, 2), 'utf8');
}

/**
 * Elimina la sesión guardada.
 */
export function clearSession() {
  if (fs.existsSync(CONFIG.sessionFile)) {
    fs.unlinkSync(CONFIG.sessionFile);
  }
}

/**
 * Obtiene la configuración general de la aplicación desde settings.json.
 */
export function getAppSettings() {
  try {
    const settingsPath = path.join(CONFIG.dataDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const parsedGrouping = parseInt(data.chapterGrouping, 10);
      return {
        geminiApiKey: data.geminiApiKey || process.env.GEMINI_API_KEY || null,
        chapterGrouping: !isNaN(parsedGrouping) && parsedGrouping > 0 ? parsedGrouping : 20,
        ...data
      };
    }
  } catch {}
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || null,
    chapterGrouping: 20
  };
}

/**
 * Guarda o actualiza configuraciones en settings.json preservando las demás propiedades.
 */
export function saveAppSettings(newSettings = {}) {
  const settingsPath = path.join(CONFIG.dataDir, 'settings.json');
  let current = {};
  try {
    if (fs.existsSync(settingsPath)) {
      current = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch {}

  if (!fs.existsSync(CONFIG.dataDir)) {
    fs.mkdirSync(CONFIG.dataDir, { recursive: true });
  }

  const merged = { ...current, ...newSettings };
  if (merged.chapterGrouping !== undefined) {
    const parsed = parseInt(merged.chapterGrouping, 10);
    merged.chapterGrouping = !isNaN(parsed) && parsed > 0 ? parsed : 20;
  }

  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

/**
 * Obtiene la cantidad de capítulos por grupo para el acordeón (por defecto 20).
 */
export function getChapterGrouping() {
  const settings = getAppSettings();
  return settings.chapterGrouping || 20;
}

/**
 * Guarda la cantidad de capítulos por grupo para el acordeón.
 * Acepta cualquier valor numérico válido (10, 20, etc.). Si no es válido o es <= 0, usa 20.
 */
export function saveChapterGrouping(size) {
  const parsed = parseInt(size, 10);
  const validatedSize = !isNaN(parsed) && parsed > 0 ? parsed : 20;
  const updated = saveAppSettings({ chapterGrouping: validatedSize });
  return { success: true, chapterGrouping: updated.chapterGrouping };
}

/**
 * Obtiene la API Key de Gemini configurada.
 */
export function getGeminiApiKey() {
  const settings = getAppSettings();
  return settings.geminiApiKey || process.env.GEMINI_API_KEY || null;
}

/**
 * Guarda la API Key de Gemini para uso con IA.
 */
export function saveGeminiApiKey(key) {
  return saveAppSettings({ geminiApiKey: (key || '').trim() });
}
