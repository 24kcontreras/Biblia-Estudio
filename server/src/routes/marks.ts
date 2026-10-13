import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { db } from "../db.js";
import { findBook } from "../services/bibleBooks.js";
import { userIdOf } from "../user.js";

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

marksRouter.get(
  "/chapter/:version/:book/:chapter",
  asyncHandler(async (req, res) => {
    const { version, book, chapter } = req.params;
    const bookMeta = findBook(book);
    if (!bookMeta) {
      res.status(404).json({ error: `Libro no reconocido: ${book}` });
      return;
    }

    const rows = (await db.all(
      "SELECT * FROM verse_marks WHERE user_id = ? AND version = ? AND book = ? AND chapter = ?",
      userIdOf(res),
      version,
      bookMeta.slug,
      Number(chapter)
    )) as MarkRow[];

    res.json({ marks: rows.map(toMark) });
  })
);

marksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const type = req.query.type;
    const userId = userIdOf(res);
    let rows: MarkRow[];

    if (type === "favorite") {
      rows = (await db.all("SELECT * FROM verse_marks WHERE user_id = ? AND is_favorite = 1 ORDER BY updated_at DESC", userId)) as MarkRow[];
    } else if (type === "memorize") {
      rows = (await db.all("SELECT * FROM verse_marks WHERE user_id = ? AND memorize = 1 ORDER BY updated_at DESC", userId)) as MarkRow[];
    } else {
      rows = (await db.all("SELECT * FROM verse_marks WHERE user_id = ? ORDER BY updated_at DESC", userId)) as MarkRow[];
    }

    res.json({ marks: rows.map(toMark) });
  })
);

marksRouter.put(
  "/:version/:book/:chapter/:verse",
  asyncHandler(async (req, res) => {
    const { version, book, chapter, verse } = req.params;
    const chapterNum = Number(chapter);
    const verseNum = Number(verse);
    const userId = userIdOf(res);
    const bookMeta = findBook(book);
    if (!bookMeta) {
      res.status(404).json({ error: `Libro no reconocido: ${book}` });
      return;
    }

    const body = (req.body ?? {}) as {
      isFavorite?: boolean;
      color?: string | null;
      note?: string | null;
      memorize?: boolean;
    };

    const current = (await db.get(
      "SELECT * FROM verse_marks WHERE user_id = ? AND version = ? AND book = ? AND chapter = ? AND verse = ?",
      userId,
      version,
      bookMeta.slug,
      chapterNum,
      verseNum
    )) as MarkRow | undefined;

    const merged = {
      isFavorite: "isFavorite" in body ? Boolean(body.isFavorite) : Boolean(current?.is_favorite),
      color: "color" in body ? (body.color ?? null) : (current?.color ?? null),
      note: "note" in body ? (body.note ?? null) : (current?.note ?? null),
      memorize: "memorize" in body ? Boolean(body.memorize) : Boolean(current?.memorize),
    };

    const isEmpty = !merged.isFavorite && !merged.color && !merged.note && !merged.memorize;

    if (isEmpty) {
      await db.run(
        "DELETE FROM verse_marks WHERE user_id = ? AND version = ? AND book = ? AND chapter = ? AND verse = ?",
        userId,
        version,
        bookMeta.slug,
        chapterNum,
        verseNum
      );
      res.json({ mark: null });
      return;
    }

    await db.run(
      `INSERT INTO verse_marks (user_id, version, book, chapter, verse, is_favorite, color, note, memorize, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, version, book, chapter, verse) DO UPDATE SET
         is_favorite = excluded.is_favorite,
         color = excluded.color,
         note = excluded.note,
         memorize = excluded.memorize,
         updated_at = excluded.updated_at`,
      userId,
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
  })
);
