"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isAdvanced, levelMeta } from "@/lib/levels";
import { prerequisite, starsNeeded } from "@/lib/unlock";
import { useMapProgress } from "./use-current-level";

/** Protege un planeta: solo se puede jugar si el jugador reunió las estrellas del planeta anterior. */
export function LevelGate({
  level,
  children,
}: {
  level: number;
  children: React.ReactNode;
}) {
  const state = useMapProgress();
  if (!state.ready)
    return <p className="py-16 text-center text-muted">Cargando…</p>;
  if (state.unlocked.has(level)) return <>{children}</>;

  const preLevel = prerequisite(level);
  const prev = levelMeta(preLevel);
  const need = starsNeeded(level);
  const have = state.stars(preLevel);
  const adv = isAdvanced(level);
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="text-5xl" aria-hidden>
        🔒
      </p>
      <h2 className="mt-2 text-2xl font-extrabold">
        {adv ? "El modo avanzado todavía está cerrado" : "Este planeta todavía está cerrado"}
      </h2>
      <p className="mt-2 text-muted">
        Para abrirlo necesitas <strong>{need} estrellas</strong> en «
        {prev?.title ?? "el planeta anterior"}». Llevas{" "}
        <strong>
          {have}/{need}
        </strong>
        .
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <ButtonLink href={`/nivel/${preLevel}`}>
          Ir a «{prev?.title ?? "anterior"}»
        </ButtonLink>
        <Link
          href="/mapa"
          className="grid h-11 place-items-center px-3 font-semibold text-brand"
        >
          Volver al mapa
        </Link>
      </div>
    </Card>
  );
}
