import { Fuzzy, type FuzzyVariant } from "@/components/game/fuzzy";

const CAST: { variant: FuzzyVariant; size: number; delay: string; dir: 0 | 1 | 2 | 3 }[] = [
  { variant: "rainbow", size: 120, delay: "0s", dir: 1 },
  { variant: "cyan", size: 136, delay: "0.5s", dir: 2 },
  { variant: "purple", size: 112, delay: "1s", dir: 3 },
  { variant: "orange", size: 96, delay: "1.4s", dir: 2 },
];

/** Escena de bienvenida: personajes peludos sobre un prado, bajo un cielo con nubes. */
export function HeroScene() {
  return (
    <div
      className="relative mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl border border-border shadow-card"
      style={{ background: "linear-gradient(180deg,#5cc8ff 0%,#a8e4ff 60%,#d7f3ff 100%)" }}
      aria-hidden
    >
      <div className="bd-cloud" style={{ top: "10%", left: "8%", width: 110, height: 32 }} />
      <div className="bd-cloud bd-cloud-slow" style={{ top: "22%", right: "10%", width: 140, height: 40 }} />
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full"
        style={{ background: "radial-gradient(circle,#fff6b0 0%,#ffe066 45%,rgba(255,224,102,0) 70%)" }}
      />

      <div className="relative flex items-end justify-center gap-2 px-4 pb-9 pt-24 sm:gap-6">
        {CAST.map((c) => (
          <div key={c.variant} className="fz-idle" style={{ animationDelay: c.delay }}>
            <Fuzzy variant={c.variant} size={c.size} dir={c.dir} mood="happy" className="max-w-[22vw] drop-shadow-[0_10px_8px_rgba(10,40,90,0.25)]" />
          </div>
        ))}
      </div>

      {/* prado con relieve */}
      <div className="absolute inset-x-0 bottom-0 h-10" style={{ background: "linear-gradient(180deg,#7fdc63 0%,#4fb84a 100%)", borderTop: "3px solid #a6ee8a" }} />
      <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: "#2f8f3c" }} />
    </div>
  );
}
