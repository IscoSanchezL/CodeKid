"use client";

import { Fuzzy, type FuzzyVariant } from "@/components/game/fuzzy";
import { useT } from "@/i18n";

const STUDENTS: { name: string; variant: FuzzyVariant; stars: number; coins: number }[] = [
  { name: "Ana", variant: "cyan", stars: 11, coins: 95 },
  { name: "Luis", variant: "orange", stars: 8, coins: 60 },
  { name: "Sofía", variant: "purple", stars: 14, coins: 140 },
  { name: "Mateo", variant: "green", stars: 5, coins: 30 },
];

/** Maqueta del panel docente (datos de ejemplo). */
export function TeacherPreview() {
  const t = useT();
  return (
    <div className="glass mx-auto max-w-md rounded-2xl p-5" aria-label={t("land.preview.aria")}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white/70">{t("land.preview.title")}</p>
        <span className="rounded-full bg-[#22d3ee]/20 px-2 py-0.5 text-xs font-bold text-[#8af0ff]">{t("land.preview.students")}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{t("land.preview.code")}</p>
          <p className="font-mono text-2xl font-extrabold tracking-[0.15em] text-[#5ee3ff]">• • • • •</p>
        </div>
        <div className="rounded-xl bg-black/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{t("land.preview.key")}</p>
          <p className="font-mono text-2xl font-extrabold tracking-[0.15em] text-[#ffb454]">• •</p>
        </div>
      </div>
      <ul className="mt-3 divide-y divide-white/10">
        {STUDENTS.map((s) => (
          <li key={s.name} className="flex items-center gap-3 py-2">
            <Fuzzy variant={s.variant} size={36} dir={2} mood="happy" />
            <span className="flex-1 font-semibold">{s.name}</span>
            <span className="text-sm font-bold text-[#ffd43b]">★ {s.stars}</span>
            <span className="w-14 text-right text-sm font-bold">🪙 {s.coins}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
