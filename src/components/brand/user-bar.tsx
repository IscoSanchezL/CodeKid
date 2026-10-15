"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FuzzyAvatar } from "@/components/game/fuzzy-avatar";
import { useWallet } from "@/components/shop/use-wallet";
import { createClient } from "@/lib/supabase/client";

/** Muestra quién juega, sus monedas y permite salir de la cuenta. */
export function UserBar() {
  const router = useRouter();
  const { wallet, ready } = useWallet();

  async function leave() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!ready) return null;
  if (!wallet) {
    return (
      <Link
        href="/clase"
        className="rounded-xl bg-surface px-3 py-1.5 text-sm font-bold text-brand shadow-[0_3px_0_0_rgb(var(--border))]"
      >
        Entrar con mi clase
      </Link>
    );
  }
  const staff = wallet.role === "teacher" || wallet.role === "admin";
  return (
    <div className="flex items-center gap-2 text-sm sm:gap-3">
      <span className="flex min-w-0 items-center gap-2 rounded-full bg-surface-2/80 py-0.5 pl-0.5 pr-3 font-bold ring-1 ring-border">
        <FuzzyAvatar id={wallet.id} avatar={wallet.avatar} size={32} />
        <span className="max-w-[7rem] truncate">{wallet.name}</span>
      </span>
      {!staff && (
        <Link
          href="/tienda"
          className="btn-gloss flex items-center gap-1 rounded-full bg-gradient-to-b from-[#ffd75e] to-[#ffb800] px-3 py-1.5 font-extrabold text-[#0b1440] shadow-[0_3px_0_0_#b98600]"
          aria-label={`${wallet.coins} monedas. Ir a la tienda`}
        >
          <span aria-hidden>🪙</span>
          {wallet.coins}
        </Link>
      )}
      {staff && (
        <Link href="/docente" className="font-semibold text-brand">
          Panel
        </Link>
      )}
      <button
        type="button"
        onClick={leave}
        aria-label="Salir de mi cuenta"
        className="btn-gloss btn-exit flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
          <path d="M16 8l4 4-4 4M20 12H9" />
        </svg>
        Salir
      </button>
    </div>
  );
}
