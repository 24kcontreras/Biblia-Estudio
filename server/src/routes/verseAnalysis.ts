import { Router } from "express";
import { AIConfigError, getAIProvider } from "../ai/index.js";
import type { VerseAnalysis } from "../ai/index.js";
import { db } from "../db.js";
import { consumeAiQuota } from "../rateLimit.js";
import { findBook } from "../services/bibleBooks.js";
import { BibleSourceError, getChapter } from "../services/bibleSource.js";
import { getCommentary, getVerifiedCrossReferences } from "../services/grounding.js";
import { requireUser, userIdOf } from "../user.js";

export const verseAnalysisRouter = Router();

const CONTEXT_WINDOW = 5;
const MAX_RANGE = 30;

interface SavedAnalysisRow {
  id: number;
  version: string;
  book: string;
  book_name: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  analysis_json: string;
  created_at: string;
}

verseAnalysisRouter.use("/saved", requireUser);

verseAnalysisRouter.get("/saved", async (_req, res, next) => {
  try {
    const rows = (await db.all(
      "SELECT id, version, book, book_name, chapter, verse_start, verse_end, analysis_json, created_at FROM saved_analyses WHERE user_id = ? ORDER BY created_at DESC",
      userIdOf(res)
    )) as SavedAnalysisRow[];

    res.json({
      saved: rows.map((r) => ({
        id: r.id,
        version: r.version,
        book: r.book,
        bookName: r.book_name,
        chapter: r.chapter,
        verseStart: r.verse_start,
        verseEnd: r.verse_end,
        analysis: JSON.parse(r.analysis_json) as VerseAnalysis,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

verseAnalysisRouter.post("/saved", async (req, res, next) => {
  try {
    const { version, book, chapter, verseStart, verseEnd, analysis } = req.body ?? {};
    if (
      typeof version !== "string" ||
      !version ||
      typeof book !== "string" ||
      !book ||
      !Number.isInteger(chapter) ||
      !Number.isInteger(verseStart) ||
      !Number.isInteger(verseEnd) ||
      !analysis
    ) {
      res.status(400).json({ error: "Parámetros inválidos para guardar el análisis." });
      return;
    }

    const bookMeta = findBook(book);
    if (!bookMeta) {
      res.status(404).json({ error: `Libro no reconocido: ${book}` });
      return;
    }

    const result = await db.run(
      `INSERT INTO saved_analyses (user_id, version, book, book_name, chapter, verse_start, verse_end, analysis_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      userIdOf(res),
      version,
      bookMeta.slug,
      bookMeta.name,
      chapter,
      verseStart,
      verseEnd,
      JSON.stringify(analysis)
    );

    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    next(err);
  }
});

verseAnalysisRouter.delete("/saved/:id", async (req, res, next) => {
  try {
    await db.run("DELETE FROM saved_analyses WHERE id = ? AND user_id = ?", Number(req.params.id), userIdOf(res));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

verseAnalysisRouter.post("/", async (req, res, next) => {
  try {
    const { version, book, chapter, verse, verseEnd: verseEndInput } = req.body ?? {};
    const chapterNum = Number(chapter);
    const verseStart = Number(verse);
    const verseEnd = verseEndInput != null ? Number(verseEndInput) : verseStart;

    if (
      typeof version !== "string" ||
      !version ||
      !book ||
      !Number.isInteger(chapterNum) ||
      !Number.isInteger(verseStart) ||
      !Number.isInteger(verseEnd) ||
      verseEnd < verseStart ||
      verseEnd - verseStart + 1 > MAX_RANGE
    ) {
      return res
        .status(400)
        .json({ error: `Parámetros inválidos: se requieren version, book, chapter, verse (y opcionalmente verseEnd, máximo ${MAX_RANGE} versículos).` });
    }

    const bookMeta = findBook(book);
    if (!bookMeta) {
      return res.status(404).json({ error: `Libro no reconocido: ${book}` });
    }

    const cached = (await db.get(
      "SELECT analysis_json FROM verse_analysis_cache_v2 WHERE version = ? AND book = ? AND chapter = ? AND verse_start = ? AND verse_end = ?",
      version,
      bookMeta.slug,
      chapterNum,
      verseStart,
      verseEnd
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

    if (!(await consumeAiQuota(req, res))) return;

    const chapterVerses = await getChapter(version, bookMeta.slug, chapterNum);
    const passageVerses = chapterVerses.filter((v) => {
      const n = Number(v.verse);
      return n >= verseStart && n <= verseEnd;
    });
    if (passageVerses.length === 0) {
      return res.status(404).json({ error: "Versículo no encontrado en esta versión." });
    }

    const contextVerses = chapterVerses
      .filter((v) => {
        const n = Number(v.verse);
        return n >= verseStart - CONTEXT_WINDOW && n <= verseEnd + CONTEXT_WINDOW;
      })
      .map((v) => ({ verse: Number(v.verse), text: v.text }));

    const verseText = passageVerses.map((v) => `${v.verse}. ${v.text}`).join(" ");

    const commentary = await getCommentary(bookMeta.slug, chapterNum, verseStart, verseEnd);
    const verifiedCrossReferences = await getVerifiedCrossReferences(bookMeta.slug, chapterNum, verseStart, verseEnd);

    // A partir de acá la respuesta es streaming (SSE): analyzeVerse puede tardar, y si el proveedor
    // principal falla queremos avisar ("event: status") antes de tener el resultado final del respaldo.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const onFallback = (message: string) => {
        res.write(`event: status\ndata: ${JSON.stringify({ message })}\n\n`);
      };

      const analysis = await provider.analyzeVerse(
        {
          versionName: version,
          book: bookMeta.name,
          chapter: chapterNum,
          verse: verseStart,
          verseEnd,
          verseText,
          contextVerses,
          commentary,
          verifiedCrossReferences,
        },
        onFallback
      );

      await db.run(
        `INSERT INTO verse_analysis_cache_v2 (version, book, chapter, verse_start, verse_end, analysis_json)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(version, book, chapter, verse_start, verse_end) DO UPDATE SET analysis_json = excluded.analysis_json`,
        version,
        bookMeta.slug,
        chapterNum,
        verseStart,
        verseEnd,
        JSON.stringify(analysis)
      );

      res.write(`event: result\ndata: ${JSON.stringify({ analysis, cached: false })}\n\n`);
    } catch (err) {
      console.error(err);
      const message = err instanceof BibleSourceError ? err.message : "No se pudo generar el análisis. Intenta de nuevo.";
      res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      res.end();
    }
  } catch (err) {
    if (err instanceof BibleSourceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});
