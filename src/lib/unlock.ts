import { CHALLENGES, PLAYABLE_LEVELS } from "@/engine/levels";
import { ADV_OFFSET, isAdvanced } from "@/lib/levels";
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

/** Nivel que hay que superar para abrir este: el planeta anterior, o el propio planeta si es su modo avanzado (0 = ninguno). */
export function prerequisite(level: number): number {
  return isAdvanced(level) ? level - ADV_OFFSET : level - 1;
}

/** Estrellas mínimas del prerrequisito de un nivel. */
export function starsNeeded(level: number): number {
  return Math.min(PASS_STARS, maxStars(prerequisite(level)));
}

/** Un planeta se abre al sacar PASS_STARS en el anterior; su modo avanzado, al superar el propio planeta. Docentes y administradores ven todo abierto. */
export function unlockedLevels(
  progress: ProgressMap,
  staff: boolean,
): Set<number> {
  const open = new Set<number>();
  // planetas básicos: en cadena, sin saltarse ninguno
  for (const lv of PLAYABLE_LEVELS.filter((l) => !isAdvanced(l))) {
    if (
      staff ||
      lv === PLAYABLE_LEVELS[0] ||
      starsOfLevel(prerequisite(lv), progress) >= starsNeeded(lv)
    )
      open.add(lv);
    else break;
  }
  // modo avanzado: se abre al superar su planeta
  for (const lv of PLAYABLE_LEVELS.filter(isAdvanced)) {
    if (
      staff ||
      (open.has(prerequisite(lv)) &&
        starsOfLevel(prerequisite(lv), progress) >= starsNeeded(lv))
    )
      open.add(lv);
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
  const base = PLAYABLE_LEVELS.filter((lv) => !isAdvanced(lv));
  return base.find((lv) => !passed.has(lv)) ?? Math.max(...base);
}
