import { Router } from "express";
import { db } from "../db.js";
import { findBook } from "../services/bibleBooks.js";

export const collectionsRouter = Router();

interface CollectionRow {
  id: number;
  name: string;
}

interface CollectionVerseRow {
  version: string;
  book: string;
  chapter: number;
  verse: number;
}

collectionsRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id AS id, c.name AS name, COUNT(cv.collection_id) AS verseCount
       FROM collections c
       LEFT JOIN collection_verses cv ON cv.collection_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at ASC`
    )
    .all() as unknown as { id: number; name: string; verseCount: number }[];

  res.json({ collections: rows });
});

collectionsRouter.post("/", (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    return res.status(400).json({ error: "El nombre de la colección no puede estar vacío." });
  }

  try {
    const result = db.prepare("INSERT INTO collections (name) VALUES (?)").run(name);
    res.status(201).json({ id: Number(result.lastInsertRowid), name });
  } catch {
    res.status(409).json({ error: "Ya existe una colección con ese nombre." });
  }
});

collectionsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM collection_verses WHERE collection_id = ?").run(id);
  db.prepare("DELETE FROM collections WHERE id = ?").run(id);
  res.status(204).end();
});

collectionsRouter.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const collection = db.prepare("SELECT id, name FROM collections WHERE id = ?").get(id) as unknown as
    | CollectionRow
    | undefined;

  if (!collection) {
    return res.status(404).json({ error: "Colección no encontrada." });
  }

  const verses = db
    .prepare(
      "SELECT version, book, chapter, verse FROM collection_verses WHERE collection_id = ? ORDER BY added_at ASC"
    )
    .all(id) as unknown as CollectionVerseRow[];

  res.json({ id: collection.id, name: collection.name, verses });
});

collectionsRouter.post("/:id/verses", (req, res) => {
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
    return res.status(400).json({ error: "Parámetros inválidos." });
  }

  const bookMeta = findBook(book);
  if (!bookMeta) {
    return res.status(404).json({ error: `Libro no reconocido: ${book}` });
  }

  db.prepare(
    `INSERT INTO collection_verses (collection_id, version, book, chapter, verse)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(collection_id, version, book, chapter, verse) DO NOTHING`
  ).run(id, version, bookMeta.slug, chapterNum, verseNum);

  res.status(204).end();
});

collectionsRouter.delete("/:id/verses/:version/:book/:chapter/:verse", (req, res) => {
  const id = Number(req.params.id);
  const { version, book, chapter, verse } = req.params;
  const bookMeta = findBook(book);
  if (!bookMeta) {
    return res.status(404).json({ error: `Libro no reconocido: ${book}` });
  }

  db.prepare(
    "DELETE FROM collection_verses WHERE collection_id = ? AND version = ? AND book = ? AND chapter = ? AND verse = ?"
  ).run(id, version, bookMeta.slug, Number(chapter), Number(verse));

  res.status(204).end();
});
