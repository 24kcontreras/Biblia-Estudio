// Índice de episodios de "The Chosen" por pasaje bíblico que dramatizan, citan o aluden.
// Curado a partir de índices públicos de referencias de la serie (temporadas 1-4; la temporada 5
// y especiales no tienen un índice de referencias verificado todavía, por eso no aparecen acá).
// No es una fuente oficial de la producción: es una guía de descubrimiento, no una cita académica
// estricta (algunos capítulos completos, como "Mateo 5-7", se repiten en varios episodios porque
// el Sermón del Monte es un recurso narrativo recurrente en la serie).
// Los títulos están en español (doblaje oficial). El link de "ver" apunta a la versión en
// español de Angel Studios (angel.com/es), pero el idioma real del audio/subtítulos disponible
// depende de la región y de cómo Angel Studios distribuya la serie en ese momento — no lo controla
// esta app.

export interface ChosenScriptureRef {
  /** Slug de libro, igual al usado en bibleBooks.ts */
  book: string;
  chapterStart: number;
  verseStart: number;
  chapterEnd: number;
  verseEnd: number;
}

export interface ChosenEpisode {
  season: number;
  episode: number;
  title: string;
  refs: ChosenScriptureRef[];
}

/** Referencia dentro de un mismo capítulo (o un solo versículo si no se pasa verseEnd). */
function ref(book: string, chapter: number, verseStart: number, verseEnd?: number): ChosenScriptureRef {
  return { book, chapterStart: chapter, verseStart, chapterEnd: chapter, verseEnd: verseEnd ?? verseStart };
}

/** Rango de capítulos completos (ej. "Mateo 5-7" o un solo capítulo entero). */
function refChapters(book: string, chapterStart: number, chapterEnd = chapterStart): ChosenScriptureRef {
  return { book, chapterStart, verseStart: 1, chapterEnd, verseEnd: 999 };
}

/** Rango que cruza capítulos (ej. Marcos 2:23 - 3:6). */
function refSpan(book: string, chapterStart: number, verseStart: number, chapterEnd: number, verseEnd: number): ChosenScriptureRef {
  return { book, chapterStart, verseStart, chapterEnd, verseEnd };
}

export const CHOSEN_EPISODES: ChosenEpisode[] = [
  // Temporada 1
  {
    season: 1,
    episode: 1,
    title: "Te He Llamado por Tu Nombre",
    refs: [ref("isaías", 43, 1, 7), ref("sanjuan", 3, 1, 2), ref("sanlucas", 8, 1, 3), ref("sanjuan", 20, 11, 16)],
  },
  {
    season: 1,
    episode: 2,
    title: "Shabbat",
    refs: [
      ref("génesis", 2, 1, 3),
      ref("éxodo", 20, 8, 11),
      ref("éxodo", 31, 14, 17),
      ref("deuteronomio", 5, 12, 14),
      ref("2samuel", 18, 4, 15),
      ref("sanmateo", 1, 1, 6),
      ref("proverbios", 31, 10, 31),
      ref("sanjuan", 1, 45, 46),
      ref("sanjuan", 9, 1, 16),
      ref("sanlucas", 14, 1, 11),
    ],
  },
  {
    season: 1,
    episode: 3,
    title: "Jesús Tiene Ojos para los Niños",
    refs: [
      ref("deuteronomio", 6, 4, 5),
      ref("deuteronomio", 32, 35),
      refChapters("sanmateo", 5, 7),
      ref("sanmateo", 6, 9, 15),
      ref("sanmateo", 18, 3, 5),
      ref("salmos", 133, 1),
      ref("sanlucas", 6, 12),
      ref("sanlucas", 18, 15, 17),
      ref("sanmateo", 13, 55),
    ],
  },
  {
    season: 1,
    episode: 4,
    title: "La Roca sobre la que Se Construye",
    refs: [
      ref("sanmateo", 3, 1, 12),
      ref("sanmateo", 4, 18, 22),
      ref("sanmateo", 13, 47, 50),
      ref("sanmarcos", 1, 16, 20),
      ref("sanlucas", 3, 1, 17),
      ref("sanlucas", 5, 1, 11),
      ref("sanjuan", 1, 19, 34),
      ref("sanjuan", 1, 35, 51),
      ref("sanmarcos", 6, 17, 29),
    ],
  },
  {
    season: 1,
    episode: 5,
    title: "Regalo de Bodas",
    refs: [ref("1reyes", 19, 19, 21), ref("sanlucas", 2, 41, 52), ref("proverbios", 30, 1, 6), ref("sanjuan", 2, 1, 12)],
  },
  {
    season: 1,
    episode: 6,
    title: "Compasión Indescriptible",
    refs: [
      ref("éxodo", 33, 20),
      ref("deuteronomio", 4, 15),
      ref("deuteronomio", 17, 15),
      ref("isaías", 40, 1, 5),
      ref("sanlucas", 5, 12, 16),
      ref("sanlucas", 5, 17, 26),
      ref("sanlucas", 12, 36, 48),
      ref("sanlucas", 13, 1, 5),
      ref("sanmateo", 6, 1, 4),
      ref("sanmateo", 8, 1, 4),
      ref("sanmateo", 9, 1, 8),
      ref("sanmarcos", 2, 1, 12),
      ref("proverbios", 17, 15),
      ref("salmos", 63, 1),
      ref("salmos", 104, 34),
    ],
  },
  {
    season: 1,
    episode: 7,
    title: "Una Invitación",
    refs: [
      ref("números", 21, 4, 9),
      ref("salmos", 2, 11, 12),
      ref("sanmateo", 9, 9, 13),
      ref("sanlucas", 5, 27, 28),
      ref("sanjuan", 3, 1, 21),
      ref("sanmarcos", 2, 14),
    ],
  },
  {
    season: 1,
    episode: 8,
    title: "Yo Soy Él",
    refs: [
      refChapters("génesis", 16),
      ref("génesis", 33, 18, 20),
      ref("sanmateo", 8, 14, 15),
      ref("sanmateo", 9, 9, 13),
      ref("sanmateo", 19, 16, 26),
      ref("sanmarcos", 1, 29, 31),
      ref("sanmarcos", 2, 13, 17),
      ref("sanlucas", 4, 38, 39),
      ref("sanlucas", 5, 29, 32),
      ref("sanjuan", 4, 1, 42),
    ],
  },

  // Temporada 2
  {
    season: 2,
    episode: 1,
    title: "Los Hijos del Trueno",
    refs: [
      ref("génesis", 1, 1, 5),
      ref("salmos", 33, 6, 9),
      ref("sanjuan", 1, 1, 18),
      ref("sanjuan", 4, 27, 42),
      ref("sanlucas", 15, 1, 7),
      ref("sanlucas", 10, 25, 37),
      ref("sanlucas", 9, 51, 55),
      ref("hechos", 12, 1, 2),
    ],
  },
  {
    season: 2,
    episode: 2,
    title: "Te Vi",
    refs: [
      ref("génesis", 16, 7, 14),
      ref("génesis", 21, 14, 19),
      ref("génesis", 28, 10, 17),
      ref("génesis", 32, 22, 32),
      ref("sanmateo", 16, 13, 20),
      ref("sanjuan", 1, 19, 34),
      ref("sanjuan", 1, 35, 51),
    ],
  },
  {
    season: 2,
    episode: 3,
    title: "Mateo 4:24",
    refs: [ref("sanmateo", 4, 24), ref("zacarías", 14, 2, 4), ref("sanlucas", 2, 1, 7), ref("salmos", 139, 8)],
  },
  {
    season: 2,
    episode: 4,
    title: "La Oportunidad Perfecta",
    refs: [
      ref("éxodo", 22, 20),
      ref("eclesiastés", 3, 3),
      ref("sanjuan", 5, 1, 13),
      ref("levítico", 24, 5, 9),
      refChapters("sanmateo", 5, 7),
      ref("sanmateo", 5, 3, 12),
      ref("salmos", 69, 9),
      ref("sofonías", 3, 14, 20),
      ref("zacarías", 14, 16),
    ],
  },
  {
    season: 2,
    episode: 5,
    title: "Espíritu",
    refs: [
      ref("1reyes", 1, 1, 4),
      ref("levítico", 18, 16),
      ref("levítico", 20, 21),
      ref("sanmateo", 3, 1, 12),
      ref("sanmateo", 12, 43, 45),
      ref("sanjuan", 5, 14, 16),
      ref("sanjuan", 1, 19, 34),
      ref("sanmarcos", 6, 17, 18),
      ref("salmos", 7, 1, 2),
      refChapters("sanlucas", 1),
      ref("sanlucas", 11, 24, 26),
    ],
  },
  {
    season: 2,
    episode: 6,
    title: "Ilícito",
    refs: [
      ref("deuteronomio", 23, 2, 4),
      ref("levítico", 24, 5, 9),
      ref("1samuel", 21, 1, 6),
      ref("sanmateo", 12, 1, 14),
      refSpan("sanmarcos", 2, 23, 3, 6),
      ref("salmos", 20, 7),
      ref("daniel", 7, 13, 14),
    ],
  },
  { season: 2, episode: 7, title: "Ajuste de Cuentas", refs: [ref("sanmateo", 6, 5, 14)] },
  {
    season: 2,
    episode: 8,
    title: "Más Allá de las Montañas",
    refs: [refChapters("sanmateo", 5, 7), ref("sanmateo", 5, 3, 12), ref("salmos", 139, 15, 16)],
  },

  // Temporada 3
  {
    season: 3,
    episode: 1,
    title: "Regreso a Casa",
    refs: [
      ref("números", 6, 24, 26),
      ref("proverbios", 3, 5),
      ref("sanlucas", 6, 17, 49),
      ref("sanlucas", 8, 1, 3),
      refChapters("sanmateo", 5, 7),
    ],
  },
  {
    season: 3,
    episode: 2,
    title: "De Dos en Dos",
    refs: [refChapters("salmos", 3), ref("salmos", 139, 14), ref("isaías", 35, 5, 6), ref("job", 1, 21), refChapters("sanmateo", 10)],
  },
  {
    season: 3,
    episode: 3,
    title: "Médico, Cúrate a Ti Mismo",
    refs: [
      ref("1reyes", 17, 8, 16),
      refChapters("2reyes", 5),
      ref("deuteronomio", 18, 20),
      ref("sanmateo", 13, 54, 58),
      ref("sanmarcos", 6, 1, 5),
      ref("sanjuan", 11, 1, 6),
      ref("sanjuan", 12, 1, 3),
      ref("sanlucas", 4, 16, 30),
      ref("sanlucas", 10, 38, 42),
    ],
  },
  {
    season: 3,
    episode: 4,
    title: "Limpieza, Parte 1",
    refs: [ref("levítico", 15, 7, 15), ref("sanmateo", 9, 18, 26), ref("sanmarcos", 5, 21, 43), ref("sanlucas", 8, 40, 56)],
  },
  {
    season: 3,
    episode: 5,
    title: "Limpieza, Parte 2",
    refs: [
      ref("sanmateo", 9, 14, 17),
      ref("sanmateo", 9, 18, 26),
      ref("sanmarcos", 2, 18, 22),
      ref("sanmarcos", 5, 21, 43),
      ref("sanlucas", 5, 33, 39),
      ref("sanlucas", 8, 40, 56),
      ref("jeremías", 2, 13),
    ],
  },
  {
    season: 3,
    episode: 6,
    title: "Tensión en el Campamento",
    refs: [ref("proverbios", 27, 17), ref("sanmateo", 11, 2, 19), ref("sanlucas", 7, 18, 35)],
  },
  {
    season: 3,
    episode: 7,
    title: "Oídos para Oír",
    refs: [
      ref("números", 15, 37, 41),
      ref("sanmateo", 1, 1, 6),
      ref("sanmateo", 12, 18, 21),
      ref("sanmateo", 13, 24, 30),
      ref("sanmateo", 13, 36, 43),
      ref("sanmateo", 22, 1, 14),
      ref("isaías", 42, 1, 4),
      ref("sanlucas", 14, 15, 24),
    ],
  },
  {
    season: 3,
    episode: 8,
    title: "Sustento",
    refs: [
      ref("job", 1, 21),
      ref("salmos", 13, 2),
      ref("salmos", 57, 1),
      refChapters("salmos", 77),
      ref("salmos", 147, 3),
      ref("sanmateo", 11, 20, 30),
      ref("sanmateo", 13, 1, 23),
      ref("sanmateo", 13, 31, 32),
      ref("sanmateo", 13, 44, 46),
      ref("sanmateo", 14, 13, 21),
      ref("sanmateo", 14, 22, 33),
      ref("sanmateo", 19, 27),
      ref("sanmarcos", 4, 39),
      ref("sanmarcos", 6, 30, 44),
      ref("sanmarcos", 6, 45, 52),
      ref("sanmarcos", 8, 1, 10),
      ref("sanlucas", 10, 21, 22),
      ref("sanlucas", 17, 5, 6),
      ref("sanjuan", 6, 1, 15),
      ref("sanjuan", 6, 16, 21),
      ref("isaías", 61, 1, 2),
      ref("1pedro", 1, 6, 7),
    ],
  },

  // Temporada 4
  {
    season: 4,
    episode: 1,
    title: "Promesas",
    refs: [
      ref("éxodo", 30, 23, 25),
      ref("rut", 3, 1, 14),
      ref("isaías", 2, 2, 3),
      ref("sanmateo", 14, 1, 12),
      ref("sanmarcos", 6, 14, 29),
      ref("apocalipsis", 19, 6, 9),
      refChapters("sanlucas", 1),
      ref("sanjuan", 1, 6, 23),
    ],
  },
  {
    season: 4,
    episode: 2,
    title: "Confesiones",
    refs: [
      ref("éxodo", 4, 24, 26),
      ref("eclesiastés", 1, 1, 14),
      ref("eclesiastés", 3, 6, 7),
      ref("eclesiastés", 5, 10),
      ref("sanmateo", 10, 34, 37),
      ref("sanmateo", 16, 13, 20),
      ref("sanmateo", 18, 21, 22),
      ref("sanlucas", 9, 18, 21),
      ref("sanlucas", 12, 51, 53),
      ref("sanmarcos", 8, 27, 30),
      ref("sanlucas", 17, 3, 4),
    ],
  },
  {
    season: 4,
    episode: 3,
    title: "Luna Ensangrentada",
    refs: [
      ref("2samuel", 12, 15, 23),
      ref("sanmateo", 6, 33),
      ref("sanmateo", 7, 7, 8),
      ref("sanmateo", 12, 38, 42),
      ref("sanmateo", 12, 50),
      ref("sanmateo", 23, 23, 26),
      ref("sanlucas", 11, 27, 43),
      ref("sanlucas", 12, 1, 3),
      ref("sanlucas", 12, 51),
      refChapters("sanjuan", 9),
      ref("salmos", 110, 1),
    ],
  },
  {
    season: 4,
    episode: 4,
    title: "Calma Previa",
    refs: [
      ref("salmos", 38, 7, 11),
      ref("salmos", 77, 3, 4),
      ref("isaías", 55, 8, 9),
      ref("sanmateo", 8, 5, 13),
      ref("sanmateo", 20, 17, 27),
      ref("sanmarcos", 10, 32, 45),
      ref("sanlucas", 7, 1, 10),
      ref("sanjuan", 4, 46, 54),
    ],
  },
  {
    season: 4,
    episode: 5,
    title: "Contemplar, Servir, Maquinar",
    refs: [ref("sanmateo", 5, 38, 42), ref("sanmateo", 20, 1, 16), ref("sanlucas", 10, 38, 42)],
  },
  {
    season: 4,
    episode: 6,
    title: "Dedicación",
    refs: [
      ref("salmos", 113, 2, 4),
      ref("salmos", 114, 7, 8),
      ref("salmos", 115, 1, 3),
      ref("salmos", 116, 15, 17),
      ref("salmos", 118, 8, 9),
      ref("salmos", 118, 25, 27),
      refChapters("sanjuan", 10),
      ref("sanjuan", 11, 1, 16),
      ref("sanmateo", 7, 7, 11),
    ],
  },
  {
    season: 4,
    episode: 7,
    title: "La Última Señal",
    refs: [ref("deuteronomio", 30, 19), ref("isaías", 53, 3), refChapters("salmos", 13), refChapters("sanjuan", 11)],
  },
  {
    season: 4,
    episode: 8,
    title: "Humilde",
    refs: [
      ref("eclesiastés", 12, 13),
      ref("miqueas", 6, 8),
      ref("zacarías", 9, 9),
      ref("sanmateo", 25, 31, 46),
      ref("sanmateo", 26, 6, 13),
      ref("sanmarcos", 11, 1, 7),
      ref("sanmarcos", 14, 3, 9),
      ref("sanlucas", 19, 28, 35),
      ref("sanjuan", 6, 28),
      ref("sanjuan", 11, 45, 53),
      ref("sanjuan", 12, 1, 8),
      ref("sanjuan", 13, 1),
      ref("sanjuan", 13, 34, 35),
    ],
  },
];

export const CHOSEN_WATCH_URL = "https://www.angel.com/es/watch/the-chosen";

function refMatches(r: ChosenScriptureRef, bookSlug: string, chapter: number, verse: number): boolean {
  if (r.book !== bookSlug) return false;
  if (chapter < r.chapterStart || chapter > r.chapterEnd) return false;
  if (r.chapterStart === r.chapterEnd) return verse >= r.verseStart && verse <= r.verseEnd;
  if (chapter === r.chapterStart) return verse >= r.verseStart;
  if (chapter === r.chapterEnd) return verse <= r.verseEnd;
  return true;
}

export function getChosenEpisodesForVerse(bookSlug: string, chapter: number, verse: number): ChosenEpisode[] {
  return CHOSEN_EPISODES.filter((ep) => ep.refs.some((r) => refMatches(r, bookSlug, chapter, verse)));
}
