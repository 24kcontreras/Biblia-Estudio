import { createAnthropicProvider } from "./anthropicProvider.js";
import { createGeminiProvider } from "./geminiProvider.js";
import type { AIProvider } from "./types.js";

export { AIConfigError } from "./types.js";
export type { ChatMessage, VerseAnalysis, VerseAnalysisInput, CrossReference, AIProvider } from "./types.js";

let provider: AIProvider | undefined;

/** Crea el proveedor de IA de forma perezosa, para que el servidor arranque sin API key configurada. */
export function getAIProvider(): AIProvider {
  if (!provider) {
    const providerName = process.env.AI_PROVIDER ?? "anthropic";
    if (providerName === "anthropic") {
      provider = createAnthropicProvider();
    } else if (providerName === "gemini") {
      provider = createGeminiProvider();
    } else {
      throw new Error(`Proveedor de IA no soportado: ${providerName}`);
    }
  }
  return provider;
}
