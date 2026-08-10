import { useEffect, useState } from "react";
import { analyzeVerse, type VerseAnalysis } from "../api/client";
import { CitationText } from "./CitationText";

interface Props {
  version: string;
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; analysis: VerseAnalysis };

export function VerseAnalysisPanel({ version, bookSlug, bookName, chapter, verse, onClose }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    analyzeVerse({ version, book: bookSlug, chapter, verse })
      .then(({ analysis }) => {
        if (!cancelled) setState({ status: "ready", analysis });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [version, bookSlug, chapter, verse]);

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />
      <aside
        className="fixed inset-x-0 bottom-0 z-40 flex h-[85dvh] w-full flex-col rounded-t-2xl border-t
        border-ink/10 bg-white shadow-2xl lg:static lg:z-auto lg:h-full lg:max-w-md lg:rounded-none
        lg:border-l lg:border-t-0 lg:shadow-none"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <h2 className="font-serif text-lg font-semibold">
            {bookName} {chapter}:{verse}
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

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {state.status === "loading" && <p className="text-sm text-ink/60">Analizando versículo...</p>}

          {state.status === "error" && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-800">{state.message}</p>
          )}

          {state.status === "ready" && (
            <div className="space-y-5">
              <Section title="Contexto">{state.analysis.contexto}</Section>
              <Section title="Exposición">{state.analysis.exposicion}</Section>
              <Section title="Significado teológico">{state.analysis.teologia}</Section>

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

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink/50">{title}</h3>
      <p className="whitespace-pre-line text-sm leading-relaxed">{children}</p>
    </div>
  );
}
