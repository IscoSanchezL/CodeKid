"use client";

import { useEffect, useState } from "react";
import { loadProgress, progressKey } from "@/lib/progress";

export function StarsBadge({ level, challenge }: { level: number; challenge: number }) {
  const [stars, setStars] = useState(0);

  useEffect(() => {
    setStars(loadProgress()[progressKey(level, challenge)] ?? 0);
  }, [level, challenge]);

  return (
    <span aria-label={`${stars} de 3 estrellas`} className="text-lg tracking-tight text-warn">
      {"★".repeat(stars)}
      <span className="opacity-25">{"★".repeat(3 - stars)}</span>
    </span>
  );
}
