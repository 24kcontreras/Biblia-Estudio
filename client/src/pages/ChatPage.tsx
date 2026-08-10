import { useEffect, useRef, useState } from "react";
import { getChatHistory, streamChat, type ChatMessage } from "../api/client";
import { CitationText } from "../components/CitationText";
import { usePreferredVersion } from "../hooks/usePreferredVersion";

const SESSION_KEY = "biblechat:chatSession";

export function ChatPage() {
  const [version] = usePreferredVersion();
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setError(null);
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);

    await streamChat(text, sessionId, {
      onChunk: (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: next[next.length - 1].content + chunk };
          return next;
        });
      },
      onDone: (newSessionId) => {
        if (newSessionId !== sessionId) {
          localStorage.setItem(SESSION_KEY, newSessionId);
          setSessionId(newSessionId);
        }
        setSending(false);
      },
      onError: (message) => {
        setError(message);
        setSending(false);
        setMessages((prev) => (prev[prev.length - 1]?.content === "" ? prev.slice(0, -1) : prev));
      },
    });
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
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed sm:max-w-[85%] ${
                m.role === "user" ? "bg-ink text-parchment" : "bg-white shadow-sm"
              }`}
            >
              {m.role === "assistant" ? <CitationText text={m.content} version={version} /> : m.content}
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
          className="min-w-0 flex-1 rounded border border-ink/20 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 sm:text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="shrink-0 rounded bg-ink px-4 py-2.5 text-sm font-medium text-parchment disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
