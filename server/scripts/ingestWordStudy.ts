/**
 * Script de ingesta de una sola corrida:
 *   npm run ingest:words -w server
 *
 * Carga dos fuentes públicas para el estudio de palabras del Nuevo Testamento griego:
 *  1. El Diccionario Griego de Strong (openscriptures/strongs, dominio público, 1890/2006) —
 *     número Strong -> palabra griega, transliteración, pronunciación y definición.
 *  2. El Nuevo Testamento Griego Amalgamado de los Traductores (STEPBible-Data, CC BY 4.0) —
 *     cada palabra del NT etiquetada con su número Strong, y de regalo trae glosa en español
 *     por palabra. Solo cubre el Nuevo Testamento (no hay equivalente en español para el
 *     Antiguo Testamento hebreo en esta fuente).
 *
 * Nota de alcance: esto NO es un alineamiento palabra-por-palabra con nuestras traducciones en
 * español — es el griego original de ese versículo. Sirve para "qué palabra griega hay detrás
 * de este versículo", no para "qué palabra española corresponde a cuál griega".
 */
import "dotenv/config";
import { XMLParser } from "fast-xml-parser";
import { db, initDb } from "../src/db.js";
import { usfmToSlug } from "../src/services/bibleBookCodes.js";

const STRONGS_XML_URL =
  "https://raw.githubusercontent.com/openscriptures/strongs/master/greek/StrongsGreekDictionaryXML_1.4/strongsgreek.xml";
const TAGNT_URLS = [
  "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
  "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
];
const BATCH_SIZE = 500;

/** "G0976", "G2424G", o el atributo crudo "00976" del diccionario -> clave canónica "G00976". */
function normalizeStrongsNumber(raw: string): string | null {
  const match = /^G?(\d+)/.exec(raw);
  if (!match) return null;
  return `G${match[1].padStart(5, "0")}`;
}

/** Aplana contenido XML mixto (texto + tags anidados) a texto plano legible. */
function extractText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (typeof node === "object") {
    const text = (node as Record<string, unknown>)["#text"];
    return typeof text === "string" ? text : "";
  }
  return "";
}

interface StrongsGreekRow {
  number: string;
  greek: string;
  transliteration: string;
  pronunciation: string | null;
  definition: string;
}

async function fetchStrongsDictionary(): Promise<StrongsGreekRow[]> {
  console.log("[diccionario] Descargando el diccionario griego de Strong...");
  const res = await fetch(STRONGS_XML_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar el diccionario`);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });
  const doc = parser.parse(xml) as {
    strongsdictionary: { entries: { entry: Record<string, unknown>[] } };
  };
  const entries = doc.strongsdictionary.entries.entry;

  const rows: StrongsGreekRow[] = [];
  for (const entry of entries) {
    const rawNumber = String(entry["@_strongs"] ?? "");
    const number = normalizeStrongsNumber(rawNumber);
    const greekNode = Array.isArray(entry.greek) ? entry.greek[0] : entry.greek;
    if (!number || !greekNode) continue;

    const greek = (greekNode as Record<string, unknown>)["@_unicode"] as string | undefined;
    const translit = (greekNode as Record<string, unknown>)["@_translit"] as string | undefined;
    const pronunciation = (entry.pronunciation as Record<string, unknown> | undefined)?.["@_strongs"] as
      | string
      | undefined;
    const definition = extractText(entry.strongs_def).trim();
    if (!greek || !translit || !definition) continue;

    rows.push({ number, greek, transliteration: translit, pronunciation: pronunciation ?? null, definition });
  }

  console.log(`[diccionario] ${rows.length} entradas parseadas.`);
  return rows;
}

interface WordStudyRow {
  book: string;
  chapter: number;
  verse: number;
  wordOrder: number;
  greek: string;
  transliteration: string | null;
  strongsNumber: string | null;
  glossEs: string | null;
}

const REFERENCE_PATTERN = /^([A-Za-z0-9]+)\.(\d+)\.(\d+)#(\d+)=/;
const GREEK_TRANSLIT_PATTERN = /^(\S+)\s+\(([^)]+)\)/;

function parseTagntLine(line: string): WordStudyRow | null {
  const cols = line.split("\t");
  const refMatch = REFERENCE_PATTERN.exec(cols[0] ?? "");
  if (!refMatch) return null;

  const [, stepBook, chapterStr, verseStr, wordOrderStr] = refMatch;
  const slug = usfmToSlug.get(stepBook.toUpperCase());
  if (!slug) return null;

  const wordMatch = GREEK_TRANSLIT_PATTERN.exec(cols[1] ?? "");
  const greek = wordMatch ? wordMatch[1] : (cols[1]?.trim() ?? "");
  if (!greek) return null;

  const strongsNumber = normalizeStrongsNumber((cols[3] ?? "").split("=")[0]);
  const glossEs = cols[8]?.trim() || null;

  return {
    book: slug,
    chapter: Number(chapterStr),
    verse: Number(verseStr),
    wordOrder: Number(wordOrderStr),
    greek,
    transliteration: wordMatch ? wordMatch[2] : null,
    strongsNumber,
    glossEs,
  };
}

async function fetchTagntRows(url: string): Promise<WordStudyRow[]> {
  console.log(`[NT] Descargando ${url.split("/").pop()}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  const text = await res.text();

  const rows: WordStudyRow[] = [];
  for (const line of text.split("\n")) {
    const row = parseTagntLine(line);
    if (row) rows.push(row);
  }
  console.log(`[NT] ${rows.length} palabras parseadas.`);
  return rows;
}

async function main(): Promise<void> {
  await initDb();

  const dictionaryRows = await fetchStrongsDictionary();
  console.log("[diccionario] Vaciando strongs_greek para reingestar...");
  await db.run("DELETE FROM strongs_greek");
  for (let i = 0; i < dictionaryRows.length; i += BATCH_SIZE) {
    const chunk = dictionaryRows.slice(i, i + BATCH_SIZE);
    await db.batch(
      chunk.map((r) => ({
        sql: `INSERT INTO strongs_greek (number, greek, transliteration, pronunciation, definition)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(number) DO UPDATE SET
                greek = excluded.greek, transliteration = excluded.transliteration,
                pronunciation = excluded.pronunciation, definition = excluded.definition`,
        args: [r.number, r.greek, r.transliteration, r.pronunciation, r.definition],
      }))
    );
  }
  console.log(`[diccionario] ${dictionaryRows.length} entradas insertadas.`);

  console.log("[NT] Vaciando word_study para reingestar...");
  await db.run("DELETE FROM word_study");
  let totalWords = 0;
  for (const url of TAGNT_URLS) {
    const rows = await fetchTagntRows(url);
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      await db.batch(
        chunk.map((r) => ({
          sql: `INSERT INTO word_study (book, chapter, verse, word_order, greek, transliteration, strongs_number, gloss_es)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(book, chapter, verse, word_order) DO UPDATE SET
                  greek = excluded.greek, transliteration = excluded.transliteration,
                  strongs_number = excluded.strongs_number, gloss_es = excluded.gloss_es`,
          args: [r.book, r.chapter, r.verse, r.wordOrder, r.greek, r.transliteration, r.strongsNumber, r.glossEs],
        }))
      );
    }
    totalWords += rows.length;
    console.log(`[NT] ${totalWords} palabras insertadas hasta ahora...`);
  }

  console.log(`Ingesta de estudio de palabras completa: ${dictionaryRows.length} entradas de diccionario, ${totalWords} palabras del NT.`);
}

main().catch((err) => {
  console.error("La ingesta de estudio de palabras falló:", err);
  process.exit(1);
});
