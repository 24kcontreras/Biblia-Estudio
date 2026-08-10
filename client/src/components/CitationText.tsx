import { Fragment } from "react";
import { Link } from "react-router-dom";
import { findBookByName } from "../data/bibleBooks";

const CITATION_PATTERN = /\[\[([^\]]+)\]\]/g;
const REFERENCE_PATTERN = /^(.+?)\s+(\d+):(\d+)(?:-\d+)?$/;

interface Props {
  text: string;
  version: string;
}

/** Detecta referencias [[Libro Cap:Vers]] en el texto y las convierte en links a la Biblia. */
export function CitationText({ text, version }: Props) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  CITATION_PATTERN.lastIndex = 0;
  while ((match = CITATION_PATTERN.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }

    const raw = match[1];
    const refMatch = raw.match(REFERENCE_PATTERN);
    const book = refMatch ? findBookByName(refMatch[1]) : undefined;

    if (refMatch && book) {
      const [, , chapter, verse] = refMatch;
      parts.push(
        <Link
          key={key++}
          to={`/biblia/${version}/${book.slug}/${chapter}?v=${verse}`}
          className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-sm font-medium text-amber-900 hover:bg-amber-200"
        >
          {raw}
        </Link>
      );
    } else {
      parts.push(<Fragment key={key++}>{raw}</Fragment>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{parts}</>;
}
