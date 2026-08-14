import { useEffect, useState } from "react";
import {
  getApocryphaChapter,
  getApocryphaWorks,
  type ApocryphaChapter,
  type ApocryphaWork,
} from "../api/client";
import { ApocryphaAnalysisPanel } from "../components/ApocryphaAnalysisPanel";

export function ApocryphaPage() {
  const [works, setWorks] = useState<ApocryphaWork[] | null>(null);
  const [activeWork, setActiveWork] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [chapter, setChapter] = useState<ApocryphaChapter | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    getApocryphaWorks()
      .then(({ works }) => setWorks(works))
      .catch(() => setWorks([]));
  }, []);

  const work = works?.find((w) => w.slug === activeWork) ?? null;

  return (
    <div className="flex h-full">
      <nav className="hidden w-56 shrink-0 overflow-y-auto border-r border-ink/10 bg-parchment py-2 lg:block">
        <h2 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-800">
          Apócrifos no canónicos
        </h2>
        <p className="px-3 pb-2 text-xs text-ink/40">
          No son canon de ninguna tradición cristiana mayoritaria — traducidos al español con IA.
        </p>
        <ul>
          {(works ?? []).map((w) => (
            <li key={w.slug}>
              <button
                type="button"
                onClick={() => {
                  setActiveWork(w.slug);
                  setActiveChapter(1);
                  setAnalyzing(false);
                }}
                className={`w-full truncate px-3 py-2 text-left text-sm hover:bg-ink/10 ${
                  w.slug === activeWork ? "font-semibold text-amber-800" : ""
                }`}
              >
                {w.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto">
        {works === null && <p className="p-6 text-sm text-ink/60">Cargando...</p>}
        {works !== null && works.length === 0 && (
          <p className="p-6 text-sm text-ink/50">Todavía no hay apócrifos cargados.</p>
        )}

        {works !== null && works.length > 0 && !work && (
          <div className="p-4 sm:p-6">
            <h1 className="mb-1 font-serif text-2xl font-semibold">Apócrifos no canónicos</h1>
            <p className="mb-6 text-sm text-ink/50">
              Textos antiguos que no forman parte del canon de ninguna tradición cristiana mayoritaria — se
              muestran aparte de la Biblia y de los libros deuterocanónicos.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {works.map((w) => (
                <button
                  key={w.slug}
                  type="button"
                  onClick={() => {
                    setActiveWork(w.slug);
                    setActiveChapter(1);
                    setAnalyzing(false);
                  }}
                  className="rounded-lg bg-white p-4 text-left shadow-sm transition-colors hover:bg-amber-50"
                >
                  <h3 className="font-serif text-lg font-semibold">{w.name}</h3>
                  <p className="mt-1 text-sm text-ink/60">{w.description}</p>
                  <p className="mt-2 text-xs text-ink/40">{w.chapterCount} capítulos</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {work && activeChapter && (
          <ChapterReader
            work={work}
            chapterNum={activeChapter}
            chapter={chapter}
            onChapterLoaded={setChapter}
            onBack={() => setActiveWork(null)}
            onChangeChapter={(n) => {
              setActiveChapter(n);
              setAnalyzing(false);
            }}
            onAnalyze={() => setAnalyzing(true)}
          />
        )}
      </div>

      {work && activeChapter && chapter && analyzing && (
        <ApocryphaAnalysisPanel
          workSlug={work.slug}
          workName={work.name}
          chapterNumber={activeChapter}
          chapterTitle={chapter.title}
          onClose={() => setAnalyzing(false)}
        />
      )}
    </div>
  );
}

function ChapterReader({
  work,
  chapterNum,
  chapter,
  onChapterLoaded,
  onBack,
  onChangeChapter,
  onAnalyze,
}: {
  work: ApocryphaWork;
  chapterNum: number;
  chapter: ApocryphaChapter | null;
  onChapterLoaded: (chapter: ApocryphaChapter | null) => void;
  onBack: () => void;
  onChangeChapter: (n: number) => void;
  onAnalyze: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onChapterLoaded(null);
    setError(null);
    getApocryphaChapter(work.slug, chapterNum)
      .then(onChapterLoaded)
      .catch((err: Error) => setError(err.message));
  }, [work.slug, chapterNum, onChapterLoaded]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <button type="button" onClick={onBack} className="mb-3 text-sm text-ink/60 hover:text-ink">
        ← Volver a apócrifos
      </button>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold sm:text-2xl">{work.name}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeChapter(chapterNum - 1)}
            disabled={chapterNum <= 1}
            className="rounded border border-ink/20 px-2 py-1 text-sm hover:bg-ink/10 disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-sm text-ink/60">
            {chapterNum} / {work.chapterCount}
          </span>
          <button
            type="button"
            onClick={() => onChangeChapter(chapterNum + 1)}
            disabled={chapterNum >= work.chapterCount}
            className="rounded border border-ink/20 px-2 py-1 text-sm hover:bg-ink/10 disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!error && !chapter && <p className="text-sm text-ink/60">Cargando...</p>}
      {chapter && (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">{chapter.title}</h2>
            <button
              type="button"
              onClick={onAnalyze}
              className="shrink-0 rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink/60 transition-colors hover:border-ink/30 hover:bg-ink/5 hover:text-ink"
            >
              ✨ Analizar con IA
            </button>
          </div>
          <p className="whitespace-pre-line text-base leading-8">{chapter.content}</p>
        </>
      )}

      <p className="mt-8 border-t border-ink/10 pt-3 text-xs text-ink/40">
        Traducción asistida por IA a partir de una traducción al inglés de dominio público en Wikisource.
        No es canon de ninguna tradición cristiana mayoritaria.
      </p>
    </div>
  );
}
