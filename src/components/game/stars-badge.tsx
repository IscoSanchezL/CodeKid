"use client";

import { useEffect, useState } from "react";
import { loadProgress, progressKey } from "@/lib/progress";
import { useT } from "@/i18n";

export function StarsBadge({ level, challenge }: { level: number; challenge: number }) {
  const [stars, setStars] = useState(0);
  const t = useT();

  useEffect(() => {
    let alive = true;
    loadProgress().then((all) => {
      if (alive) setStars(all[progressKey(level, challenge)] ?? 0);
    });
    return () => {
      alive = false;
    };
  }, [level, challenge]);

  return (
    <span aria-label={t("stars.aria", { n: stars })} className="text-lg tracking-tight text-warn">
      {"★".repeat(stars)}
      <span className="opacity-25">{"★".repeat(3 - stars)}</span>
    </span>
  );
}
