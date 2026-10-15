"use client";

import { useCallback, useEffect, useState } from "react";
import { loadWallet, WALLET_EVENT, type Wallet } from "@/lib/wallet";

/** Cartera del usuario actual (monedas, traje, inventario). Se actualiza sola al comprar o ganar. */
export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setWallet(await loadWallet());
    } catch {
      setWallet(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(WALLET_EVENT, refresh);
    return () => window.removeEventListener(WALLET_EVENT, refresh);
  }, [refresh]);

  return { wallet, ready, refresh };
}
