import { Link } from "react-router-dom";
import { VersionSelector } from "../components/VersionSelector";
import { BIBLE_BOOKS, type BibleBookMeta } from "../data/bibleBooks";
import { usePreferredVersion } from "../hooks/usePreferredVersion";

const SECTIONS: { testament: BibleBookMeta["testament"]; label: string }[] = [
  { testament: "AT", label: "Antiguo Testamento" },
  { testament: "NT", label: "Nuevo Testamento" },
  { testament: "DEU", label: "Deuterocanónicos" },
];

export function BookSelectorPage() {
  const [version, setVersion] = usePreferredVersion();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-semibold">¿Qué quieres leer?</h1>
          <p className="text-sm text-ink/50">Elige un libro para empezar.</p>
        </div>
        <VersionSelector version={version} onChange={setVersion} />
      </div>

      {SECTIONS.map(({ testament, label }) => {
        const books = BIBLE_BOOKS.filter((b) => b.testament === testament);
        if (books.length === 0) return null;
        return (
          <div key={testament} className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {books.map((book) => (
                <Link
                  key={book.slug}
                  to={`/biblia/${version}/${book.slug}/1`}
                  className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium shadow-sm transition-colors hover:bg-amber-50"
                >
                  {book.name}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
