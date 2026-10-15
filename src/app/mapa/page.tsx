import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { WorldMap } from "@/components/map/world-map";

export const metadata: Metadata = { title: "Mapa de aventura" };

export default function MapaPage() {
  return (
    <div data-theme="dark" className="cosmos-page min-h-dvh text-fg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <p className="hidden font-mono text-xs uppercase tracking-[0.25em] text-cyan-200/80 sm:block">
          Toca un planeta para empezar
        </p>
      </header>
      <main className="mx-auto max-w-6xl px-3 pb-12">
        <h1 className="sr-only">Mapa de aventura</h1>
        <WorldMap />
      </main>
    </div>
  );
}
