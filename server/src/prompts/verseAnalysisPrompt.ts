import type Anthropic from "@anthropic-ai/sdk";
import type { VerseAnalysisInput } from "../ai/types.js";

export const VERSE_ANALYSIS_SYSTEM_PROMPT = `Eres un teólogo y erudito bíblico que produce análisis de estudio para un
lector de habla hispana. Trabajas siempre a partir del texto que se te da, apoyado en tu conocimiento del
contexto histórico, literario y teológico de la Biblia.

Reglas importantes:
- Todo el contenido debe estar en español.
- Las referencias cruzadas deben ser reales y precisas (Libro Capítulo:Versículo). No inventes citas.
- Usa los nombres de libro en español tal como aparecen en una Biblia en español (ej. Génesis, Mateo, Apocalipsis).
- Sé expositivo y concreto: explica el significado del texto verso a verso cuando aplique, no solo en términos generales.
- Conecta el pasaje con el resto de la Biblia mediante las referencias cruzadas, explicando brevemente por qué se relaciona cada una.
- Cuando se te provea un comentario de referencia y/o una lista de referencias cruzadas verificadas, básate en ellos — son de fuentes reales, no los ignores ni los contradigas sin motivo.

Responde exclusivamente con el análisis estructurado solicitado, sin texto adicional fuera de esa estructura.`;

/** JSON Schema plano, reutilizado tanto por la tool de Anthropic como por el response_format de Gemini. */
export const VERSE_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    contexto: {
      type: "string",
      description:
        "Contexto histórico y literario del pasaje: quién escribe, a quién, cuándo, por qué, y su lugar dentro del libro/sección.",
    },
    exposicion: {
      type: "string",
      description: "Explicación expositiva del significado del versículo, frase por frase si es necesario.",
    },
    teologia: {
      type: "string",
      description: "Significado y aplicación teológica del pasaje: qué enseña sobre Dios, el evangelio, o la vida cristiana.",
    },
    referenciasCruzadas: {
      type: "array",
      description: "Pasajes relacionados que iluminan el significado de este versículo.",
      items: {
        type: "object",
        properties: {
          referencia: { type: "string", description: "Ej: Juan 1:1" },
          nota: { type: "string", description: "Por qué este pasaje se relaciona con el versículo analizado." },
        },
        required: ["referencia", "nota"],
      },
    },
  },
  required: ["contexto", "exposicion", "teologia", "referenciasCruzadas"],
} as const;

export const VERSE_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "submit_verse_analysis",
  description: "Entrega el análisis estructurado de estudio bíblico para un versículo específico.",
  input_schema: VERSE_ANALYSIS_JSON_SCHEMA as unknown as Anthropic.Tool["input_schema"],
};

const COMMENTARY_MAX_CHARS = 2500;

export function buildVerseAnalysisUserMessage(input: VerseAnalysisInput): string {
  const context = input.contextVerses
    .map((v) => `${v.verse}. ${v.text}`)
    .join("\n");

  let grounding = "";

  if (input.commentary) {
    const excerpt =
      input.commentary.length > COMMENTARY_MAX_CHARS
        ? `${input.commentary.slice(0, COMMENTARY_MAX_CHARS)}...`
        : input.commentary;
    grounding += `\n\nComentario de referencia (Matthew Henry, dominio público) sobre este pasaje:\n"""\n${excerpt}\n"""`;
  }

  if (input.verifiedCrossReferences && input.verifiedCrossReferences.length > 0) {
    const list = input.verifiedCrossReferences.map((r) => `- ${r.referencia} (voto de relevancia: ${r.votos})`).join("\n");
    grounding += `\n\nReferencias cruzadas verificadas para este versículo (dataset basado en Treasury of Scripture Knowledge, ordenadas por relevancia). Prioriza estas para "referenciasCruzadas" — elige las más pertinentes y escribe tú la nota explicando la conexión. Como máximo, podés agregar 1 referencia propia si es claramente relevante y no está en esta lista:\n${list}`;
  }

  return `Versión: ${input.versionName}
Pasaje: ${input.book} ${input.chapter}:${input.verse}

Versículo a analizar:
"${input.verseText}"

Contexto del capítulo (versículos circundantes):
${context}${grounding}

Analiza el versículo ${input.chapter}:${input.verse} de ${input.book} usando la herramienta submit_verse_analysis.`;
}
