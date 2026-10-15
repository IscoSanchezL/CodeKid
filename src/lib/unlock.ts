import { CHALLENGES, PLAYABLE_LEVELS } from "@/engine/levels";
import { progressKey, type ProgressMap } from "@/lib/progress";

/** Estrellas que hay que reunir en un planeta para poder pasar al siguiente (de 15). */
export const PASS_STARS = 11;

/** Estrellas ganadas por el jugador en un nivel. */
export function starsOfLevel(level: number, progress: ProgressMap): number {
  return CHALLENGES.filter((c) => c.level === level).reduce(
    (n, c) => n + (progress[progressKey(c.level, c.challenge)] ?? 0),
    0,
  );
}

export const maxStars = (level: number) =>
  CHALLENGES.filter((c) => c.level === level).length * 3;

/** Un planeta se abre al sacar PASS_STARS en el anterior. Docentes y administradores ven todo abierto. */
export function unlockedLevels(
  progress: ProgressMap,
  staff: boolean,
): Set<number> {
  const open = new Set<number>();
  for (const lv of PLAYABLE_LEVELS) {
    if (
      staff ||
      lv === PLAYABLE_LEVELS[0] ||
      starsOfLevel(lv - 1, progress) >= Math.min(PASS_STARS, maxStars(lv - 1))
    )
      open.add(lv);
    else break;
  }
  return open;
}

/** Planetas superados (con las estrellas mínimas). */
export function passedLevels(progress: ProgressMap): Set<number> {
  return new Set(
    PLAYABLE_LEVELS.filter(
      (lv) => starsOfLevel(lv, progress) >= Math.min(PASS_STARS, maxStars(lv)),
    ),
  );
}

/** Donde está el jugador: el primer planeta que aún no ha superado (o el último si superó todos). */
export function currentLevel(progress: ProgressMap): number {
  const passed = passedLevels(progress);
  return (
    PLAYABLE_LEVELS.find((lv) => !passed.has(lv)) ??
    Math.max(...PLAYABLE_LEVELS)
  );
}
