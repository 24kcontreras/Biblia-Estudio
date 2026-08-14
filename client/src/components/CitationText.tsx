import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import { Link } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { findBookByName } from "../data/bibleBooks";

const CITATION_PATTERN = /\[\[([^\]]+)\]\]/g;
const REFERENCE_PATTERN = /^(.+?)\s+(\d+):(\d+)(?:-\d+)?$/;
const CITATION_SCHEME = "citation:";

interface Props {
  text: string;
  version: string;
}

/** Detecta referencias [[Libro Cap:Vers]] y renderiza markdown (negrita, listas, títulos, etc.). */
export function CitationText({ text, version }: Props) {
  const preprocessed = text.replace(
    CITATION_PATTERN,
    (_match, raw: string) => `[${raw}](${CITATION_SCHEME}${encodeURIComponent(raw)})`
  );

  const components: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
    hr: () => <hr className="my-3 border-ink/10" />,
    h1: ({ children }) => <p className="mb-1 mt-3 font-serif text-base font-semibold first:mt-0">{children}</p>,
    h2: ({ children }) => <p className="mb-1 mt-3 font-serif text-base font-semibold first:mt-0">{children}</p>,
    h3: ({ children }) => <p className="mb-1 mt-3 font-serif text-base font-semibold first:mt-0">{children}</p>,
    a: ({ href, children }) => {
      if (href?.startsWith(CITATION_SCHEME)) {
        const raw = decodeURIComponent(href.slice(CITATION_SCHEME.length));
        const refMatch = REFERENCE_PATTERN.exec(raw);
        const book = refMatch ? findBookByName(refMatch[1]) : undefined;

        if (refMatch && book) {
          const [, , chapter, verse] = refMatch;
          return (
            <Link
              to={`/biblia/${version}/${book.slug}/${chapter}?v=${verse}`}
              className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-sm font-medium text-amber-900 hover:bg-amber-200"
            >
              {raw}
            </Link>
          );
        }
        return <>{raw}</>;
      }
      return (
        <a href={href} target="_blank" rel="noreferrer" className="underline">
          {children}
        </a>
      );
    },
  };

  // react-markdown sanea los href por defecto y descarta cualquier esquema que no reconozca
  // (http, https, mailto, etc.) — sin esto, el pseudo-protocolo "citation:" se vacía a "" antes
  // de llegar al componente `a` de arriba, y el link queda ahí pero sin destino.
  const urlTransform = (url: string) => (url.startsWith(CITATION_SCHEME) ? url : defaultUrlTransform(url));

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={urlTransform}>
      {preprocessed}
    </ReactMarkdown>
  );
}
