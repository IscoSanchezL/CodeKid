"use client";

import Link from "next/link";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { ADV_OFFSET, isAdvanced, levelMeta, planetOf } from "@/lib/levels";
import { maxStars, PASS_STARS } from "@/lib/unlock";
import { useMapProgress } from "@/components/map/use-current-level";
import { levelTitle, useT } from "@/i18n";

/** Estado del planeta (11★) al ganar: cuánto falta, o qué camino elegir al superarlo (modo avanzado o siguiente planeta). */
export function UnlockNote({ level }: { level: number }) {
  const t = useT();
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
        {t("unlock.progress", { have, need, where: adv ? t("unlock.whereAdv") : t("unlock.wherePlanet") })}
        {adv
          ? ` ${t("unlock.advPass", { need })}`
          : next
            ? ` ${t("unlock.nextOpens", { need, title: levelTitle(t, next.id, next.title) })}`
            : ""}
      </p>
    );
  return (
    <div role="status" className={box}>
      <p>
        {adv ? t("unlock.advDone") : t("unlock.planetDone")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-fg">
        {!adv && hasAdv && (
          <Link href={`/nivel/${advLevel}`} className="rounded-full border border-fuchsia-400/60 bg-surface px-3 py-1 font-extrabold">
            {t("unlock.advMode")}
          </Link>
        )}
        {next ? (
          <Link href={`/nivel/${planet + 1}`} className="rounded-full border border-cyan-400/60 bg-surface px-3 py-1 font-extrabold">
            {t("unlock.nextPlanet", { title: levelTitle(t, next.id, next.title) })}
          </Link>
        ) : (
          <Link href="/mapa" className="rounded-full border border-cyan-400/60 bg-surface px-3 py-1 font-extrabold">
            {t("unlock.backMap")}
          </Link>
        )}
      </div>
    </div>
  );
}
