"use client";

import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/progress";
import { useT } from "@/i18n";

/** Total de estrellas ganadas por el usuario actual. */
export function StarsTotal() {
  const [total, setTotal] = useState(0);
  const t = useT();
  useEffect(() => {
    let alive = true;
    loadProgress().then((all) => {
      if (alive) setTotal(Object.values(all).reduce((n, v) => n + v, 0));
    });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <span
      className="flex items-center gap-1 font-extrabold"
      aria-label={t("map.starsAria", { n: total })}
    >
      <span aria-hidden className="text-warn">
        ★
      </span>
      {total}
    </span>
  );
}
