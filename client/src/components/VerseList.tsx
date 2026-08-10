import type { ChapterResponse, ChapterVerse, VerseMark } from "../api/client";
import { getVerseColor } from "../data/verseColors";

interface Props {
  chapter: ChapterResponse;
  highlightedVerse: number | null;
  marksByVerse: Map<number, VerseMark>;
  onSelectVerse: (verse: ChapterVerse) => void;
}

export function VerseList({ chapter, highlightedVerse, marksByVerse, onSelectVerse }: Props) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-4 font-serif text-xl font-semibold sm:text-2xl">
        {chapter.book.name} {chapter.chapter}
      </h1>
      <p className="text-base leading-8 sm:text-lg sm:leading-loose">
        {chapter.verses.map((v) => {
          const verseNum = Number(v.verse);
          const isHighlighted = verseNum === highlightedVerse;
          const mark = marksByVerse.get(verseNum);
          const persistentColor = getVerseColor(mark?.color);

          const bgClass = isHighlighted
            ? "bg-amber-200"
            : persistentColor
              ? `${persistentColor.bgClass} hover:brightness-95`
              : "hover:bg-amber-100 active:bg-amber-200";

          return (
            <span
              key={v.verse}
              id={`verse-${verseNum}`}
              onClick={() => onSelectVerse(v)}
              className={`cursor-pointer rounded px-0.5 py-1 transition-colors ${bgClass}`}
            >
              <sup className="mr-0.5 text-xs font-semibold text-amber-800">{v.verse}</sup>
              {v.text}
              {mark?.isFavorite && <span className="ml-0.5 align-super text-xs">★</span>}
              {mark?.note && <span className="ml-0.5 align-super text-xs">📝</span>}{" "}
            </span>
          );
        })}
      </p>
    </div>
  );
}
