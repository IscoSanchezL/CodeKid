import type { Block } from "@/engine/types";

/**
 * Cola de resultados que no se pudieron guardar (sin conexión, servidor caído…).
 * Se guarda en este navegador y se reintenta sola; el servidor vuelve a comprobar el programa,
 * así que reintentar es seguro y nunca da más estrellas de las merecidas.
 */
const KEY = "codekid:pending:v1";
const MAX_ITEMS = 50;

export type Pending = { userId: string; level: number; challenge: number; program: Block[]; at: number };
export type Store = Pick<Storage, "getItem" | "setItem">;

const browserStore = (): Store | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

const same = (a: Pending, b: Pending) => a.userId === b.userId && a.level === b.level && a.challenge === b.challenge;

export function readPending(store: Store | null = browserStore()): Pending[] {
  try {
    const raw = store?.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Pending[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: Pending[], store: Store | null) {
  try {
    store?.setItem(KEY, JSON.stringify(list.slice(-MAX_ITEMS)));
  } catch {
    // sin almacenamiento: no hay nada más que hacer
  }
}

/** Añade un resultado pendiente (si ya había uno del mismo reto, lo reemplaza por el más reciente). */
export function queuePending(item: Omit<Pending, "at">, store: Store | null = browserStore()) {
  const entry: Pending = { ...item, at: Date.now() };
  write([...readPending(store).filter((p) => !same(p, entry)), entry], store);
}

export function removePending(item: Pick<Pending, "userId" | "level" | "challenge">, store: Store | null = browserStore()) {
  write(
    readPending(store).filter((p) => !same(p, item as Pending)),
    store,
  );
}

export const pendingFor = (userId: string, store: Store | null = browserStore()) => readPending(store).filter((p) => p.userId === userId);

/**
 * Reintenta los pendientes de un usuario. Devuelve cuántos se guardaron.
 * Si el fallo es temporal el resultado se conserva; si el servidor lo rechaza de forma definitiva, se descarta.
 */
export async function flushPending(
  userId: string,
  submit: (p: Pending) => Promise<unknown>,
  isRetryable: (err: unknown) => boolean,
  store: Store | null = browserStore(),
): Promise<number> {
  let saved = 0;
  for (const p of pendingFor(userId, store)) {
    try {
      await submit(p);
      removePending(p, store);
      saved += 1;
    } catch (err) {
      if (!isRetryable(err)) removePending(p, store);
      else break; // sin conexión: no tiene sentido seguir probando el resto
    }
  }
  return saved;
}
