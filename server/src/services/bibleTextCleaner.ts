/**
 * Algunas versiones del CDN (notablemente es-rv09) traen las referencias cruzadas
 * incrustadas dentro del texto del versículo sin separación clara, ej:
 *   "EN el 1.1 Sal. 136.5. Jn. 1.1-3. Col. 1.16,17. He. 1.10 y 11.3.principio crió..."
 * en vez de:
 *   "EN el principio crió..."
 *
 * Este limpiador es heurístico (basado en el patrón observado: número.número de
 * autorreferencia seguido de una o más citas "Abrev. núm.núm[-,núm][ y núm.núm]."),
 * no un parser real. Puede dejar artefactos en casos poco comunes; por eso el
 * selector de versión existe como alternativa de lectura limpia (ej. es-vbl).
 */

const CITATION_UNIT =
  String.raw`(?:[1-3]\s?)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*\.\s*\d+\.\d+(?:[-,]\s?\d+)*(?:\s+y\s+\d+\.\d+(?:[-,]\s?\d+)*)?\.\s*`;

const CITATION_CLUSTER = new RegExp(String.raw`\d+\.\d+\s+(?:${CITATION_UNIT})+`, "g");

/** IDs de versión (tal como aparecen en bibles.json) con este problema de datos conocido. */
export const VERSIONS_WITH_INLINE_REFS = new Set(["es-rv09"]);

export function cleanVerseText(versionId: string, rawText: string): string {
  if (!VERSIONS_WITH_INLINE_REFS.has(versionId)) return rawText;

  return rawText
    .replace(CITATION_CLUSTER, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
