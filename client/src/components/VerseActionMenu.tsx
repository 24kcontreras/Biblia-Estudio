import { useEffect, useRef, useState } from "react";
import {
  addVerseToCollection,
  createCollection,
  getChapter,
  getCollections,
  getVersions,
  upsertMark,
  type CollectionSummary,
  type VerseMark,
} from "../api/client";
import { getVerseColor, VERSE_COLORS } from "../data/verseColors";

interface Props {
  version: string;
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseText: string;
  mark: VerseMark | undefined;
  onClose: () => void;
  onAnalyze: () => void;
  onMarkChange: (mark: VerseMark | null) => void;
}

type SubView = "menu" | "nota" | "colecciones" | "comparar";

type CompareState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; entries: { label: string; text: string | null }[] };

export function VerseActionMenu({
  version,
  bookSlug,
  bookName,
  chapter,
  verse,
  verseText,
  mark,
  onClose,
  onAnalyze,
  onMarkChange,
}: Props) {
  const [subView, setSubView] = useState<SubView>("menu");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [noteDraft, setNoteDraft] = useState(mark?.note ?? "");

  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionFeedback, setCollectionFeedback] = useState<string | null>(null);

  const [compare, setCompare] = useState<CompareState>({ status: "loading" });

  useEffect(() => {
    return () => clearTimeout(feedbackTimeout.current);
  }, []);

  const reference = `${bookName} ${chapter}:${verse}`;

  const showFeedback = (message: string) => {
    setFeedback(message);
    clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 1500);
  };

  const updateMark = async (update: Parameters<typeof upsertMark>[4]) => {
    const { mark: updated } = await upsertMark(version, bookSlug, chapter, verse, update);
    onMarkChange(updated);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${reference} — "${verseText}"`);
    showFeedback("¡Copiado!");
  };

  const handleShare = async () => {
    const url = `${location.origin}/biblia/${version}/${bookSlug}/${chapter}?v=${verse}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: reference, text: verseText, url });
      } catch {
        // el usuario canceló el share nativo
      }
    } else {
      await navigator.clipboard.writeText(url);
      showFeedback("Enlace copiado");
    }
  };

  const openNota = () => {
    setNoteDraft(mark?.note ?? "");
    setSubView("nota");
  };

  const saveNota = async () => {
    await updateMark({ note: noteDraft.trim() || null });
    setSubView("menu");
  };

  const openColecciones = () => {
    setSubView("colecciones");
    setCollectionFeedback(null);
    getCollections()
      .then(({ collections }) => setCollections(collections))
      .catch(() => setCollections([]));
  };

  const handleAddToCollection = async (id: number, name: string) => {
    await addVerseToCollection(id, { version, book: bookSlug, chapter, verse });
    setCollectionFeedback(`Agregado a "${name}"`);
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const created = await createCollection(name);
    setNewCollectionName("");
    setCollections((prev) => [...prev, { id: created.id, name: created.name, verseCount: 0 }]);
    await handleAddToCollection(created.id, created.name);
  };

  const openComparar = () => {
    setSubView("comparar");
    setCompare({ status: "loading" });
    getVersions()
      .then(async (versions) => {
        const spanish = versions.filter((v) => v.language.code === "spa");
        const entries = await Promise.all(
          spanish.map(async (v) => {
            try {
              const data = await getChapter(v.id, bookSlug, chapter);
              const found = data.verses.find((vs) => Number(vs.verse) === verse);
              return { label: v.localVersionAbbreviation, text: found?.text ?? null };
            } catch {
              return { label: v.localVersionAbbreviation, text: null };
            }
          })
        );
        setCompare({ status: "ready", entries });
      })
      .catch((err: Error) => setCompare({ status: "error", message: err.message }));
  };

  const activeColor = getVerseColor(mark?.color);

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />
      <aside
        className="fixed inset-x-0 bottom-0 z-40 flex max-h-[80dvh] w-full flex-col rounded-t-2xl
        border-t border-ink/10 bg-white shadow-2xl lg:static lg:z-auto lg:h-full lg:max-h-none
        lg:w-full lg:max-w-md lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <div className="flex items-center gap-2">
            {subView !== "menu" && (
              <button
                type="button"
                onClick={() => setSubView("menu")}
                className="-ml-1.5 rounded-full p-1.5 text-ink/50 hover:bg-ink/10 hover:text-ink"
                aria-label="Volver"
              >
                ←
              </button>
            )}
            <h2 className="font-serif text-lg font-semibold">{reference}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 rounded-full p-2 text-ink/50 hover:bg-ink/10 hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {subView === "menu" && (
            <div>
              <p className="mb-3 text-sm italic text-ink/70">"{verseText}"</p>

              <div className="grid grid-cols-3 gap-2">
                <ActionButton icon="✨" label="Analizar con IA" onClick={onAnalyze} />
                <ActionButton icon="📋" label="Copiar" onClick={handleCopy} />
                <ActionButton icon="🔗" label="Compartir" onClick={handleShare} />
                <ActionButton icon="⇄" label="Comparar" onClick={openComparar} />
                <ActionButton
                  icon={mark?.isFavorite ? "★" : "☆"}
                  label="Favorito"
                  active={mark?.isFavorite}
                  onClick={() => updateMark({ isFavorite: !mark?.isFavorite })}
                />
                <ActionButton
                  icon="🧠"
                  label="Memorizar"
                  active={mark?.memorize}
                  onClick={() => updateMark({ memorize: !mark?.memorize })}
                />
                <ActionButton
                  icon="🖍️"
                  label="Resaltar"
                  active={Boolean(activeColor)}
                  onClick={() => setColorPickerOpen((v) => !v)}
                />
                <ActionButton icon="📝" label="Nota" active={Boolean(mark?.note)} onClick={openNota} />
                <ActionButton icon="🗂️" label="Colecciones" onClick={openColecciones} />
              </div>

              {colorPickerOpen && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink/5 p-3">
                  {VERSE_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      aria-label={c.label}
                      onClick={() => {
                        updateMark({ color: mark?.color === c.key ? null : c.key });
                        setColorPickerOpen(false);
                      }}
                      className={`h-8 w-8 rounded-full ${c.swatchClass} ${
                        mark?.color === c.key ? "ring-2 ring-offset-2 ring-ink" : ""
                      }`}
                    />
                  ))}
                </div>
              )}

              {feedback && <p className="mt-3 text-center text-sm text-amber-800">{feedback}</p>}
            </div>
          )}

          {subView === "nota" && (
            <div className="flex flex-col gap-3">
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Escribe tu nota sobre este versículo..."
                rows={6}
                className="w-full rounded border border-ink/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubView("menu")}
                  className="rounded px-3 py-2 text-sm text-ink/60 hover:bg-ink/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveNota}
                  className="rounded bg-ink px-4 py-2 text-sm font-medium text-parchment"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {subView === "colecciones" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Nueva colección..."
                  className="min-w-0 flex-1 rounded border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                  className="shrink-0 rounded bg-ink px-3 py-2 text-sm font-medium text-parchment disabled:opacity-40"
                >
                  Crear y agregar
                </button>
              </div>

              {collections.length === 0 && (
                <p className="text-sm text-ink/50">Todavía no tienes colecciones. Crea una arriba.</p>
              )}

              <ul className="space-y-1">
                {collections.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleAddToCollection(c.id, c.name)}
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-ink/10"
                    >
                      {c.name} <span className="text-ink/40">({c.verseCount})</span>
                    </button>
                  </li>
                ))}
              </ul>

              {collectionFeedback && (
                <p className="text-center text-sm text-amber-800">{collectionFeedback}</p>
              )}
            </div>
          )}

          {subView === "comparar" && (
            <div className="space-y-4">
              {compare.status === "loading" && <p className="text-sm text-ink/60">Cargando versiones...</p>}
              {compare.status === "error" && (
                <p className="rounded bg-red-50 p-3 text-sm text-red-800">{compare.message}</p>
              )}
              {compare.status === "ready" &&
                compare.entries.map((entry) => (
                  <div key={entry.label}>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">
                      {entry.label}
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {entry.text ?? <span className="italic text-ink/40">No disponible en esta versión.</span>}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs hover:bg-ink/10 ${
        active ? "bg-amber-100 text-amber-900" : "text-ink/80"
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}
