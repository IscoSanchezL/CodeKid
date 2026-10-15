import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { UserBar } from "@/components/brand/user-bar";
import { ShopView } from "@/components/shop/shop-view";

export const metadata: Metadata = { title: "Tienda" };

export default function TiendaPage() {
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo href="/mapa" />
        <div className="flex items-center gap-4">
          <Link href="/mapa" className="text-sm font-semibold text-muted hover:text-fg">
            ← Mapa
          </Link>
          <UserBar />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <ShopView />
      </main>
    </>
  );
}
