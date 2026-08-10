import { Router } from "express";
import { BIBLE_BOOKS, findBook } from "../services/bibleBooks.js";
import { BibleSourceError, getChapter, getVersions } from "../services/bibleSource.js";

export const bibleRouter = Router();

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
