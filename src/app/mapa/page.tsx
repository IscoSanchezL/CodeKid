import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { WorldMap } from "@/components/map/world-map";

export const metadata: Metadata = { title: "Mapa de aventura" };

export default function MapaPage() {
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <p className="hidden text-sm text-muted sm:block">Toca una isla para empezar</p>
      </header>
      <main className="mx-auto max-w-6xl px-3 pb-12">
        <h1 className="sr-only">Mapa de aventura</h1>
        <WorldMap />
      </main>
    </>
  );
}
