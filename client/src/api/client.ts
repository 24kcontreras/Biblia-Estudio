export interface BibleBook {
  slug: string;
  name: string;
  testament: "AT" | "NT" | "DEU";
  order: number;
  chapterCount: number;
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

export interface ChapterResponse {
  book: BibleBook;
  chapter: number;
  version: string;
  verses: ChapterVerse[];
}

export interface CrossReference {
  referencia: string;
  nota: string;
}

export interface VerseAnalysis {
  contexto: string;
  analisisLiterario: string;
  exposicion: string;
  palabrasClave: string;
  teologia: string;
  panoramaCanonico: string;
  referenciasCruzadas: CrossReference[];
  historiaInterpretacion: string;
  aplicacion: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface VerseMark {
  version: string;
  book: string;
  chapter: number;
  verse: number;
  isFavorite: boolean;
  color: string | null;
  note: string | null;
  memorize: boolean;
}

export interface VerseMarkUpdate {
  isFavorite?: boolean;
  color?: string | null;
  note?: string | null;
  memorize?: boolean;
}

export interface CollectionSummary {
  id: number;
  name: string;
  verseCount: number;
}

export interface CollectionVerseRef {
  version: string;
  book: string;
  chapter: number;
  verse: number;
}

export interface CollectionDetail {
  id: number;
  name: string;
  verses: CollectionVerseRef[];
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getBooks(): Promise<BibleBook[]> {
  return fetch("/api/bible/books").then((r) => handle<BibleBook[]>(r));
}

export function getVersions(): Promise<BibleVersion[]> {
  return fetch("/api/bible/versions").then((r) => handle<BibleVersion[]>(r));
}

export interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  snippet: string;
}

export function searchBible(version: string, q: string): Promise<{ results: SearchResult[] }> {
  const params = new URLSearchParams({ q, version });
  return fetch(`/api/bible/search?${params.toString()}`).then((r) => handle(r));
}

export interface WordStudyEntry {
  greek: string;
  transliteration: string | null;
  strongsNumber: string | null;
  glossEs: string | null;
  definition: string | null;
  pronunciation: string | null;
}

export function getWordStudy(book: string, chapter: number, verse: number): Promise<{ words: WordStudyEntry[] }> {
  return fetch(`/api/bible/word-study/${encodeURIComponent(book)}/${chapter}/${verse}`).then((r) => handle(r));
}

export function getChapter(version: string, book: string, chapter: number): Promise<ChapterResponse> {
  return fetch(`/api/bible/${encodeURIComponent(version)}/${encodeURIComponent(book)}/${chapter}`).then((r) =>
    handle<ChapterResponse>(r)
  );
}

export function analyzeVerse(params: {
  version: string;
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
}): Promise<{ analysis: VerseAnalysis; cached: boolean }> {
  return fetch("/api/verse/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).then((r) => handle<{ analysis: VerseAnalysis; cached: boolean }>(r));
}

export interface SavedAnalysis {
  id: number;
  version: string;
  book: string;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  analysis: VerseAnalysis;
  createdAt: string;
}

export function getSavedAnalyses(): Promise<{ saved: SavedAnalysis[] }> {
  return fetch("/api/verse/analyze/saved").then((r) => handle(r));
}

export function saveAnalysis(params: {
  version: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  analysis: VerseAnalysis;
}): Promise<{ id: number }> {
  return fetch("/api/verse/analyze/saved", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).then((r) => handle(r));
}

export function deleteSavedAnalysis(id: number): Promise<void> {
  return fetch(`/api/verse/analyze/saved/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error(`Error ${r.status}`);
  });
}

export function getChatHistory(sessionId: string): Promise<{ messages: ChatMessage[] }> {
  return fetch(`/api/chat/${encodeURIComponent(sessionId)}`).then((r) => handle(r));
}

export interface SavedChatAnswer {
  id: number;
  question: string | null;
  answer: string;
  created_at: string;
}

export function getSavedChatAnswers(): Promise<{ saved: SavedChatAnswer[] }> {
  return fetch("/api/chat/saved").then((r) => handle(r));
}

export function saveChatAnswer(question: string | null, answer: string): Promise<{ id: number }> {
  return fetch("/api/chat/saved", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer }),
  }).then((r) => handle(r));
}

export function deleteSavedChatAnswer(id: number): Promise<void> {
  return fetch(`/api/chat/saved/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error(`Error ${r.status}`);
  });
}

export interface ChatStreamHandlers {
  onChunk: (text: string) => void;
  onDone: (sessionId: string) => void;
  onError: (message: string) => void;
}

export async function streamChat(
  message: string,
  sessionId: string | null,
  handlers: ChatStreamHandlers
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    handlers.onError(body.error ?? `Error ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const chunk of events) {
      let eventType = "message";
      let data = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) eventType = line.slice(7);
        else if (line.startsWith("data: ")) data = line.slice(6);
      }
      if (!data) continue;
      const parsed = JSON.parse(data);
      if (eventType === "done") handlers.onDone(parsed.sessionId as string);
      else if (eventType === "error") handlers.onError(parsed.error as string);
      else handlers.onChunk(parsed.text as string);
    }
  }
}

export function getChapterMarks(version: string, book: string, chapter: number): Promise<{ marks: VerseMark[] }> {
  return fetch(`/api/marks/chapter/${encodeURIComponent(version)}/${encodeURIComponent(book)}/${chapter}`).then(
    (r) => handle(r)
  );
}

export function listMarks(type?: "favorite" | "memorize"): Promise<{ marks: VerseMark[] }> {
  const query = type ? `?type=${type}` : "";
  return fetch(`/api/marks${query}`).then((r) => handle(r));
}

export function upsertMark(
  version: string,
  book: string,
  chapter: number,
  verse: number,
  update: VerseMarkUpdate
): Promise<{ mark: VerseMark | null }> {
  return fetch(`/api/marks/${encodeURIComponent(version)}/${encodeURIComponent(book)}/${chapter}/${verse}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  }).then((r) => handle(r));
}

export function getCollections(): Promise<{ collections: CollectionSummary[] }> {
  return fetch("/api/collections").then((r) => handle(r));
}

export function createCollection(name: string): Promise<{ id: number; name: string }> {
  return fetch("/api/collections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }).then((r) => handle(r));
}

export function deleteCollection(id: number): Promise<void> {
  return fetch(`/api/collections/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error(`Error ${r.status}`);
  });
}

export function getCollection(id: number): Promise<CollectionDetail> {
  return fetch(`/api/collections/${id}`).then((r) => handle(r));
}

export function addVerseToCollection(collectionId: number, ref: CollectionVerseRef): Promise<void> {
  return fetch(`/api/collections/${collectionId}/verses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ref),
  }).then((r) => {
    if (!r.ok) throw new Error(`Error ${r.status}`);
  });
}

export function removeVerseFromCollection(collectionId: number, ref: CollectionVerseRef): Promise<void> {
  return fetch(
    `/api/collections/${collectionId}/verses/${encodeURIComponent(ref.version)}/${encodeURIComponent(
      ref.book
    )}/${ref.chapter}/${ref.verse}`,
    { method: "DELETE" }
  ).then((r) => {
    if (!r.ok) throw new Error(`Error ${r.status}`);
  });
}
