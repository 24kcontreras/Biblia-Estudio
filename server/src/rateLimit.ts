import type { Request, Response } from "express";
import { db } from "./db.js";
import { getUserId } from "./user.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const PER_IP_PER_HOUR = Number(process.env.AI_RATE_LIMIT_PER_HOUR ?? 20);
const GLOBAL_PER_DAY = Number(process.env.AI_DAILY_LIMIT ?? 300);

/**
 * Suma 1 al contador `key` dentro de la ventana fija actual y dice si sigue bajo `limit`.
 * Vive en la base (no en memoria) porque en Vercel cada instancia de la función tendría su propio
 * contador. En el UPDATE, `window_start` y `count` del lado derecho son los valores viejos de la fila.
 */
async function hit(key: string, windowMs: number, limit: number): Promise<boolean> {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const row = (await db.get(
    `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN window_start = excluded.window_start THEN count + 1 ELSE 1 END,
       window_start = excluded.window_start
     RETURNING count`,
    key,
    windowStart
  )) as { count: number };
  return row.count <= limit;
}

function clientIp(req: Request): string {
  // Vercel pone la IP real del cliente en x-real-ip (y la sobrescribe si el cliente la manda).
  return req.header("x-real-ip") ?? req.socket.remoteAddress ?? "unknown";
}

/**
 * Consume una llamada a la IA para quien hace la petición: límite por IP por hora y un tope global
 * por día (que acota el gasto aunque alguien rote IPs). Solo se llama cuando de verdad se va a
 * generar algo — las respuestas cacheadas no cuentan. El dueño (OWNER_USER_ID) no tiene límite.
 * Si se pasa, responde 429 y devuelve false.
 */
export async function consumeAiQuota(req: Request, res: Response): Promise<boolean> {
  const owner = process.env.OWNER_USER_ID?.toLowerCase();
  if (owner && getUserId(req) === owner) return true;

  if (!(await hit(`ip:${clientIp(req)}`, HOUR, PER_IP_PER_HOUR))) {
    res.status(429).json({ error: "Llegaste al límite de consultas a la IA por esta hora. Intenta más tarde." });
    return false;
  }
  if (!(await hit("global", DAY, GLOBAL_PER_DAY))) {
    res.status(429).json({ error: "Se alcanzó el límite diario de consultas a la IA del demo. Vuelve mañana." });
    return false;
  }
  return true;
}
