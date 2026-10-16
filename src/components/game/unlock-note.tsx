"use client";

import Link from "next/link";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { ADV_OFFSET, isAdvanced, levelMeta, planetOf } from "@/lib/levels";
import { maxStars, PASS_STARS } from "@/lib/unlock";
import { useMapProgress } from "@/components/map/use-current-level";

/** Estado del planeta (11★) al ganar: cuánto falta, o qué camino elegir al superarlo (modo avanzado o siguiente planeta). */
export function UnlockNote({ level }: { level: number }) {
  const state = useMapProgress();
  const adv = isAdvanced(level);
  const planet = planetOf(level);
  const next = PLAYABLE_LEVELS.includes(planet + 1)
    ? levelMeta(planet + 1)
    : null;
  const advLevel = planet + ADV_OFFSET;
  const hasAdv = PLAYABLE_LEVELS.includes(advLevel);
  if (!state.ready) return null;
  const need = Math.min(PASS_STARS, maxStars(level));
  const have = state.stars(level);
  const passed = have >= need;

  const box = `mt-3 rounded-xl p-3 text-sm font-semibold ${passed ? "bg-success/15 text-success" : "bg-surface-2 text-fg"}`;
  if (!passed)
    return (
      <p role="status" className={box}>
        🚀 Llevas {have}/{need}★ en {adv ? "el modo avanzado" : "este planeta"}.
        {adv
          ? ` Con ${need} lo superas.`
          : next
            ? ` Con ${need} se abre «${next.title}».`
            : ""}
      </p>
    );
  return (
    <div role="status" className={box}>
      <p>
        {adv
          ? "🏅 ¡Modo avanzado superado!"
          : "🎉 ¡Planeta superado! ¿Qué quieres hacer ahora?"}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-fg">
        {!adv && hasAdv && (
          <Link href={`/nivel/${advLevel}`} className="rounded-full border border-fuchsia-400/60 bg-surface px-3 py-1 font-extrabold">
            ⚡ Modo avanzado
          </Link>
        )}
        {next ? (
          <Link href={`/nivel/${planet + 1}`} className="rounded-full border border-cyan-400/60 bg-surface px-3 py-1 font-extrabold">
            🚀 Siguiente planeta: {next.title}
          </Link>
        ) : (
          <Link href="/mapa" className="rounded-full border border-cyan-400/60 bg-surface px-3 py-1 font-extrabold">
            🗺️ Volver al mapa
          </Link>
        )}
      </div>
    </div>
  );
}
