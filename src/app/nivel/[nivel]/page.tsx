import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { SceneShell } from "@/components/brand/scene-shell";
import { UserBar } from "@/components/brand/user-bar";
import { Fuzzy } from "@/components/game/fuzzy";
import { variantFor } from "@/components/game/fuzzy-avatar";
import { StarsBadge } from "@/components/game/stars-badge";
import { WORLDS } from "@/components/map/island";
import { LevelGate } from "@/components/map/level-gate";
import { challengesOf, PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";

type Params = { nivel: string };

export function generateStaticParams(): Params[] {
  return PLAYABLE_LEVELS.map((n) => ({ nivel: String(n) }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const meta = LEVELS.find((l) => l.id === Number(params.nivel));
  return { title: meta ? `Nivel ${meta.id}: ${meta.title}` : "Nivel" };
}

export default function NivelPage({ params }: { params: Params }) {
  const n = Number(params.nivel);
  const meta = LEVELS.find((l) => l.id === n);
  const list = challengesOf(n);
  if (!meta || list.length === 0) notFound();
  const world = WORLDS[(n - 1) % WORLDS.length];

  return (
    <SceneShell>
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Logo href="/mapa" />
        <div className="flex items-center gap-4">
          <Link
            href="/mapa"
            className="text-sm font-semibold text-fg/80 hover:text-fg"
          >
            ← Mapa
          </Link>
          <UserBar />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4">
        <LevelGate level={n}>
          <p className="text-sm font-bold uppercase tracking-wide text-fg/70">
            Mundo {world.name}
          </p>
          <h1 className="text-3xl font-extrabold">
            Nivel {meta.id}: {meta.title}
          </h1>
          <p className="mt-1 text-fg/80">{meta.summary}</p>
          <ol className="rise-stagger mt-8 grid gap-4 sm:grid-cols-2">
            {list.map((c) => (
              <li key={c.challenge}>
                <Link
                  href={`/nivel/${c.level}/${c.challenge}`}
                  className="card-3d lift flex items-center gap-4 rounded-2xl border border-border bg-surface p-3"
                >
                  <span
                    className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-extrabold text-white shadow-[0_4px_0_0_rgba(0,0,0,0.25)]"
                    style={{
                      background: `linear-gradient(135deg, ${world.top}, ${world.side})`,
                    }}
                  >
                    {c.challenge}
                  </span>
                  <span className="flex-1">
                    <span className="block font-extrabold leading-tight">
                      {c.title}
                    </span>
                    <StarsBadge level={c.level} challenge={c.challenge} />
                  </span>
                  <Fuzzy
                    variant={variantFor(`${c.level}-${c.challenge}`)}
                    size={48}
                    dir={1}
                    mood="happy"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </LevelGate>
      </main>
    </SceneShell>
  );
}
