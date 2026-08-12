import { useCallback, useState } from "react";

const STORAGE_KEY = "biblechat:fontSize";
const MIN_SIZE = 14;
const MAX_SIZE = 28;
const STEP = 2;
const DEFAULT_SIZE = 18;

export function useFontSize(): { fontSize: number; increase: () => void; decrease: () => void } {
  const [fontSize, setFontSize] = useState(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return stored >= MIN_SIZE && stored <= MAX_SIZE ? stored : DEFAULT_SIZE;
  });

  const step = useCallback((delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(MAX_SIZE, Math.max(MIN_SIZE, prev + delta));
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const increase = useCallback(() => step(STEP), [step]);
  const decrease = useCallback(() => step(-STEP), [step]);

  return { fontSize, increase, decrease };
}
