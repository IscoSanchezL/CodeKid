import Link from "next/link";
import { Sparkles } from "@/components/fx/fx";
import { UserBar } from "@/components/brand/user-bar";
import { Fuzzy, type FuzzyVariant } from "@/components/game/fuzzy";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";
import { Balloon, Bunch, Butterfly, Cloud, RAINBOW } from "@/components/scenery/sky";
import { MapNode } from "./map-node";
import { rng, smoothPath, type Pt } from "./path";
import { StarsTotal } from "./stars-total";

/** Posición de cada nivel en el mapa (viewBox 1000×700): una serpiente que sube hacia la derecha. */
const NODES: Pt[] = [
  [110, 590],
  [300, 520],
  [500, 600],
  [700, 520],
  [880, 440],
  [720, 350],
  [520, 410],
  [320, 330],
  [150, 230],
  [380, 140],
];
const ICONS = ["🚩", "🔁", "🔀", "⚙️", "➕", "📋", "🧠", "💻", "🐍", "🏆"];
const FRIENDS: { variant: FuzzyVariant; x: number; y: number; size: number }[] = [
  { variant: "rainbow", x: 92, y: 40, size: 54 },
  { variant: "purple", x: 84, y: 15, size: 52 },
  { variant: "orange", x: 62, y: 88, size: 50 },
];

const { d: TRAIL, samples: TRAIL_PTS } = smoothPath(NODES);

type Deco = { kind: "balloon" | "bunch" | "cloud" | "butterfly"; x: number; y: number; s: number; v: number };

/** Cielo repartido con semilla fija (sin saltos al hidratar), lejos del camino y de las nubes-isla. */
const DECOR: Deco[] = (() => {
  const r = rng(23);
  const items: Deco[] = [];
  const dist = (a: Pt, bx: number, by: number) => Math.hypot(a[0] - bx, a[1] - by);
  for (let tries = 0; tries < 2500 && items.length < 46; tries++) {
    const x = 28 + r() * 944;
    const y = 90 + r() * 600;
    const roll = r();
    const kind: Deco["kind"] = roll < 0.34 ? "balloon" : roll < 0.46 ? "bunch" : roll < 0.78 ? "cloud" : "butterfly";
    const gap = kind === "cloud" ? 70 : 52;
    if (TRAIL_PTS.some((p) => dist(p, x, y) < gap)) continue;
    if (NODES.some((n) => dist(n, x, y) < gap + 62)) continue;
    if (NODES.some((n) => Math.abs(x - n[0]) < 96 && y > n[1] + 30 && y < n[1] + 112)) continue;
    if (items.some((it) => Math.hypot(it.x - x, it.y - y) < 54)) continue;
    items.push({ kind, x, y, s: 0.7 + r() * 0.55, v: Math.floor(r() * 6) });
  }
  return items.sort((a, b) => a.y - b.y);
})();

/** Mapa ilustrado del mundo CodeKid: camino de arco iris, nubes-isla por nivel, globos y personajes. */
export function WorldMap() {
  return (
    <div>
      <div className="flex items-start justify-between gap-2 pb-3">
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="grid h-11 w-11 place-items-center rounded-full border-4 border-[#fff3b0] bg-[#ffc524] text-2xl font-black text-[#0b1440] shadow-[0_4px_0_#c78f00]"
        >
          ←
        </Link>
        <div className="hidden rounded-full bg-[#0b1440]/85 px-6 md:block py-1.5 text-center font-extrabold leading-tight text-white shadow">
          Mundo CodeKid
          <span className="block text-xs font-semibold text-cyan-200">
            Aprende a programar
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-3xl bg-surface/90 px-3 py-1.5 text-sm shadow-lg ring-1 ring-border backdrop-blur sm:gap-3">
          <Link
            href="/tienda"
            className="rounded-full bg-[#ffc524] px-3 py-1 font-extrabold text-[#0b1440] shadow-[0_2px_0_#c78f00]"
          >
            🛍️ Tienda
          </Link>
          <StarsTotal />
          <UserBar />
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl">
        <div
          className="relative mx-auto aspect-[10/7] w-full min-w-[720px] max-w-6xl overflow-hidden rounded-3xl border-4 border-white shadow-card"
          style={{ containerType: "inline-size" }}
        >
          <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="sky-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7b86f2" />
                <stop offset="45%" stopColor="#a9b9ff" />
                <stop offset="100%" stopColor="#dcefff" />
              </linearGradient>
              <linearGradient id="sky-ray" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="1000" height="700" fill="url(#sky-bg)" />
            {/* rayos de luz */}
            <polygon points="140,0 260,0 420,700 180,700" fill="url(#sky-ray)" />
            <polygon points="520,0 600,0 860,700 640,700" fill="url(#sky-ray)" />
            <polygon points="800,0 880,0 1000,500 1000,700" fill="url(#sky-ray)" opacity="0.7" />
            {/* mar de nubes abajo */}
            <ellipse cx="500" cy="720" rx="640" ry="110" fill="#fff" opacity="0.8" />
            <ellipse cx="180" cy="690" rx="260" ry="70" fill="#fff" opacity="0.9" />
            <ellipse cx="860" cy="700" rx="280" ry="70" fill="#fff" opacity="0.9" />

            {/* camino de arco iris */}
            <g strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d={TRAIL} stroke="#6f7fdc" strokeWidth="64" opacity="0.28" transform="translate(0 8)" />
              {RAINBOW.map((c, i) => (
                <path key={c} d={TRAIL} stroke={c} strokeWidth={56 - i * 9} opacity="0.95" />
              ))}
              <path className="rainbow-flow" d={TRAIL} stroke="#fff" strokeWidth="4" strokeDasharray="3 40" opacity="0.7" />
            </g>

            {DECOR.map((d, i) => {
              const motion = i % 2 ? "sky-bob" : "sky-drift";
              const el =
                d.kind === "balloon" ? (
                  <Balloon x={d.x} y={d.y} s={d.s} v={d.v} />
                ) : d.kind === "bunch" ? (
                  <Bunch x={d.x} y={d.y} s={d.s} v={d.v} />
                ) : d.kind === "cloud" ? (
                  <Cloud x={d.x} y={d.y} s={d.s * 1.2} o={0.88} />
                ) : (
                  <Butterfly x={d.x} y={d.y} s={d.s} v={d.v} />
                );
              return (
                <g key={i} className={d.kind === "cloud" ? "sky-drift" : motion} style={{ animationDelay: `${(i % 6) * -1.3}s` }}>
                  {el}
                </g>
              );
            })}

            <rect width="1000" height="700" fill="var(--map-tint)" />
          </svg>

          {/* personajes que pasean por el mapa */}
          {FRIENDS.map((f, i) => (
            <div
              key={i}
              className="fz-idle pointer-events-none absolute"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                animationDelay: `${i * 0.6}s`,
              }}
            >
              <Fuzzy
                variant={f.variant}
                size={f.size}
                dir={(i + 1) as 1 | 2 | 3}
                mood="happy"
              />
            </div>
          ))}

          <Sparkles count={16} />
          <ol className="absolute inset-0">
            {LEVELS.map((l, i) => (
              <MapNode
                key={l.id}
                level={l.id}
                title={l.title}
                icon={ICONS[i]}
                x={NODES[i][0]}
                y={NODES[i][1]}
                open={PLAYABLE_LEVELS.includes(l.id)}
              />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
