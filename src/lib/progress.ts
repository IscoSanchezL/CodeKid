import { createClient } from "@/lib/supabase/client";

const KEY = "codekid:progress:v1";

export type ProgressMap = Record<string, number>;

export const progressKey = (level: number, challenge: number) => `${level}-${challenge}`;

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await createClient().auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

function readLocal(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeLocal(all: ProgressMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // sin almacenamiento disponible: el progreso queda solo en memoria
  }
}

// Evita pedir lo mismo varias veces en una pantalla con muchas tarjetas
let cache: { userId: string | null; at: number; promise: Promise<ProgressMap> } | null = null;

/** Estrellas por reto del usuario actual (Supabase si hay sesión; si no, este navegador). */
export async function loadProgress(): Promise<ProgressMap> {
  const userId = await currentUserId();
  if (cache && cache.userId === userId && Date.now() - cache.at < 2000) return cache.promise;

  const promise = (async () => {
    if (!userId) return readLocal();
    const { data } = await createClient().from("progress").select("level, challenge, stars").eq("student_id", userId);
    const map: ProgressMap = {};
    for (const row of data ?? []) map[progressKey(row.level as number, row.challenge as number)] = row.stars as number;
    return map;
  })();
  cache = { userId, at: Date.now(), promise };
  return promise;
}

/** Guarda el mejor resultado: nunca baja las estrellas ni sube los bloques ya logrados. */
export async function saveResult(level: number, challenge: number, stars: number, blocks: number): Promise<void> {
  cache = null;
  const userId = await currentUserId();

  if (!userId) {
    const all = readLocal();
    const k = progressKey(level, challenge);
    all[k] = Math.max(all[k] ?? 0, stars);
    writeLocal(all);
    return;
  }

  const supabase = createClient();
  const { data: prev } = await supabase
    .from("progress")
    .select("stars, attempts, best_blocks")
    .eq("student_id", userId)
    .eq("level", level)
    .eq("challenge", challenge)
    .maybeSingle();

  await supabase.from("progress").upsert({
    student_id: userId,
    level,
    challenge,
    stars: Math.max(prev?.stars ?? 0, stars),
    attempts: (prev?.attempts ?? 0) + 1,
    best_blocks: prev?.best_blocks != null ? Math.min(prev.best_blocks, blocks) : blocks,
    completed_at: new Date().toISOString(),
  });
}
