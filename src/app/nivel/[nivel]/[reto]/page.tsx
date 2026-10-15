import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { UserBar } from "@/components/brand/user-bar";
import { Player } from "@/components/game/player";
import { challengesOf, CHALLENGES, getChallenge } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";

type Params = { nivel: string; reto: string };

export function generateStaticParams(): Params[] {
  return CHALLENGES.map((c) => ({
    nivel: String(c.level),
    reto: String(c.challenge),
  }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const c = getChallenge(Number(params.nivel), Number(params.reto));
  return { title: c ? `${c.title} · Nivel ${c.level}` : "Reto" };
}

export default function RetoPage({ params }: { params: Params }) {
  const level = getChallenge(Number(params.nivel), Number(params.reto));
  if (!level) notFound();
  const meta = LEVELS.find((l) => l.id === level.level);

  return (
    <>
      <header className="topbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo href="/mapa" />
          <div className="flex items-center gap-4">
            <p className="hidden text-sm font-medium text-muted sm:block">
              Nivel {level.level} · {meta?.title}
            </p>
            <UserBar />
          </div>
        </div>
      </header>
      <main className="rise mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-1 text-2xl font-extrabold">
          Reto {level.challenge}: {level.title}
        </h1>
        <p className="mb-6 text-muted">Lleva al robot hasta la bandera 🏁</p>
        <Player level={level} total={challengesOf(level.level).length} />
      </main>
    </>
  );
}
