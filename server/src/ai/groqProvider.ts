import { CHAT_SYSTEM_PROMPT } from "../prompts/chatSystemPrompt.js";
import {
  VERSE_ANALYSIS_JSON_SCHEMA,
  VERSE_ANALYSIS_SYSTEM_PROMPT,
  buildVerseAnalysisUserMessage,
} from "../prompts/verseAnalysisPrompt.js";
import type { AIProvider, ChatMessage, VerseAnalysis, VerseAnalysisInput } from "./types.js";

const MODEL = "openai/gpt-oss-120b";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Proveedor de respaldo (API compatible con OpenAI). Se usa cuando el proveedor principal falla. */
export class GroqProvider implements AIProvider {
  constructor(private apiKey: string) {}

  private async request(body: Record<string, unknown>): Promise<Response> {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: MODEL, ...body }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Groq devolvió un error (${res.status}): ${text.slice(0, 300)}`);
    }
    return res;
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    const res = await this.request({
      messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...messages],
      stream: true,
    });

    const reader = res.body?.getReader();
    if (!reader) throw new Error("Groq no devolvió un stream de respuesta.");

    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice("data:".length).trim();
        if (data === "[DONE]") return;
        const parsed = JSON.parse(data) as { choices?: [{ delta?: { content?: string } }] };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      }
    }
  }

  async analyzeVerse(input: VerseAnalysisInput): Promise<VerseAnalysis> {
    const res = await this.request({
      messages: [
        { role: "system", content: VERSE_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: buildVerseAnalysisUserMessage(input) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "verse_analysis", schema: VERSE_ANALYSIS_JSON_SCHEMA },
      },
    });

    const data = (await res.json()) as { choices?: [{ message?: { content?: string } }] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("La IA no devolvió un análisis estructurado del versículo.");
    }
    return JSON.parse(content) as VerseAnalysis;
  }
}

/** A diferencia de los proveedores principales, no lanza si falta la key: el respaldo es opcional. */
export function createGroqProvider(): AIProvider | undefined {
  const apiKey = process.env.GROQ_API_KEY;
  return apiKey ? new GroqProvider(apiKey) : undefined;
}
