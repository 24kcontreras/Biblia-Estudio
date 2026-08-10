import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BIBLE_BOOKS } from "../data/bibleBooks";

interface Props {
  version: string;
  currentBookSlug: string;
  /** Se llama tras elegir un capítulo — úsalo para cerrar el cajón en móvil/tablet. */
  onNavigate?: () => void;
}

export function BookChapterNav({ version, currentBookSlug, onNavigate }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string>(currentBookSlug);

  const goTo = (bookSlug: string, chapter: number) => {
    navigate(`/biblia/${version}/${bookSlug}/${chapter}`);
    onNavigate?.();
  };

  const renderBooks = (testament: "AT" | "NT", label: string) => (
    <div>
      <h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</h3>
      <ul>
        {BIBLE_BOOKS.filter((b) => b.testament === testament).map((book) => (
          <li key={book.slug}>
            <button
              type="button"
              onClick={() => setExpanded(expanded === book.slug ? "" : book.slug)}
              className={`w-full truncate px-3 py-2.5 text-left text-sm hover:bg-ink/10 sm:py-2 ${
                book.slug === currentBookSlug ? "font-semibold text-amber-800" : ""
              }`}
            >
              {book.name}
            </button>
            {expanded === book.slug && (
              <div className="grid grid-cols-6 gap-1.5 px-3 pb-3 pt-1 sm:gap-1 sm:pb-2">
                {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((chapter) => (
                  <button
                    key={chapter}
                    type="button"
                    onClick={() => goTo(book.slug, chapter)}
                    className="rounded bg-ink/5 py-2 text-xs hover:bg-amber-200 sm:py-1"
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
    </nav>
  );
}
