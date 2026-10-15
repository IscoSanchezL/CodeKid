"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FuzzyAvatar } from "@/components/game/fuzzy-avatar";
import { useWallet } from "@/components/shop/use-wallet";
import { createClient } from "@/lib/supabase/client";

/** Muestra quién juega, sus monedas y permite cambiar de alumno (equipos compartidos del aula). */
export function UserBar() {
  const router = useRouter();
  const { wallet, ready } = useWallet();

  async function leave() {
    await createClient().auth.signOut();
    router.push("/clase");
    router.refresh();
  }

  if (!ready) return null;
  if (!wallet) {
    return (
      <Link href="/clase" className="rounded-xl bg-surface px-3 py-1.5 text-sm font-bold text-brand shadow-[0_3px_0_0_rgb(var(--border))]">
        Entrar con mi clase
      </Link>
    );
  }
  const staff = wallet.role === "teacher" || wallet.role === "admin";
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex items-center gap-2 font-semibold">
        <FuzzyAvatar id={wallet.id} avatar={wallet.avatar} size={36} />
        {wallet.name}
      </span>
      {!staff && (
        <Link
          href="/tienda"
          className="flex items-center gap-1 rounded-full bg-warn/20 px-3 py-1 font-extrabold text-fg hover:bg-warn/35"
          aria-label={`${wallet.coins} monedas. Ir a la tienda`}
        >
          <span aria-hidden>🪙</span>
          {wallet.coins}
        </Link>
      )}
      {staff && (
        <Link href="/docente" className="font-medium text-brand">
          Panel
        </Link>
      )}
      <button type="button" onClick={leave} className="font-medium text-muted hover:text-fg">
        {staff ? "Salir" : "Cambiar de alumno"}
      </button>
    </div>
  );
}
