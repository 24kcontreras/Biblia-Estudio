/**
 * Script de ingesta de una sola corrida:
 *   npm run ingest:search -w server
 *
 * Descarga el texto completo de cada una de nuestras versiones en español (vía HelloAO,
 * /api/{version}/complete.json — todo el libro en un solo request) y lo carga en la tabla
 * FTS5 `bible_search` de Turso para poder buscar frases en toda la Biblia.
 */
import "dotenv/config";
import { db, initDb } from "../src/db.js";
import { SPANISH_VERSIONS } from "../src/services/bibleSource.js";
import { usfmToSlug } from "../src/services/bibleBookCodes.js";

const HELLOAO_BASE = "https://bible.helloao.org/api";
const BATCH_SIZE = 500;

interface HelloAOContentEntry {
  type: string;
  number: number;
  content: unknown[];
}

interface HelloAOCompleteResponse {
  books: {
    id: string;
    chapters: {
      chapter: { number: number; content: HelloAOContentEntry[] };
    }[];
  }[];
}

function joinVerseContent(content: unknown[]): string {
  return content
    .map((part) => (typeof part === "string" ? part : ((part as { text?: string })?.text ?? "")))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function ingestVersion(versionId: string): Promise<number> {
  const res = await fetch(`${HELLOAO_BASE}/${versionId}/complete.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${versionId}`);
  const data = (await res.json()) as HelloAOCompleteResponse;

  const rows: { book: string; chapter: number; verse: number; text: string }[] = [];
  for (const book of data.books) {
    const slug = usfmToSlug.get(book.id);
    if (!slug) continue;
    for (const ch of book.chapters) {
      for (const entry of ch.chapter.content) {
        if (entry.type !== "verse") continue;
        const text = joinVerseContent(entry.content);
        if (!text) continue;
        rows.push({ book: slug, chapter: ch.chapter.number, verse: entry.number, text });
      }
    }
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await db.batch(
      chunk.map((r) => ({
        sql: "INSERT INTO bible_search (version, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)",
        args: [versionId, r.book, r.chapter, r.verse, r.text],
      }))
    );
  }

  return rows.length;
}

async function main(): Promise<void> {
  await initDb();

  console.log(`[búsqueda] Vaciando bible_search para reingestar ${SPANISH_VERSIONS.length} versiones...`);
  await db.run("DELETE FROM bible_search");

  for (const version of SPANISH_VERSIONS) {
    console.log(`[búsqueda] Descargando e indexando ${version.id} (${version.localVersionName})...`);
    const count = await ingestVersion(version.id);
    console.log(`[búsqueda] ${version.id}: ${count} versículos indexados.`);
  }

  console.log("Ingesta de búsqueda completa.");
}

main().catch((err) => {
  console.error("La ingesta de búsqueda falló:", err);
  process.exit(1);
});
