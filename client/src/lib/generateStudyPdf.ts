import { jsPDF } from "jspdf";
import type { VerseAnalysis } from "../api/client";

const ACCENT = [124, 45, 18] as const; // #7c2d12, mismo tono que el resto de la app
const INK = [43, 38, 32] as const; // #2b2620
const MARGIN = 50;

// Rangos Unicode del griego (incluye politónico) y del hebreo/arameo (mismo alfabeto).
// La fuente estándar de jsPDF (helvetica) no tiene esos glifos: fuera de WinAnsi/Latin-1,
// jsPDF cae a una codificación de 2 bytes por carácter dentro de una fuente simple de 1 byte,
// lo que corrompe el texto (algunos lectores, sobre todo en móvil, lo muestran como dañado).
// Como la transliteración ya va siempre al lado (ej. "ἠγάπησεν - ēgapēsen", "בְּרֵאשִׁית - bereshit"),
// se quita el original del PDF y se deja solo la transliteración.
const ORIGINAL_LANGUAGE_RANGE = /[Ͱ-Ͽἀ-῿֐-׿]+/g;

function stripOriginalLanguageScript(text: string): string {
  return text
    .replace(new RegExp(`${ORIGINAL_LANGUAGE_RANGE.source}\\s*-\\s*`, "g"), "")
    .replace(ORIGINAL_LANGUAGE_RANGE, "")
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;:)])/g, "$1")
    .trim();
}

// Puntuación "tipográfica" (comillas curvas, rayas, puntos suspensivos, viñeta) que SÍ está
// en WinAnsiEncoding aunque su código Unicode esté fuera de Latin-1 (0x00-0xFF).
const WINANSI_EXTRA_CODEPOINTS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

// La transliteración académica (ej. "ēgapēsen", "bārā'") usa marcas diacríticas (macrón, breve,
// punto bajo, etc.) y letras (ʾ alef, ʿ ayin) que tampoco están en WinAnsi. Basta con UN carácter
// fuera de ese repertorio para que jsPDF corrompa el string completo (ver ORIGINAL_LANGUAGE_RANGE
// arriba). Las tildes españolas (á, é, ñ...) ya están en WinAnsi y se dejan intactas; sólo se
// decompone (NFD) y se le quita la marca diacrítica a los caracteres que lo necesitan, y
// cualquiera que siga sin poder representarse se descarta.
function toWinAnsiSafe(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const code = ch.codePointAt(0) as number;
      if (code <= 0xff || WINANSI_EXTRA_CODEPOINTS.has(code)) return ch;
      if (ch === "ʾ" || ch === "ʼ" || ch === "ʻ" || ch === "ʿ") return "'";
      const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      const baseCode = base.length === 1 ? base.codePointAt(0) : undefined;
      return baseCode !== undefined && baseCode <= 0xff ? base : "";
    })
    .join("");
}

/** Quita marcado markdown, griego/hebreo (ver stripOriginalLanguageScript) y caracteres fuera de WinAnsi. */
function stripMarkdown(text: string): string {
  return toWinAnsiSafe(stripOriginalLanguageScript(text))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "$1")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/^---+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Documento A4 con el estilo de la app: título, subtítulo, secciones con encabezado y texto corrido.
 * Lo usan tanto el análisis de versículos como las respuestas del chat.
 */
function createStudyDoc(title: string, subtitle: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - MARGIN - 20) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const addSectionHeading = (text: string) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...ACCENT);
    doc.text(toWinAnsiSafe(text).toUpperCase(), MARGIN, y);
    y += 6;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + contentWidth, y);
    y += 14;
  };

  const addLabel = (text: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...ACCENT);
    ensureSpace(15);
    doc.text(toWinAnsiSafe(text), MARGIN, y);
    y += 15;
  };

  const addBody = (raw: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    const paragraphs = stripMarkdown(raw).split("\n");
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        y += 6;
        continue;
      }
      const lines = doc.splitTextToSize(paragraph, contentWidth) as string[];
      for (const line of lines) {
        ensureSpace(15);
        doc.text(line, MARGIN, y);
        y += 15;
      }
      y += 3;
    }
    y += 8;
  };

  const finish = (): jsPDF => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`BibleChat — Estudio bíblico con IA · página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 25, {
        align: "center",
      });
    }
    return doc;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ACCENT);
  const titleLines = doc.splitTextToSize(toWinAnsiSafe(title), contentWidth) as string[];
  doc.text(titleLines, MARGIN, y + 20);
  y += titleLines.length * 26 + 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(120, 110, 100);
  doc.text(toWinAnsiSafe(subtitle), MARGIN, y);
  y += 24;

  return { addSectionHeading, addLabel, addBody, finish };
}

function today(): string {
  return new Date().toLocaleDateString("es");
}

interface AnalysisPdfParams {
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  versionName: string;
  analysis: VerseAnalysis;
}

const SECTIONS: { title: string; key: keyof VerseAnalysis }[] = [
  { title: "1. Contexto histórico y cultural", key: "contexto" },
  { title: "2. Análisis literario", key: "analisisLiterario" },
  { title: "3. Exposición", key: "exposicion" },
  { title: "4. Palabras clave en el idioma original", key: "palabrasClave" },
  { title: "5. Significado teológico", key: "teologia" },
  { title: "6. Panorama canónico", key: "panoramaCanonico" },
];

export function generateAnalysisPdf(params: AnalysisPdfParams): jsPDF {
  const { bookName, chapter, verseStart, verseEnd, versionName, analysis } = params;
  const passage = verseEnd > verseStart ? `${bookName} ${chapter}:${verseStart}-${verseEnd}` : `${bookName} ${chapter}:${verseStart}`;

  const pdf = createStudyDoc(passage, `Versión: ${versionName} · Generado el ${today()}`);

  for (const section of SECTIONS) {
    const value = analysis[section.key];
    if (typeof value !== "string" || !value.trim()) continue;
    pdf.addSectionHeading(section.title);
    pdf.addBody(value);
  }

  if (analysis.referenciasCruzadas.length > 0) {
    pdf.addSectionHeading("Referencias cruzadas");
    for (const ref of analysis.referenciasCruzadas) {
      pdf.addLabel(ref.referencia);
      pdf.addBody(ref.nota);
    }
  }

  pdf.addSectionHeading("7. Historia de la interpretación");
  pdf.addBody(analysis.historiaInterpretacion);
  pdf.addSectionHeading("8. Aplicación");
  pdf.addBody(analysis.aplicacion);

  return pdf.finish();
}

export function downloadAnalysisPdf(params: AnalysisPdfParams): void {
  const doc = generateAnalysisPdf(params);
  const safeBook = params.bookName.toLowerCase().replace(/\s+/g, "-");
  const passage = params.verseEnd > params.verseStart ? `${params.verseStart}-${params.verseEnd}` : `${params.verseStart}`;
  doc.save(`${safeBook}-${params.chapter}-${passage}.pdf`);
}

interface ChatPdfParams {
  question: string | null;
  answer: string;
}

const CITATION_RE = /\[\[([^\]]+)\]\]/g;

/**
 * PDF de estudio a partir de una respuesta del chat: la pregunta, la respuesta (los títulos markdown
 * pasan a ser subtítulos) y al final la lista de pasajes citados, para repasarlos con la Biblia abierta.
 */
export function generateChatPdf({ question, answer }: ChatPdfParams): jsPDF {
  const pdf = createStudyDoc("Estudio bíblico", `Generado el ${today()}`);

  const citations = [...new Set(Array.from(answer.matchAll(CITATION_RE), (m) => m[1].trim()))];
  const text = answer.replace(CITATION_RE, "($1)");

  if (question) {
    pdf.addSectionHeading("Pregunta");
    pdf.addBody(question);
  }

  pdf.addSectionHeading("Respuesta");
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.join("").trim()) pdf.addBody(paragraph.join("\n"));
    paragraph = [];
  };
  for (const line of text.split("\n")) {
    const heading = /^#{1,6}\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      pdf.addLabel(heading[1].replace(/\*+/g, ""));
    } else {
      paragraph.push(line);
    }
  }
  flush();

  if (citations.length > 0) {
    pdf.addSectionHeading("Pasajes citados");
    pdf.addBody(citations.map((c) => `- ${c}`).join("\n"));
  }

  return pdf.finish();
}

export function downloadChatPdf(params: ChatPdfParams): void {
  generateChatPdf(params).save(`estudio-biblico-${new Date().toISOString().slice(0, 10)}.pdf`);
}
