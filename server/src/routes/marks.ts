import { Router } from "express";
import { db } from "../db.js";
import { findBook } from "../services/bibleBooks.js";

export const marksRouter = Router();

interface MarkRow {
  version: string;
  book: string;
  chapter: number;
  verse: number;
  is_favorite: number;
  color: string | null;
  note: string | null;
  memorize: number;
}

function toMark(row: MarkRow) {
  return {
    version: row.version,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    isFavorite: Boolean(row.is_favorite),
    color: row.color,
    note: row.note,
    memorize: Boolean(row.memorize),
  };
}

marksRouter.get("/chapter/:version/:book/:chapter", (req, res) => {
  const { version, book, chapter } = req.params;
  const bookMeta = findBook(book);
  if (!bookMeta) {
    return res.status(404).json({ error: `Libro no reconocido: ${book}` });
  }

  const rows = db
    .prepare("SELECT * FROM verse_marks WHERE version = ? AND book = ? AND chapter = ?")
    .all(version, bookMeta.slug, Number(chapter)) as unknown as MarkRow[];

  res.json({ marks: rows.map(toMark) });
});

marksRouter.get("/", (req, res) => {
  const type = req.query.type;
  let rows: MarkRow[];

  if (type === "favorite") {
    rows = db
      .prepare("SELECT * FROM verse_marks WHERE is_favorite = 1 ORDER BY updated_at DESC")
      .all() as unknown as MarkRow[];
  } else if (type === "memorize") {
    rows = db
      .prepare("SELECT * FROM verse_marks WHERE memorize = 1 ORDER BY updated_at DESC")
      .all() as unknown as MarkRow[];
  } else {
    rows = db.prepare("SELECT * FROM verse_marks ORDER BY updated_at DESC").all() as unknown as MarkRow[];
  }

  res.json({ marks: rows.map(toMark) });
});

marksRouter.put("/:version/:book/:chapter/:verse", (req, res) => {
  const { version, book, chapter, verse } = req.params;
  const chapterNum = Number(chapter);
  const verseNum = Number(verse);
  const bookMeta = findBook(book);
  if (!bookMeta) {
    return res.status(404).json({ error: `Libro no reconocido: ${book}` });
  }

  const body = (req.body ?? {}) as {
    isFavorite?: boolean;
    color?: string | null;
    note?: string | null;
    memorize?: boolean;
  };

  const current = db
    .prepare("SELECT * FROM verse_marks WHERE version = ? AND book = ? AND chapter = ? AND verse = ?")
    .get(version, bookMeta.slug, chapterNum, verseNum) as unknown as MarkRow | undefined;

  const merged = {
    isFavorite: "isFavorite" in body ? Boolean(body.isFavorite) : Boolean(current?.is_favorite),
    color: "color" in body ? body.color ?? null : (current?.color ?? null),
    note: "note" in body ? body.note ?? null : (current?.note ?? null),
    memorize: "memorize" in body ? Boolean(body.memorize) : Boolean(current?.memorize),
  };

  const isEmpty = !merged.isFavorite && !merged.color && !merged.note && !merged.memorize;

  if (isEmpty) {
    db.prepare(
      "DELETE FROM verse_marks WHERE version = ? AND book = ? AND chapter = ? AND verse = ?"
    ).run(version, bookMeta.slug, chapterNum, verseNum);
    return res.json({ mark: null });
  }

  db.prepare(
    `INSERT INTO verse_marks (version, book, chapter, verse, is_favorite, color, note, memorize, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(version, book, chapter, verse) DO UPDATE SET
       is_favorite = excluded.is_favorite,
       color = excluded.color,
       note = excluded.note,
       memorize = excluded.memorize,
       updated_at = excluded.updated_at`
  ).run(
    version,
    bookMeta.slug,
    chapterNum,
    verseNum,
    merged.isFavorite ? 1 : 0,
    merged.color,
    merged.note,
    merged.memorize ? 1 : 0
  );

  res.json({
    mark: {
      version,
      book: bookMeta.slug,
      chapter: chapterNum,
      verse: verseNum,
      ...merged,
    },
  });
});
