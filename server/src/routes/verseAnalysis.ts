import { Router } from "express";
import { AIConfigError, getAIProvider } from "../ai/index.js";
import type { VerseAnalysis } from "../ai/index.js";
import { db } from "../db.js";
import { findBook } from "../services/bibleBooks.js";
import { BibleSourceError, getChapter } from "../services/bibleSource.js";
import { getCommentary, getVerifiedCrossReferences } from "../services/grounding.js";

export const verseAnalysisRouter = Router();

const CONTEXT_WINDOW = 5;

verseAnalysisRouter.post("/", async (req, res, next) => {
  try {
    const { version, book, chapter, verse } = req.body ?? {};
    const chapterNum = Number(chapter);
    const verseNum = Number(verse);

    if (typeof version !== "string" || !version || !book || !Number.isInteger(chapterNum) || !Number.isInteger(verseNum)) {
      return res.status(400).json({ error: "Parámetros inválidos: se requieren version, book, chapter, verse." });
    }

    const bookMeta = findBook(book);
    if (!bookMeta) {
      return res.status(404).json({ error: `Libro no reconocido: ${book}` });
    }

    const cached = (await db.get(
      "SELECT analysis_json FROM verse_analysis_cache WHERE version = ? AND book = ? AND chapter = ? AND verse = ?",
      version,
      bookMeta.slug,
      chapterNum,
      verseNum
    )) as { analysis_json: string } | undefined;

    if (cached) {
      return res.json({ analysis: JSON.parse(cached.analysis_json) as VerseAnalysis, cached: true });
    }

    let provider;
    try {
      provider = getAIProvider();
    } catch (err) {
      if (err instanceof AIConfigError) {
        return res.status(503).json({ error: err.message });
      }
      throw err;
    }

    const chapterVerses = await getChapter(version, bookMeta.slug, chapterNum);
    const target = chapterVerses.find((v) => Number(v.verse) === verseNum);
    if (!target) {
      return res.status(404).json({ error: "Versículo no encontrado en esta versión." });
    }

    const contextVerses = chapterVerses
      .filter((v) => Math.abs(Number(v.verse) - verseNum) <= CONTEXT_WINDOW)
      .map((v) => ({ verse: Number(v.verse), text: v.text }));

    const commentary = await getCommentary(bookMeta.slug, chapterNum, verseNum);
    const verifiedCrossReferences = await getVerifiedCrossReferences(bookMeta.slug, chapterNum, verseNum);

    const analysis = await provider.analyzeVerse({
      versionName: version,
      book: bookMeta.name,
      chapter: chapterNum,
      verse: verseNum,
      verseText: target.text,
      contextVerses,
      commentary,
      verifiedCrossReferences,
    });

    await db.run(
      `INSERT INTO verse_analysis_cache (version, book, chapter, verse, analysis_json)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(version, book, chapter, verse) DO UPDATE SET analysis_json = excluded.analysis_json`,
      version,
      bookMeta.slug,
      chapterNum,
      verseNum,
      JSON.stringify(analysis)
    );

    res.json({ analysis, cached: false });
  } catch (err) {
    if (err instanceof BibleSourceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});
