import Anthropic from "@anthropic-ai/sdk";
import {
  APOCRYPHA_ANALYSIS_SYSTEM_PROMPT,
  APOCRYPHA_ANALYSIS_TOOL,
  buildApocryphaAnalysisUserMessage,
} from "../prompts/apocryphaAnalysisPrompt.js";
import { CHAT_SYSTEM_PROMPT } from "../prompts/chatSystemPrompt.js";
import {
  VERSE_ANALYSIS_SYSTEM_PROMPT,
  VERSE_ANALYSIS_TOOL,
  buildVerseAnalysisUserMessage,
} from "../prompts/verseAnalysisPrompt.js";
import { AIConfigError } from "./types.js";
import type {
  AIProvider,
  ApocryphaAnalysis,
  ApocryphaAnalysisInput,
  ChatMessage,
  VerseAnalysis,
  VerseAnalysisInput,
} from "./types.js";

const MODEL = "claude-opus-5";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    const stream = this.client.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      system: CHAT_SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }

  async analyzeVerse(input: VerseAnalysisInput): Promise<VerseAnalysis> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: VERSE_ANALYSIS_SYSTEM_PROMPT,
      tools: [VERSE_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: VERSE_ANALYSIS_TOOL.name },
      messages: [{ role: "user", content: buildVerseAnalysisUserMessage(input) }],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
      throw new Error("La IA no devolvió un análisis estructurado del versículo.");
    }

    return toolUse.input as VerseAnalysis;
  }

  async analyzeApocrypha(input: ApocryphaAnalysisInput): Promise<ApocryphaAnalysis> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: APOCRYPHA_ANALYSIS_SYSTEM_PROMPT,
      tools: [APOCRYPHA_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: APOCRYPHA_ANALYSIS_TOOL.name },
      messages: [{ role: "user", content: buildApocryphaAnalysisUserMessage(input) }],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
      throw new Error("La IA no devolvió un análisis estructurado del capítulo.");
    }

    return toolUse.input as ApocryphaAnalysis;
  }
}

export function createAnthropicProvider(): AIProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AIConfigError(
      "Falta configurar ANTHROPIC_API_KEY en server/.env para habilitar el asistente de IA."
    );
  }
  return new AnthropicProvider(apiKey);
}
