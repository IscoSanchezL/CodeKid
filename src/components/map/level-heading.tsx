"use client";

import Link from "next/link";
import { challengeTitle, levelSummary, levelTitle, useT } from "@/i18n";
import { isAdvanced, levelMeta, planetOf } from "@/lib/levels";
import { WORLDS } from "./island";

/** Cabecera de la página de un nivel: mundo, título y resumen, en el idioma activo. */
export function LevelHeading({ level }: { level: number }) {
  const t = useT();
  const meta = levelMeta(level);
  if (!meta) return null;
  const adv = isAdvanced(level);
  const idx = (planetOf(level) - 1) % WORLDS.length;
  return (
    <>
      <p className="text-sm font-bold uppercase tracking-wide text-fg/70">
        {t("nivel.world", { name: t(`world.${idx + 1}`) })}
        {adv ? t("nivel.adv") : ""}
      </p>
      <h1 className="text-3xl font-extrabold">
        {adv ? t("nivel.h1adv", { n: planetOf(level) }) : t("nivel.h1", { n: meta.id })}: {levelTitle(t, level, meta.title)}
      </h1>
      <p className="mt-1 text-fg/80">{levelSummary(t, level, meta.summary)}</p>
    </>
  );
}

/** Título de un reto en el idioma activo. */
export function ChallengeName({ level, challenge, title }: { level: number; challenge: number; title: string }) {
  const t = useT();
  return <>{challengeTitle(t, level, challenge, title)}</>;
}

/** Cabecera de la página de un reto. */
export function ChallengeHeading({ level, challenge, title }: { level: number; challenge: number; title: string }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-baseline gap-x-4">
      <h1 className="text-xl font-extrabold">{t("play.challenge", { n: challenge, title: challengeTitle(t, level, challenge, title) })}</h1>
      <p className="text-sm text-muted">{t("play.goal")}</p>
      <Link href={`/nivel/${level}`} className="ml-auto text-sm font-medium text-muted hover:text-fg">
        {t("play.backToLevel", { n: level })}
      </Link>
    </div>
  );
}

/** «Nivel 3 · Condicionales» / «⚡ Avanzado · …» de la barra superior de un reto. */
export function ChallengeCrumb({ level }: { level: number }) {
  const t = useT();
  const meta = levelMeta(level);
  const base = levelMeta(planetOf(level));
  return (
    <>
      {isAdvanced(level) ? t("play.advanced") : t("play.level", { n: level })} ·{" "}
      {levelTitle(t, planetOf(level), base?.title ?? meta?.title ?? "")}
    </>
  );
}
