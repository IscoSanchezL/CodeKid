"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { loadProgress, type ProgressMap } from "@/lib/progress";
import {
  currentLevel,
  passedLevels,
  starsOfLevel,
  unlockedLevels,
} from "@/lib/unlock";
import { useWallet } from "@/components/shop/use-wallet";

export type MapState = {
  ready: boolean;
  /** Planeta donde está el jugador (null mientras carga). */
  current: number | null;
  /** Planetas superados (con las estrellas mínimas). */
  done: Set<number>;
  /** Planetas que se pueden jugar. */
  unlocked: Set<number>;
  progress: ProgressMap;
  stars: (level: number) => number;
};

const EMPTY: MapState = {
  ready: false,
  current: null,
  done: new Set(),
  unlocked: new Set([PLAYABLE_LEVELS[0]]),
  progress: {},
  stars: () => 0,
};

/** Progreso del jugador: qué planeta toca, cuáles superó y cuáles están abiertos (según las estrellas). */
export function useMapProgress(): MapState {
  const { wallet, ready: walletReady } = useWallet();
  const [progress, setProgress] = useState<ProgressMap | null>(null);

  useEffect(() => {
    let alive = true;
    loadProgress().then((all) => {
      if (alive) setProgress(all);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!progress || !walletReady) return EMPTY;
  const staff = wallet?.role === "teacher" || wallet?.role === "admin";
  return {
    ready: true,
    current: currentLevel(progress),
    done: passedLevels(progress),
    unlocked: unlockedLevels(progress, staff),
    progress,
    stars: (lv) => starsOfLevel(lv, progress),
  };
}

const Ctx = createContext<MapState | null>(null);

/** Calcula el estado del mapa una sola vez y lo comparten los planetas y el cohete. */
export function MapStateProvider({ children }: { children: React.ReactNode }) {
  const state = useMapProgress();
  return createElement(Ctx.Provider, { value: state }, children);
}

export function useMapState(): MapState {
  return useContext(Ctx) ?? EMPTY;
}
