import type { ChapterResponse, ChapterVerse, VerseMark } from "../api/client";
import { getVerseColor } from "../data/verseColors";

interface Props {
  chapter: ChapterResponse;
  highlightedRange: { start: number; end: number } | null;
  marksByVerse: Map<number, VerseMark>;
  onSelectVerse: (verse: ChapterVerse) => void;
  fontSize: number;
  selectionMode?: boolean;
  selectedRange?: { start: number; end: number } | null;
}

export function VerseList({
  chapter,
  highlightedRange,
  marksByVerse,
  onSelectVerse,
  fontSize,
  selectionMode,
  selectedRange,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-4 font-serif text-xl font-semibold sm:text-2xl">
        {chapter.book.name} {chapter.chapter}
      </h1>
      <p style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}>
        {chapter.verses.map((v) => {
          const verseNum = Number(v.verse);
          const isHighlighted = Boolean(highlightedRange && verseNum >= highlightedRange.start && verseNum <= highlightedRange.end);
          const isSelected = Boolean(selectedRange && verseNum >= selectedRange.start && verseNum <= selectedRange.end);
          const mark = marksByVerse.get(verseNum);
          const persistentColor = getVerseColor(mark?.color);

          const bgClass = isSelected
            ? "bg-sky-200"
            : isHighlighted
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
      {selectionMode && (
        <p className="mt-4 text-xs text-ink/40">Toca los versículos que quieres incluir en el análisis.</p>
      )}
    </div>
  );
}
