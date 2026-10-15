import { Fuzzy, type FuzzyVariant } from "@/components/game/fuzzy";
import { Meadow, SceneDecor } from "./scene-decor";

const CAST: { variant: FuzzyVariant; size: number; delay: string; dir: 0 | 1 | 2 | 3 }[] = [
  { variant: "rainbow", size: 120, delay: "0s", dir: 1 },
  { variant: "cyan", size: 136, delay: "0.5s", dir: 2 },
  { variant: "purple", size: 112, delay: "1s", dir: 3 },
  { variant: "orange", size: 96, delay: "1.4s", dir: 2 },
];

/** Escena de bienvenida: personajes peludos sobre un prado (de día) o bajo las estrellas (de noche). */
export function HeroScene() {
  return (
    <div className="scene-sky relative mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl border border-border shadow-card" aria-hidden>
      <SceneDecor />
      <div className="relative flex items-end justify-center gap-2 px-4 pb-9 pt-24 sm:gap-6">
        {CAST.map((c) => (
          <div key={c.variant} className="fz-idle" style={{ animationDelay: c.delay }}>
            <Fuzzy variant={c.variant} size={c.size} dir={c.dir} mood="happy" className="max-w-[22vw] drop-shadow-[0_10px_8px_rgba(10,40,90,0.25)]" />
          </div>
        ))}
      </div>
      <Meadow height={40} />
    </div>
  );
}
