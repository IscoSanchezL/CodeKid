"use client";

import { useEffect, useMemo, useState } from "react";
import { challengesOf } from "@/engine/levels";
import { loadProgress, progressKey } from "@/lib/progress";

/** Estrellas ganadas en un nivel, p. ej. «★ 7/15». */
export function LevelStars({ level }: { level: number }) {
  const list = useMemo(() => challengesOf(level), [level]);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    let alive = true;
    loadProgress().then((all) => {
      if (alive) setStars(list.reduce((n, c) => n + (all[progressKey(c.level, c.challenge)] ?? 0), 0));
    });
    return () => {
      alive = false;
    };
  }, [list]);

  return (
    <span className="text-sm font-bold text-warn drop-shadow-sm">
      ★ {stars}/{list.length * 3}
    </span>
  );
}
