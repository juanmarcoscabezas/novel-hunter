import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './connection.js';
import { CONFIG } from '../config.js';

export class NovelRepository {
  constructor(dbInstance = null) {
    this.db = dbInstance || getDb();
  }

  /**
   * Inserta o recupera el ID de un autor.
   */
  upsertAuthor(name) {
    if (!name || typeof name !== 'string') return null;
    const cleanName = name.trim();
    if (!cleanName) return null;

    const findStmt = this.db.prepare('SELECT id FROM authors WHERE name = ?');
    const existing = findStmt.get(cleanName);
    if (existing) return existing.id;

    const insertStmt = this.db.prepare('INSERT INTO authors (name) VALUES (?) RETURNING id');
    return insertStmt.get(cleanName).id;
  }

  /**
   * Guarda o actualiza los metadatos de una novela.
   */
  upsertNovel(novel) {
    const authorId = this.upsertAuthor(novel.author);
    const stmt = this.db.prepare(`
      INSERT INTO novels (id, slug, title, author_id, total_chapters, cover_url, synopsis, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        title = excluded.title,
        author_id = COALESCE(excluded.author_id, novels.author_id),
        total_chapters = MAX(novels.total_chapters, excluded.total_chapters),
        cover_url = COALESCE(excluded.cover_url, novels.cover_url),
        synopsis = COALESCE(excluded.synopsis, novels.synopsis),
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      novel.rawId || novel.id || novel.raw_id,
      novel.slug,
      novel.title,
      authorId,
      novel.totalChapters || novel.chapterCount || 0,
      novel.coverUrl || novel.image || null,
      novel.synopsis || novel.description || null
    );
  }

  /**
   * Inserta o recupera el ID de un motor de traducción.
   */
  upsertEngine(name, provider = 'wtr-ai') {
    const cleanName = (name || 'Unknown Engine').trim();
    const findStmt = this.db.prepare('SELECT id FROM translation_engines WHERE name = ?');
    const existing = findStmt.get(cleanName);
    if (existing) return existing.id;

    const insertStmt = this.db.prepare('INSERT INTO translation_engines (name, provider) VALUES (?, ?) RETURNING id');
    return insertStmt.get(cleanName, provider).id;
  }

  /**
   * Guarda los términos de glosario oficiales de una novela.
   */
  saveGlossaryTerms(novelId, terms = [], language = 'en') {
    if (!Array.isArray(terms) || terms.length === 0) return;

    // Asegurar que la novela exista para satisfacer la clave foránea
    this.db.prepare(`
      INSERT OR IGNORE INTO novels (id, slug, title)
      VALUES (?, ?, ?)
    `).run(novelId, `novel-${novelId}`, `Novela ${novelId}`);

    const stmt = this.db.prepare(`
      INSERT INTO glossary_terms (novel_id, raw_term, translated_term, language)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(novel_id, raw_term, language) DO UPDATE SET
        translated_term = excluded.translated_term
    `);

    for (const [translated, raw] of terms) {
      if (raw && translated) {
        stmt.run(novelId, String(raw).trim(), String(translated).trim(), language);
      }
    }
  }

  /**
   * Guarda un capítulo canónico y su traducción con sus párrafos atómicos en una transacción.
   */
  saveChapterTranslation(novelRawId, chapterNo, translationData, novelMeta = null) {
    if (novelMeta) {
      this.upsertNovel(novelMeta);
    } else {
      // Asegurar que la novela exista
      this.db.prepare(`
        INSERT OR IGNORE INTO novels (id, slug, title)
        VALUES (?, ?, ?)
      `).run(novelRawId, `novel-${novelRawId}`, `Novela ${novelRawId}`);
    }

    const engineId = this.upsertEngine(translationData.model, translationData.source === 'google' ? 'google' : 'wtr-ai');

    // 1. Asegurar la existencia del capítulo canónico
    const chapterStmt = this.db.prepare(`
      INSERT INTO chapters (novel_id, chapter_no, raw_title)
      VALUES (?, ?, ?)
      ON CONFLICT(novel_id, chapter_no) DO UPDATE SET
        raw_title = COALESCE(excluded.raw_title, chapters.raw_title)
      RETURNING id
    `);
    const chapterId = chapterStmt.get(novelRawId, chapterNo, translationData.rawTitle || null).id;

    // 2. Guardar la traducción del capítulo
    const fullText = Array.isArray(translationData.paragraphs)
      ? translationData.paragraphs.join('\n\n')
      : String(translationData.paragraphs || '');

    const transStmt = this.db.prepare(`
      INSERT INTO chapter_translations (chapter_id, engine_id, language, title, source_service, full_text, translated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(chapter_id, language, engine_id) DO UPDATE SET
        title = excluded.title,
        source_service = excluded.source_service,
        full_text = excluded.full_text,
        translated_at = CURRENT_TIMESTAMP
      RETURNING id
    `);
    const translationId = transStmt.get(
      chapterId,
      engineId,
      translationData.language || 'en',
      translationData.title,
      translationData.source || 'gemini',
      fullText
    ).id;

    // 3. Guardar los párrafos atómicos en la tabla 'paragraphs'
    if (Array.isArray(translationData.paragraphs) && translationData.paragraphs.length > 0) {
      // Limpiar párrafos previos de esta traducción si existieran
      this.db.prepare('DELETE FROM paragraphs WHERE translation_id = ?').run(translationId);

      const pStmt = this.db.prepare(`
        INSERT INTO paragraphs (translation_id, paragraph_order, content)
        VALUES (?, ?, ?)
      `);

      for (let i = 0; i < translationData.paragraphs.length; i++) {
        pStmt.run(translationId, i + 1, translationData.paragraphs[i]);
      }
    }

    return { chapterId, translationId };
  }

  /**
   * Obtiene la traducción de un capítulo y sus párrafos desde la base de datos si ya existe.
   */
  getChapterTranslation(novelRawId, chapterNo, language = 'en') {
    const query = this.db.prepare(`
      SELECT 
        c.chapter_no,
        c.raw_title,
        ct.id as translation_id,
        ct.title,
        ct.language,
        ct.source_service,
        ct.full_text,
        e.name as model
      FROM chapters c
      JOIN chapter_translations ct ON ct.chapter_id = c.id
      JOIN translation_engines e ON ct.engine_id = e.id
      WHERE c.novel_id = ? AND c.chapter_no = ? AND ct.language = ?
      ORDER BY ct.translated_at DESC
      LIMIT 1
    `);

    const row = query.get(novelRawId, chapterNo, language);
    if (!row) return null;

    // Obtener los párrafos atómicos ordenados
    const pStmt = this.db.prepare(`
      SELECT content FROM paragraphs
      WHERE translation_id = ?
      ORDER BY paragraph_order ASC
    `);
    const pRows = pStmt.all(row.translation_id);
    const paragraphs = pRows.length > 0 ? pRows.map(p => p.content) : row.full_text.split('\n\n');

    return {
      chapterNo: row.chapter_no,
      title: row.title,
      rawTitle: row.raw_title,
      language: row.language,
      model: row.model,
      source: row.source_service,
      paragraphs
    };
  }

  /**
   * Busca una novela por su ID o por su slug.
   */
  getNovel(identifier) {
    const stmt = this.db.prepare(`
      SELECT n.*, a.name as author
      FROM novels n
      LEFT JOIN authors a ON n.author_id = a.id
      WHERE n.id = ? OR n.slug = ?
    `);
    return stmt.get(identifier, identifier);
  }

  /**
   * Obtiene estadísticas de capítulos e idiomas de una novela en la base de datos.
   */
  getNovelStats(identifier) {
    const novel = this.getNovel(identifier);
    if (!novel) return null;

    const stmt = this.db.prepare(`
      SELECT 
        ct.language,
        COUNT(DISTINCT c.chapter_no) as chapter_count,
        MIN(c.chapter_no) as min_chapter,
        MAX(c.chapter_no) as max_chapter
      FROM chapters c
      JOIN chapter_translations ct ON ct.chapter_id = c.id
      WHERE c.novel_id = ?
      GROUP BY ct.language
    `);
    const langStats = stmt.all(novel.id);

    return {
      novelId: novel.id,
      title: novel.title,
      slug: novel.slug,
      languages: langStats
    };
  }

  /**
   * Lista todas las novelas en la base de datos con conteo de capítulos descargados por idioma.
   */
  listLibrary() {
    const stmt = this.db.prepare(`
      SELECT 
        n.id as raw_id,
        n.slug,
        n.title,
        a.name as author,
        n.total_chapters,
        n.cover_url,
        n.synopsis,
        COUNT(DISTINCT c.chapter_no) as downloaded_chapters,
        GROUP_CONCAT(DISTINCT ct.language) as languages,
        rp.last_read_chapter_no,
        rp.last_read_language,
        rp.last_read_at
      FROM novels n
      LEFT JOIN authors a ON n.author_id = a.id
      LEFT JOIN chapters c ON c.novel_id = n.id
      LEFT JOIN chapter_translations ct ON ct.chapter_id = c.id
      LEFT JOIN reading_progress rp ON rp.novel_id = n.id
      GROUP BY n.id
      ORDER BY n.updated_at DESC
    `);
    return stmt.all();
  }

  /**
   * Obtiene la lista completa de capítulos descargados para una novela e idioma.
   */
  getDownloadedChapters(novelRawId, language = 'en') {
    const stmt = this.db.prepare(`
      SELECT 
        c.chapter_no,
        c.raw_title,
        ct.id as translation_id,
        ct.title,
        ct.language,
        ct.source_service,
        e.name as model,
        ct.translated_at,
        length(ct.full_text) as char_length
      FROM chapters c
      JOIN chapter_translations ct ON ct.chapter_id = c.id
      JOIN translation_engines e ON ct.engine_id = e.id
      WHERE c.novel_id = ? AND ct.language = ?
      ORDER BY c.chapter_no ASC
    `);
    return stmt.all(novelRawId, language);
  }

  /**
   * Obtiene la lista de números de capítulos descargados para una novela e idioma.
   */
  getDownloadedChapterNumbers(novelRawId, language = 'en') {
    const stmt = this.db.prepare(`
      SELECT DISTINCT c.chapter_no
      FROM chapters c
      JOIN chapter_translations ct ON ct.chapter_id = c.id
      WHERE c.novel_id = ? AND ct.language = ?
      ORDER BY c.chapter_no ASC
    `);
    return stmt.all(novelRawId, language).map(r => r.chapter_no);
  }

  /**
   * Obtiene los números de capítulos descargados en sourceLang pero no en targetLang.
   */
  getUntranslatedChapterNumbers(novelRawId, sourceLang = 'en', targetLang = 'es') {
    const stmt = this.db.prepare(`
      SELECT DISTINCT c.chapter_no
      FROM chapters c
      JOIN chapter_translations ct_src ON ct_src.chapter_id = c.id AND ct_src.language = ?
      WHERE c.novel_id = ?
        AND c.id NOT IN (
          SELECT ct_tgt.chapter_id
          FROM chapter_translations ct_tgt
          WHERE ct_tgt.language = ?
        )
      ORDER BY c.chapter_no ASC
    `);
    return stmt.all(sourceLang, novelRawId, targetLang).map(r => r.chapter_no);
  }

  /**
   * Actualiza el progreso de lectura de una novela.
   */
  updateReadingProgress(novelRawId, chapterNo, language = 'en') {
    const stmt = this.db.prepare(`
      INSERT INTO reading_progress (novel_id, last_read_chapter_no, last_read_language, last_read_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(novel_id) DO UPDATE SET
        last_read_chapter_no = excluded.last_read_chapter_no,
        last_read_language = excluded.last_read_language,
        last_read_at = CURRENT_TIMESTAMP
    `);
    stmt.run(novelRawId, chapterNo, language);
  }

  /**
   * Obtiene el último capítulo leído globalmente en la aplicación.
   */
  getGlobalLastRead() {
    const stmt = this.db.prepare(`
      SELECT 
        rp.novel_id,
        rp.last_read_chapter_no,
        rp.last_read_language,
        rp.last_read_at,
        n.slug,
        n.title,
        n.cover_url,
        a.name as author
      FROM reading_progress rp
      JOIN novels n ON rp.novel_id = n.id
      LEFT JOIN authors a ON n.author_id = a.id
      ORDER BY rp.last_read_at DESC
      LIMIT 1
    `);
    return stmt.get() || null;
  }

  /**
   * Obtiene el progreso de lectura de una novela específica.
   */
  getReadingProgress(novelRawId) {
    const stmt = this.db.prepare(`
      SELECT novel_id, last_read_chapter_no, last_read_language, last_read_at
      FROM reading_progress
      WHERE novel_id = ?
    `);
    return stmt.get(novelRawId) || null;
  }

  /**
   * Obtiene el tamaño total ocupado en disco por la base de datos y recursos locales.
   */
  getStorageStats() {
    try {
      const dataDir = CONFIG.dataDir;
      const getDirSize = (dir) => {
        let total = 0;
        if (!fs.existsSync(dir)) return 0;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            total += getDirSize(fullPath);
          } else if (entry.isFile()) {
            total += fs.statSync(fullPath).size;
          }
        }
        return total;
      };

      const bytes = getDirSize(dataDir);
      const formatBytes = (b) => {
        if (!b || b <= 0) return '0 KB';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      return {
        bytes,
        formatted: formatBytes(bytes),
        path: dataDir
      };
    } catch {
      return { bytes: 0, formatted: '0 KB', path: 'data' };
    }
  }

  /**
   * Elimina una novela completa y todos sus datos asociados por CASCADE en SQLite.
   * @param {number|string} identifier ID raw o slug de la novela
   * @returns {object|null} Metadatos de la novela eliminada o null si no existía
   */
  deleteNovel(identifier) {
    const novel = this.getNovel(identifier);
    if (!novel) return null;

    this.db.prepare('DELETE FROM novels WHERE id = ?').run(novel.id);

    // Opcional: limpiar autores huérfanos sin novelas asociadas
    try {
      this.db.prepare(`
        DELETE FROM authors
        WHERE id NOT IN (SELECT DISTINCT author_id FROM novels WHERE author_id IS NOT NULL)
      `).run();
    } catch {
      // Ignorar si hay restricción
    }

    return novel;
  }

  /**
   * Elimina uno, varios o todos los capítulos de una novela.
   * Si se especifica un idioma, solo se elimina la traducción de dicho idioma.
   * Si no tiene más traducciones, se elimina el capítulo canónico.
   * 
   * @param {number} novelRawId ID de la novela
   * @param {number[]|string} chapterNumbers Array de números de capítulos o 'all'
   * @param {string|null} [language] Idioma específico ('en', 'es') o null/'all' para borrar todos
   * @returns {object} Resultado con conteo de capítulos eliminados
   */
  deleteChapters(novelRawId, chapterNumbers = 'all', language = null) {
    const novel = this.getNovel(novelRawId);
    if (!novel) return { success: false, deletedCount: 0 };

    const isAll = !chapterNumbers || chapterNumbers === 'all';
    let targetNumbers = [];

    if (!isAll) {
      targetNumbers = (Array.isArray(chapterNumbers) ? chapterNumbers : [chapterNumbers])
        .map(n => parseInt(n, 10))
        .filter(n => !isNaN(n));
      if (targetNumbers.length === 0) {
        return { success: true, deletedCount: 0 };
      }
    }

    let deletedCount = 0;

    if (language && language !== 'all') {
      // Borrar solo las traducciones del idioma especificado
      if (isAll) {
        const transStmt = this.db.prepare(`
          DELETE FROM chapter_translations
          WHERE language = ? AND chapter_id IN (
            SELECT id FROM chapters WHERE novel_id = ?
          )
        `);
        const info = transStmt.run(language, novel.id);
        deletedCount = info?.changes || 0;
      } else {
        const placeholders = targetNumbers.map(() => '?').join(',');
        const transStmt = this.db.prepare(`
          DELETE FROM chapter_translations
          WHERE language = ? AND chapter_id IN (
            SELECT id FROM chapters WHERE novel_id = ? AND chapter_no IN (${placeholders})
          )
        `);
        const info = transStmt.run(language, novel.id, ...targetNumbers);
        deletedCount = info?.changes || 0;
      }

      // Eliminar capítulos canónicos que hayan quedado huérfanos sin traducciones en ningún idioma
      this.db.prepare(`
        DELETE FROM chapters
        WHERE novel_id = ? AND id NOT IN (SELECT DISTINCT chapter_id FROM chapter_translations)
      `).run(novel.id);
    } else {
      // Borrar capítulos canónicos directamente (cascada automática a traducciones y párrafos)
      if (isAll) {
        const chStmt = this.db.prepare('DELETE FROM chapters WHERE novel_id = ?');
        const info = chStmt.run(novel.id);
        deletedCount = info?.changes || 0;
      } else {
        const placeholders = targetNumbers.map(() => '?').join(',');
        const chStmt = this.db.prepare(`
          DELETE FROM chapters
          WHERE novel_id = ? AND chapter_no IN (${placeholders})
        `);
        const info = chStmt.run(novel.id, ...targetNumbers);
        deletedCount = info?.changes || 0;
      }
    }

    // Actualizar o limpiar progreso de lectura si apuntaba a un capítulo que ya no existe
    const remaining = this.getDownloadedChapterNumbers(novel.id);
    if (remaining.length === 0) {
      this.db.prepare('DELETE FROM reading_progress WHERE novel_id = ?').run(novel.id);
    } else {
      const prog = this.getReadingProgress(novel.id);
      if (prog && !remaining.includes(prog.last_read_chapter_no)) {
        this.db.prepare(`
          UPDATE reading_progress
          SET last_read_chapter_no = ?, last_read_at = CURRENT_TIMESTAMP
          WHERE novel_id = ?
        `).run(remaining[0], novel.id);
      }
    }

    return { success: true, deletedCount };
  }
}

export const repository = new NovelRepository();
