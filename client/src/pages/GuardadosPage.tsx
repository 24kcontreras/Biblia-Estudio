import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createCollection,
  deleteCollection,
  getChapter,
  getCollection,
  getCollections,
  listMarks,
  removeVerseFromCollection,
  upsertMark,
  type CollectionDetail,
  type CollectionSummary,
  type CollectionVerseRef,
  type VerseMark,
} from "../api/client";
import { findBookBySlug } from "../data/bibleBooks";

type Tab = "guardados" | "colecciones" | "memorizar";
type MarkFilter = "todos" | "favorito" | "color" | "nota" | "memorizar";

function verseRef(v: { version: string; book: string; chapter: number; verse: number }) {
  const book = findBookBySlug(v.book);
  return { name: book?.name ?? v.book, path: `/biblia/${v.version}/${v.book}/${v.chapter}?v=${v.verse}` };
}

export function GuardadosPage() {
  const [tab, setTab] = useState<Tab>("guardados");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 font-serif text-xl font-semibold sm:text-2xl">Guardado</h1>

      <div className="mb-6 flex gap-1.5">
        {(
          [
            ["guardados", "Guardados"],
            ["colecciones", "Colecciones"],
            ["memorizar", "Memorización"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === key ? "bg-ink text-parchment" : "text-ink/70 hover:bg-ink/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "guardados" && <GuardadosTab />}
      {tab === "colecciones" && <ColeccionesTab />}
      {tab === "memorizar" && <MemorizarTab />}
    </div>
  );
}

function GuardadosTab() {
  const [marks, setMarks] = useState<VerseMark[] | null>(null);
  const [filter, setFilter] = useState<MarkFilter>("todos");

  useEffect(() => {
    listMarks()
      .then(({ marks }) => setMarks(marks))
      .catch(() => setMarks([]));
  }, []);

  const filtered = (marks ?? []).filter((m) => {
    if (filter === "todos") return true;
    if (filter === "favorito") return m.isFavorite;
    if (filter === "color") return Boolean(m.color);
    if (filter === "nota") return Boolean(m.note);
    if (filter === "memorizar") return m.memorize;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["todos", "Todos"],
            ["favorito", "⭐ Favoritos"],
            ["color", "🖍 Resaltados"],
            ["nota", "📝 Notas"],
            ["memorizar", "🧠 Memorizar"],
          ] as [MarkFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === key ? "border-ink bg-ink text-parchment" : "border-ink/20 text-ink/70 hover:bg-ink/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {marks === null && <p className="text-sm text-ink/60">Cargando...</p>}
      {marks !== null && filtered.length === 0 && (
        <p className="text-sm text-ink/50">No hay versículos guardados todavía.</p>
      )}

      <ul className="space-y-2">
        {filtered.map((m) => {
          const ref = verseRef(m);
          return (
            <li key={`${m.version}-${m.book}-${m.chapter}-${m.verse}`}>
              <Link to={ref.path} className="block rounded-lg bg-white p-3 shadow-sm hover:bg-amber-50">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {ref.name} {m.chapter}:{m.verse}
                  {m.isFavorite && <span>⭐</span>}
                  {m.color && <span>🖍</span>}
                  {m.memorize && <span>🧠</span>}
                </div>
                {m.note && <p className="mt-1 truncate text-sm text-ink/60">{m.note}</p>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ColeccionesTab() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [name, setName] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CollectionDetail | null>(null);

  const reload = () => getCollections().then(({ collections }) => setCollections(collections));

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (openId == null) {
      setDetail(null);
      return;
    }
    getCollection(openId).then(setDetail);
  }, [openId]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createCollection(trimmed);
    setName("");
    reload();
  };

  const handleDelete = async (id: number) => {
    await deleteCollection(id);
    if (openId === id) setOpenId(null);
    reload();
  };

  const handleRemoveVerse = async (ref: CollectionVerseRef) => {
    if (openId == null) return;
    await removeVerseFromCollection(openId, ref);
    setDetail((prev) => (prev ? { ...prev, verses: prev.verses.filter((v) => v !== ref) } : prev));
    reload();
  };

  if (openId != null && detail) {
    return (
      <div>
        <button type="button" onClick={() => setOpenId(null)} className="mb-3 text-sm text-ink/60 hover:text-ink">
          ← Volver a colecciones
        </button>
        <h2 className="mb-3 font-serif text-lg font-semibold">{detail.name}</h2>
        {detail.verses.length === 0 && <p className="text-sm text-ink/50">Sin versículos todavía.</p>}
        <ul className="space-y-2">
          {detail.verses.map((v) => {
            const ref = verseRef(v);
            return (
              <li key={`${v.version}-${v.book}-${v.chapter}-${v.verse}`} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                <Link to={ref.path} className="text-sm font-medium hover:underline">
                  {ref.name} {v.chapter}:{v.verse}
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemoveVerse(v)}
                  className="text-xs text-ink/40 hover:text-red-700"
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nueva colección..."
          className="min-w-0 flex-1 rounded border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={!name.trim()}
          className="shrink-0 rounded bg-ink px-4 py-2 text-sm font-medium text-parchment disabled:opacity-40"
        >
          Crear
        </button>
      </div>

      {collections.length === 0 && <p className="text-sm text-ink/50">Todavía no tienes colecciones.</p>}

      <ul className="space-y-2">
        {collections.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
            <button type="button" onClick={() => setOpenId(c.id)} className="text-left text-sm font-medium hover:underline">
              {c.name} <span className="text-ink/40">({c.verseCount})</span>
            </button>
            <button type="button" onClick={() => handleDelete(c.id)} className="text-xs text-ink/40 hover:text-red-700">
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MemorizarTab() {
  const [marks, setMarks] = useState<VerseMark[] | null>(null);
  const [revealed, setRevealed] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    listMarks("memorize")
      .then(({ marks }) => setMarks(marks))
      .catch(() => setMarks([]));
  }, []);

  const key = (m: VerseMark) => `${m.version}-${m.book}-${m.chapter}-${m.verse}`;

  const handleReveal = async (m: VerseMark) => {
    if (revealed.has(key(m))) return;
    const data = await getChapter(m.version, m.book, m.chapter);
    const found = data.verses.find((v) => Number(v.verse) === m.verse);
    setRevealed((prev) => new Map(prev).set(key(m), found?.text ?? ""));
  };

  const handleRemove = async (m: VerseMark) => {
    await upsertMark(m.version, m.book, m.chapter, m.verse, { memorize: false });
    setMarks((prev) => (prev ?? []).filter((x) => x !== m));
  };

  return (
    <div>
      {marks === null && <p className="text-sm text-ink/60">Cargando...</p>}
      {marks !== null && marks.length === 0 && (
        <p className="text-sm text-ink/50">
          No tienes versículos para memorizar. Marca alguno con 🧠 desde el menú del versículo.
        </p>
      )}

      <ul className="space-y-2">
        {(marks ?? []).map((m) => {
          const ref = verseRef(m);
          const text = revealed.get(key(m));
          return (
            <li key={key(m)} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => handleReveal(m)} className="text-sm font-medium">
                  {ref.name} {m.chapter}:{m.verse}
                </button>
                <button type="button" onClick={() => handleRemove(m)} className="text-xs text-ink/40 hover:text-red-700">
                  Ya me lo sé
                </button>
              </div>
              {text !== undefined && <p className="mt-2 text-sm leading-relaxed text-ink/80">{text}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
