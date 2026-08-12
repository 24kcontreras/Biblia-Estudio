import { GoogleGenAI } from "@google/genai";
import { CHAT_SYSTEM_PROMPT } from "../prompts/chatSystemPrompt.js";
import {
  VERSE_ANALYSIS_JSON_SCHEMA,
  VERSE_ANALYSIS_SYSTEM_PROMPT,
  buildVerseAnalysisUserMessage,
} from "../prompts/verseAnalysisPrompt.js";
import { AIConfigError } from "./types.js";
import type { AIProvider, ChatMessage, VerseAnalysis, VerseAnalysisInput } from "./types.js";

const MODEL = "gemini-3.6-flash";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    // La API de Gemini maneja el historial vía interaction chaining o arrays de "steps" sin
    // forma pública confirmada para turnos de modelo de texto plano; para no depender de un
    // shape no documentado, serializamos el historial como transcripción en el input.
    const transcript = messages
      .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
      .join("\n\n");

    const stream = await this.client.interactions.create({
      model: MODEL,
      system_instruction: CHAT_SYSTEM_PROMPT,
      input: transcript,
      stream: true,
    });

    for await (const event of stream) {
      if (event.event_type === "step.delta" && event.delta?.type === "text") {
        yield event.delta.text;
      } else if (event.event_type === "error") {
        throw new Error(event.error?.message ?? "La IA devolvió un error durante el streaming.");
      }
    }
  }

  async analyzeVerse(input: VerseAnalysisInput): Promise<VerseAnalysis> {
    const interaction = await this.client.interactions.create({
      model: MODEL,
      system_instruction: VERSE_ANALYSIS_SYSTEM_PROMPT,
      input: buildVerseAnalysisUserMessage(input),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: VERSE_ANALYSIS_JSON_SCHEMA,
      },
    });

    if (!interaction.output_text) {
      throw new Error("La IA no devolvió un análisis estructurado del versículo.");
    }

    return JSON.parse(interaction.output_text) as VerseAnalysis;
  }
}

export function createGeminiProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIConfigError(
      "Falta configurar GEMINI_API_KEY en server/.env para habilitar el asistente de IA."
    );
  }
  return new GeminiProvider(apiKey);
}
