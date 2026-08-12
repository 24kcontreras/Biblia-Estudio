/**
 * Script de ingesta de una sola corrida:
 *   npm run ingest:apocrypha -w server
 *
 * Descarga cuatro textos apócrifos/pseudoepígrafos de dominio público desde Wikisource (en
 * inglés, no hay traducción libre al español) y los traduce al español con Gemini antes de
 * cargarlos. Estos textos NO son canon de ninguna tradición cristiana mayoritaria (solo Enoc lo
 * es en la iglesia ortodoxa etíope) — se muestran en una sección aparte de la app, distinta de
 * los libros deuterocanónicos (que sí son canon católico/ortodoxo).
 *
 * Fuentes:
 *  - Libro de Enoc: traducción de R.H. Charles (1917), en.wikisource.org.
 *  - Epístola de Bernabé: traducción de J.B. Lightfoot (s. XIX), en.wikisource.org.
 *  - Pastor de Hermas: traducción de J.B. Lightfoot (s. XIX), en.wikisource.org.
 */
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { db, initDb } from "../src/db.js";

const WIKISOURCE_API = "https://en.wikisource.org/w/api.php";
const MODEL = "gemini-3.6-flash";
// El tier gratis de Gemini limita a 20 solicitudes/minuto — se traduce en serie con este delay
// entre pedidos (≈18/min) para no pisar la cuota en vez de descubrirlo a los golpes con reintentos.
const TRANSLATE_DELAY_MS = 3300;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Falta GEMINI_API_KEY en server/.env.");
const genai = new GoogleGenAI({ apiKey });

interface RawChapter {
  title: string;
  content: string;
}

interface Work {
  slug: string;
  name: string;
  description: string;
  fetch: () => Promise<RawChapter[]>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function wikisourceExtract(title: string, attempt = 1): Promise<string> {
  const url = `${WIKISOURCE_API}?action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=1&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": "BibleChat-personal-app/1.0 (uso personal, no comercial)" } });
  if (res.status === 429 && attempt <= 8) {
    console.log(`  (429 de Wikisource en "${title}", esperando ${attempt * 5}s antes de reintentar...)`);
    await sleep(attempt * 5000);
    return wikisourceExtract(title, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} en Wikisource para "${title}"`);
  const data = (await res.json()) as { query: { pages: Record<string, { extract?: string }> } };
  const page = Object.values(data.query.pages)[0];
  return page?.extract ?? "";
}

async function wikisourceAllPages(prefix: string): Promise<string[]> {
  const url = `${WIKISOURCE_API}?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=500&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} listando páginas "${prefix}"`);
  const data = (await res.json()) as { query: { allpages: { title: string }[] } };
  return data.query.allpages.map((p) => p.title);
}

/** Divide el texto plano extraído de una página en capítulos usando encabezados "== Título ==". */
function splitBySections(text: string): RawChapter[] {
  const parts = text.split(/^==\s*(.+?)\s*==$/m);
  const chapters: RawChapter[] = [];
  // parts[0] es el preámbulo antes del primer encabezado — se descarta.
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    const content = (parts[i + 1] ?? "").trim();
    if (content) chapters.push({ title, content });
  }
  return chapters;
}

/** Quita líneas de encabezado wiki ("== Título ==", "=== Título ===", ...) que Wikisource deja en el
 * texto plano cuando una página de capítulo tiene sub-secciones internas. */
function stripWikiHeadings(text: string): string {
  return text
    .replace(/^={2,}\s*.*?\s*={2,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchEnoch(): Promise<RawChapter[]> {
  const pages = await wikisourceAllPages("The Book of Enoch (Charles)/Chapter ");
  const chapters: RawChapter[] = [];
  for (const page of pages.sort()) {
    const match = /Chapter (\d+)/.exec(page);
    if (!match) continue;
    const content = stripWikiHeadings(await wikisourceExtract(page));
    if (content) chapters.push({ title: `Capítulo ${Number(match[1])}`, content });
    await sleep(1000);
  }
  return chapters;
}

async function fetchBarnabas(): Promise<RawChapter[]> {
  const text = await wikisourceExtract("Epistle of Barnabas (Lightfoot translation)");
  return splitBySections(text).map((c, i) => ({ title: `Capítulo ${i + 1}`, content: stripWikiHeadings(c.content) }));
}

async function fetchHermas(): Promise<RawChapter[]> {
  const pages = [
    "Shepherd of Hermas: Book of Visions (Lightfoot translation)",
    "Shepherd of Hermas: Book of Mandates (Lightfoot translation)",
    "Shepherd of Hermas: Book of Similitudes (Lightfoot translation)",
  ];
  const chapters: RawChapter[] = [];
  for (const page of pages) {
    const text = await wikisourceExtract(page);
    chapters.push(...splitBySections(text));
  }
  return chapters.map((c, i) => ({ title: `${i + 1}. ${c.title}`, content: stripWikiHeadings(c.content) }));
}

const WORKS: Work[] = [
  {
    slug: "enoc",
    name: "Libro de Enoc",
    description:
      "Texto judío pseudoepígrafo (siglos III-I a.C.) atribuido al patriarca Enoc, con visiones sobre ángeles caídos, el juicio final y el Mesías. Canónico en la tradición ortodoxa etíope; no forma parte del canon católico, ortodoxo oriental ni protestante. Traducción al inglés de R.H. Charles (1917, dominio público), traducida aquí al español con IA.",
    fetch: fetchEnoch,
  },
  {
    slug: "bernabe",
    name: "Epístola de Bernabé",
    description:
      "Carta cristiana primitiva (finales del s. I o principios del s. II) de autor desconocido, tradicionalmente atribuida a Bernabé. Aparece en el Códice Sinaítico junto a los libros del Nuevo Testamento, pero no forma parte del canon de ninguna tradición cristiana actual. Traducción al inglés de J.B. Lightfoot (dominio público), traducida aquí al español con IA.",
    fetch: fetchBarnabas,
  },
  {
    slug: "hermas",
    name: "El Pastor de Hermas",
    description:
      "Obra cristiana primitiva (s. II) de visiones, mandamientos y parábolas sobre el arrepentimiento, muy leída en la iglesia antigua — algunas listas antiguas la consideraron cercana al canon, pero no forma parte del canon de ninguna tradición actual. Traducción al inglés de J.B. Lightfoot (dominio público), traducida aquí al español con IA.",
    fetch: fetchHermas,
  },
];

async function translateToSpanish(englishText: string, attempt = 1): Promise<string> {
  try {
    const interaction = await genai.interactions.create({
      model: MODEL,
      system_instruction:
        "Eres un traductor experto de textos religiosos antiguos del inglés al español. Traduce el texto que se te da de forma clara, fiel y fluida, en español neutro. Mantén la numeración de versículos si el texto la tiene. No agregues comentarios, notas ni interpretación propia — solo la traducción. No incluyas los marcadores de crítica textual tipo ⌈ ⌉ del original, simplemente traduce el texto que encierran como parte normal de la oración.",
      input: englishText,
    });
    return interaction.output_text?.trim() ?? "";
  } catch (err) {
    const message = (err as Error).message ?? "";
    const isRateLimit = message.includes("429") || /quota/i.test(message);
    if (isRateLimit && attempt <= 6) {
      const retryMatch = /retry in ([\d.]+)s/i.exec(message);
      const waitMs = retryMatch ? Math.ceil(Number(retryMatch[1]) * 1000) + 1000 : attempt * 10000;
      console.log(`  (cuota de Gemini alcanzada, esperando ${Math.round(waitMs / 1000)}s antes de reintentar...)`);
      await sleep(waitMs);
      return translateToSpanish(englishText, attempt + 1);
    }
    throw err;
  }
}

async function translateChapters(chapters: RawChapter[]): Promise<RawChapter[]> {
  const results: RawChapter[] = new Array(chapters.length);
  let failures = 0;

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    try {
      const content = await translateToSpanish(chapter.content);
      results[i] = { title: chapter.title, content: content || chapter.content };
    } catch (err) {
      failures++;
      console.warn(`  Error traduciendo "${chapter.title}" (queda en inglés):`, (err as Error).message);
      results[i] = chapter;
    }
    if (i < chapters.length - 1) await sleep(TRANSLATE_DELAY_MS);
  }

  if (failures > 0) {
    console.warn(`  ADVERTENCIA: ${failures} de ${chapters.length} capítulos quedaron sin traducir.`);
  }
  return results;
}

async function main(): Promise<void> {
  await initDb();

  for (const work of WORKS) {
    console.log(`[${work.slug}] Descargando desde Wikisource...`);
    const rawChapters = await work.fetch();
    console.log(`[${work.slug}] ${rawChapters.length} capítulos descargados. Traduciendo con IA...`);

    const translated = await translateChapters(rawChapters);

    await db.run("DELETE FROM apocrypha_chapters WHERE work_slug = ?", work.slug);
    await db.run(
      `INSERT INTO apocrypha_works (slug, name, description, chapter_count) VALUES (?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description, chapter_count = excluded.chapter_count`,
      work.slug,
      work.name,
      work.description,
      translated.length
    );

    const BATCH_SIZE = 50;
    for (let i = 0; i < translated.length; i += BATCH_SIZE) {
      const chunk = translated.slice(i, i + BATCH_SIZE);
      await db.batch(
        chunk.map((c, j) => ({
          sql: "INSERT INTO apocrypha_chapters (work_slug, chapter_number, title, content) VALUES (?, ?, ?, ?)",
          args: [work.slug, i + j + 1, c.title, c.content],
        }))
      );
    }

    console.log(`[${work.slug}] Listo: ${translated.length} capítulos traducidos e insertados.`);
  }

  console.log("Ingesta de apócrifos completa.");
}

main().catch((err) => {
  console.error("La ingesta de apócrifos falló:", err);
  process.exit(1);
});
