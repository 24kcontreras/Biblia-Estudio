import fs from "node:fs/promises";
import path from "node:path";
import { slugToUsfm } from "../src/services/bibleBookCodes.js";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
const TXT_FILE_PATH = path.join(process.cwd(), "data", "mibiblia.txt"); // Tu PDF convertido a TXT
const VERSION_ID = "spa_mi_version";
const OUTPUT_DIR = path.join(process.cwd(), "data", "local_bibles", VERSION_ID);

const BOOK_NAMES: Record<string, string> = {
  "Génesis": "GEN",
  "Éxodo": "EXO",
  "Levítico": "LEV",
  // ... completa según los nombres en tu archivo .txt
};

async function extractVersesFromTxt() {
  console.log(`Leyendo TXT desde: ${TXT_FILE_PATH}`);
  const text = await fs.readFile(TXT_FILE_PATH, "utf-8");

  // Ajusta esta expresión regular dependiendo de cómo se vea tu archivo .txt
  const regex = /(Génesis|Éxodo)\s+(\d+):(\d+)\s+(.+?)(?=(?:Génesis|Éxodo)\s+\d+:\d+|$)/gs;
  
  let match;
  const parsedData: Record<string, Record<string, { number: number, text: string }[]>> = {};

  while ((match = regex.exec(text)) !== null) {
    const bookName = match[1];
    const chapter = match[2];
    const verseNum = parseInt(match[3], 10);
    const verseText = match[4].trim();

    const usfm = BOOK_NAMES[bookName];
    if (!usfm) continue;

    if (!parsedData[usfm]) parsedData[usfm] = {};
    if (!parsedData[usfm][chapter]) parsedData[usfm][chapter] = [];

    parsedData[usfm][chapter].push({ number: verseNum, text: verseText });
  }

  for (const [usfm, chapters] of Object.entries(parsedData)) {
    const bookDir = path.join(OUTPUT_DIR, usfm);
    await fs.mkdir(bookDir, { recursive: true });

    for (const [chapter, verses] of Object.entries(chapters)) {
      const chapterFile = path.join(bookDir, `${chapter}.json`);
      const helloAoStructure = {
        chapter: {
          content: verses.map(v => ({
            type: "verse",
            number: v.number,
            content: [v.text]
          }))
        }
      };
      await fs.writeFile(chapterFile, JSON.stringify(helloAoStructure, null, 2), "utf-8");
    }
  }

  console.log(`¡Completado! Archivos en: ${OUTPUT_DIR}`);
}

extractVersesFromTxt().catch(console.error);
