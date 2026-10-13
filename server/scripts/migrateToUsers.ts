/**
 * Migración de una sola corrida, para bases creadas antes de que los datos personales tuvieran
 * user_id (marcas, colecciones, respuestas y análisis guardados):
 *   npm run migrate:users -w server -- <tu-código>
 *
 * <tu-código> es el código de sincronización que aparece en la app (Guardado → Código de
 * sincronización). Todas las filas existentes quedan asignadas a ese usuario. Si no se pasa
 * ninguno, se genera uno nuevo y se imprime para pegarlo en la app.
 *
 * Por cada tabla: la renombra a <tabla>_legacy, crea la nueva con user_id y copia las filas.
 * Las tablas _legacy no se borran — cuando verifiques que todo está bien, puedes hacer DROP a mano.
 * Es idempotente: las tablas que ya tienen user_id se saltan.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { USER_TABLES, db, initDb } from "../src/db.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function columnsOf(table: string): Promise<string[]> {
  const rows = (await db.all("SELECT name FROM pragma_table_info(?)", table)) as { name: string }[];
  return rows.map((r) => r.name);
}

async function main() {
  const arg = process.argv[2];
  if (arg && !UUID_RE.test(arg)) {
    throw new Error(`"${arg}" no es un código válido (debe ser un UUID, como el que muestra la app).`);
  }
  const ownerId = (arg ?? randomUUID()).toLowerCase();

  for (const [table, createSql] of Object.entries(USER_TABLES)) {
    const columns = await columnsOf(table);
    if (columns.length === 0) {
      console.log(`[${table}] no existe todavía, se creará vacía.`);
      continue;
    }
    if (columns.includes("user_id")) {
      console.log(`[${table}] ya tiene user_id, se salta.`);
      continue;
    }
    if ((await columnsOf(`${table}_legacy`)).length > 0) {
      throw new Error(`Ya existe ${table}_legacy de una corrida anterior incompleta. Revísala a mano antes de seguir.`);
    }

    const columnList = columns.join(", ");
    await db.batch(
      [
        `ALTER TABLE ${table} RENAME TO ${table}_legacy`,
        createSql,
        {
          sql: `INSERT INTO ${table} (user_id, ${columnList}) SELECT ?, ${columnList} FROM ${table}_legacy`,
          args: [ownerId],
        },
      ],
      "write"
    );
    const { count } = (await db.get(`SELECT COUNT(*) AS count FROM ${table}`)) as { count: number };
    console.log(`[${table}] migrada: ${count} filas asignadas al usuario.`);
  }

  await initDb();

  console.log(`\nListo. Código del dueño: ${ownerId}`);
  if (!arg) console.log("Pégalo en la app (Guardado → Código de sincronización → Usar otro código).");
  console.log("Para no tener límite de uso de la IA, pon OWNER_USER_ID con ese valor en las variables de entorno.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
