export interface BibleBookMeta {
  slug: string;
  name: string;
  testament: "AT" | "NT" | "DEU";
  chapterCount: number;
}

// Debe reflejar exactamente server/src/services/bibleBooks.ts
export const BIBLE_BOOKS: BibleBookMeta[] = [
  { slug: "génesis", name: "Génesis", testament: "AT", chapterCount: 50 },
  { slug: "éxodo", name: "Éxodo", testament: "AT", chapterCount: 40 },
  { slug: "levítico", name: "Levítico", testament: "AT", chapterCount: 27 },
  { slug: "números", name: "Números", testament: "AT", chapterCount: 36 },
  { slug: "deuteronomio", name: "Deuteronomio", testament: "AT", chapterCount: 34 },
  { slug: "josué", name: "Josué", testament: "AT", chapterCount: 24 },
  { slug: "jueces", name: "Jueces", testament: "AT", chapterCount: 21 },
  { slug: "rut", name: "Rut", testament: "AT", chapterCount: 4 },
  { slug: "1samuel", name: "1 Samuel", testament: "AT", chapterCount: 31 },
  { slug: "2samuel", name: "2 Samuel", testament: "AT", chapterCount: 24 },
  { slug: "1reyes", name: "1 Reyes", testament: "AT", chapterCount: 22 },
  { slug: "2reyes", name: "2 Reyes", testament: "AT", chapterCount: 25 },
  { slug: "1crónicas", name: "1 Crónicas", testament: "AT", chapterCount: 29 },
  { slug: "2crónicas", name: "2 Crónicas", testament: "AT", chapterCount: 36 },
  { slug: "esdras", name: "Esdras", testament: "AT", chapterCount: 10 },
  { slug: "nehemías", name: "Nehemías", testament: "AT", chapterCount: 13 },
  { slug: "ester", name: "Ester", testament: "AT", chapterCount: 10 },
  { slug: "job", name: "Job", testament: "AT", chapterCount: 42 },
  { slug: "salmos", name: "Salmos", testament: "AT", chapterCount: 150 },
  { slug: "proverbios", name: "Proverbios", testament: "AT", chapterCount: 31 },
  { slug: "eclesiastés", name: "Eclesiastés", testament: "AT", chapterCount: 12 },
  { slug: "cantares", name: "Cantares", testament: "AT", chapterCount: 8 },
  { slug: "isaías", name: "Isaías", testament: "AT", chapterCount: 66 },
  { slug: "jeremías", name: "Jeremías", testament: "AT", chapterCount: 52 },
  { slug: "lamentaciones", name: "Lamentaciones", testament: "AT", chapterCount: 5 },
  { slug: "ezequiel", name: "Ezequiel", testament: "AT", chapterCount: 48 },
  { slug: "daniel", name: "Daniel", testament: "AT", chapterCount: 12 },
  { slug: "oseas", name: "Oseas", testament: "AT", chapterCount: 14 },
  { slug: "joel", name: "Joel", testament: "AT", chapterCount: 3 },
  { slug: "amós", name: "Amós", testament: "AT", chapterCount: 9 },
  { slug: "abdías", name: "Abdías", testament: "AT", chapterCount: 1 },
  { slug: "jonás", name: "Jonás", testament: "AT", chapterCount: 4 },
  { slug: "miqueas", name: "Miqueas", testament: "AT", chapterCount: 7 },
  { slug: "nahúm", name: "Nahúm", testament: "AT", chapterCount: 3 },
  { slug: "habacuc", name: "Habacuc", testament: "AT", chapterCount: 3 },
  { slug: "sofonías", name: "Sofonías", testament: "AT", chapterCount: 3 },
  { slug: "hageo", name: "Hageo", testament: "AT", chapterCount: 2 },
  { slug: "zacarías", name: "Zacarías", testament: "AT", chapterCount: 14 },
  { slug: "malaquías", name: "Malaquías", testament: "AT", chapterCount: 4 },

  { slug: "sanmateo", name: "Mateo", testament: "NT", chapterCount: 28 },
  { slug: "sanmarcos", name: "Marcos", testament: "NT", chapterCount: 16 },
  { slug: "sanlucas", name: "Lucas", testament: "NT", chapterCount: 24 },
  { slug: "sanjuan", name: "Juan", testament: "NT", chapterCount: 21 },
  { slug: "hechos", name: "Hechos", testament: "NT", chapterCount: 28 },
  { slug: "romanos", name: "Romanos", testament: "NT", chapterCount: 16 },
  { slug: "1corintios", name: "1 Corintios", testament: "NT", chapterCount: 16 },
  { slug: "2corintios", name: "2 Corintios", testament: "NT", chapterCount: 13 },
  { slug: "gálatas", name: "Gálatas", testament: "NT", chapterCount: 6 },
  { slug: "efesios", name: "Efesios", testament: "NT", chapterCount: 6 },
  { slug: "filipenses", name: "Filipenses", testament: "NT", chapterCount: 4 },
  { slug: "colosenses", name: "Colosenses", testament: "NT", chapterCount: 4 },
  { slug: "1tesalonicenses", name: "1 Tesalonicenses", testament: "NT", chapterCount: 5 },
  { slug: "2tesalonicenses", name: "2 Tesalonicenses", testament: "NT", chapterCount: 3 },
  { slug: "1timoteo", name: "1 Timoteo", testament: "NT", chapterCount: 6 },
  { slug: "2timoteo", name: "2 Timoteo", testament: "NT", chapterCount: 4 },
  { slug: "tito", name: "Tito", testament: "NT", chapterCount: 3 },
  { slug: "filemón", name: "Filemón", testament: "NT", chapterCount: 1 },
  { slug: "hebreos", name: "Hebreos", testament: "NT", chapterCount: 13 },
  { slug: "santiago", name: "Santiago", testament: "NT", chapterCount: 5 },
  { slug: "1pedro", name: "1 Pedro", testament: "NT", chapterCount: 5 },
  { slug: "2pedro", name: "2 Pedro", testament: "NT", chapterCount: 3 },
  { slug: "1juan", name: "1 Juan", testament: "NT", chapterCount: 5 },
  { slug: "2juan", name: "2 Juan", testament: "NT", chapterCount: 1 },
  { slug: "3juan", name: "3 Juan", testament: "NT", chapterCount: 1 },
  { slug: "judas", name: "Judas", testament: "NT", chapterCount: 1 },
  { slug: "apocalipsis", name: "Apocalipsis", testament: "NT", chapterCount: 22 },

  // Deuterocanónicos/apócrifos — solo disponibles en la versión spa_blm (ver server/src/services/bibleBookCodes.ts).
  { slug: "tobit", name: "Tobit", testament: "DEU", chapterCount: 14 },
  { slug: "judit", name: "Judit", testament: "DEU", chapterCount: 16 },
  { slug: "sabiduría", name: "Sabiduría", testament: "DEU", chapterCount: 19 },
  { slug: "sirácide", name: "Sirácide", testament: "DEU", chapterCount: 51 },
  { slug: "baruc", name: "Baruc", testament: "DEU", chapterCount: 6 },
  { slug: "1macabeos", name: "1 Macabeos", testament: "DEU", chapterCount: 16 },
  { slug: "2macabeos", name: "2 Macabeos", testament: "DEU", chapterCount: 15 },
  { slug: "3macabeos", name: "3 Macabeos", testament: "DEU", chapterCount: 7 },
  { slug: "4macabeos", name: "4 Macabeos", testament: "DEU", chapterCount: 18 },
  { slug: "estergriega", name: "Ester griega", testament: "DEU", chapterCount: 10 },
  { slug: "danielgriego", name: "Daniel griego", testament: "DEU", chapterCount: 14 },
  { slug: "1esdras", name: "1 Esdras", testament: "DEU", chapterCount: 9 },
  { slug: "2esdras", name: "2 Esdras", testament: "DEU", chapterCount: 16 },
  { slug: "manasés", name: "Manasés", testament: "DEU", chapterCount: 1 },
  { slug: "salmo151", name: "Salmo 151", testament: "DEU", chapterCount: 1 },
];

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const BY_NORMALIZED_NAME = new Map(BIBLE_BOOKS.map((b) => [normalize(b.name), b]));
const BY_SLUG = new Map(BIBLE_BOOKS.map((b) => [b.slug, b]));

export function findBookByName(name: string): BibleBookMeta | undefined {
  return BY_NORMALIZED_NAME.get(normalize(name));
}

export function findBookBySlug(slug: string): BibleBookMeta | undefined {
  return BY_SLUG.get(slug);
}
