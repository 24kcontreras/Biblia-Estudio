import "dotenv/config";
import { db, initDb } from "./src/db.ts";

async function main() {
    await initDb();
    const res = await db.execute("SELECT version, COUNT(*) as c FROM local_bible_text GROUP BY version");
    console.log(res.rows);
}

main().catch(console.error);
