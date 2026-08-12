import type Anthropic from "@anthropic-ai/sdk";
import type { VerseAnalysisInput } from "../ai/types.js";

export const VERSE_ANALYSIS_SYSTEM_PROMPT = `Eres un teólogo y erudito bíblico que produce análisis de estudio para un
lector de habla hispana. Trabajas siempre a partir del texto que se te da, apoyado en tu conocimiento del
contexto histórico, literario y teológico de la Biblia. Tu método sigue estos siete pasos de la exégesis
bíblica clásica, y tu respuesta debe cubrir cada uno de ellos:

1. Contexto histórico y cultural: autoría, audiencia, propósito, época, geografía, y el entorno sociocultural
   (costumbres, leyes, conflictos políticos, sistema económico) en el que se escribió.
2. Análisis literario: género literario (narrativa, poesía, profecía, epístola, ley, proverbio, apocalíptica),
   cómo encaja en la estructura del libro, y los recursos retóricos que usa el autor (metáforas, paralelismos,
   hipérboles, repeticiones).
3. Análisis lingüístico: 2 a 4 palabras clave en el idioma original (hebreo, arameo o griego) cuyo significado
   sea especialmente relevante para interpretar el pasaje, con su transliteración y por qué importan. No hace
   falta un desglose palabra por palabra completo — eso ya lo cubre otra herramienta de la aplicación — solo
   los términos más significativos para la interpretación.
4. Contexto canónico: cómo este pasaje encaja en el panorama general de la Biblia (Creación, Caída, Redención,
   Restauración), más allá de las referencias cruzadas puntuales.
5. Análisis teológico: qué revela sobre el carácter y las acciones de Dios (teología propia), y qué revela
   sobre la condición humana (antropología bíblica).
6. Historia de la interpretación: variantes textuales relevantes si las hay, y cómo se ha entendido este
   pasaje a través de la tradición cristiana (padres de la iglesia, reformadores, erudición moderna) — señala
   si hay lecturas divergentes entre tradiciones para evitar conclusiones extrañas.
7. Hermenéutica y aplicación: el principio universal y atemporal que se extrae del texto, y cómo debería
   cambiar la forma de pensar, actuar o relacionarse del lector hoy.

Reglas importantes:
- Todo el contenido debe estar en español.
- Las referencias cruzadas deben ser reales y precisas (Libro Capítulo:Versículo). No inventes citas.
- Usa los nombres de libro en español tal como aparecen en una Biblia en español (ej. Génesis, Mateo, Apocalipsis).
- Sé expositivo y concreto: explica el significado del texto verso a verso cuando aplique, no solo en términos generales.
- Conecta el pasaje con el resto de la Biblia mediante las referencias cruzadas, explicando brevemente por qué se relaciona cada una.
- Cuando se te provea un comentario de referencia y/o una lista de referencias cruzadas verificadas, básate en ellos — son de fuentes reales, no los ignores ni los contradigas sin motivo.
- Si el pasaje son varios versículos, trata la exposición y el análisis de forma unificada para el pasaje completo, no como notas sueltas verso por verso desconectadas entre sí.

Responde exclusivamente con el análisis estructurado solicitado, sin texto adicional fuera de esa estructura.`;

/** JSON Schema plano, reutilizado tanto por la tool de Anthropic como por el response_format de Gemini. */
export const VERSE_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    contexto: {
      type: "string",
      description:
        "Contexto histórico y cultural del pasaje: quién escribe, a quién, cuándo, por qué, geografía, entorno sociocultural, y su lugar dentro del libro/sección.",
    },
    analisisLiterario: {
      type: "string",
      description:
        "Género literario del pasaje, cómo encaja en la estructura del libro, y los recursos retóricos que usa el autor (metáforas, paralelismos, hipérboles, repeticiones).",
    },
    exposicion: {
      type: "string",
      description: "Explicación expositiva del significado del pasaje, frase por frase o verso por verso si es necesario.",
    },
    palabrasClave: {
      type: "string",
      description:
        "2 a 4 palabras clave en el idioma original (hebreo, arameo o griego) relevantes para la interpretación, con su transliteración y por qué importan.",
    },
    teologia: {
      type: "string",
      description:
        "Significado y aplicación teológica del pasaje: qué revela sobre el carácter y las acciones de Dios (teología propia), y qué revela sobre la condición humana (antropología bíblica).",
    },
    panoramaCanonico: {
      type: "string",
      description:
        "Cómo este pasaje encaja en el panorama general de la Biblia (Creación, Caída, Redención, Restauración) más allá de las referencias cruzadas puntuales.",
    },
    referenciasCruzadas: {
      type: "array",
      description: "Pasajes relacionados que iluminan el significado de este pasaje.",
      items: {
        type: "object",
        properties: {
          referencia: { type: "string", description: "Ej: Juan 1:1" },
          nota: { type: "string", description: "Por qué este pasaje se relaciona con el pasaje analizado." },
        },
        required: ["referencia", "nota"],
      },
    },
    historiaInterpretacion: {
      type: "string",
      description:
        "Variantes textuales relevantes si las hay, y cómo se ha entendido este pasaje a través de la tradición cristiana (padres de la iglesia, reformadores, erudición moderna). Si hay lecturas divergentes entre tradiciones, señalarlo.",
    },
    aplicacion: {
      type: "string",
      description:
        "El principio universal y atemporal que se extrae del texto (más allá de la situación cultural original), y cómo debería aplicarse en la vida del lector hoy.",
    },
  },
  required: [
    "contexto",
    "analisisLiterario",
    "exposicion",
    "palabrasClave",
    "teologia",
    "panoramaCanonico",
    "referenciasCruzadas",
    "historiaInterpretacion",
    "aplicacion",
  ],
} as const;

export const VERSE_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "submit_verse_analysis",
  description: "Entrega el análisis estructurado de estudio bíblico para un versículo o pasaje específico.",
  input_schema: VERSE_ANALYSIS_JSON_SCHEMA as unknown as Anthropic.Tool["input_schema"],
};

const COMMENTARY_MAX_CHARS = 2500;

export function buildVerseAnalysisUserMessage(input: VerseAnalysisInput): string {
  const context = input.contextVerses.map((v) => `${v.verse}. ${v.text}`).join("\n");
  const isRange = input.verseEnd > input.verse;
  const passageLabel = isRange
    ? `${input.book} ${input.chapter}:${input.verse}-${input.verseEnd}`
    : `${input.book} ${input.chapter}:${input.verse}`;

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
    grounding += `\n\nReferencias cruzadas verificadas para este pasaje (dataset basado en Treasury of Scripture Knowledge, ordenadas por relevancia). Prioriza estas para "referenciasCruzadas" — elige las más pertinentes y escribe tú la nota explicando la conexión. Como máximo, podés agregar 1-2 referencias propias si son claramente relevantes y no están en esta lista:\n${list}`;
  }

  return `Versión: ${input.versionName}
Pasaje: ${passageLabel}

Texto a analizar${isRange ? " (pasaje completo)" : ""}:
"${input.verseText}"

Contexto del capítulo (versículos circundantes):
${context}${grounding}

Analiza el pasaje ${passageLabel} usando la herramienta submit_verse_analysis.`;
}
