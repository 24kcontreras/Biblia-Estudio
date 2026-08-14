import fs from "node:fs/promises";
import path from "node:path";
// NOTA: Debes instalar esta dependencia primero corriendo: npm install pdf-parse -w server
import pdf from "pdf-parse";
import { slugToUsfm } from "../src/services/bibleBookCodes.js";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
const PDF_FILE_PATH = path.join(process.cwd(), "data", "mibiblia.pdf"); // Ruta a tu PDF
const VERSION_ID = "spa_mi_pdf"; // Un ID único para tu versión
const OUTPUT_DIR = path.join(process.cwd(), "data", "local_bibles", VERSION_ID);

// Mapa inverso para encontrar el USFM por el nombre del libro en español.
// ¡ATENCIÓN! Tendrás que ajustar estos nombres exactos a cómo aparecen en tu PDF.
const BOOK_NAMES: Record<string, string> = {
  "Génesis": "GEN",
  "Éxodo": "EXO",
  "Levítico": "LEV",
  // ... agrega el resto de los libros que quieras extraer
};

// ============================================================================
// SCRIPT DE EXTRACCIÓN (Plantilla heurística)
// ============================================================================
async function extractVersesFromPdf() {
  console.log(`Leyendo PDF desde: ${PDF_FILE_PATH}`);
  const dataBuffer = await fs.readFile(PDF_FILE_PATH);
  
  console.log("Extrayendo texto del PDF... esto puede tardar un poco.");
  const data = await pdf(dataBuffer);
  const text = data.text;

  // --------------------------------------------------------------------------
  // LÓGICA DE PARSEO: Aquí es donde la magia (y la complejidad) ocurre.
  // Como cada PDF es distinto (doble columna, encabezados, etc.), este es 
  // solo un ejemplo básico asumiendo que el texto fluye línea a línea.
  // --------------------------------------------------------------------------
  
  // Expresión regular de ejemplo para capturar "Génesis 1:1 En el principio..."
  // ESTO DEBE CAMBIARSE COMPLETAMENTE DEPENDIENDO DEL FORMATO DE TU PDF
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

    parsedData[usfm][chapter].push({
      number: verseNum,
      text: verseText
    });
  }

  console.log("Extracción finalizada. Generando archivos JSON compatibles con HelloAO...");

  // --------------------------------------------------------------------------
  // GUARDAR COMO ESTRUCTURA JSON HelloAO
  // --------------------------------------------------------------------------
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
            content: [v.text] // HelloAO guarda el texto en un array
          }))
        }
      };

      await fs.writeFile(chapterFile, JSON.stringify(helloAoStructure, null, 2), "utf-8");
      console.log(`Guardado: ${usfm} Capítulo ${chapter}`);
    }
  }

  console.log(`\n¡Proceso completado! Archivos guardados en: ${OUTPUT_DIR}`);
  console.log(`Siguiente paso: Modificar 'server/src/services/bibleSource.ts' para leer esta carpeta.`);
}

extractVersesFromPdf().catch(console.error);
