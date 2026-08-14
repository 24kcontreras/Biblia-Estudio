import { Router } from "express";
import { AIConfigError, getAIProvider, type ApocryphaAnalysis } from "../ai/index.js";
import { db } from "../db.js";

export const apocryphaRouter = Router();

interface WorkRow {
  slug: string;
  name: string;
  description: string;
  chapter_count: number;
}

interface ChapterRow {
  title: string;
  content: string;
}

apocryphaRouter.get("/works", async (_req, res, next) => {
  try {
    const rows = (await db.all("SELECT slug, name, description, chapter_count FROM apocrypha_works ORDER BY slug")) as WorkRow[];
    res.json({
      works: rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        description: r.description,
        chapterCount: r.chapter_count,
      })),
    });
  } catch (err) {
    next(err);
  }
});

apocryphaRouter.get("/:work/:chapter", async (req, res, next) => {
  try {
    const { work, chapter } = req.params;
    const chapterNum = Number(chapter);
    if (!Number.isInteger(chapterNum) || chapterNum < 1) {
      res.status(400).json({ error: "Capítulo inválido." });
      return;
    }

    const row = (await db.get(
      "SELECT title, content FROM apocrypha_chapters WHERE work_slug = ? AND chapter_number = ?",
      work,
      chapterNum
    )) as ChapterRow | undefined;

    if (!row) {
      res.status(404).json({ error: "Capítulo no encontrado." });
      return;
    }

    res.json({ title: row.title, content: row.content });
  } catch (err) {
    next(err);
  }
});

apocryphaRouter.post("/:work/:chapter/analyze", async (req, res, next) => {
  try {
    const { work, chapter } = req.params;
    const chapterNum = Number(chapter);
    if (!Number.isInteger(chapterNum) || chapterNum < 1) {
      res.status(400).json({ error: "Capítulo inválido." });
      return;
    }

    const workRow = (await db.get(
      "SELECT slug, name, description, chapter_count FROM apocrypha_works WHERE slug = ?",
      work
    )) as WorkRow | undefined;
    if (!workRow) {
      res.status(404).json({ error: "Obra no encontrada." });
      return;
    }

    const chapterRow = (await db.get(
      "SELECT title, content FROM apocrypha_chapters WHERE work_slug = ? AND chapter_number = ?",
      work,
      chapterNum
    )) as ChapterRow | undefined;
    if (!chapterRow) {
      res.status(404).json({ error: "Capítulo no encontrado." });
      return;
    }

    const cached = (await db.get(
      "SELECT analysis_json FROM apocrypha_analysis_cache WHERE work_slug = ? AND chapter_number = ?",
      work,
      chapterNum
    )) as { analysis_json: string } | undefined;

    if (cached) {
      res.json({ analysis: JSON.parse(cached.analysis_json) as ApocryphaAnalysis, cached: true });
      return;
    }

    let provider;
    try {
      provider = getAIProvider();
    } catch (err) {
      if (err instanceof AIConfigError) {
        res.status(503).json({ error: err.message });
        return;
      }
      throw err;
    }

    // Streaming (SSE): igual que el análisis de versículos, para poder avisar ("event: status")
    // si el proveedor principal falla y se reintenta con el respaldo, antes de tener el resultado.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const onFallback = (message: string) => {
        res.write(`event: status\ndata: ${JSON.stringify({ message })}\n\n`);
      };

      const analysis = await provider.analyzeApocrypha(
        {
          workName: workRow.name,
          workDescription: workRow.description,
          chapterTitle: chapterRow.title,
          chapterNumber: chapterNum,
          totalChapters: workRow.chapter_count,
          content: chapterRow.content,
        },
        onFallback
      );

      await db.run(
        `INSERT INTO apocrypha_analysis_cache (work_slug, chapter_number, analysis_json) VALUES (?, ?, ?)
         ON CONFLICT(work_slug, chapter_number) DO UPDATE SET analysis_json = excluded.analysis_json`,
        work,
        chapterNum,
        JSON.stringify(analysis)
      );

      res.write(`event: result\ndata: ${JSON.stringify({ analysis, cached: false })}\n\n`);
    } catch (err) {
      console.error(err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: "No se pudo generar el análisis. Intenta de nuevo." })}\n\n`);
    } finally {
      res.end();
    }
  } catch (err) {
    next(err);
  }
});
