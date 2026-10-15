import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { StarsBadge } from "@/components/game/stars-badge";
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

  return (
    <>
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Logo href="/mapa" />
        <Link href="/mapa" className="text-sm font-medium text-muted hover:text-fg">
          ← Mapa
        </Link>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <h1 className="text-3xl font-extrabold">
          Nivel {meta.id}: {meta.title}
        </h1>
        <p className="mt-1 text-muted">{meta.summary}</p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2">
          {list.map((c) => (
            <li key={c.challenge}>
              <Link
                href={`/nivel/${c.level}/${c.challenge}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand font-mono text-lg font-bold text-brand-fg">
                  {c.challenge}
                </span>
                <span className="flex-1 font-bold">{c.title}</span>
                <StarsBadge level={c.level} challenge={c.challenge} />
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
