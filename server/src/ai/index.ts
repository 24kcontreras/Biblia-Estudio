import { createAnthropicProvider } from "./anthropicProvider.js";
import { createGeminiProvider } from "./geminiProvider.js";
import { createGroqProvider } from "./groqProvider.js";
import type {
  AIProvider,
  ApocryphaAnalysis,
  ApocryphaAnalysisInput,
  ChatMessage,
  VerseAnalysis,
  VerseAnalysisInput,
} from "./types.js";

export { AIConfigError } from "./types.js";
export type {
  ChatMessage,
  VerseAnalysis,
  VerseAnalysisInput,
  ApocryphaAnalysis,
  ApocryphaAnalysisInput,
  CrossReference,
  AIProvider,
} from "./types.js";

function createPrimaryProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER ?? "anthropic";
  if (providerName === "anthropic") return createAnthropicProvider();
  if (providerName === "gemini") return createGeminiProvider();
  throw new Error(`Proveedor de IA no soportado: ${providerName}`);
}

/**
 * Envuelve al proveedor principal: si falla (cuota agotada, error de red, lo que sea), reintenta
 * con Groq como respaldo. En streamChat, si el fallo ocurre después de haber emitido texto del
 * proveedor principal (poco común — normalmente falla antes de la primera respuesta), el respaldo
 * continúa desde cero y el resultado queda como texto-parcial-principal + respuesta-completa-de-Groq;
 * no se intenta "empalmar" ambas respuestas.
 */
class FallbackProvider implements AIProvider {
  constructor(
    private primary: AIProvider,
    private fallback: AIProvider
  ) {}

  async *streamChat(messages: ChatMessage[], onFallback?: (message: string) => void): AsyncGenerator<string, void, unknown> {
    try {
      const iterator = this.primary.streamChat(messages);
      let next = await iterator.next();
      while (!next.done) {
        yield next.value;
        next = await iterator.next();
      }
      return;
    } catch (err) {
      console.error("Proveedor de IA principal falló en streamChat, usando respaldo Groq:", err);
      onFallback?.("Reintentando con IA de respaldo...");
    }
    yield* this.fallback.streamChat(messages);
  }

  async analyzeVerse(input: VerseAnalysisInput, onFallback?: (message: string) => void): Promise<VerseAnalysis> {
    try {
      return await this.primary.analyzeVerse(input);
    } catch (err) {
      console.error("Proveedor de IA principal falló en analyzeVerse, usando respaldo Groq:", err);
      onFallback?.("Reintentando con IA de respaldo...");
      return this.fallback.analyzeVerse(input);
    }
  }

  async analyzeApocrypha(input: ApocryphaAnalysisInput, onFallback?: (message: string) => void): Promise<ApocryphaAnalysis> {
    try {
      return await this.primary.analyzeApocrypha(input);
    } catch (err) {
      console.error("Proveedor de IA principal falló en analyzeApocrypha, usando respaldo Groq:", err);
      onFallback?.("Reintentando con IA de respaldo...");
      return this.fallback.analyzeApocrypha(input);
    }
  }
}

let provider: AIProvider | undefined;

/** Crea el proveedor de IA de forma perezosa, para que el servidor arranque sin API key configurada. */
export function getAIProvider(): AIProvider {
  if (!provider) {
    const primary = createPrimaryProvider();
    const fallback = createGroqProvider();
    provider = fallback ? new FallbackProvider(primary, fallback) : primary;
  }
  return provider;
}
