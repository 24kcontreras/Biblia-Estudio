export interface BibleBook {
  /** Slug usado en las URLs del CDN (bibles/{version}/books/{slug}/...) */
  slug: string;
  /** Nombre para mostrar en español */
  name: string;
  testament: "AT" | "NT";
  /** Orden canónico 1-66 */
  order: number;
  chapterCount: number;
}

// Slugs verificados contra el listado real del repo wldeh/bible-api (bibles/es-rv09/books).
export const BIBLE_BOOKS: BibleBook[] = [
  { slug: "génesis", name: "Génesis", testament: "AT", order: 1, chapterCount: 50 },
  { slug: "éxodo", name: "Éxodo", testament: "AT", order: 2, chapterCount: 40 },
  { slug: "levítico", name: "Levítico", testament: "AT", order: 3, chapterCount: 27 },
  { slug: "números", name: "Números", testament: "AT", order: 4, chapterCount: 36 },
  { slug: "deuteronomio", name: "Deuteronomio", testament: "AT", order: 5, chapterCount: 34 },
  { slug: "josué", name: "Josué", testament: "AT", order: 6, chapterCount: 24 },
  { slug: "jueces", name: "Jueces", testament: "AT", order: 7, chapterCount: 21 },
  { slug: "rut", name: "Rut", testament: "AT", order: 8, chapterCount: 4 },
  { slug: "1samuel", name: "1 Samuel", testament: "AT", order: 9, chapterCount: 31 },
  { slug: "2samuel", name: "2 Samuel", testament: "AT", order: 10, chapterCount: 24 },
  { slug: "1reyes", name: "1 Reyes", testament: "AT", order: 11, chapterCount: 22 },
  { slug: "2reyes", name: "2 Reyes", testament: "AT", order: 12, chapterCount: 25 },
  { slug: "1crónicas", name: "1 Crónicas", testament: "AT", order: 13, chapterCount: 29 },
  { slug: "2crónicas", name: "2 Crónicas", testament: "AT", order: 14, chapterCount: 36 },
  { slug: "esdras", name: "Esdras", testament: "AT", order: 15, chapterCount: 10 },
  { slug: "nehemías", name: "Nehemías", testament: "AT", order: 16, chapterCount: 13 },
  { slug: "ester", name: "Ester", testament: "AT", order: 17, chapterCount: 10 },
  { slug: "job", name: "Job", testament: "AT", order: 18, chapterCount: 42 },
  { slug: "salmos", name: "Salmos", testament: "AT", order: 19, chapterCount: 150 },
  { slug: "proverbios", name: "Proverbios", testament: "AT", order: 20, chapterCount: 31 },
  { slug: "eclesiastés", name: "Eclesiastés", testament: "AT", order: 21, chapterCount: 12 },
  { slug: "cantares", name: "Cantares", testament: "AT", order: 22, chapterCount: 8 },
  { slug: "isaías", name: "Isaías", testament: "AT", order: 23, chapterCount: 66 },
  { slug: "jeremías", name: "Jeremías", testament: "AT", order: 24, chapterCount: 52 },
  { slug: "lamentaciones", name: "Lamentaciones", testament: "AT", order: 25, chapterCount: 5 },
  { slug: "ezequiel", name: "Ezequiel", testament: "AT", order: 26, chapterCount: 48 },
  { slug: "daniel", name: "Daniel", testament: "AT", order: 27, chapterCount: 12 },
  { slug: "oseas", name: "Oseas", testament: "AT", order: 28, chapterCount: 14 },
  { slug: "joel", name: "Joel", testament: "AT", order: 29, chapterCount: 3 },
  { slug: "amós", name: "Amós", testament: "AT", order: 30, chapterCount: 9 },
  { slug: "abdías", name: "Abdías", testament: "AT", order: 31, chapterCount: 1 },
  { slug: "jonás", name: "Jonás", testament: "AT", order: 32, chapterCount: 4 },
  { slug: "miqueas", name: "Miqueas", testament: "AT", order: 33, chapterCount: 7 },
  { slug: "nahúm", name: "Nahúm", testament: "AT", order: 34, chapterCount: 3 },
  { slug: "habacuc", name: "Habacuc", testament: "AT", order: 35, chapterCount: 3 },
  { slug: "sofonías", name: "Sofonías", testament: "AT", order: 36, chapterCount: 3 },
  { slug: "hageo", name: "Hageo", testament: "AT", order: 37, chapterCount: 2 },
  { slug: "zacarías", name: "Zacarías", testament: "AT", order: 38, chapterCount: 14 },
  { slug: "malaquías", name: "Malaquías", testament: "AT", order: 39, chapterCount: 4 },

  { slug: "sanmateo", name: "Mateo", testament: "NT", order: 40, chapterCount: 28 },
  { slug: "sanmarcos", name: "Marcos", testament: "NT", order: 41, chapterCount: 16 },
  { slug: "sanlucas", name: "Lucas", testament: "NT", order: 42, chapterCount: 24 },
  { slug: "sanjuan", name: "Juan", testament: "NT", order: 43, chapterCount: 21 },
  { slug: "hechos", name: "Hechos", testament: "NT", order: 44, chapterCount: 28 },
  { slug: "romanos", name: "Romanos", testament: "NT", order: 45, chapterCount: 16 },
  { slug: "1corintios", name: "1 Corintios", testament: "NT", order: 46, chapterCount: 16 },
  { slug: "2corintios", name: "2 Corintios", testament: "NT", order: 47, chapterCount: 13 },
  { slug: "gálatas", name: "Gálatas", testament: "NT", order: 48, chapterCount: 6 },
  { slug: "efesios", name: "Efesios", testament: "NT", order: 49, chapterCount: 6 },
  { slug: "filipenses", name: "Filipenses", testament: "NT", order: 50, chapterCount: 4 },
  { slug: "colosenses", name: "Colosenses", testament: "NT", order: 51, chapterCount: 4 },
  { slug: "1tesalonicenses", name: "1 Tesalonicenses", testament: "NT", order: 52, chapterCount: 5 },
  { slug: "2tesalonicenses", name: "2 Tesalonicenses", testament: "NT", order: 53, chapterCount: 3 },
  { slug: "1timoteo", name: "1 Timoteo", testament: "NT", order: 54, chapterCount: 6 },
  { slug: "2timoteo", name: "2 Timoteo", testament: "NT", order: 55, chapterCount: 4 },
  { slug: "tito", name: "Tito", testament: "NT", order: 56, chapterCount: 3 },
  { slug: "filemón", name: "Filemón", testament: "NT", order: 57, chapterCount: 1 },
  { slug: "hebreos", name: "Hebreos", testament: "NT", order: 58, chapterCount: 13 },
  { slug: "santiago", name: "Santiago", testament: "NT", order: 59, chapterCount: 5 },
  { slug: "1pedro", name: "1 Pedro", testament: "NT", order: 60, chapterCount: 5 },
  { slug: "2pedro", name: "2 Pedro", testament: "NT", order: 61, chapterCount: 3 },
  { slug: "1juan", name: "1 Juan", testament: "NT", order: 62, chapterCount: 5 },
  { slug: "2juan", name: "2 Juan", testament: "NT", order: 63, chapterCount: 1 },
  { slug: "3juan", name: "3 Juan", testament: "NT", order: 64, chapterCount: 1 },
  { slug: "judas", name: "Judas", testament: "NT", order: 65, chapterCount: 1 },
  { slug: "apocalipsis", name: "Apocalipsis", testament: "NT", order: 66, chapterCount: 22 },
];

const BY_SLUG = new Map(BIBLE_BOOKS.map((b) => [b.slug, b]));

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const BY_NORMALIZED_SLUG = new Map(BIBLE_BOOKS.map((b) => [normalize(b.slug), b]));
const BY_NORMALIZED_NAME = new Map(BIBLE_BOOKS.map((b) => [normalize(b.name), b]));

/** Busca un libro por su slug exacto, o cae a una búsqueda sin tildes por slug/nombre. */
export function findBook(slugOrName: string): BibleBook | undefined {
  return (
    BY_SLUG.get(slugOrName) ??
    BY_NORMALIZED_SLUG.get(normalize(slugOrName)) ??
    BY_NORMALIZED_NAME.get(normalize(slugOrName))
  );
}
