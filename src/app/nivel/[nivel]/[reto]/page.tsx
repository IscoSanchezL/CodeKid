import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { UserBar } from "@/components/brand/user-bar";
import { Player } from "@/components/game/player";
import { LevelGate } from "@/components/map/level-gate";
import { challengesOf, CHALLENGES, getChallenge } from "@/engine/levels";
import { ChallengeCrumb, ChallengeHeading } from "@/components/map/level-heading";

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

  return (
    <>
      <header className="topbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo href="/mapa" />
          <div className="flex items-center gap-4">
            <p className="hidden text-sm font-medium text-muted sm:block">
              <ChallengeCrumb level={level.level} />
            </p>
            <UserBar />
          </div>
        </div>
      </header>
      <main className="rise mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-4 py-3 lg:h-[calc(100dvh-62px)]">
        <ChallengeHeading level={level.level} challenge={level.challenge} title={level.title} />
        <LevelGate level={level.level}>
          <Player level={level} total={challengesOf(level.level).length} />
        </LevelGate>
      </main>
    </>
  );
}
