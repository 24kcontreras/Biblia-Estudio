import { useEffect, useState } from "react";
import { getVersions, type BibleVersion } from "../api/client";

interface Props {
  version: string;
  onChange: (versionId: string) => void;
}

export function VersionSelector({ version, onChange }: Props) {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVersions()
      .then(setVersions)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <span className="text-xs text-red-700">No se pudieron cargar las versiones ({error})</span>;
  }

  return (
    <select
      value={version}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-0 max-w-[65vw] rounded border border-ink/20 bg-white px-2 py-2 text-sm sm:max-w-none sm:py-1"
    >
      {versions.map((v) => (
        <option key={v.id} value={v.id}>
          {v.localVersionName} ({v.localVersionAbbreviation})
        </option>
      ))}
    </select>
  );
}
