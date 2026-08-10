import { cleanVerseText } from "./bibleTextCleaner.js";

const BASE_URL = "https://raw.githubusercontent.com/wldeh/bible-api/main";

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

// Cache en memoria: el texto público del CDN es inmutable, así que no expira.
const cache = new Map<string, unknown>();

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const cached = cache.get(url);
  if (cached !== undefined) return cached as T;

  const res = await fetch(url);
  if (res.status === 404) {
    throw new BibleSourceError(`No se encontró el recurso solicitado (${path}).`, 404);
  }
  if (!res.ok) {
    throw new BibleSourceError(`Error al consultar la fuente bíblica (${res.status}).`, 502);
  }

  const data = (await res.json()) as T;
  cache.set(url, data);
  return data;
}

let versionsPromise: Promise<BibleVersion[]> | undefined;

export function getVersions(): Promise<BibleVersion[]> {
  versionsPromise ??= fetchJson<BibleVersion[]>("/bibles/bibles.json");
  return versionsPromise;
}

export async function getChapter(
  versionId: string,
  bookSlug: string,
  chapter: number
): Promise<ChapterVerse[]> {
  const path = `/bibles/${encodeURIComponent(versionId)}/books/${encodeURIComponent(
    bookSlug
  )}/chapters/${chapter}.json`;
  const { data } = await fetchJson<{ data: ChapterVerse[] }>(path);
  return data.map((v) => ({ ...v, text: cleanVerseText(versionId, v.text) }));
}

export async function getVerse(
  versionId: string,
  bookSlug: string,
  chapter: number,
  verse: number
): Promise<{ verse: string; text: string }> {
  const path = `/bibles/${encodeURIComponent(versionId)}/books/${encodeURIComponent(
    bookSlug
  )}/chapters/${chapter}/verses/${verse}.json`;
  const data = await fetchJson<{ verse: string; text: string }>(path);
  return { ...data, text: cleanVerseText(versionId, data.text) };
}
