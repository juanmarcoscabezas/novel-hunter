import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let instance = null;

/**
 * Obtiene la conexión a la base de datos SQLite (Singleton).
 * @param {string} [customPath] Ruta personalizada para pruebas o memoria
 * @returns {DatabaseSync}
 */
export function getDb(customPath = null) {
  if (instance && !customPath) {
    return instance;
  }

  let dbPath = customPath || CONFIG.dbPath;

  // Medida defensiva: nunca permitir una ruta dentro del archivo .asar
  if (dbPath && dbPath !== ':memory:' && dbPath.includes('app.asar')) {
    const fallbackDir = process.env.PORTABLE_EXECUTABLE_DIR || process.env.APPDATA || process.env.HOME || process.cwd();
    dbPath = path.join(fallbackDir, 'data', 'novels.db');
  }

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  // Optimizaciones de rendimiento e integridad
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');

  // Inicializar esquema de tablas
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Migraciones incrementales automáticas
  try {
    db.exec(`ALTER TABLE reading_progress ADD COLUMN last_read_language TEXT DEFAULT 'en';`);
  } catch {
    // Columna ya existe
  }

  if (!customPath) {
    instance = db;
  }

  return db;
}

/**
 * Cierra la conexión activa de la base de datos.
 */
export function closeDb() {
  if (instance) {
    instance.close();
    instance = null;
  }
}
