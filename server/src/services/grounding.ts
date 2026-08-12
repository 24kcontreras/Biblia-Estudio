import { db } from "../db.js";
import { findBook } from "./bibleBooks.js";

interface CommentaryRow {
  verse_start: number;
  content: string;
}

/**
 * Comentario de Matthew Henry aplicable al pasaje [verseStart, verseEnd]: el bloque que cubre
 * verseStart, más cualquier bloque adicional que empiece dentro del rango (para pasajes de
 * varios versículos que abarcan más de una nota del comentario).
 */
export async function getCommentary(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number = verseStart
): Promise<string | null> {
  const rows = (await db.all(
    "SELECT verse_start, content FROM commentary_matthew_henry WHERE book = ? AND chapter = ? ORDER BY verse_start ASC",
    book,
    chapter
  )) as CommentaryRow[];

  if (rows.length === 0) return null;

  let coveringIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].verse_start <= verseStart) coveringIndex = i;
    else break;
  }
  if (coveringIndex === -1) coveringIndex = 0;

  const relevant = rows.filter((r, i) => i >= coveringIndex && r.verse_start <= verseEnd);
  if (relevant.length === 0) return null;

  return relevant.map((r) => r.content).join("\n\n");
}

export interface VerifiedCrossReference {
  referencia: string;
  votos: number;
}

interface CrossRefRow {
  to_book: string;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  votes: number;
}

/** Referencias cruzadas verificadas (dataset basado en Treasury of Scripture Knowledge), solo votos positivos. */
export async function getVerifiedCrossReferences(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number = verseStart,
  limit = 8
): Promise<VerifiedCrossReference[]> {
  const rows = (await db.all(
    `SELECT to_book, to_chapter, to_verse_start, to_verse_end, votes
     FROM cross_references
     WHERE from_book = ? AND from_chapter = ? AND from_verse >= ? AND from_verse <= ? AND votes > 0
     ORDER BY votes DESC`,
    book,
    chapter,
    verseStart,
    verseEnd
  )) as CrossRefRow[];

  const byTarget = new Map<string, VerifiedCrossReference>();
  for (const r of rows) {
    const bookMeta = findBook(r.to_book);
    if (!bookMeta) continue;
    const range = r.to_verse_start === r.to_verse_end ? `${r.to_verse_start}` : `${r.to_verse_start}-${r.to_verse_end}`;
    const key = `${bookMeta.slug}-${r.to_chapter}-${range}`;
    const existing = byTarget.get(key);
    if (!existing || r.votes > existing.votos) {
      byTarget.set(key, { referencia: `${bookMeta.name} ${r.to_chapter}:${range}`, votos: r.votes });
    }
  }

  return [...byTarget.values()].sort((a, b) => b.votos - a.votos).slice(0, limit);
}
