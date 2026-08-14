import type Anthropic from "@anthropic-ai/sdk";
import type { ApocryphaAnalysisInput } from "../ai/types.js";

export const APOCRYPHA_ANALYSIS_SYSTEM_PROMPT = `Eres un historiador y erudito en literatura judía y cristiana antigua (pseudoepígrafos,
apócrifos, padres apostólicos) que produce análisis para un lector de habla hispana. El texto que
se te da NO es canon de la Biblia en ninguna tradición cristiana mayoritaria (con la excepción
puntual del Libro de Enoc en la iglesia ortodoxa etíope) — es literatura extracanónica de trasfondo
histórico. Tu análisis es histórico-literario, NUNCA una exposición doctrinal como si fuera
Escritura inspirada. Cubre estos cinco puntos:

1. Contexto histórico: quién probablemente lo escribió (o a quién se atribuye), cuándo, para qué
   comunidad y con qué propósito, y el entorno religioso/político en el que surgió.
2. Análisis literario: género (apocalíptico, epistolar, visiones, parábolas, etc.), recursos
   retóricos, y cómo encaja este capítulo en la estructura de la obra completa.
3. Resumen del contenido: qué dice o narra este capítulo en concreto, en lenguaje claro — muchos
   lectores no conocen el texto y necesitan entender de qué trata antes de cualquier otra cosa.
4. Significado histórico-teológico: qué revela sobre las creencias, expectativas o debates
   teológicos de la comunidad que lo escribió o lo leyó (angelología, escatología, ética, etc.).
   Preséntalo como dato histórico sobre lo que esa gente creía, no como verdad doctrinal para el
   lector de hoy.
5. Estado canónico y conexión bíblica: por qué este texto no forma parte del canon (criterios como
   autoría, uso litúrgico temprano, aceptación por las iglesias), qué tradición (si alguna) lo
   considera canónico o cercano al canon, y si hay citas directas o alusiones claras en libros
   bíblicos canónicos (ej. Judas cita a Enoc) — sé preciso y no exageres conexiones débiles.

Reglas importantes:
- Todo el contenido debe estar en español.
- Deja siempre claro, de forma explícita en el texto, que esto no es Escritura canónica ni tiene
  autoridad doctrinal — es una fuente histórica de trasfondo.
- Las conexiones bíblicas que menciones deben ser reales y verificables (Libro Capítulo:Versículo).
  No inventes citas ni fuerces paralelos que no existen; si no hay conexiones bíblicas claras para
  este capítulo específico, es preferible dejar la lista vacía a inventar una.
- Sé concreto y basado en erudición real (ej. R.H. Charles para Enoc, J.B. Lightfoot para Bernabé y
  Hermas, y la erudición patrística/moderna en general), no generalidades vagas.

Responde exclusivamente con el análisis estructurado solicitado, sin texto adicional fuera de esa estructura.`;

export const APOCRYPHA_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    contexto: {
      type: "string",
      description: "Autoría (real o atribuida), fecha aproximada, comunidad destinataria, propósito, y entorno histórico-religioso.",
    },
    analisisLiterario: {
      type: "string",
      description: "Género literario, recursos retóricos, y cómo encaja este capítulo en la estructura de la obra completa.",
    },
    resumen: {
      type: "string",
      description: "Resumen claro en lenguaje llano de qué dice o narra este capítulo en concreto.",
    },
    conexionesBiblicas: {
      type: "array",
      description: "Citas directas o alusiones claras en libros bíblicos canónicos. Vacío si no hay ninguna real para este capítulo.",
      items: {
        type: "object",
        properties: {
          referencia: { type: "string", description: "Ej: Judas 1:14-15" },
          nota: { type: "string", description: "Naturaleza de la conexión (cita directa, alusión, paralelo temático) y por qué." },
        },
        required: ["referencia", "nota"],
      },
    },
    significadoHistorico: {
      type: "string",
      description:
        "Qué revela este capítulo sobre las creencias, expectativas o debates teológicos de la comunidad que lo escribió/leyó, presentado como dato histórico, no como doctrina para el lector de hoy.",
    },
    estadoCanonico: {
      type: "string",
      description:
        "Por qué este texto no es canon, qué tradición (si alguna) lo acepta o lo consideró cercano al canon, y cómo debe leerlo el usuario (como trasfondo histórico, no como Escritura).",
    },
  },
  required: ["contexto", "analisisLiterario", "resumen", "conexionesBiblicas", "significadoHistorico", "estadoCanonico"],
} as const;

export const APOCRYPHA_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "submit_apocrypha_analysis",
  description: "Entrega el análisis histórico-literario estructurado de un capítulo de un texto apócrifo/pseudoepígrafo no canónico.",
  input_schema: APOCRYPHA_ANALYSIS_JSON_SCHEMA as unknown as Anthropic.Tool["input_schema"],
};

export function buildApocryphaAnalysisUserMessage(input: ApocryphaAnalysisInput): string {
  return `Obra: ${input.workName} (${input.workDescription})
Capítulo ${input.chapterNumber} de ${input.totalChapters}: "${input.chapterTitle}"

Texto a analizar:
"""
${input.content}
"""

Analiza este capítulo usando la herramienta submit_apocrypha_analysis.`;
}
