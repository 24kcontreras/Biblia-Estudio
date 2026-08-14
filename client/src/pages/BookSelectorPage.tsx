import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VersionSelector } from "../components/VersionSelector";
import { BIBLE_BOOKS, type BibleBookMeta } from "../data/bibleBooks";
import { usePreferredVersion } from "../hooks/usePreferredVersion";

const SECTIONS: { testament: BibleBookMeta["testament"]; label: string }[] = [
  { testament: "AT", label: "Antiguo Testamento" },
  { testament: "NT", label: "Nuevo Testamento" },
  { testament: "DEU", label: "Deuterocanónicos" },
];

/** Única de nuestras versiones que incluye los libros deuterocanónicos/apócrifos. */
const DEUTEROCANONICAL_VERSION = "spa_blm";

export function BookSelectorPage() {
  const [version, setVersion] = usePreferredVersion();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const navigate = useNavigate();

  const goToChapter = (book: BibleBookMeta, chapter: number) => {
    const targetVersion = book.testament === "DEU" ? DEUTEROCANONICAL_VERSION : version;
    navigate(`/biblia/${targetVersion}/${book.slug}/${chapter}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-semibold">¿Qué quieres leer?</h1>
          <p className="text-sm text-ink/50">Elige un libro y después el capítulo.</p>
        </div>
        <VersionSelector version={version} onChange={setVersion} />
      </div>

      {SECTIONS.map(({ testament, label }) => {
        const books = BIBLE_BOOKS.filter((b) => b.testament === testament);
        if (books.length === 0) return null;
        return (
          <div key={testament} className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</h2>
            {testament === "DEU" && (
              <p className="mb-2 text-xs text-ink/40">Solo disponibles en la versión católica (BLM).</p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {books.map((book) => {
                const isExpanded = expandedSlug === book.slug;
                return (
                  <div key={book.slug} className={isExpanded ? "col-span-full" : undefined}>
                    <button
                      type="button"
                      onClick={() => setExpandedSlug(isExpanded ? null : book.slug)}
                      className={`w-full rounded-lg px-3 py-3 text-center text-sm font-medium shadow-sm transition-colors ${
                        isExpanded ? "bg-amber-100" : "bg-white hover:bg-amber-50"
                      }`}
                    >
                      {book.name}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 grid animate-fade-in grid-cols-6 gap-1.5 rounded-lg bg-white p-3 shadow-sm sm:grid-cols-8 md:grid-cols-10">
                        {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((chapter) => (
                          <button
                            key={chapter}
                            type="button"
                            onClick={() => goToChapter(book, chapter)}
                            className="rounded bg-ink/5 py-2 text-xs transition-transform hover:bg-amber-200 active:scale-90"
                          >
                            {chapter}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
