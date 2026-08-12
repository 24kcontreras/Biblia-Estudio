import "dotenv/config";
import { db, initDb } from "../src/db.js";

interface WorkRow {
  slug: string;
  name: string;
  chapter_count: number;
}

interface ChapterRow {
  chapter_number: number;
  content: string;
}

async function main(): Promise<void> {
  await initDb();
  const works = (await db.all("SELECT slug, name, chapter_count FROM apocrypha_works")) as WorkRow[];
  for (const w of works) {
    const rows = (await db.all(
      "SELECT chapter_number, content FROM apocrypha_chapters WHERE work_slug = ? ORDER BY chapter_number",
      w.slug
    )) as ChapterRow[];
    const untranslated: number[] = [];
    for (const r of rows) {
      const c = r.content;
      const hasSpanishAccents = /[áéíóúñ¿¡]/i.test(c);
      const hasCommonSpanishWords = /\b(que|para|con|los|las|del|una|dios|señor)\b/i.test(c);
      if (!hasSpanishAccents && !hasCommonSpanishWords) untranslated.push(r.chapter_number);
    }
    console.log(`${w.slug} (${w.name}): ${rows.length} capítulos, sospechosos de quedar en inglés: ${untranslated.length}`);
    if (untranslated.length) console.log("  capítulos:", untranslated.join(", "));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
