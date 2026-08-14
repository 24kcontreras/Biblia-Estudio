import { connect } from "@tursodatabase/serverless";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("Falta configurar TURSO_DATABASE_URL en server/.env.");
}

// connect() es liviano y síncrono — no abre conexión de red hasta la primera consulta.
export const db = connect({ url, authToken });

const SCHEMA_STATEMENTS = [
  // Reemplazada por verse_analysis_cache_v2 (soporta rangos de versículos) — se limpia la vieja.
  `DROP TABLE IF EXISTS verse_analysis_cache`,
  `CREATE TABLE IF NOT EXISTS verse_analysis_cache_v2 (
    version TEXT NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (version, book, chapter, verse_start, verse_end)
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id, id)`,
  `CREATE TABLE IF NOT EXISTS verse_marks (
    version TEXT NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    color TEXT,
    note TEXT,
    memorize INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (version, book, chapter, verse)
  )`,
  `CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS collection_verses (
    collection_id INTEGER NOT NULL,
    version TEXT NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (collection_id, version, book, chapter, verse)
  )`,
  `CREATE TABLE IF NOT EXISTS commentary_matthew_henry (
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    content TEXT NOT NULL,
    PRIMARY KEY (book, chapter, verse_start)
  )`,
  `CREATE TABLE IF NOT EXISTS cross_references (
    from_book TEXT NOT NULL,
    from_chapter INTEGER NOT NULL,
    from_verse INTEGER NOT NULL,
    to_book TEXT NOT NULL,
    to_chapter INTEGER NOT NULL,
    to_verse_start INTEGER NOT NULL,
    to_verse_end INTEGER NOT NULL,
    votes INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_crossref_from
    ON cross_references (from_book, from_chapter, from_verse, votes DESC)`,
  `CREATE TABLE IF NOT EXISTS saved_chat_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS bible_search USING fts5(
    version UNINDEXED,
    book UNINDEXED,
    chapter UNINDEXED,
    verse UNINDEXED,
    text,
    tokenize = 'unicode61 remove_diacritics 2'
  )`,
  `CREATE TABLE IF NOT EXISTS strongs_greek (
    number TEXT PRIMARY KEY,
    greek TEXT NOT NULL,
    transliteration TEXT NOT NULL,
    pronunciation TEXT,
    definition TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS word_study (
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    word_order INTEGER NOT NULL,
    greek TEXT NOT NULL,
    transliteration TEXT,
    strongs_number TEXT,
    gloss_es TEXT,
    PRIMARY KEY (book, chapter, verse, word_order)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_word_study_verse ON word_study (book, chapter, verse)`,
  `CREATE TABLE IF NOT EXISTS saved_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    book TEXT NOT NULL,
    book_name TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS apocrypha_works (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    chapter_count INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS apocrypha_chapters (
    work_slug TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    PRIMARY KEY (work_slug, chapter_number)
  )`,
  `CREATE TABLE IF NOT EXISTS apocrypha_analysis_cache (
    work_slug TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (work_slug, chapter_number)
  )`,
  `CREATE TABLE IF NOT EXISTS local_bible_text (
    version TEXT NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    PRIMARY KEY (version, book, chapter, verse)
  )`,
];

let initPromise: Promise<void> | undefined;

/** Crea las tablas si no existen. Idempotente — se puede llamar en cada arranque. */
export function initDb(): Promise<void> {
  initPromise ??= db.batch(SCHEMA_STATEMENTS).then(() => undefined);
  return initPromise;
}
