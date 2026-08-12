import { getChosenSeasonUrl, type ChosenEpisode } from "../data/theChosenReferences";

interface Props {
  reference: string;
  episodes: ChosenEpisode[];
  onClose: () => void;
}

export function ChosenEpisodesPopover({ reference, episodes, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40 animate-fade-in bg-black/30" onClick={onClose} />
      <div
        className="fixed inset-x-4 top-1/3 z-50 mx-auto max-w-sm rounded-2xl border border-ink/10 bg-white p-4
        shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif text-base font-semibold">🎬 The Chosen</h3>
            <p className="text-xs text-ink/50">{reference}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-full p-1.5 text-ink/50 hover:bg-ink/10 hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <ul className="space-y-2">
          {episodes.map((ep) => (
            <li key={`${ep.season}-${ep.episode}`} className="rounded-lg bg-amber-50 px-3 py-2">
              <p className="text-sm font-medium text-ink">
                Temporada {ep.season}, Episodio {ep.episode}
              </p>
              <p className="text-sm italic text-ink/70">"{ep.title}"</p>
              <a
                href={getChosenSeasonUrl(ep.season)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-amber-800 hover:underline"
              >
                Ver Temporada {ep.season} en The Chosen ↗
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-center text-xs text-ink/40">
          Serie independiente de terceros, sin afiliación con BibleChat.
        </p>
      </div>
    </>
  );
}
