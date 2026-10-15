"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushPending } from "@/lib/pending-results";
import { loadWallet, submitResult, SubmitError, WALLET_EVENT, type Wallet } from "@/lib/wallet";

/** Cartera del usuario actual (monedas, traje, inventario). Se actualiza sola al comprar o ganar. */
export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ready, setReady] = useState(false);
  const flushedFor = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const w = await loadWallet();
      setWallet(w);
      // Al entrar, se reintentan los resultados que quedaron sin guardar (una vez por sesión de página)
      if (w && w.role === "student" && flushedFor.current !== w.id) {
        flushedFor.current = w.id;
        void flushPending(
          w.id,
          (p) => submitResult(p.level, p.challenge, p.program),
          (e) => e instanceof SubmitError && e.retryable,
        );
      }
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
