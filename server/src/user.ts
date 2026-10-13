import type { Request, RequestHandler, Response } from "express";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * No hay cuentas: cada navegador genera un UUID anónimo (ver client/src/lib/userId.ts) y lo manda
 * en X-User-Id. Funciona como un token: quien lo conoce ve y edita esos datos, así que el cliente
 * lo trata como secreto ("código de sincronización").
 */
export function getUserId(req: Request): string | null {
  const id = req.header("X-User-Id");
  return id && UUID_RE.test(id) ? id.toLowerCase() : null;
}

/** Rechaza la petición si no trae un X-User-Id válido; si lo trae, lo deja en res.locals.userId. */
export const requireUser: RequestHandler = (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(400).json({ error: "Falta el identificador de usuario (header X-User-Id)." });
    return;
  }
  res.locals.userId = userId;
  next();
};

export function userIdOf(res: Response): string {
  return res.locals.userId as string;
}
