import { Fuzzy, type FuzzyVariant, type Outfit } from "@/components/game/fuzzy";

const CAST: { name: string; variant: FuzzyVariant; outfit: Outfit; delay: string }[] = [
  { name: "Mago", variant: "purple", outfit: { hat: "hat-wizard", neck: "neck-bow" }, delay: "0s" },
  { name: "Programador", variant: "cyan", outfit: { glasses: "gl-nerd", hat: "hat-antenna" }, delay: "-2s" },
  { name: "Rey", variant: "gold", outfit: { hat: "hat-crown", neck: "neck-medal" }, delay: "-4s" },
  { name: "Superhéroe", variant: "red", outfit: { neck: "neck-cape", glasses: "gl-sun" }, delay: "-1s" },
  { name: "Astronauta", variant: "green", outfit: { hat: "hat-astro" }, delay: "-3s" },
];

/** Escaparate de trajes: lo que los alumnos pueden comprar con las monedas que ganan. */
export function WardrobeShowcase() {
  return (
    <ul className="flex flex-wrap items-end justify-center gap-x-3 gap-y-8">
      {CAST.map((c) => (
        <li key={c.name} className="flex w-36 flex-col items-center">
          <div className="cosmos-float" style={{ animationDelay: c.delay, animationDuration: "7s" }}>
            <Fuzzy variant={c.variant} outfit={c.outfit} size={116} dir={2} mood="happy" className="drop-shadow-[0_12px_18px_rgba(94,160,255,0.35)]" />
          </div>
          <span className="glass mt-3 rounded-full px-4 py-1 text-sm font-bold">{c.name}</span>
        </li>
      ))}
    </ul>
  );
}
