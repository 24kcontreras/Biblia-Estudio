import { db } from "../db.js";
import { slugToUsfm } from "./bibleBookCodes.js";

const BASE_URL = "https://bible.helloao.org/api";

export class BibleSourceError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "BibleSourceError";
  }
}

export interface BibleVersion {
  id: string;
  version: string;
  description: string;
  language: { name: string; code: string };
  localVersionName: string;
  localVersionAbbreviation: string;
}

export interface ChapterVerse {
  book: string;
  chapter: string;
  verse: string;
  text: string;
}

/**
 * Únicamente versiones en español, de dominio público (ebible.org vía la API de HelloAO —
 * la misma fuente que ya usamos para el comentario de Matthew Henry). No existe una API pública
 * gratuita con NVI ni con una edición oficial de una editorial católica (Biblia de Jerusalén,
 * Latinoamericana, etc.) — ambas son traducciones con derechos de autor. La opción marcada como
 * "católica" es la única edición libre disponible que incluye los libros deuterocanónicos
 * (Tobías, Judit, Sabiduría, Eclesiástico, Baruc y 1-2 Macabeos), que es lo que en la práctica
 * distingue a una Biblia católica de una protestante.
 */
export const SPANISH_VERSIONS: BibleVersion[] = [
  {
    id: "spa_rv1960",
    version: "Reina Valera 1960",
    description: "Traducción clásica evangélica (Desde PDF local).",
    language: { name: "Español", code: "spa" },
    localVersionName: "Reina Valera 1960",
    localVersionAbbreviation: "RV1960",
  },
  {
    id: "spa_r09",
    version: "Reina Valera 1909",
    description: "Traducción clásica de dominio público.",
    language: { name: "Español", code: "spa" },
    localVersionName: "Reina Valera 1909",
    localVersionAbbreviation: "RV09",
  },
  {
    id: "spa_rvg",
    version: "Reina Valera Gómez",
    description: "Revisión de la Reina Valera, de dominio público.",
    language: { name: "Español", code: "spa" },
    localVersionName: "Reina Valera Gómez",
    localVersionAbbreviation: "RVG",
  },
  {
    id: "spa_v2p",
    version: "Valera 1602 Purificada",
    description: "Revisión de la Valera de 1602, de dominio público.",
    language: { name: "Español", code: "spa" },
    localVersionName: "Valera 1602 Purificada",
    localVersionAbbreviation: "V2P",
  },
  {
    id: "spa_blm",
    version: "Santa Biblia libre para el mundo",
    description:
      "Incluye los libros deuterocanónicos que reconoce la tradición católica (Tobías, Judit, Sabiduría, Eclesiástico, Baruc, 1-2 Macabeos).",
    language: { name: "Español", code: "spa" },
    localVersionName: "Biblia con Deuterocanónicos (católica)",
    localVersionAbbreviation: "BLM",
  },
  {
    id: "spa_pdt",
    version: "Palabra de Dios para Ti",
    description: "Traducción en español moderno, de fácil lectura.",
    language: { name: "Español", code: "spa" },
    localVersionName: "Palabra de Dios para Ti",
    localVersionAbbreviation: "PDT",
  },
  {
    id: "spa_onbv",
    version: "Nueva Biblia Viva",
    description: "Paráfrasis en español contemporáneo.",
    language: { name: "Español", code: "spa" },
    localVersionName: "Nueva Biblia Viva",
    localVersionAbbreviation: "NBV",
  },
  {
    id: "spa_bes",
    version: "La Biblia en Español Sencillo",
    description: "Traducción en español simplificado.",
    language: { name: "Español", code: "spa" },
    localVersionName: "Biblia en Español Sencillo",
    localVersionAbbreviation: "BES",
  },
  {
    id: "spa_vbl",
    version: "Versión Biblia Libre",
    description: "Traducción libre en español, de dominio público.",
    language: { name: "Español", code: "spa" },
    localVersionName: "Versión Biblia Libre",
    localVersionAbbreviation: "VBL",
  },
  {
    id: "spa_nvi",
    version: "Nueva Versión Internacional (NVI) 2015",
    description: "Traducción moderna (Desde PDF local).",
    language: { name: "Español", code: "spa" },
    localVersionName: "Nueva Versión Internacional",
    localVersionAbbreviation: "NVI",
  },

  {
    id: "spa_tnm",
    version: "Traducción del Nuevo Mundo (Testigos de Jehová)",
    description: "Testigos de Jehová (Desde PDF local).",
    language: { name: "Español", code: "spa" },
    localVersionName: "Traducción del Nuevo Mundo (Testigos de Jehová)",
    localVersionAbbreviation: "TNM",
  },
];

const VALID_VERSION_IDS = new Set(SPANISH_VERSIONS.map((v) => v.id));

// Cache en memoria: el texto público del CDN es inmutable, así que no expira.
const cache = new Map<string, unknown>();

async function fetchJson<T>(apiPath: string): Promise<T> {

  const url = `${BASE_URL}${apiPath}`;
  const cached = cache.get(url);
  if (cached !== undefined) return cached as T;

  const res = await fetch(url);
  if (res.status === 404) {
    throw new BibleSourceError(`No se encontró el recurso solicitado (${apiPath}).`, 404);
  }
  if (!res.ok) {
    throw new BibleSourceError(`Error al consultar la fuente bíblica (${res.status}).`, 502);
  }

  const data = (await res.json()) as T;
  cache.set(url, data);
  return data;
}

export async function getVersions(): Promise<BibleVersion[]> {
  return SPANISH_VERSIONS;
}

interface HelloAOContentEntry {
  type: string;
  number: number;
  content: unknown[];
}

function joinVerseContent(content: unknown[]): string {
  return content
    .map((part) => (typeof part === "string" ? part : ((part as { text?: string })?.text ?? "")))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function assertKnownVersion(versionId: string): void {
  if (!VALID_VERSION_IDS.has(versionId)) {
    throw new BibleSourceError(`Versión no reconocida: ${versionId}`, 404);
  }
}

export async function getChapter(
  versionId: string,
  bookSlug: string,
  chapter: number
): Promise<ChapterVerse[]> {
  assertKnownVersion(versionId);
  const usfm = slugToUsfm.get(bookSlug);
  if (!usfm) {
    throw new BibleSourceError(`Libro no reconocido: ${bookSlug}`, 404);
  }

  // Leer desde la base de datos para las versiones personalizadas (PDF)
  if (versionId === "spa_nvi" || versionId === "spa_rv1960" || versionId === "spa_tnm") {
    const res = await db.batch([{
      sql: "SELECT verse, text FROM local_bible_text WHERE version = ? AND book = ? AND chapter = ? ORDER BY verse",
      args: [versionId, usfm, chapter],
    }]);
    
    const rows = res[0].rows as { verse: number; text: string }[];
    if (rows.length === 0) {
       throw new BibleSourceError(`No se encontró el recurso en la base de datos para ${versionId} ${usfm} ${chapter}. Asegúrate de ingerirlo primero.`, 404);
    }
    
    return rows.map((row) => ({
      book: bookSlug,
      chapter: String(chapter),
      verse: String(row.verse),
      text: String(row.text),
    }));
  }

  const data = await fetchJson<{ chapter: { content: HelloAOContentEntry[] } }>(
    `/${versionId}/${usfm}/${chapter}.json`
  );

  return data.chapter.content
    .filter((entry) => entry.type === "verse")
    .map((entry) => ({
      book: bookSlug,
      chapter: String(chapter),
      verse: String(entry.number),
      text: joinVerseContent(entry.content),
    }));
}

export async function getVerse(
  versionId: string,
  bookSlug: string,
  chapter: number,
  verse: number
): Promise<{ verse: string; text: string }> {
  const verses = await getChapter(versionId, bookSlug, chapter);
  const target = verses.find((v) => v.verse === String(verse));
  if (!target) {
    throw new BibleSourceError(`No se encontró el versículo ${bookSlug} ${chapter}:${verse}.`, 404);
  }
  return { verse: target.verse, text: target.text };
}
