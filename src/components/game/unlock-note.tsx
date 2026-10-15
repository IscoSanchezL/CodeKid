"use client";

import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";
import { maxStars, PASS_STARS } from "@/lib/unlock";
import { useMapProgress } from "@/components/map/use-current-level";

/** Cuánto falta para abrir el siguiente planeta (11 estrellas en este). */
export function UnlockNote({ level }: { level: number }) {
  const state = useMapProgress();
  const next = PLAYABLE_LEVELS.includes(level + 1)
    ? LEVELS.find((l) => l.id === level + 1)
    : null;
  if (!state.ready || !next) return null;
  const need = Math.min(PASS_STARS, maxStars(level));
  const have = state.stars(level);
  const passed = have >= need;
  return (
    <p
      role="status"
      className={`mt-3 rounded-xl p-3 text-sm font-semibold ${passed ? "bg-success/15 text-success" : "bg-surface-2 text-fg"}`}
    >
      {passed ? (
        <>🎉 ¡Planeta superado! Ya puedes viajar a «{next.title}».</>
      ) : (
        <>
          🚀 Llevas {have}/{need}★ en este planeta. Con {need} se abre «
          {next.title}».
        </>
      )}
    </p>
  );
}
