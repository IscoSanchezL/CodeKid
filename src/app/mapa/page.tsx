import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SceneShell } from "@/components/brand/scene-shell";
import { UserBar } from "@/components/brand/user-bar";
import { Island, WORLDS } from "@/components/map/island";
import { LevelStars } from "@/components/map/level-stars";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";

export const metadata: Metadata = { title: "Mapa de aventura" };

export default function MapaPage() {
  const current = Math.min(...PLAYABLE_LEVELS);
  return (
    <SceneShell>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <UserBar />
      </header>
      <main className="mx-auto max-w-6xl px-4">
        <h1 className="text-3xl font-extrabold">Mapa de aventura</h1>
        <p className="mt-1 text-fg/80">Salta de isla en isla y conviértete en un gran programador.</p>

        <ol className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {LEVELS.map((l, i) => {
            const open = PLAYABLE_LEVELS.includes(l.id);
            const body = (
              <>
                <Island level={l.id} open={open} current={l.id === current} />
                <div className="mt-1 text-center">
                  <h2 className="font-extrabold leading-tight">{l.title}</h2>
                  <p className="text-xs text-fg/70">Mundo {WORLDS[i % WORLDS.length].name}</p>
                  {open ? <LevelStars level={l.id} /> : <span className="text-xs font-semibold text-fg/60">Próximamente</span>}
                </div>
              </>
            );
            return (
              <li key={l.id} className={i % 2 ? "lg:translate-y-10" : ""}>
                {open ? (
                  <Link href={`/nivel/${l.id}`} className="block transition-transform hover:-translate-y-1.5 focus-visible:-translate-y-1.5">
                    {body}
                  </Link>
                ) : (
                  <div aria-disabled>{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </main>
    </SceneShell>
  );
}
