import { Router } from "express";
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
