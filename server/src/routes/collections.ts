import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { db } from "../db.js";
import { findBook } from "../services/bibleBooks.js";
import { userIdOf } from "../user.js";

export const collectionsRouter = Router();

interface CollectionRow {
  id: number;
  name: string;
}

/** Las colecciones tienen id global (AUTOINCREMENT): antes de tocar una hay que verificar que sea del usuario. */
async function findOwnCollection(id: number, userId: string): Promise<CollectionRow | undefined> {
  return (await db.get("SELECT id, name FROM collections WHERE id = ? AND user_id = ?", id, userId)) as
    | CollectionRow
    | undefined;
}

interface CollectionVerseRow {
  version: string;
  book: string;
  chapter: number;
  verse: number;
}

collectionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = (await db.all(
      `SELECT c.id AS id, c.name AS name, COUNT(cv.collection_id) AS verseCount
       FROM collections c
       LEFT JOIN collection_verses cv ON cv.collection_id = c.id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      userIdOf(res)
    )) as { id: number; name: string; verseCount: number }[];

    res.json({ collections: rows });
  })
);

collectionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      res.status(400).json({ error: "El nombre de la colección no puede estar vacío." });
      return;
    }

    try {
      const result = await db.run("INSERT INTO collections (user_id, name) VALUES (?, ?)", userIdOf(res), name);
      res.status(201).json({ id: Number(result.lastInsertRowid), name });
    } catch {
      res.status(409).json({ error: "Ya existe una colección con ese nombre." });
    }
  })
);

collectionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!(await findOwnCollection(id, userIdOf(res)))) {
      res.status(404).json({ error: "Colección no encontrada." });
      return;
    }
    await db.run("DELETE FROM collection_verses WHERE collection_id = ?", id);
    await db.run("DELETE FROM collections WHERE id = ?", id);
    res.status(204).end();
  })
);

collectionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const collection = await findOwnCollection(id, userIdOf(res));

    if (!collection) {
      res.status(404).json({ error: "Colección no encontrada." });
      return;
    }

    const verses = (await db.all(
      "SELECT version, book, chapter, verse FROM collection_verses WHERE collection_id = ? ORDER BY added_at ASC",
      id
    )) as CollectionVerseRow[];

    res.json({ id: collection.id, name: collection.name, verses });
  })
);

collectionsRouter.post(
  "/:id/verses",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { version, book, chapter, verse } = req.body ?? {};
    const chapterNum = Number(chapter);
    const verseNum = Number(verse);

    if (
      typeof version !== "string" ||
      !version ||
      !book ||
      !Number.isInteger(chapterNum) ||
      !Number.isInteger(verseNum)
    ) {
      res.status(400).json({ error: "Parámetros inválidos." });
      return;
    }

    const bookMeta = findBook(book);
    if (!bookMeta) {
      res.status(404).json({ error: `Libro no reconocido: ${book}` });
      return;
    }

    if (!(await findOwnCollection(id, userIdOf(res)))) {
      res.status(404).json({ error: "Colección no encontrada." });
      return;
    }

    await db.run(
      `INSERT INTO collection_verses (collection_id, version, book, chapter, verse)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(collection_id, version, book, chapter, verse) DO NOTHING`,
      id,
      version,
      bookMeta.slug,
      chapterNum,
      verseNum
    );

    res.status(204).end();
  })
);

collectionsRouter.delete(
  "/:id/verses/:version/:book/:chapter/:verse",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { version, book, chapter, verse } = req.params;
    const bookMeta = findBook(book);
    if (!bookMeta) {
      res.status(404).json({ error: `Libro no reconocido: ${book}` });
      return;
    }

    if (!(await findOwnCollection(id, userIdOf(res)))) {
      res.status(404).json({ error: "Colección no encontrada." });
      return;
    }

    await db.run(
      "DELETE FROM collection_verses WHERE collection_id = ? AND version = ? AND book = ? AND chapter = ? AND verse = ?",
      id,
      version,
      bookMeta.slug,
      Number(chapter),
      Number(verse)
    );

    res.status(204).end();
  })
);
