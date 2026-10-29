"use client";
import "./index";

import { setLang, useLang, useT, type Lang } from "./core";

const OPTIONS: { id: Lang; label: string; name: string }[] = [
  { id: "es", label: "ES", name: "Español" },
  { id: "en", label: "EN", name: "English" },
];

/** Selector de idioma ES | EN. Va fijo en pantalla (junto al botón de sonido) en todas las páginas. */
export function LangSwitch() {
  const lang = useLang();
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className="!fixed bottom-4 left-20 z-40 flex h-12 items-center gap-1 rounded-full bg-[#1b1650]/90 p-1 text-sm font-extrabold text-white shadow-[0_4px_0_#0e0a33,0_12px_22px_-8px_rgba(20,10,80,0.7)] ring-1 ring-white/25 backdrop-blur"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          lang={o.id}
          title={o.name}
          aria-label={o.name}
          aria-pressed={lang === o.id}
          onClick={() => setLang(o.id)}
          className={`h-10 min-w-10 rounded-full px-3 transition-colors ${lang === o.id ? "bg-[#22d3ee] text-[#03051a]" : "text-white/80 hover:bg-white/15"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
