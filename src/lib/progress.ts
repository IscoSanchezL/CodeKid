const KEY = "codekid:progress:v1";

export type ProgressMap = Record<string, number>;

export const progressKey = (level: number, challenge: number) => `${level}-${challenge}`;

export function loadProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

/** Guarda el mejor resultado (nunca baja las estrellas ya ganadas). */
export function saveStars(level: number, challenge: number, stars: number): ProgressMap {
  const all = loadProgress();
  const k = progressKey(level, challenge);
  all[k] = Math.max(all[k] ?? 0, stars);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // sin almacenamiento disponible: el progreso queda solo en memoria
  }
  return all;
}
