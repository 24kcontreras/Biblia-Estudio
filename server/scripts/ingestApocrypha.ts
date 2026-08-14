/**
 * Script de ingesta de una sola corrida:
 *   npm run ingest:apocrypha -w server                    (todos los libros)
 *   npm run ingest:apocrypha -w server -- bernabe          (solo uno o varios, por slug)
 *
 * Descarga cuatro textos apócrifos/pseudoepígrafos de dominio público desde Wikisource (en
 * inglés, no hay traducción libre al español) y los traduce al español con un modelo local de
 * Ollama (gemma4:12b) antes de cargarlos — evita la cuota/costo de un proveedor hosted para esta
 * traducción de una sola vez. Requiere Ollama corriendo en localhost:11434 con el modelo bajado
 * (`ollama pull gemma4:12b`). Estos textos NO son canon de ninguna tradición cristiana mayoritaria
 * (solo Enoc lo es en la iglesia ortodoxa etíope) — se muestran en una sección aparte de la app,
 * distinta de los libros deuterocanónicos (que sí son canon católico/ortodoxo).
 *
 * Fuentes:
 *  - Libro de Enoc: traducción de R.H. Charles (1917), en.wikisource.org.
 *  - Epístola de Bernabé: traducción de J.B. Lightfoot (s. XIX), en.wikisource.org.
 *  - Pastor de Hermas: traducción de J.B. Lightfoot (s. XIX), en.wikisource.org.
 */
import "dotenv/config";
import { db, initDb } from "../src/db.js";

const WIKISOURCE_API = "https://en.wikisource.org/w/api.php";
const OLLAMA_URL = "http://localhost:11434/api/chat";
const OLLAMA_MODEL = "gemma4:12b";

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

const OLLAMA_SYSTEM_PROMPT =
  "Eres un traductor experto de textos religiosos antiguos del inglés al español. Traduce el texto que se te da de forma clara, fiel y fluida, en español neutro. Mantén la numeración de versículos si el texto la tiene. No agregues comentarios, notas ni interpretación propia — solo la traducción. No incluyas los marcadores de crítica textual tipo ⌈ ⌉ del original, simplemente traduce el texto que encierran como parte normal de la oración.";

async function translateToSpanish(englishText: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        // gemma4 es un modelo "thinking": sin este flag, a veces vuelca TODA la respuesta en el
        // campo message.thinking (razonamiento interno) y deja message.content vacío — se pierde
        // en silencio y el capítulo queda sin traducir. Con think:false responde directo en content.
        think: false,
        messages: [
          { role: "system", content: OLLAMA_SYSTEM_PROMPT },
          { role: "user", content: englishText },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama devolvió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim() ?? "";
    if (!content) throw new Error("Ollama devolvió una traducción vacía.");
    return content;
  } catch (err) {
    if (attempt <= 3) {
      console.log(`  (fallo hablando con Ollama: ${(err as Error).message} — reintentando en 5s... intento ${attempt + 1})`);
      await sleep(5000);
      return translateToSpanish(englishText, attempt + 1);
    }
    throw err;
  }
}

/**
 * Traduce e inserta capítulo por capítulo (no todo el libro de una), para que una corrida larga
 * y desatendida (horas) no pierda el progreso entero de un libro si se corta a mitad de camino
 * — solo se pierde, como mucho, el capítulo que estaba traduciéndose en ese momento.
 */
async function translateAndPersistChapters(workSlug: string, chapters: RawChapter[]): Promise<void> {
  let failures = 0;

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const started = Date.now();
    let content = chapter.content;
    try {
      const translated = await translateToSpanish(chapter.content);
      content = translated || chapter.content;
      console.log(`  [${i + 1}/${chapters.length}] "${chapter.title}" traducido (${Math.round((Date.now() - started) / 1000)}s)`);
    } catch (err) {
      failures++;
      console.warn(`  Error traduciendo "${chapter.title}" (queda en inglés):`, (err as Error).message);
    }

    await db.run(
      `INSERT INTO apocrypha_chapters (work_slug, chapter_number, title, content) VALUES (?, ?, ?, ?)
       ON CONFLICT(work_slug, chapter_number) DO UPDATE SET title = excluded.title, content = excluded.content`,
      workSlug,
      i + 1,
      chapter.title,
      content
    );
  }

  if (failures > 0) {
    console.warn(`  ADVERTENCIA: ${failures} de ${chapters.length} capítulos quedaron sin traducir.`);
  }
}

async function main(): Promise<void> {
  const requestedSlugs = process.argv.slice(2);
  const works = requestedSlugs.length ? WORKS.filter((w) => requestedSlugs.includes(w.slug)) : WORKS;
  if (requestedSlugs.length && works.length !== requestedSlugs.length) {
    const known = WORKS.map((w) => w.slug).join(", ");
    throw new Error(`Slug desconocido en [${requestedSlugs.join(", ")}]. Válidos: ${known}`);
  }

  await initDb();

  for (const work of works) {
    console.log(`[${work.slug}] Descargando desde Wikisource...`);
    const rawChapters = await work.fetch();
    console.log(`[${work.slug}] ${rawChapters.length} capítulos descargados. Traduciendo con ${OLLAMA_MODEL}...`);

    await db.run("DELETE FROM apocrypha_chapters WHERE work_slug = ?", work.slug);
    await db.run(
      `INSERT INTO apocrypha_works (slug, name, description, chapter_count) VALUES (?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description, chapter_count = excluded.chapter_count`,
      work.slug,
      work.name,
      work.description,
      rawChapters.length
    );

    await translateAndPersistChapters(work.slug, rawChapters);

    console.log(`[${work.slug}] Listo: ${rawChapters.length} capítulos traducidos e insertados.`);
  }

  console.log("Ingesta de apócrifos completa.");
}

main().catch((err) => {
  console.error("La ingesta de apócrifos falló:", err);
  process.exit(1);
});
