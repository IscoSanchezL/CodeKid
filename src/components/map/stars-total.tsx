"use client";

import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/progress";

/** Total de estrellas ganadas por el usuario actual. */
export function StarsTotal() {
  const [total, setTotal] = useState(0);
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
    <span className="flex items-center gap-1 font-extrabold" aria-label={`${total} estrellas`}>
      <span aria-hidden className="text-warn">
        ★
      </span>
      {total}
    </span>
  );
}
