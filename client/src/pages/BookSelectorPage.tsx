import { Link } from "react-router-dom";
import { BIBLE_BOOKS, type BibleBookMeta } from "../data/bibleBooks";
import { usePreferredVersion } from "../hooks/usePreferredVersion";

const SECTIONS: { testament: BibleBookMeta["testament"]; label: string }[] = [
  { testament: "AT", label: "Antiguo Testamento" },
  { testament: "NT", label: "Nuevo Testamento" },
  { testament: "DEU", label: "Deuterocanónicos" },
];

export function BookSelectorPage() {
  const [version] = usePreferredVersion();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 font-serif text-2xl font-semibold">¿Qué querés leer?</h1>
      <p className="mb-6 text-sm text-ink/50">Elegí un libro para empezar.</p>

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
