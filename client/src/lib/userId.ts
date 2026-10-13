const STORAGE_KEY = "biblechat:userId";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Identificador anónimo de este navegador. El backend lo usa para separar las marcas, colecciones
 * y guardados de cada persona. Se crea la primera vez que se pide.
 */
export function getUserId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id || !UUID_RE.test(id)) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/** Reemplaza el identificador por uno traído de otro dispositivo. Devuelve false si no es válido. */
export function setUserId(id: string): boolean {
  const trimmed = id.trim().toLowerCase();
  if (!UUID_RE.test(trimmed)) return false;
  localStorage.setItem(STORAGE_KEY, trimmed);
  return true;
}
