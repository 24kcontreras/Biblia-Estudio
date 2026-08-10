import { connect } from "@tursodatabase/serverless";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("Falta configurar TURSO_DATABASE_URL en server/.env.");
}

// connect() es liviano y síncrono — no abre conexión de red hasta la primera consulta.
export const db = connect({ url, authToken });

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS verse_analysis_cache (
    version TEXT NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (version, book, chapter, verse)
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
];

let initPromise: Promise<void> | undefined;

/** Crea las tablas si no existen. Idempotente — se puede llamar en cada arranque. */
export function initDb(): Promise<void> {
  initPromise ??= db.batch(SCHEMA_STATEMENTS).then(() => undefined);
  return initPromise;
}
