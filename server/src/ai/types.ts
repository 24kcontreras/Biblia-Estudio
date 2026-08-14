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
  analisisLiterario: string;
  exposicion: string;
  palabrasClave: string;
  teologia: string;
  panoramaCanonico: string;
  referenciasCruzadas: CrossReference[];
  historiaInterpretacion: string;
  aplicacion: string;
}

export interface VerseAnalysisInput {
  versionName: string;
  book: string;
  chapter: number;
  verse: number;
  /** Último versículo del rango a analizar. Igual a `verse` cuando se analiza un solo versículo. */
  verseEnd: number;
  verseText: string;
  contextVerses: { verse: number; text: string }[];
  /** Extracto del comentario de Matthew Henry (dominio público) aplicable a este pasaje, si existe. */
  commentary?: string | null;
  /** Referencias cruzadas verificadas (dataset basado en Treasury of Scripture Knowledge), si existen. */
  verifiedCrossReferences?: { referencia: string; votos: number }[];
}

export interface ApocryphaAnalysis {
  contexto: string;
  analisisLiterario: string;
  resumen: string;
  /** Conexiones reales y verificables con la Biblia canónica (citas directas, ecos temáticos). */
  conexionesBiblicas: CrossReference[];
  significadoHistorico: string;
  /** Por qué no es canon, qué tradición (si alguna) lo acepta, y cómo debe leerse (no como Escritura). */
  estadoCanonico: string;
}

export interface ApocryphaAnalysisInput {
  workName: string;
  workDescription: string;
  chapterTitle: string;
  chapterNumber: number;
  totalChapters: number;
  content: string;
}

export interface AIProvider {
  /** `onFallback` se llama (solo en el proveedor con respaldo) cuando el principal falla y se reintenta con Groq. */
  streamChat(messages: ChatMessage[], onFallback?: (message: string) => void): AsyncGenerator<string, void, unknown>;
  analyzeVerse(input: VerseAnalysisInput, onFallback?: (message: string) => void): Promise<VerseAnalysis>;
  analyzeApocrypha(input: ApocryphaAnalysisInput, onFallback?: (message: string) => void): Promise<ApocryphaAnalysis>;
}

/** Se lanza cuando falta configuración necesaria para hablar con el proveedor de IA (ej. API key). */
export class AIConfigError extends Error {}
