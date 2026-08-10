import "dotenv/config";
import cors from "cors";
import express from "express";
import { bibleRouter } from "./routes/bible.js";
import { chatRouter } from "./routes/chat.js";
import { collectionsRouter } from "./routes/collections.js";
import { marksRouter } from "./routes/marks.js";
import { verseAnalysisRouter } from "./routes/verseAnalysis.js";
import "./db.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.use("/api/bible", bibleRouter);
app.use("/api/chat", chatRouter);
app.use("/api/verse/analyze", verseAnalysisRouter);
app.use("/api/marks", marksRouter);
app.use("/api/collections", collectionsRouter);

app.get("/api/health", (_req, res) => {
  const aiProvider = process.env.AI_PROVIDER ?? "anthropic";
  const aiConfigured =
    aiProvider === "gemini" ? Boolean(process.env.GEMINI_API_KEY) : Boolean(process.env.ANTHROPIC_API_KEY);
  res.json({ ok: true, aiProvider, aiConfigured });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`BibleChat backend escuchando en http://localhost:${PORT}`);
});
