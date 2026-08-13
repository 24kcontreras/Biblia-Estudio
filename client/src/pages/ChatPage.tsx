import { useEffect, useRef, useState } from "react";
import { getChatHistory, saveChatAnswer, streamChat, type ChatMessage } from "../api/client";
import { CitationText } from "../components/CitationText";
import { usePreferredVersion } from "../hooks/usePreferredVersion";

const SESSION_KEY = "biblechat:chatSession";

const INDAGAR_PROMPT =
  "Profundiza más en tu respuesta anterior: dame más detalle, ejemplos bíblicos adicionales y matices que no hayas mencionado.";
const COMPARAR_PROMPT =
  "Dame una segunda perspectiva teológica sobre lo mismo: ¿cómo entendería este pasaje o tema otra tradición cristiana (por ejemplo la católica, la ortodoxa, o una corriente protestante distinta a la que reflejaste)? Señala en qué coinciden y en qué difieren.";

export function ChatPage() {
  const [version] = usePreferredVersion();
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      getChatHistory(sessionId)
        .then(({ messages }) => setMessages(messages))
        .catch(() => undefined);
    }
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || sending) return;

    if (!override) setInput("");
    setError(null);
    setStatusMessage(null);
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);

    await streamChat(text, sessionId, {
      onChunk: (chunk) => {
        setStatusMessage(null);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: next[next.length - 1].content + chunk };
          return next;
        });
      },
      onStatus: (message) => setStatusMessage(message),
      onDone: (newSessionId) => {
        if (newSessionId !== sessionId) {
          localStorage.setItem(SESSION_KEY, newSessionId);
          setSessionId(newSessionId);
        }
        setStatusMessage(null);
        setSending(false);
      },
      onError: (message) => {
        setError(message);
        setStatusMessage(null);
        setSending(false);
        setMessages((prev) => (prev[prev.length - 1]?.content === "" ? prev.slice(0, -1) : prev));
      },
    });
  };

  const handleSave = async (index: number) => {
    const answer = messages[index]?.content;
    if (!answer) return;
    const question = index > 0 && messages[index - 1].role === "user" ? messages[index - 1].content : null;
    await saveChatAnswer(question, answer);
    setSavedIndex(index);
    setTimeout(() => setSavedIndex((prev) => (prev === index ? null : prev)), 2000);
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-3 sm:px-4">
      <div className="flex-1 space-y-4 overflow-y-auto py-4 sm:py-6">
        {messages.length === 0 && (
          <p className="text-center text-sm text-ink/50">
            Pregunta lo que quieras sobre la Biblia — el asistente citará los pasajes en los que se basa.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[88%] sm:max-w-[85%]">
              <div
                className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed transition-shadow ${
                  m.role === "user" ? "bg-ink text-parchment" : "bg-white shadow-sm"
                }`}
              >
                {m.role === "assistant" && !m.content && sending && i === messages.length - 1 && statusMessage ? (
                  <span className="italic text-ink/50">{statusMessage}</span>
                ) : m.role === "assistant" ? (
                  <CitationText text={m.content} version={version} />
                ) : (
                  m.content
                )}
              </div>
              {m.role === "assistant" && m.content && !(sending && i === messages.length - 1) && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSave(i)}
                    className="rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink/60 transition-colors hover:border-ink/30 hover:bg-ink/5 hover:text-ink"
                  >
                    {savedIndex === i ? "Guardado ✓" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void handleSend(INDAGAR_PROMPT)}
                    className="rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink/60 transition-colors hover:border-ink/30 hover:bg-ink/5 hover:text-ink disabled:opacity-40"
                  >
                    Indagar más
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void handleSend(COMPARAR_PROMPT)}
                    className="rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink/60 transition-colors hover:border-ink/30 hover:bg-ink/5 hover:text-ink disabled:opacity-40"
                  >
                    Comparar perspectiva
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 rounded bg-red-50 p-2 text-sm text-red-800">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="flex gap-2 pb-3 pt-1 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="min-w-0 flex-1 rounded border border-ink/20 px-3 py-2.5 text-base transition-shadow focus:outline-none focus:ring-2 focus:ring-amber-400 sm:text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="shrink-0 rounded bg-ink px-4 py-2.5 text-sm font-medium text-parchment transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
