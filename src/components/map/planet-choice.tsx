"use client";

import Link from "next/link";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { ADV_OFFSET, isAdvanced, levelMeta, planetOf } from "@/lib/levels";
import { maxStars, starsNeeded, prerequisite } from "@/lib/unlock";
import { useMapProgress } from "./use-current-level";

/**
 * Al superar un planeta (11★) el jugador elige: practicar el modo avanzado de ese planeta
 * o seguir al siguiente planeta. Al superar el modo avanzado, el siguiente paso es el siguiente planeta.
 */
export function PlanetChoice({ level }: { level: number }) {
  const state = useMapProgress();
  if (!state.ready) return null;
  const adv = isAdvanced(level);
  const planet = planetOf(level);
  const advLevel = planet + ADV_OFFSET;
  const nextPlanet = planet + 1;
  const hasNext = PLAYABLE_LEVELS.includes(nextPlanet);
  const baseDone = state.stars(planet) >= starsNeeded(advLevel);
  const advHave = state.stars(advLevel);
  const advMax = maxStars(advLevel);
  const advDone = advHave >= Math.min(11, advMax);
  const nextTitle = levelMeta(nextPlanet)?.title;

  if (adv) {
    if (!advDone) return null;
    return (
      <div className="mt-4 rounded-2xl border border-success/40 bg-success/10 p-4">
        <p className="font-extrabold text-success">🏅 ¡Modo avanzado superado!</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {hasNext && (
            <Link href={`/nivel/${nextPlanet}`} className="btn-gloss rounded-full bg-gradient-to-b from-[#5ee3ff] to-[#1fa7ff] px-4 py-2 font-extrabold text-[#06214a] shadow-[0_3px_0_#0b6aa8]">
              🚀 Siguiente planeta: {nextTitle}
            </Link>
          )}
          <Link href="/mapa" className="rounded-full px-3 py-2 font-semibold text-brand">Volver al mapa</Link>
        </div>
      </div>
    );
  }

  if (!baseDone || prerequisite(advLevel) !== planet) return null;
  return (
    <div className="mt-4 rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-indigo-500/10 to-cyan-400/10 p-4">
      <p className="font-extrabold">🎉 ¡Planeta superado! ¿Qué quieres hacer ahora?</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/nivel/${advLevel}`}
          className="lift rounded-2xl border border-fuchsia-400/50 bg-surface p-3"
        >
          <span className="block text-lg font-extrabold">⚡ Modo avanzado</span>
          <span className="block text-sm text-muted">
            Retos más difíciles de este mismo tema. {advHave}/{advMax}★
          </span>
        </Link>
        {hasNext ? (
          <Link
            href={`/nivel/${nextPlanet}`}
            className="lift rounded-2xl border border-cyan-400/50 bg-surface p-3"
          >
            <span className="block text-lg font-extrabold">🚀 Siguiente planeta</span>
            <span className="block text-sm text-muted">{nextTitle}</span>
          </Link>
        ) : (
          <Link href="/mapa" className="lift rounded-2xl border border-cyan-400/50 bg-surface p-3">
            <span className="block text-lg font-extrabold">🗺️ Volver al mapa</span>
            <span className="block text-sm text-muted">¡Terminaste todos los planetas!</span>
          </Link>
        )}
      </div>
    </div>
  );
}
