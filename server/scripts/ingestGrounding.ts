/**
 * Script de ingesta de una sola corrida (no se ejecuta en el arranque normal del servidor):
 *   npm run ingest -w server
 *
 * Descarga y carga en SQLite:
 *  1. El comentario de Matthew Henry (dominio público) desde la API de HelloAO, capítulo por
 *     capítulo. Reanudable: si un capítulo ya tiene filas en la tabla, se salta.
 *  2. Las referencias cruzadas verificadas de openbible.info (basadas en Treasury of Scripture
 *     Knowledge), descargando el zip y descomprimiéndolo a mano (un solo archivo, formato ZIP
 *     estándar con deflate) para no depender de tar/unzip del sistema.
 */
import { inflateRawSync } from "node:zlib";
import { db } from "../src/db.js";
import { openBibleToSlug, usfmToSlug } from "../src/services/bibleBookCodes.js";

const HELLOAO_BASE = "https://bible.helloao.org/api/c/matthew-henry";
const CROSSREF_ZIP_URL = "https://a.openbible.info/data/cross-references.zip";
const COMMENTARY_CONCURRENCY = 5;

interface HelloAOBook {
  id: string;
  numberOfChapters: number;
}

interface HelloAOChapterContentEntry {
  type: string;
  number: number;
  content: string[];
}

async function ingestCommentary(): Promise<void> {
  console.log("[comentario] Obteniendo lista de libros...");
  const booksRes = await fetch(`${HELLOAO_BASE}/books.json`);
  if (!booksRes.ok) throw new Error(`No se pudo obtener books.json: HTTP ${booksRes.status}`);
  const { books } = (await booksRes.json()) as { books: HelloAOBook[] };

  const hasChapter = db.prepare(
    "SELECT 1 FROM commentary_matthew_henry WHERE book = ? AND chapter = ? LIMIT 1"
  );
  const insertVerse = db.prepare(
    `INSERT INTO commentary_matthew_henry (book, chapter, verse_start, content)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(book, chapter, verse_start) DO UPDATE SET content = excluded.content`
  );

  const jobs: { slug: string; usfm: string; chapter: number }[] = [];
  for (const book of books) {
    const slug = usfmToSlug.get(book.id);
    if (!slug) {
      console.warn(`[comentario] Libro sin mapeo conocido, se omite: ${book.id}`);
      continue;
    }
    for (let chapter = 1; chapter <= book.numberOfChapters; chapter++) {
      jobs.push({ slug, usfm: book.id, chapter });
    }
  }

  console.log(`[comentario] ${jobs.length} capítulos por procesar (algunos pueden ya estar cargados)...`);

  let cursor = 0;
  let done = 0;
  let skipped = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= jobs.length) return;
      const job = jobs[index];
      done++;

      if (hasChapter.get(job.slug, job.chapter)) {
        skipped++;
      } else {
        const url = `${HELLOAO_BASE}/${job.usfm}/${job.chapter}.json`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`[comentario] HTTP ${res.status} en ${job.usfm} ${job.chapter}`);
          } else {
            const data = (await res.json()) as { chapter?: { content?: HelloAOChapterContentEntry[] } };
            const entries = data.chapter?.content ?? [];
            for (const entry of entries) {
              if (entry.type !== "verse") continue;
              insertVerse.run(job.slug, job.chapter, entry.number, entry.content.join("\n"));
            }
          }
        } catch (err) {
          console.warn(`[comentario] Error en ${job.usfm} ${job.chapter}:`, (err as Error).message);
        }
      }

      if (done % 50 === 0 || done === jobs.length) {
        console.log(`[comentario] ${done}/${jobs.length} (${skipped} ya estaban cargados)`);
      }
    }
  }

  await Promise.all(Array.from({ length: COMMENTARY_CONCURRENCY }, () => worker()));
  console.log("[comentario] Listo.");
}

/** Descomprime el único archivo de un .zip estándar (deflate o sin comprimir), sin depender de herramientas externas. */
function unzipSingleFile(zipBuffer: Buffer): string {
  if (zipBuffer.readUInt32LE(0) !== 0x04034b50) {
    throw new Error("El archivo descargado no es un .zip válido (falta la firma de cabecera local).");
  }
  const method = zipBuffer.readUInt16LE(8);
  const compressedSize = zipBuffer.readUInt32LE(18);
  const nameLength = zipBuffer.readUInt16LE(26);
  const extraLength = zipBuffer.readUInt16LE(28);
  const dataStart = 30 + nameLength + extraLength;
  const compressedData = zipBuffer.subarray(dataStart, dataStart + compressedSize);

  const raw = method === 0 ? compressedData : inflateRawSync(compressedData);
  return raw.toString("utf8");
}

function parseVerseRef(ref: string): { book: string; chapter: number; verse: number } | null {
  const match = /^(\d?[A-Za-z]+)\.(\d+)\.(\d+)$/.exec(ref);
  if (!match) return null;
  const slug = openBibleToSlug.get(match[1]);
  if (!slug) return null;
  return { book: slug, chapter: Number(match[2]), verse: Number(match[3]) };
}

async function ingestCrossReferences(): Promise<void> {
  console.log("[referencias] Descargando dataset de openbible.info...");
  const zipRes = await fetch(CROSSREF_ZIP_URL);
  if (!zipRes.ok) throw new Error(`No se pudo descargar el zip de referencias: HTTP ${zipRes.status}`);
  const zipBuffer = Buffer.from(await zipRes.arrayBuffer());

  console.log("[referencias] Descomprimiendo...");
  const text = unzipSingleFile(zipBuffer);
  const lines = text.split("\n");

  console.log(`[referencias] ${lines.length - 1} filas por procesar. Reemplazando tabla anterior...`);
  db.exec("DELETE FROM cross_references;");

  const insert = db.prepare(
    `INSERT INTO cross_references (from_book, from_chapter, from_verse, to_book, to_chapter, to_verse_start, to_verse_end, votes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.exec("BEGIN;");
  let inserted = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    const [fromRaw, toRaw, votesRaw] = line.split("\t");
    const from = fromRaw ? parseVerseRef(fromRaw) : null;
    if (!from || !toRaw) {
      skipped++;
      continue;
    }

    const toParts = toRaw.split("-");
    const toStart = parseVerseRef(toParts[0]);
    const toEnd = toParts[1] ? parseVerseRef(toParts[1]) : toStart;
    if (!toStart || !toEnd) {
      skipped++;
      continue;
    }

    const votes = Number(votesRaw) || 0;
    insert.run(from.book, from.chapter, from.verse, toStart.book, toStart.chapter, toStart.verse, toEnd.verse, votes);
    inserted++;
  }

  db.exec("COMMIT;");
  console.log(`[referencias] Listo: ${inserted} insertadas, ${skipped} omitidas (libro no mapeado o formato inesperado).`);
}

async function main(): Promise<void> {
  await ingestCommentary();
  await ingestCrossReferences();
  console.log("Ingesta completa.");
}

main().catch((err) => {
  console.error("La ingesta falló:", err);
  process.exit(1);
});
