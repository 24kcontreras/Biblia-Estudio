import { randomUUID } from "node:crypto";
import { Router } from "express";
import { AIConfigError, getAIProvider } from "../ai/index.js";
import type { ChatMessage } from "../ai/index.js";
import { db } from "../db.js";

export const chatRouter = Router();

interface MessageRow {
  role: "user" | "assistant";
  content: string;
}

chatRouter.get("/:sessionId", (req, res) => {
  const rows = db
    .prepare("SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id ASC")
    .all(req.params.sessionId) as unknown as MessageRow[];
  res.json({ messages: rows });
});

chatRouter.post("/", async (req, res) => {
  const { message, sessionId: sessionIdInput } = req.body ?? {};
  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Falta el mensaje." });
    return;
  }

  const sessionId = typeof sessionIdInput === "string" && sessionIdInput ? sessionIdInput : randomUUID();

  let provider;
  try {
    provider = getAIProvider();
  } catch (err) {
    if (err instanceof AIConfigError) {
      res.status(503).json({ error: err.message });
      return;
    }
    throw err;
  }

  const history = db
    .prepare("SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id ASC")
    .all(sessionId) as unknown as MessageRow[];

  const messages: ChatMessage[] = [...history, { role: "user", content: message }];

  db.prepare("INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)").run(sessionId, message);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullText = "";
  try {
    for await (const chunk of provider.streamChat(messages)) {
      fullText += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    db.prepare("INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)").run(sessionId, fullText);
    res.write(`event: done\ndata: ${JSON.stringify({ sessionId })}\n\n`);
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
  } finally {
    res.end();
  }
});
