import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
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
        <p className="mt-2 text-muted">Elige un nivel. Los retos llegan en el hito 3.</p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {LEVELS.map((l, i) => {
            const locked = i > 0;
            return (
              <li
                key={l.id}
                className={`flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card ${
                  locked ? "opacity-60" : ""
                } ${i % 2 ? "sm:translate-y-6" : ""}`}
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand font-mono text-xl font-bold text-brand-fg">
                  {l.id}
                </span>
                <div>
                  <h2 className="font-bold">{l.title}</h2>
                  <p className="text-sm text-muted">{l.summary}</p>
                </div>
                <span className="ml-auto text-sm text-muted">
                  <span aria-hidden>{locked ? "🔒" : "▶"}</span>
                  <span className="sr-only">{locked ? "Bloqueado" : "Disponible"}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
