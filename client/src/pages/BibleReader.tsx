import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getChapter, getChapterMarks, type ChapterResponse, type ChapterVerse, type VerseMark } from "../api/client";
import { BookChapterNav } from "../components/BookChapterNav";
import { SearchPanel } from "../components/SearchPanel";
import { VerseActionMenu } from "../components/VerseActionMenu";
import { VerseAnalysisPanel } from "../components/VerseAnalysisPanel";
import { VerseList } from "../components/VerseList";
import { VersionSelector } from "../components/VersionSelector";
import { WordStudyPanel } from "../components/WordStudyPanel";
import { useFontSize } from "../hooks/useFontSize";
import { DEFAULT_VERSION, usePreferredVersion } from "../hooks/usePreferredVersion";

export function BibleReader() {
  const params = useParams<{ version: string; book: string; chapter: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [, setPreferredVersion] = usePreferredVersion();
  const { fontSize, increase: increaseFontSize, decrease: decreaseFontSize } = useFontSize();

  const version = params.version ?? DEFAULT_VERSION;
  const bookSlug = params.book ?? "génesis";
  const chapterNum = Number(params.chapter ?? 1);

  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [marksByVerse, setMarksByVerse] = useState<Map<number, VerseMark>>(new Map());
  const [menuVerse, setMenuVerse] = useState<number | null>(null);
  const [analysisRange, setAnalysisRange] = useState<{ start: number; end: number } | null>(() => {
    const v = searchParams.get("v");
    const vEnd = searchParams.get("vEnd");
    return v ? { start: Number(v), end: vEnd ? Number(vEnd) : Number(v) } : null;
  });
  const [wordStudyVerse, setWordStudyVerse] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    setChapter(null);
    setError(null);
    setMenuVerse(null);
    getChapter(version, bookSlug, chapterNum)
      .then(setChapter)
      .catch((err: Error) => setError(err.message));

    getChapterMarks(version, bookSlug, chapterNum)
      .then(({ marks }) => setMarksByVerse(new Map(marks.map((m) => [m.verse, m]))))
      .catch(() => setMarksByVerse(new Map()));
  }, [version, bookSlug, chapterNum]);

  useEffect(() => {
    const v = searchParams.get("v");
    const vEnd = searchParams.get("vEnd");
    setAnalysisRange(v ? { start: Number(v), end: vEnd ? Number(vEnd) : Number(v) } : null);
  }, [searchParams]);

  useEffect(() => {
    const target = menuVerse ?? analysisRange?.start ?? wordStudyVerse;
    if (target) {
      document.getElementById(`verse-${target}`)?.scrollIntoView({ block: "center" });
    }
  }, [menuVerse, analysisRange, wordStudyVerse, chapter]);

  const handleOpenMenu = (verse: number) => {
    if (analysisRange) {
      searchParams.delete("v");
      searchParams.delete("vEnd");
      setSearchParams(searchParams);
    }
    setWordStudyVerse(null);
    setMenuVerse(verse);
  };

  const handleOpenAnalysis = (verse: number) => {
    setMenuVerse(null);
    setSearchParams({ v: String(verse) });
  };

  const handleCloseAnalysis = () => {
    setAnalysisRange(null);
    searchParams.delete("v");
    searchParams.delete("vEnd");
    setSearchParams(searchParams);
  };

  const handleOpenWordStudy = (verse: number) => {
    setMenuVerse(null);
    setWordStudyVerse(verse);
  };

  const handleMarkChange = (verse: number, mark: VerseMark | null) => {
    setMarksByVerse((prev) => {
      const next = new Map(prev);
      if (mark) next.set(verse, mark);
      else next.delete(verse);
      return next;
    });
  };

  const handleVersionChange = (nextVersion: string) => {
    setPreferredVersion(nextVersion);
    navigate(`/biblia/${nextVersion}/${bookSlug}/${chapterNum}${analysisRange ? `?v=${analysisRange.start}&vEnd=${analysisRange.end}` : ""}`);
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedRange(null);
  };

  const handleVerseTap = (verse: ChapterVerse) => {
    const verseNum = Number(verse.verse);
    if (selectionMode) {
      setSelectedRange((prev) =>
        prev ? { start: Math.min(prev.start, verseNum), end: Math.max(prev.end, verseNum) } : { start: verseNum, end: verseNum }
      );
      return;
    }
    handleOpenMenu(verseNum);
  };

  const handleAnalyzeSelection = () => {
    if (!selectedRange) return;
    setSelectionMode(false);
    setMenuVerse(null);
    setSearchParams({ v: String(selectedRange.start), vEnd: String(selectedRange.end) });
    setSelectedRange(null);
  };

  const menuVerseText = menuVerse ? chapter?.verses.find((v) => Number(v.verse) === menuVerse)?.text : undefined;

  return (
    <div className="flex h-full">
      {navOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setNavOpen(false)} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] shadow-2xl transition-transform duration-200
        lg:static lg:z-auto lg:w-56 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <BookChapterNav version={version} currentBookSlug={bookSlug} onNavigate={() => setNavOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="rounded p-2 text-lg leading-none hover:bg-ink/10 lg:hidden"
            aria-label="Abrir índice de libros"
          >
            ☰
          </button>
          <VersionSelector version={version} onChange={handleVersionChange} />
          <div className="ml-auto flex items-center gap-0.5 rounded border border-ink/15">
            <button
              type="button"
              onClick={decreaseFontSize}
              disabled={fontSize <= 14}
              className="px-2 py-1.5 text-xs font-semibold leading-none hover:bg-ink/10 disabled:opacity-30"
              aria-label="Reducir tamaño de letra"
            >
              A−
            </button>
            <button
              type="button"
              onClick={increaseFontSize}
              disabled={fontSize >= 28}
              className="px-2 py-1.5 text-base font-semibold leading-none hover:bg-ink/10 disabled:opacity-30"
              aria-label="Aumentar tamaño de letra"
            >
              A+
            </button>
          </div>
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`rounded p-2 text-lg leading-none hover:bg-ink/10 ${selectionMode ? "bg-sky-100 text-sky-800" : ""}`}
            aria-label="Seleccionar varios versículos"
            title="Seleccionar varios versículos para analizar juntos"
          >
            ☑️
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="rounded p-2 text-lg leading-none hover:bg-ink/10"
            aria-label="Buscar en la Biblia"
          >
            🔍
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {error && <p className="p-6 text-sm text-red-700">{error}</p>}
          {!error && !chapter && <p className="p-6 text-sm text-ink/60">Cargando...</p>}
          {chapter && (
            <VerseList
              chapter={chapter}
              highlightedRange={menuVerse ? { start: menuVerse, end: menuVerse } : analysisRange}
              marksByVerse={marksByVerse}
              onSelectVerse={handleVerseTap}
              fontSize={fontSize}
              selectionMode={selectionMode}
              selectedRange={selectedRange}
            />
          )}
        </div>
      </div>

      {selectionMode && selectedRange && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex animate-slide-up items-center justify-between gap-3 border-t border-ink/10 bg-white p-3 shadow-2xl lg:sticky">
          <span className="text-sm font-medium">
            {selectedRange.end > selectedRange.start
              ? `${selectedRange.end - selectedRange.start + 1} versículos (${selectedRange.start}-${selectedRange.end})`
              : `Versículo ${selectedRange.start}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedRange(null)}
              className="rounded px-3 py-1.5 text-sm text-ink/60 hover:bg-ink/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAnalyzeSelection}
              className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-parchment transition-transform active:scale-95"
            >
              ✨ Analizar
            </button>
          </div>
        </div>
      )}

      {menuVerse && chapter && menuVerseText !== undefined && (
        <VerseActionMenu
          version={version}
          bookSlug={bookSlug}
          bookName={chapter.book.name}
          chapter={chapterNum}
          verse={menuVerse}
          verseText={menuVerseText}
          mark={marksByVerse.get(menuVerse)}
          onClose={() => setMenuVerse(null)}
          onAnalyze={() => handleOpenAnalysis(menuVerse)}
          onWordStudy={() => handleOpenWordStudy(menuVerse)}
          onMarkChange={(mark) => handleMarkChange(menuVerse, mark)}
        />
      )}

      {!menuVerse && analysisRange && chapter && (
        <VerseAnalysisPanel
          version={version}
          bookSlug={bookSlug}
          bookName={chapter.book.name}
          chapter={chapterNum}
          verse={analysisRange.start}
          verseEnd={analysisRange.end}
          onClose={handleCloseAnalysis}
        />
      )}

      {!menuVerse && !analysisRange && wordStudyVerse && chapter && (
        <WordStudyPanel
          bookSlug={bookSlug}
          bookName={chapter.book.name}
          chapter={chapterNum}
          verse={wordStudyVerse}
          onClose={() => setWordStudyVerse(null)}
        />
      )}

      {searchOpen && <SearchPanel version={version} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
