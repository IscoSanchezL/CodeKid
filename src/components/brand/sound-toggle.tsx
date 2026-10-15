"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  armAudio,
  isSoundEnabled,
  setAudioVisible,
  setMusicTheme,
  setSoundEnabled,
  sfx,
  subscribeSound,
} from "@/lib/audio";

/** Cada mundo tiene su música: niveles 1, 2 y 3 distintos y el resto repite en ciclo; menús y mapa, «cielo». */
const WORLD_THEMES = ["pradera", "bosque", "playa"];
function themeFor(path: string) {
  const m = /^\/nivel\/(\d+)/.exec(path);
  return m ? WORLD_THEMES[(Number(m[1]) - 1) % WORLD_THEMES.length] : "cielo";
}

/** Botón flotante de sonido. También arranca la música en el primer toque (los navegadores lo exigen). */
export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, isSoundEnabled, () => true);
  const path = usePathname();

  useEffect(() => {
    setMusicTheme(themeFor(path));
  }, [path]);

  useEffect(() => {
    const start = () => {
      armAudio();
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    const vis = () => setAudioVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        setSoundEnabled(!on);
        if (!on) window.setTimeout(() => sfx("click"), 50);
      }}
      aria-pressed={on}
      aria-label={
        on ? "Silenciar música y sonidos" : "Activar música y sonidos"
      }
      title={on ? "Silenciar" : "Activar sonido"}
      className="btn-gloss !fixed bottom-4 left-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-b from-[#8b7bff] to-[#5a46e0] text-2xl text-white shadow-[0_4px_0_#3a2aa8,0_12px_22px_-8px_rgba(90,70,224,0.7)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
    >
      <span aria-hidden>{on ? "🔊" : "🔇"}</span>
    </button>
  );
}
