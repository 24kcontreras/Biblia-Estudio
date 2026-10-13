import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createCollection,
  deleteCollection,
  deleteSavedAnalysis,
  deleteSavedChatAnswer,
  getChapter,
  getCollection,
  getCollections,
  getSavedAnalyses,
  getSavedChatAnswers,
  listMarks,
  removeVerseFromCollection,
  upsertMark,
  type CollectionDetail,
  type CollectionSummary,
  type CollectionVerseRef,
  type SavedAnalysis,
  type SavedChatAnswer,
  type VerseMark,
} from "../api/client";
import { CitationText } from "../components/CitationText";
import { findBookBySlug } from "../data/bibleBooks";
import { usePreferredVersion } from "../hooks/usePreferredVersion";
import { getUserId, setUserId } from "../lib/userId";

type Tab = "guardados" | "colecciones" | "memorizar" | "chat" | "analisis";
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
            ["chat", "Chat"],
            ["analisis", "Análisis"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
      {tab === "chat" && <ChatGuardadoTab />}
      {tab === "analisis" && <AnalisisGuardadoTab />}

      <SyncCodeSection />
    </div>
  );
}

/**
 * No hay cuentas: lo guardado queda asociado a un código anónimo de este navegador. Para ver lo
 * mismo en otro dispositivo se copia el código acá y se pega allá.
 */
function SyncCodeSection() {
  const [code] = useState(getUserId);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };

  const handleUse = () => {
    if (!setUserId(input)) {
      setError("Ese código no es válido.");
      return;
    }
    window.location.reload();
  };

  return (
    <details className="mt-10 rounded-lg border border-ink/10 p-4 text-sm">
      <summary className="cursor-pointer font-medium text-ink/70">Código de sincronización</summary>
      <p className="mt-3 text-ink/60">
        Lo que guardas queda asociado a este código. Para verlo en otro dispositivo, copia el código y pégalo
        allá. No lo compartas: quien lo tenga puede ver y editar tus guardados.
      </p>
      <div className="mt-3 flex gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-ink/5 px-3 py-2 text-xs">{code}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded border border-ink/20 px-3 py-2 text-xs hover:bg-ink/10"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          placeholder="Pegar código de otro dispositivo..."
          className="min-w-0 flex-1 rounded border border-ink/20 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="button"
          onClick={handleUse}
          disabled={!input.trim()}
          className="shrink-0 rounded bg-ink px-3 py-2 text-xs font-medium text-parchment disabled:opacity-40"
        >
          Usar
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </details>
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
          className="shrink-0 rounded bg-ink px-4 py-2 text-sm font-medium text-parchment transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100"
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

function ChatGuardadoTab() {
  const [version] = usePreferredVersion();
  const [saved, setSaved] = useState<SavedChatAnswer[] | null>(null);

  const reload = () => getSavedChatAnswers().then(({ saved }) => setSaved(saved));

  useEffect(() => {
    reload().catch(() => setSaved([]));
  }, []);

  const handleDelete = async (id: number) => {
    await deleteSavedChatAnswer(id);
    setSaved((prev) => (prev ?? []).filter((s) => s.id !== id));
  };

  return (
    <div>
      {saved === null && <p className="text-sm text-ink/60">Cargando...</p>}
      {saved !== null && saved.length === 0 && (
        <p className="text-sm text-ink/50">
          No tienes respuestas guardadas todavía. Usa "Guardar" debajo de una respuesta del chat.
        </p>
      )}

      <ul className="space-y-3">
        {(saved ?? []).map((s) => (
          <li key={s.id} className="rounded-lg bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              {s.question && <p className="text-xs font-medium text-ink/50">{s.question}</p>}
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                className="shrink-0 text-xs text-ink/40 transition-colors hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
            <div className="mt-1.5 text-sm leading-relaxed text-ink/80">
              <CitationText text={s.answer} version={version} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalisisGuardadoTab() {
  const [saved, setSaved] = useState<SavedAnalysis[] | null>(null);

  const reload = () => getSavedAnalyses().then(({ saved }) => setSaved(saved));

  useEffect(() => {
    reload().catch(() => setSaved([]));
  }, []);

  const handleDelete = async (id: number) => {
    await deleteSavedAnalysis(id);
    setSaved((prev) => (prev ?? []).filter((s) => s.id !== id));
  };

  return (
    <div>
      {saved === null && <p className="text-sm text-ink/60">Cargando...</p>}
      {saved !== null && saved.length === 0 && (
        <p className="text-sm text-ink/50">
          No tienes análisis guardados todavía. Usa "💾 Guardar" dentro de un análisis de la Biblia.
        </p>
      )}

      <ul className="space-y-2">
        {(saved ?? []).map((s) => {
          const passage = s.verseEnd > s.verseStart ? `${s.verseStart}-${s.verseEnd}` : `${s.verseStart}`;
          const path = `/biblia/${s.version}/${s.book}/${s.chapter}?v=${s.verseStart}&vEnd=${s.verseEnd}`;
          return (
            <li key={s.id} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <Link to={path} className="text-sm font-medium hover:underline">
                  {s.bookName} {s.chapter}:{passage}
                </Link>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      // jsPDF pesa bastante: se carga solo cuando alguien exporta.
                      import("../lib/generateAnalysisPdf").then(({ downloadAnalysisPdf }) =>
                        downloadAnalysisPdf({
                          bookName: s.bookName,
                          chapter: s.chapter,
                          verseStart: s.verseStart,
                          verseEnd: s.verseEnd,
                          versionName: s.version,
                          analysis: s.analysis,
                        })
                      )
                    }
                    className="text-xs text-ink/40 transition-colors hover:text-ink"
                  >
                    📄 PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="text-xs text-ink/40 transition-colors hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
