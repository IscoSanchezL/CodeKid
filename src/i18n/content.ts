import { dictionaries, type TFn } from "./core";
import { ADV_OFFSET } from "@/lib/levels";

const has = (key: string) => key in dictionaries.es;

/** Nombre de un nivel (planeta o modo avanzado) en el idioma activo; si falta la traducción, el original. */
export function levelTitle(t: TFn, id: number, fallback = ""): string {
  if (id > ADV_OFFSET) {
    const base = `lv.${id - ADV_OFFSET}.title`;
    return has(base) ? t("lv.adv.title", { title: t(base) }) : fallback;
  }
  const k = `lv.${id}.title`;
  return has(k) ? t(k) : fallback;
}

export function levelSummary(t: TFn, id: number, fallback = ""): string {
  if (id > ADV_OFFSET) {
    const base = `lv.${id - ADV_OFFSET}.title`;
    return has(base) ? t("lv.adv.summary", { title: t(base) }) : fallback;
  }
  const k = `lv.${id}.summary`;
  return has(k) ? t(k) : fallback;
}

/** Título de un reto. El texto original (en español) viene del motor y sirve de respaldo. */
export function challengeTitle(t: TFn, level: number, challenge: number, fallback: string): string {
  const k = `ch.${level}.${challenge}.title`;
  return has(k) ? t(k) : fallback;
}

export function challengeHint(t: TFn, level: number, challenge: number, fallback: string): string {
  const k = `ch.${level}.${challenge}.hint`;
  return has(k) ? t(k) : fallback;
}

/** Nombre del mundo (isla) de cada nivel: `world.1` … `world.10`. */
export const worldName = (t: TFn, n: number) => t(`world.${n}`);
