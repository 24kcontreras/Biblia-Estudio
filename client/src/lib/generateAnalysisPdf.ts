import { jsPDF } from "jspdf";
import type { VerseAnalysis } from "../api/client";

const ACCENT = [124, 45, 18] as const; // #7c2d12, mismo tono que el resto de la app
const INK = [43, 38, 32] as const; // #2b2620
const MARGIN = 50;

// Rango Unicode del griego (incluye griego politónico). La fuente estándar de jsPDF (helvetica)
// no tiene esos glifos: al medir el ancho de esas letras para partir líneas, el cálculo se
// descalibra y el texto se sale del margen. Como la transliteración ya va siempre al lado
// (ej. "ἠγάπησεν - ēgapēsen"), se quita el griego del PDF y se deja solo la transliteración.
const GREEK_RANGE = /[Ͱ-Ͽἀ-῿]+/g;

function stripGreekScript(text: string): string {
  return text
    .replace(new RegExp(`${GREEK_RANGE.source}\\s*-\\s*`, "g"), "")
    .replace(GREEK_RANGE, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:)])/g, "$1")
    .trim();
}

/** Quita marcado markdown y griego (ver stripGreekScript) para texto plano de PDF. */
function stripMarkdown(text: string): string {
  return stripGreekScript(text)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "$1")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/^---+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const addFooter = () => {
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
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - MARGIN - 20) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const addTitle = (text: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...ACCENT);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    ensureSpace(lines.length * 26);
    doc.text(lines, MARGIN, y + 20);
    y += lines.length * 26 + 6;
  };

  const addSubtitle = (text: string) => {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(120, 110, 100);
    ensureSpace(16);
    doc.text(text, MARGIN, y);
    y += 24;
  };

  const addSectionHeading = (text: string) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...ACCENT);
    doc.text(text.toUpperCase(), MARGIN, y);
    y += 6;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + contentWidth, y);
    y += 14;
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

  addTitle(passage);
  addSubtitle(`Versión: ${versionName} · Generado el ${new Date().toLocaleDateString("es")}`);

  for (const section of SECTIONS) {
    const value = analysis[section.key];
    if (typeof value !== "string" || !value.trim()) continue;
    addSectionHeading(section.title);
    addBody(value);
  }

  if (analysis.referenciasCruzadas.length > 0) {
    addSectionHeading("Referencias cruzadas");
    for (const ref of analysis.referenciasCruzadas) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...ACCENT);
      ensureSpace(15);
      doc.text(ref.referencia, MARGIN, y);
      y += 15;
      addBody(ref.nota);
    }
  }

  addSectionHeading("7. Historia de la interpretación");
  addBody(analysis.historiaInterpretacion);
  addSectionHeading("8. Aplicación");
  addBody(analysis.aplicacion);

  addFooter();
  return doc;
}

export function downloadAnalysisPdf(params: AnalysisPdfParams): void {
  const doc = generateAnalysisPdf(params);
  const safeBook = params.bookName.toLowerCase().replace(/\s+/g, "-");
  const passage = params.verseEnd > params.verseStart ? `${params.verseStart}-${params.verseEnd}` : `${params.verseStart}`;
  doc.save(`${safeBook}-${params.chapter}-${passage}.pdf`);
}
