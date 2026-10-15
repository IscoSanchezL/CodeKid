"use client";

import { useEffect, useState } from "react";
import { CHALLENGES, PLAYABLE_LEVELS } from "@/engine/levels";
import { loadProgress, progressKey } from "@/lib/progress";

export type MapProgress = { current: number | null; done: Set<number> };

/** Dónde está el jugador: el primer nivel con algún reto sin superar (o el último si los completó todos) y los niveles terminados. */
export function useMapProgress(): MapProgress {
  const [state, setState] = useState<MapProgress>({ current: null, done: new Set() });

  useEffect(() => {
    let alive = true;
    loadProgress().then((all) => {
      if (!alive) return;
      const finished = (lv: number) => CHALLENGES.filter((c) => c.level === lv).every((c) => all[progressKey(c.level, c.challenge)] > 0);
      const next = PLAYABLE_LEVELS.find((lv) => !finished(lv));
      setState({ current: next ?? Math.max(...PLAYABLE_LEVELS), done: new Set(PLAYABLE_LEVELS.filter(finished)) });
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
