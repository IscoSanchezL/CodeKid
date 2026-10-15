import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";

export const metadata: Metadata = { title: "Mapa de aventura" };

export default function MapaPage() {
  return (
    <>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Logo />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20">
        <h1 className="text-3xl font-extrabold">Mapa de aventura</h1>
        <p className="mt-2 text-muted">Elige un nivel y empieza a programar.</p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {LEVELS.map((l, i) => {
            const open = PLAYABLE_LEVELS.includes(l.id);
            const card = (
              <>
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand font-mono text-xl font-bold text-brand-fg">
                  {l.id}
                </span>
                <div>
                  <h2 className="font-bold">{l.title}</h2>
                  <p className="text-sm text-muted">{l.summary}</p>
                </div>
                <span className="ml-auto text-sm text-muted">
                  <span aria-hidden>{open ? "▶" : "🔒"}</span>
                  <span className="sr-only">{open ? "Disponible" : "Próximamente"}</span>
                </span>
              </>
            );
            const cls = `flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card ${
              i % 2 ? "sm:translate-y-6" : ""
            }`;
            return (
              <li key={l.id}>
                {open ? (
                  <Link href={`/nivel/${l.id}`} className={`${cls} transition-transform hover:-translate-y-0.5`}>
                    {card}
                  </Link>
                ) : (
                  <div className={`${cls} opacity-60`}>{card}</div>
                )}
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
