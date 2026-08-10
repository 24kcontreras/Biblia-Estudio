export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CrossReference {
  referencia: string;
  nota: string;
}

export interface VerseAnalysis {
  contexto: string;
  exposicion: string;
  teologia: string;
  referenciasCruzadas: CrossReference[];
}

export interface VerseAnalysisInput {
  versionName: string;
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  contextVerses: { verse: number; text: string }[];
  /** Extracto del comentario de Matthew Henry (dominio público) aplicable a este versículo, si existe. */
  commentary?: string | null;
  /** Referencias cruzadas verificadas (dataset basado en Treasury of Scripture Knowledge), si existen. */
  verifiedCrossReferences?: { referencia: string; votos: number }[];
}

export interface AIProvider {
  streamChat(messages: ChatMessage[]): AsyncGenerator<string, void, unknown>;
  analyzeVerse(input: VerseAnalysisInput): Promise<VerseAnalysis>;
}

/** Se lanza cuando falta configuración necesaria para hablar con el proveedor de IA (ej. API key). */
export class AIConfigError extends Error {}
