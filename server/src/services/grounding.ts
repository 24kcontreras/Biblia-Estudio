import { db } from "../db.js";
import { findBook } from "./bibleBooks.js";

interface CommentaryRow {
  content: string;
}

/** Comentario de Matthew Henry aplicable a este versículo (la entrada cuyo verse_start es el mayor <= verse). */
export async function getCommentary(book: string, chapter: number, verse: number): Promise<string | null> {
  const row = (await db.get(
    "SELECT content FROM commentary_matthew_henry WHERE book = ? AND chapter = ? AND verse_start <= ? ORDER BY verse_start DESC LIMIT 1",
    book,
    chapter,
    verse
  )) as CommentaryRow | undefined;

  return row?.content ?? null;
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
  verse: number,
  limit = 8
): Promise<VerifiedCrossReference[]> {
  const rows = (await db.all(
    `SELECT to_book, to_chapter, to_verse_start, to_verse_end, votes
     FROM cross_references
     WHERE from_book = ? AND from_chapter = ? AND from_verse = ? AND votes > 0
     ORDER BY votes DESC
     LIMIT ?`,
    book,
    chapter,
    verse,
    limit
  )) as CrossRefRow[];

  return rows
    .map((r) => {
      const bookMeta = findBook(r.to_book);
      if (!bookMeta) return null;
      const range = r.to_verse_start === r.to_verse_end ? `${r.to_verse_start}` : `${r.to_verse_start}-${r.to_verse_end}`;
      return { referencia: `${bookMeta.name} ${r.to_chapter}:${range}`, votos: r.votes };
    })
    .filter((r): r is VerifiedCrossReference => r !== null);
}
