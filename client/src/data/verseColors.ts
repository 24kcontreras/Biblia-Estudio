export interface VerseColorOption {
  key: string;
  label: string;
  /** Clase de fondo para pintar el versículo resaltado en el lector y en las listas. */
  bgClass: string;
  /** Color plano usado como swatch en el selector. */
  swatchClass: string;
}

export const VERSE_COLORS: VerseColorOption[] = [
  { key: "amarillo", label: "Amarillo", bgClass: "bg-yellow-200", swatchClass: "bg-yellow-300" },
  { key: "verde", label: "Verde", bgClass: "bg-green-200", swatchClass: "bg-green-300" },
  { key: "azul", label: "Azul", bgClass: "bg-blue-200", swatchClass: "bg-blue-300" },
  { key: "rosa", label: "Rosa", bgClass: "bg-pink-200", swatchClass: "bg-pink-300" },
  { key: "morado", label: "Morado", bgClass: "bg-purple-200", swatchClass: "bg-purple-300" },
];

const BY_KEY = new Map(VERSE_COLORS.map((c) => [c.key, c]));

export function getVerseColor(key: string | null | undefined): VerseColorOption | undefined {
  return key ? BY_KEY.get(key) : undefined;
}
