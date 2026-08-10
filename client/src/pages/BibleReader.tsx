import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getChapter, getChapterMarks, type ChapterResponse, type VerseMark } from "../api/client";
import { BookChapterNav } from "../components/BookChapterNav";
import { VerseActionMenu } from "../components/VerseActionMenu";
import { VerseAnalysisPanel } from "../components/VerseAnalysisPanel";
import { VerseList } from "../components/VerseList";
import { VersionSelector } from "../components/VersionSelector";
import { DEFAULT_VERSION, usePreferredVersion } from "../hooks/usePreferredVersion";

export function BibleReader() {
  const params = useParams<{ version: string; book: string; chapter: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [, setPreferredVersion] = usePreferredVersion();

  const version = params.version ?? DEFAULT_VERSION;
  const bookSlug = params.book ?? "génesis";
  const chapterNum = Number(params.chapter ?? 1);

  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [marksByVerse, setMarksByVerse] = useState<Map<number, VerseMark>>(new Map());
  const [menuVerse, setMenuVerse] = useState<number | null>(null);
  const [analysisVerse, setAnalysisVerse] = useState<number | null>(() => {
    const v = searchParams.get("v");
    return v ? Number(v) : null;
  });

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
    setAnalysisVerse(v ? Number(v) : null);
  }, [searchParams]);

  useEffect(() => {
    const target = menuVerse ?? analysisVerse;
    if (target) {
      document.getElementById(`verse-${target}`)?.scrollIntoView({ block: "center" });
    }
  }, [menuVerse, analysisVerse, chapter]);

  const handleOpenMenu = (verse: number) => {
    if (analysisVerse) {
      searchParams.delete("v");
      setSearchParams(searchParams);
    }
    setMenuVerse(verse);
  };

  const handleOpenAnalysis = (verse: number) => {
    setMenuVerse(null);
    setSearchParams({ v: String(verse) });
  };

  const handleCloseAnalysis = () => {
    setAnalysisVerse(null);
    searchParams.delete("v");
    setSearchParams(searchParams);
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
    navigate(`/biblia/${nextVersion}/${bookSlug}/${chapterNum}${analysisVerse ? `?v=${analysisVerse}` : ""}`);
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
        </div>
        <div className="flex-1 overflow-y-auto">
          {error && <p className="p-6 text-sm text-red-700">{error}</p>}
          {!error && !chapter && <p className="p-6 text-sm text-ink/60">Cargando...</p>}
          {chapter && (
            <VerseList
              chapter={chapter}
              highlightedVerse={menuVerse ?? analysisVerse}
              marksByVerse={marksByVerse}
              onSelectVerse={(v) => handleOpenMenu(Number(v.verse))}
            />
          )}
        </div>
      </div>

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
          onMarkChange={(mark) => handleMarkChange(menuVerse, mark)}
        />
      )}

      {!menuVerse && analysisVerse && chapter && (
        <VerseAnalysisPanel
          version={version}
          bookSlug={bookSlug}
          bookName={chapter.book.name}
          chapter={chapterNum}
          verse={analysisVerse}
          onClose={handleCloseAnalysis}
        />
      )}
    </div>
  );
}
