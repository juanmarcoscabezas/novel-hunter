-- Esquema relacional normalizado en 3NF para WTR-Lab Novel Downloader

PRAGMA foreign_keys = ON;

-- Catálogo de Autores
CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Catálogo de Géneros
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Catálogo de Novelas
CREATE TABLE IF NOT EXISTS novels (
    id INTEGER PRIMARY KEY, -- Corresponde al raw_id de WTR-LAB
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
    total_chapters INTEGER DEFAULT 0,
    cover_url TEXT,
    synopsis TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relación Muchos a Muchos: Novelas y Géneros
CREATE TABLE IF NOT EXISTS novel_genres (
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (novel_id, genre_id)
);

-- Términos de Glosario por Novela e Idioma
CREATE TABLE IF NOT EXISTS glossary_terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    raw_term TEXT NOT NULL,
    translated_term TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    UNIQUE (novel_id, raw_term, language)
);

-- Capítulos Canónicos (independientes del idioma)
CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_no INTEGER NOT NULL,
    raw_title TEXT,
    released_at DATETIME,
    UNIQUE (novel_id, chapter_no)
);

-- Catálogo de Motores de Traducción
CREATE TABLE IF NOT EXISTS translation_engines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL -- 'google' | 'wtr-ai' | 'manual'
);

-- Traducciones de Capítulos por Idioma y Motor
CREATE TABLE IF NOT EXISTS chapter_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    engine_id INTEGER NOT NULL REFERENCES translation_engines(id) ON DELETE RESTRICT,
    language TEXT NOT NULL, -- 'en', 'es', etc.
    title TEXT NOT NULL,
    source_service TEXT NOT NULL, -- 'gemini' | 'google' | 'web'
    full_text TEXT NOT NULL,
    translated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (chapter_id, language, engine_id)
);

-- Párrafos Atómicos Normalizados (1NF)
CREATE TABLE IF NOT EXISTS paragraphs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    translation_id INTEGER NOT NULL REFERENCES chapter_translations(id) ON DELETE CASCADE,
    paragraph_order INTEGER NOT NULL,
    content TEXT NOT NULL,
    UNIQUE (translation_id, paragraph_order)
);

-- Progreso de Lectura
CREATE TABLE IF NOT EXISTS reading_progress (
    novel_id INTEGER PRIMARY KEY REFERENCES novels(id) ON DELETE CASCADE,
    last_read_chapter_no INTEGER NOT NULL,
    last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas de alta velocidad
CREATE INDEX IF NOT EXISTS idx_novels_slug ON novels(slug);
CREATE INDEX IF NOT EXISTS idx_chapters_novel_no ON chapters(novel_id, chapter_no);
CREATE INDEX IF NOT EXISTS idx_translations_lookup ON chapter_translations(chapter_id, language);
CREATE INDEX IF NOT EXISTS idx_paragraphs_order ON paragraphs(translation_id, paragraph_order);
