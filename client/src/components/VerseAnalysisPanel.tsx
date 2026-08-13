import { useEffect, useState } from "react";
import { analyzeVerse, saveAnalysis, type VerseAnalysis } from "../api/client";
import { downloadAnalysisPdf } from "../lib/generateAnalysisPdf";
import { BookLoader } from "./BookLoader";
import { CitationText } from "./CitationText";

interface Props {
  version: string;
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  onClose: () => void;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; analysis: VerseAnalysis };

export function VerseAnalysisPanel({ version, bookSlug, bookName, chapter, verse, verseEnd, onClose }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [saved, setSaved] = useState(false);
  const rangeEnd = verseEnd ?? verse;

  const handleSave = async () => {
    if (state.status !== "ready") return;
    await saveAnalysis({ version, book: bookSlug, chapter, verseStart: verse, verseEnd: rangeEnd, analysis: state.analysis });
    setSaved(true);
  };

  const handleDownloadPdf = () => {
    if (state.status !== "ready") return;
    downloadAnalysisPdf({
      bookName,
      chapter,
      verseStart: verse,
      verseEnd: rangeEnd,
      versionName: version,
      analysis: state.analysis,
    });
  };

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setStatusMessage(null);
    setSaved(false);

    analyzeVerse(
      { version, book: bookSlug, chapter, verse, verseEnd: rangeEnd },
      {
        onStatus: (message) => {
          if (!cancelled) setStatusMessage(message);
        },
        onResult: ({ analysis }) => {
          if (!cancelled) setState({ status: "ready", analysis });
        },
        onError: (message) => {
          if (!cancelled) setState({ status: "error", message });
        },
      }
    ).catch((err: Error) => {
      if (!cancelled) setState({ status: "error", message: err.message });
    });

    return () => {
      cancelled = true;
    };
  }, [version, bookSlug, chapter, verse, rangeEnd]);

  return (
    <>
      <div className="fixed inset-0 z-30 animate-fade-in bg-black/30 lg:hidden" onClick={onClose} />
      <aside
        className="fixed inset-x-0 bottom-0 z-40 flex h-[85dvh] w-full animate-slide-up flex-col rounded-t-2xl border-t
        border-ink/10 bg-white shadow-2xl lg:static lg:z-auto lg:h-full lg:max-w-md lg:rounded-none
        lg:border-l lg:border-t-0 lg:shadow-none"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <h2 className="font-serif text-lg font-semibold">
            {bookName} {chapter}:{verse}
            {rangeEnd > verse ? `-${rangeEnd}` : ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 rounded-full p-2 text-ink/50 hover:bg-ink/10 hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {state.status === "ready" && (
          <div className="flex gap-1.5 border-b border-ink/10 px-4 py-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink/60 transition-colors hover:border-ink/30 hover:bg-ink/5 hover:text-ink"
            >
              {saved ? "Guardado ✓" : "💾 Guardar"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink/60 transition-colors hover:border-ink/30 hover:bg-ink/5 hover:text-ink"
            >
              📄 Descargar PDF
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {state.status === "loading" && (
            <BookLoader
              label={statusMessage ?? (rangeEnd > verse ? "Analizando pasaje..." : "Analizando versículo...")}
            />
          )}

          {state.status === "error" && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-800">{state.message}</p>
          )}

          {state.status === "ready" && (
            <div className="space-y-5">
              <Section title="1. Contexto histórico y cultural" version={version}>{state.analysis.contexto}</Section>
              <Section title="2. Análisis literario" version={version}>{state.analysis.analisisLiterario}</Section>
              <Section title="3. Exposición" version={version}>{state.analysis.exposicion}</Section>
              <Section title="4. Palabras clave en el idioma original" version={version}>{state.analysis.palabrasClave}</Section>
              <Section title="5. Significado teológico" version={version}>{state.analysis.teologia}</Section>
              <Section title="6. Panorama canónico" version={version}>{state.analysis.panoramaCanonico}</Section>

              {state.analysis.referenciasCruzadas.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
                    Referencias cruzadas
                  </h3>
                  <ul className="space-y-2">
                    {state.analysis.referenciasCruzadas.map((ref, i) => (
                      <li key={i} className="text-sm">
                        <div className="font-medium">
                          <CitationText text={`[[${ref.referencia}]]`} version={version} />
                        </div>
                        <p className="text-ink/70">{ref.nota}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Section title="7. Historia de la interpretación" version={version}>{state.analysis.historiaInterpretacion}</Section>
              <Section title="8. Aplicación" version={version}>{state.analysis.aplicacion}</Section>

              <p className="border-t border-ink/10 pt-3 text-xs text-ink/40">
                Con apoyo del comentario de Matthew Henry (dominio público) y referencias cruzadas de{" "}
                openbible.info (CC-BY).
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, version, children }: { title: string; version: string; children: string }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink/50">{title}</h3>
      <div className="text-sm leading-relaxed">
        <CitationText text={children} version={version} />
      </div>
    </div>
  );
}
