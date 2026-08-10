/**
 * Mapeo entre nuestro slug (BIBLE_BOOKS en bibleBooks.ts) y los códigos de libro que usan las
 * dos fuentes externas de anclaje:
 *  - usfm: código de 3 letras que usa la API de comentarios de HelloAO (bible.helloao.org)
 *  - openBible: abreviatura que usa el dataset de referencias cruzadas de openbible.info
 *
 * Verificado contra datos reales descargados (no adivinado): los 65 códigos USFM presentes en
 * matthew-henry/books.json (falta Cantares/SNG en ese comentario específico) y los 66 códigos
 * distintos extraídos de cross_references.txt.
 */
export interface BookCodes {
  slug: string;
  usfm: string;
  openBible: string;
}

export const BOOK_CODES: BookCodes[] = [
  { slug: "génesis", usfm: "GEN", openBible: "Gen" },
  { slug: "éxodo", usfm: "EXO", openBible: "Exod" },
  { slug: "levítico", usfm: "LEV", openBible: "Lev" },
  { slug: "números", usfm: "NUM", openBible: "Num" },
  { slug: "deuteronomio", usfm: "DEU", openBible: "Deut" },
  { slug: "josué", usfm: "JOS", openBible: "Josh" },
  { slug: "jueces", usfm: "JDG", openBible: "Judg" },
  { slug: "rut", usfm: "RUT", openBible: "Ruth" },
  { slug: "1samuel", usfm: "1SA", openBible: "1Sam" },
  { slug: "2samuel", usfm: "2SA", openBible: "2Sam" },
  { slug: "1reyes", usfm: "1KI", openBible: "1Kgs" },
  { slug: "2reyes", usfm: "2KI", openBible: "2Kgs" },
  { slug: "1crónicas", usfm: "1CH", openBible: "1Chr" },
  { slug: "2crónicas", usfm: "2CH", openBible: "2Chr" },
  { slug: "esdras", usfm: "EZR", openBible: "Ezra" },
  { slug: "nehemías", usfm: "NEH", openBible: "Neh" },
  { slug: "ester", usfm: "EST", openBible: "Esth" },
  { slug: "job", usfm: "JOB", openBible: "Job" },
  { slug: "salmos", usfm: "PSA", openBible: "Ps" },
  { slug: "proverbios", usfm: "PRO", openBible: "Prov" },
  { slug: "eclesiastés", usfm: "ECC", openBible: "Eccl" },
  { slug: "cantares", usfm: "SNG", openBible: "Song" },
  { slug: "isaías", usfm: "ISA", openBible: "Isa" },
  { slug: "jeremías", usfm: "JER", openBible: "Jer" },
  { slug: "lamentaciones", usfm: "LAM", openBible: "Lam" },
  { slug: "ezequiel", usfm: "EZK", openBible: "Ezek" },
  { slug: "daniel", usfm: "DAN", openBible: "Dan" },
  { slug: "oseas", usfm: "HOS", openBible: "Hos" },
  { slug: "joel", usfm: "JOL", openBible: "Joel" },
  { slug: "amós", usfm: "AMO", openBible: "Amos" },
  { slug: "abdías", usfm: "OBA", openBible: "Obad" },
  { slug: "jonás", usfm: "JON", openBible: "Jonah" },
  { slug: "miqueas", usfm: "MIC", openBible: "Mic" },
  { slug: "nahúm", usfm: "NAM", openBible: "Nah" },
  { slug: "habacuc", usfm: "HAB", openBible: "Hab" },
  { slug: "sofonías", usfm: "ZEP", openBible: "Zeph" },
  { slug: "hageo", usfm: "HAG", openBible: "Hag" },
  { slug: "zacarías", usfm: "ZEC", openBible: "Zech" },
  { slug: "malaquías", usfm: "MAL", openBible: "Mal" },

  { slug: "sanmateo", usfm: "MAT", openBible: "Matt" },
  { slug: "sanmarcos", usfm: "MRK", openBible: "Mark" },
  { slug: "sanlucas", usfm: "LUK", openBible: "Luke" },
  { slug: "sanjuan", usfm: "JHN", openBible: "John" },
  { slug: "hechos", usfm: "ACT", openBible: "Acts" },
  { slug: "romanos", usfm: "ROM", openBible: "Rom" },
  { slug: "1corintios", usfm: "1CO", openBible: "1Cor" },
  { slug: "2corintios", usfm: "2CO", openBible: "2Cor" },
  { slug: "gálatas", usfm: "GAL", openBible: "Gal" },
  { slug: "efesios", usfm: "EPH", openBible: "Eph" },
  { slug: "filipenses", usfm: "PHP", openBible: "Phil" },
  { slug: "colosenses", usfm: "COL", openBible: "Col" },
  { slug: "1tesalonicenses", usfm: "1TH", openBible: "1Thess" },
  { slug: "2tesalonicenses", usfm: "2TH", openBible: "2Thess" },
  { slug: "1timoteo", usfm: "1TI", openBible: "1Tim" },
  { slug: "2timoteo", usfm: "2TI", openBible: "2Tim" },
  { slug: "tito", usfm: "TIT", openBible: "Titus" },
  { slug: "filemón", usfm: "PHM", openBible: "Phlm" },
  { slug: "hebreos", usfm: "HEB", openBible: "Heb" },
  { slug: "santiago", usfm: "JAS", openBible: "Jas" },
  { slug: "1pedro", usfm: "1PE", openBible: "1Pet" },
  { slug: "2pedro", usfm: "2PE", openBible: "2Pet" },
  { slug: "1juan", usfm: "1JN", openBible: "1John" },
  { slug: "2juan", usfm: "2JN", openBible: "2John" },
  { slug: "3juan", usfm: "3JN", openBible: "3John" },
  { slug: "judas", usfm: "JUD", openBible: "Jude" },
  { slug: "apocalipsis", usfm: "REV", openBible: "Rev" },
];

export const usfmToSlug = new Map(BOOK_CODES.map((b) => [b.usfm, b.slug]));
export const openBibleToSlug = new Map(BOOK_CODES.map((b) => [b.openBible, b.slug]));
export const slugToUsfm = new Map(BOOK_CODES.map((b) => [b.slug, b.usfm]));
