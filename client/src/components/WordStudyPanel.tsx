import { useEffect, useState } from "react";
import { getWordStudy, type WordStudyEntry } from "../api/client";

interface Props {
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; words: WordStudyEntry[] };

export function WordStudyPanel({ bookSlug, bookName, chapter, verse, onClose }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    getWordStudy(bookSlug, chapter, verse)
      .then(({ words }) => {
        if (!cancelled) setState({ status: "ready", words });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [bookSlug, chapter, verse]);

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
            {bookName} {chapter}:{verse} — griego
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
          {state.status === "loading" && <p className="text-sm text-ink/60">Cargando...</p>}

          {state.status === "error" && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-800">{state.message}</p>
          )}

          {state.status === "ready" && state.words.length === 0 && (
            <p className="text-sm text-ink/50">
              No hay datos de griego original para este versículo — por ahora el estudio de palabras solo
              cubre el Nuevo Testamento.
            </p>
          )}

          {state.status === "ready" && state.words.length > 0 && (
            <div className="space-y-3">
              {state.words.map((w, i) => (
                <div key={i} className="rounded-lg bg-ink/5 p-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-lg">{w.greek}</span>
                    {w.transliteration && <span className="text-sm italic text-ink/50">{w.transliteration}</span>}
                  </div>
                  {w.glossEs && <p className="mt-0.5 text-sm font-medium text-amber-800">{w.glossEs}</p>}
                  {w.definition && <p className="mt-1 text-sm leading-relaxed text-ink/70">{w.definition}</p>}
                  {w.pronunciation && <p className="mt-1 text-xs text-ink/40">Pronunciación: {w.pronunciation}</p>}
                </div>
              ))}

              <p className="border-t border-ink/10 pt-3 text-xs text-ink/40">
                Griego del Nuevo Testamento y números Strong: STEPBible.org (CC BY 4.0). Diccionario: Strong's
                Exhaustive Concordance (dominio público). No es un alineamiento palabra por palabra con esta
                traducción al español — es el griego original de este versículo.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
