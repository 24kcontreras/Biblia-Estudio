import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { db, initDb } from "../src/db.js";

const LOCAL_VERSIONS = ["spa_tnm"];
const BATCH_SIZE = 500;

async function ingestLocalVersion(versionId: string) {
  const versionDir = path.join(process.cwd(), "data", "local_bibles", versionId);
  
  let books: string[] = [];
  try {
    books = await fs.readdir(versionDir);
  } catch (err) {
    console.log(`[local] No se encontró la carpeta para ${versionId}, omitiendo...`);
    return 0;
  }

  const rows: { book: string; chapter: number; verse: number; text: string }[] = [];

  for (const book of books) {
    const bookDir = path.join(versionDir, book);
    const stat = await fs.stat(bookDir);
    if (!stat.isDirectory()) continue;

    const chapters = await fs.readdir(bookDir);
    for (const chapterFile of chapters) {
      if (!chapterFile.endsWith(".json")) continue;
      
      const chapter = parseInt(chapterFile.replace(".json", ""), 10);
      const filePath = path.join(bookDir, chapterFile);
      
      const content = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(content);
      
      for (const entry of data.chapter.content) {
        if (entry.type !== "verse") continue;
        const text = entry.content.join(" ").trim();
        rows.push({ book, chapter, verse: entry.number, text });
      }
    }
  }

  if (rows.length === 0) return 0;

  // Limpiar primero esta versión de la tabla local_bible_text
  await db.batch([{
    sql: "DELETE FROM local_bible_text WHERE version = ?",
    args: [versionId],
  }]);

  // Limpiar de la tabla de búsqueda para re-ingestar
  await db.batch([{
    sql: "DELETE FROM bible_search WHERE version = ?",
    args: [versionId],
  }]);

  // Insertar en lotes en ambas tablas
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    
    // Ingestar para Lectura
    await db.batch(
      chunk.map((r) => ({
        sql: "INSERT INTO local_bible_text (version, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)",
        args: [versionId, r.book, r.chapter, r.verse, r.text],
      }))
    );
    
    // Ingestar para Búsqueda (FTS5)
    await db.batch(
      chunk.map((r) => ({
        sql: "INSERT INTO bible_search (version, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)",
        args: [versionId, r.book, r.chapter, r.verse, r.text],
      }))
    );
  }

  return rows.length;
}

async function main() {
  await initDb();

  console.log("Ingestando Biblias Locales en la base de datos Turso...");
  
  for (const version of LOCAL_VERSIONS) {
    const count = await ingestLocalVersion(version);
    console.log(`[local] ${version}: ${count} versículos indexados en lectura y búsqueda.`);
  }

  console.log("¡Ingesta de Biblias Locales completada!");
}

main().catch((err) => {
  console.error("La ingesta local falló:", err);
  process.exit(1);
});
