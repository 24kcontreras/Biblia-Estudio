import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APOCRYPHA_INFO } from "../data/apocryphaInfo";
import { BIBLE_BOOKS } from "../data/bibleBooks";

interface Props {
  version: string;
  currentBookSlug: string;
  /** Se llama tras elegir un capítulo — úsalo para cerrar el cajón en móvil/tablet. */
  onNavigate?: () => void;
}

/** Única de nuestras versiones que incluye los libros deuterocanónicos/apócrifos. */
const DEUTEROCANONICAL_VERSION = "spa_blm";

export function BookChapterNav({ version, currentBookSlug, onNavigate }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string>(currentBookSlug);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);

  const goTo = (bookSlug: string, chapter: number) => {
    const book = BIBLE_BOOKS.find((b) => b.slug === bookSlug);
    const targetVersion = book?.testament === "DEU" ? DEUTEROCANONICAL_VERSION : version;
    navigate(`/biblia/${targetVersion}/${bookSlug}/${chapter}`);
    onNavigate?.();
  };

  const renderBooks = (testament: "AT" | "NT" | "DEU", label: string) => (
    <div className="border-b-4 border-ink/10 pb-2 last:border-b-0">
      <h3 className="sticky top-0 z-10 bg-parchment px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-800">
        {label}
      </h3>
      {testament === "DEU" && (
        <p className="px-3 pb-1 text-xs text-ink/40">Solo disponibles en la versión católica (BLM).</p>
      )}
      <ul>
        {BIBLE_BOOKS.filter((b) => b.testament === testament).map((book) => (
          <li key={book.slug}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setExpanded(expanded === book.slug ? "" : book.slug)}
                className={`w-full truncate px-3 py-2.5 text-left text-sm hover:bg-ink/10 sm:py-2 ${
                  book.slug === currentBookSlug ? "font-semibold text-amber-800" : ""
                }`}
              >
                {book.name}
              </button>
              {APOCRYPHA_INFO[book.slug] && (
                <button
                  type="button"
                  onClick={() => setInfoOpen(infoOpen === book.slug ? null : book.slug)}
                  className="mr-2 shrink-0 rounded-full px-1.5 py-0.5 text-xs text-ink/40 transition-colors hover:bg-ink/10 hover:text-ink"
                  aria-label={`Contexto de ${book.name}`}
                >
                  ⓘ
                </button>
              )}
            </div>
            {infoOpen === book.slug && APOCRYPHA_INFO[book.slug] && (
              <p className="mx-3 mb-2 animate-fade-in rounded-lg bg-ink/5 p-2.5 text-xs leading-relaxed text-ink/70">
                {APOCRYPHA_INFO[book.slug]}
              </p>
            )}
            {expanded === book.slug && (
              <div className="grid animate-fade-in grid-cols-6 gap-1.5 px-3 pb-3 pt-1 sm:gap-1 sm:pb-2">
                {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((chapter) => (
                  <button
                    key={chapter}
                    type="button"
                    onClick={() => goTo(book.slug, chapter)}
                    className="rounded bg-ink/5 py-2 text-xs transition-transform hover:bg-amber-200 active:scale-90 sm:py-1"
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <nav className="h-full overflow-y-auto border-r border-ink/10 bg-parchment py-2">
      {renderBooks("AT", "Antiguo Testamento")}
      {renderBooks("NT", "Nuevo Testamento")}
      {renderBooks("DEU", "Deuterocanónicos")}
    </nav>
  );
}
