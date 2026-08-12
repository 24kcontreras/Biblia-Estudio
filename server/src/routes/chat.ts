import { randomUUID } from "node:crypto";
import { Router } from "express";
import { AIConfigError, getAIProvider } from "../ai/index.js";
import type { ChatMessage } from "../ai/index.js";
import { asyncHandler } from "../asyncHandler.js";
import { db } from "../db.js";

export const chatRouter = Router();

function friendlyAIError(err: Error): string {
  const message = err.message ?? "";
  if (message.includes("429") || /quota|rate.?limit/i.test(message)) {
    return "Se alcanzó el límite de uso de la IA por ahora. Espera un minuto e intenta de nuevo.";
  }
  return "No se pudo generar la respuesta. Intenta de nuevo.";
}

interface MessageRow {
  role: "user" | "assistant";
  content: string;
}

interface SavedChatAnswerRow {
  id: number;
  question: string | null;
  answer: string;
  created_at: string;
}

chatRouter.get(
  "/saved",
  asyncHandler(async (_req, res) => {
    const rows = (await db.all(
      "SELECT id, question, answer, created_at FROM saved_chat_answers ORDER BY created_at DESC"
    )) as SavedChatAnswerRow[];
    res.json({ saved: rows });
  })
);

chatRouter.post(
  "/saved",
  asyncHandler(async (req, res) => {
    const { question, answer } = req.body ?? {};
    if (typeof answer !== "string" || !answer.trim()) {
      res.status(400).json({ error: "Falta la respuesta a guardar." });
      return;
    }

    const result = await db.run(
      "INSERT INTO saved_chat_answers (question, answer) VALUES (?, ?)",
      typeof question === "string" && question.trim() ? question : null,
      answer
    );
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  })
);

chatRouter.delete(
  "/saved/:id",
  asyncHandler(async (req, res) => {
    await db.run("DELETE FROM saved_chat_answers WHERE id = ?", Number(req.params.id));
    res.status(204).end();
  })
);

chatRouter.get(
  "/:sessionId",
  asyncHandler(async (req, res) => {
    const rows = (await db.all(
      "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id ASC",
      req.params.sessionId
    )) as MessageRow[];
    res.json({ messages: rows });
  })
);

chatRouter.post(
  "/",
  asyncHandler(async (req, res) => {
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

    const history = (await db.all(
      "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id ASC",
      sessionId
    )) as MessageRow[];

    const messages: ChatMessage[] = [...history, { role: "user", content: message }];

    await db.run("INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)", sessionId, message);

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
      await db.run(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)",
        sessionId,
        fullText
      );
      res.write(`event: done\ndata: ${JSON.stringify({ sessionId })}\n\n`);
    } catch (err) {
      console.error(err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: friendlyAIError(err as Error) })}\n\n`);
    } finally {
      res.end();
    }
  })
);
