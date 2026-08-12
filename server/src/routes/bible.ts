import { Router } from "express";
import { db } from "../db.js";
import { BIBLE_BOOKS, findBook } from "../services/bibleBooks.js";
import { BibleSourceError, getChapter, getVersions } from "../services/bibleSource.js";

export const bibleRouter = Router();

interface SearchRow {
  book: string;
  chapter: number;
  verse: number;
  snippet: string;
}

interface WordStudyRow {
  word_order: number;
  greek: string;
  transliteration: string | null;
  strongs_number: string | null;
  gloss_es: string | null;
  definition: string | null;
  pronunciation: string | null;
}

bibleRouter.get("/books", (_req, res) => {
  res.json(BIBLE_BOOKS);
});

bibleRouter.get("/versions", async (_req, res, next) => {
  try {
    res.json(await getVersions());
  } catch (err) {
    next(err);
  }
});

bibleRouter.get("/search", async (req, res, next) => {
  try {
    const { q, version } = req.query;
    if (typeof q !== "string" || !q.trim() || typeof version !== "string" || !version) {
      return res.status(400).json({ error: "Parámetros inválidos: se requieren q y version." });
    }

    const tokens = q.trim().split(/\s+/).filter(Boolean).slice(0, 12);
    const ftsQuery = tokens.map((t) => `"${t.replace(/"/g, '""')}"`).join(" ");
    if (!ftsQuery) {
      return res.json({ results: [] });
    }

    const rows = (await db.all(
      `SELECT book, chapter, verse, snippet(bible_search, 4, '', '', '…', 10) AS snippet
       FROM bible_search
       WHERE bible_search MATCH ? AND version = ?
       ORDER BY rank
       LIMIT 40`,
      ftsQuery,
      version
    )) as SearchRow[];

    res.json({ results: rows });
  } catch (err) {
    next(err);
  }
});

bibleRouter.get("/word-study/:book/:chapter/:verse", async (req, res, next) => {
  try {
    const { book, chapter, verse } = req.params;
    const bookMeta = findBook(book);
    if (!bookMeta) {
      return res.status(404).json({ error: `Libro no reconocido: ${book}` });
    }

    const rows = (await db.all(
      `SELECT ws.word_order, ws.greek, ws.transliteration, ws.strongs_number, ws.gloss_es,
              sg.definition, sg.pronunciation
       FROM word_study ws
       LEFT JOIN strongs_greek sg ON sg.number = ws.strongs_number
       WHERE ws.book = ? AND ws.chapter = ? AND ws.verse = ?
       ORDER BY ws.word_order`,
      bookMeta.slug,
      Number(chapter),
      Number(verse)
    )) as WordStudyRow[];

    res.json({
      words: rows.map((r) => ({
        greek: r.greek,
        transliteration: r.transliteration,
        strongsNumber: r.strongs_number,
        glossEs: r.gloss_es,
        definition: r.definition,
        pronunciation: r.pronunciation,
      })),
    });
  } catch (err) {
    next(err);
  }
});

bibleRouter.get("/:version/:book/:chapter", async (req, res, next) => {
  try {
    const { version, book, chapter } = req.params;
    const chapterNum = Number(chapter);
    if (!Number.isInteger(chapterNum) || chapterNum < 1) {
      return res.status(400).json({ error: "Capítulo inválido." });
    }

    const bookMeta = findBook(book);
    if (!bookMeta) {
      return res.status(404).json({ error: `Libro no reconocido: ${book}` });
    }

    const verses = await getChapter(version, bookMeta.slug, chapterNum);
    res.json({ book: bookMeta, chapter: chapterNum, version, verses });
  } catch (err) {
    if (err instanceof BibleSourceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});
