import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchBible, type SearchResult } from "../api/client";
import { BookLoader } from "./BookLoader";
import { findBookBySlug } from "../data/bibleBooks";

const MATCH_START = "";
const MATCH_END = "";

interface Props {
  version: string;
  onClose: () => void;
}

function Snippet({ text }: { text: string }) {
  const parts = text.split(MATCH_START);
  return (
    <>
      {parts.map((part, i) => {
        if (i === 0) return <Fragment key={i}>{part}</Fragment>;
        const [match, rest] = part.split(MATCH_END);
        return (
          <Fragment key={i}>
            <mark className="rounded bg-amber-200 px-0.5">{match}</mark>
            {rest}
          </Fragment>
        );
      })}
    </>
  );
}

export function SearchPanel({ version, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      searchBible(version, q)
        .then(({ results }) => setResults(results))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, version]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-3 pt-16 animate-fade-in sm:pt-24"
      onClick={onClose}
    >
      <div
        className="max-h-[75vh] w-full max-w-xl animate-slide-up overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-ink/10 p-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la Biblia..."
            className="min-w-0 flex-1 rounded border border-ink/20 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 sm:text-sm"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink/50 hover:bg-ink/10 hover:text-ink"
            aria-label="Cerrar búsqueda"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(75vh-58px)] overflow-y-auto p-2">
          {query.trim().length < 2 && (
            <p className="p-3 text-sm text-ink/50">Escribe al menos 2 letras para buscar.</p>
          )}
          {loading && <BookLoader label="Buscando..." />}
          {!loading && results !== null && results.length === 0 && (
            <p className="p-3 text-sm text-ink/50">Sin resultados en esta versión.</p>
          )}

          <ul className="space-y-1">
            {(results ?? []).map((r) => {
              const book = findBookBySlug(r.book);
              return (
                <li key={`${r.book}-${r.chapter}-${r.verse}`}>
                  <Link
                    to={`/biblia/${version}/${r.book}/${r.chapter}?v=${r.verse}`}
                    onClick={onClose}
                    className="block rounded-lg p-2.5 hover:bg-amber-50"
                  >
                    <div className="text-xs font-medium text-amber-800">
                      {book?.name ?? r.book} {r.chapter}:{r.verse}
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-ink/80">
                      <Snippet text={r.snippet} />
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
