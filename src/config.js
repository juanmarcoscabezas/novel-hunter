import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');

export const CONFIG = {
  baseUrl: 'https://wtr-lab.com',
  aesKey: 'IJAFUUxjM25hyzL2AZrn0wl7cESED6Ru',
  defaultLanguage: 'en',
  sessionFile: path.join(ROOT_DIR, '.wtr-session.json'),
  downloadsDir: path.join(ROOT_DIR, 'downloads'),
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
