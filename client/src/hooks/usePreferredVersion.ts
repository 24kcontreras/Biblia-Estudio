import { useCallback, useState } from "react";

const STORAGE_KEY = "biblechat:version";
export const DEFAULT_VERSION = "es-rv09";

export function usePreferredVersion(): [string, (version: string) => void] {
  const [version, setVersionState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_VERSION);

  const setVersion = useCallback((next: string) => {
    localStorage.setItem(STORAGE_KEY, next);
    setVersionState(next);
  }, []);

  return [version, setVersion];
}
