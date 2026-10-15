"use client";

import { useEffect, useState } from "react";
import { CHALLENGES, PLAYABLE_LEVELS } from "@/engine/levels";
import { loadProgress, progressKey } from "@/lib/progress";

/** Nivel donde está el jugador: el primero con algún reto sin superar (o el último si los completó todos). null = cargando. */
export function useCurrentLevel(): number | null {
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadProgress().then((all) => {
      if (!alive) return;
      const next = PLAYABLE_LEVELS.find((lv) =>
        CHALLENGES.some((c) => c.level === lv && !(all[progressKey(c.level, c.challenge)] > 0)),
      );
      setCurrent(next ?? Math.max(...PLAYABLE_LEVELS));
    });
    return () => {
      alive = false;
    };
  }, []);

  return current;
}
