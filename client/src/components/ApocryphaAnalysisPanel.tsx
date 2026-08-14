import { useEffect, useState } from "react";
import { analyzeApocrypha, type ApocryphaAnalysis } from "../api/client";
import { usePreferredVersion } from "../hooks/usePreferredVersion";
import { BookLoader } from "./BookLoader";
import { CitationText } from "./CitationText";

interface Props {
  workSlug: string;
  workName: string;
  chapterNumber: number;
  chapterTitle: string;
  onClose: () => void;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; analysis: ApocryphaAnalysis };

export function ApocryphaAnalysisPanel({ workSlug, workName, chapterNumber, chapterTitle, onClose }: Props) {
  const [version] = usePreferredVersion();
  const [state, setState] = useState<State>({ status: "loading" });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setStatusMessage(null);

    analyzeApocrypha(workSlug, chapterNumber, {
      onStatus: (message) => {
        if (!cancelled) setStatusMessage(message);
      },
      onResult: ({ analysis }) => {
        if (!cancelled) setState({ status: "ready", analysis });
      },
      onError: (message) => {
        if (!cancelled) setState({ status: "error", message });
      },
    }).catch((err: Error) => {
      if (!cancelled) setState({ status: "error", message: err.message });
    });

    return () => {
      cancelled = true;
    };
  }, [workSlug, chapterNumber]);

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
            {workName} — {chapterTitle}
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
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Análisis histórico-literario, no una exposición doctrinal — este texto no es Escritura canónica.
          </p>

          {state.status === "loading" && <BookLoader label={statusMessage ?? "Analizando capítulo..."} />}

          {state.status === "error" && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-800">{state.message}</p>
          )}

          {state.status === "ready" && (
            <div className="space-y-5">
              <Section title="1. Contexto histórico" version={version}>{state.analysis.contexto}</Section>
              <Section title="2. Análisis literario" version={version}>{state.analysis.analisisLiterario}</Section>
              <Section title="3. Resumen del contenido" version={version}>{state.analysis.resumen}</Section>

              {state.analysis.conexionesBiblicas.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
                    Conexiones con la Biblia canónica
                  </h3>
                  <ul className="space-y-2">
                    {state.analysis.conexionesBiblicas.map((ref, i) => (
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

              <Section title="4. Significado histórico" version={version}>{state.analysis.significadoHistorico}</Section>
              <Section title="5. Estado canónico" version={version}>{state.analysis.estadoCanonico}</Section>
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
