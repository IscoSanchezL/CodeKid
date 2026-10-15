import Link from "next/link";
import { UserBar } from "@/components/brand/user-bar";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";
import { MapNode } from "./map-node";
import { MapRocket } from "./map-rocket";
import { rng, smoothPath, type Pt } from "./path";
import { StarsTotal } from "./stars-total";

/** Posición de cada planeta en el mapa (viewBox 1000×700): una ruta espacial que sube hacia la derecha. */
export const NODES: Pt[] = [
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

export const { d: TRAIL } = smoothPath(NODES);

type Star = { x: number; y: number; r: number; o: number; tw: boolean };
/** Estrellas con semilla fija (sin saltos al hidratar). */
const STARS: Star[] = (() => {
  const r = rng(77);
  return Array.from({ length: 130 }, () => ({
    x: r() * 1000,
    y: r() * 700,
    r: 0.5 + r() * 1.5,
    o: 0.25 + r() * 0.7,
    tw: r() > 0.82,
  }));
})();

/** Mapa espacial del mundo CodeKid: galaxia, planetas por nivel y un cohete que viaja de uno a otro. */
export function WorldMap() {
  return (
    <div>
      <div className="flex items-start justify-between gap-2 pb-3">
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="btn-gloss grid h-11 w-11 place-items-center rounded-full border border-cyan-300/50 bg-[#0b0830]/70 text-xl font-black text-cyan-200 shadow-[0_0_18px_-2px_rgba(94,227,255,0.6)] backdrop-blur"
        >
          ←
        </Link>
        <div className="hidden rounded-full border border-cyan-300/30 bg-[#0b0830]/60 px-6 py-1.5 text-center font-extrabold leading-tight text-white shadow-[0_0_24px_-6px_rgba(94,227,255,0.6)] backdrop-blur md:block">
          Galaxia CodeKid
          <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-200">
            Elige tu planeta
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-3xl border border-white/15 bg-[#0b0830]/60 px-3 py-1.5 text-sm shadow-lg backdrop-blur sm:gap-3">
          <Link
            href="/tienda"
            className="btn-gloss rounded-full bg-gradient-to-b from-[#ffd75e] to-[#ffb800] px-3 py-1 font-extrabold text-[#0b1440] shadow-[0_2px_0_#b98600]"
          >
            🛍️ Tienda
          </Link>
          <StarsTotal />
          <UserBar />
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl">
        <div
          className="relative mx-auto aspect-[10/7] w-full min-w-[720px] max-w-6xl overflow-hidden rounded-3xl border border-cyan-300/40 shadow-[0_0_60px_-10px_rgba(94,160,255,0.6),inset_0_0_80px_rgba(120,80,255,0.25)]"
          style={{ containerType: "inline-size" }}
        >
          <svg
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <radialGradient id="sp-bg" cx="0.5" cy="0.4" r="0.85">
                <stop offset="0%" stopColor="#1b1457" />
                <stop offset="55%" stopColor="#0a0a33" />
                <stop offset="100%" stopColor="#03041a" />
              </radialGradient>
              <radialGradient id="neb-a" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#ff4fd8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ff4fd8" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="neb-b" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#3fd8ff" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#3fd8ff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="neb-c" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#7a5cff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7a5cff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="gal-core" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                <stop offset="40%" stopColor="#ffd9fb" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#c28cff" stopOpacity="0" />
              </radialGradient>
              <linearGradient
                id="lane"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="1000"
                y2="0"
              >
                <stop offset="0%" stopColor="#4ff3e6" />
                <stop offset="55%" stopColor="#8f7bff" />
                <stop offset="100%" stopColor="#ff7ad9" />
              </linearGradient>
              <filter id="blur6" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <pattern
                id="hud-grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M50 0H0V50"
                  fill="none"
                  stroke="#6fe8ff"
                  strokeOpacity="0.08"
                />
              </pattern>
            </defs>
            <rect width="1000" height="700" fill="url(#sp-bg)" />
            <rect width="1000" height="700" fill="url(#hud-grid)" />
            <ellipse cx="190" cy="150" rx="260" ry="150" fill="url(#neb-a)" />
            <ellipse cx="860" cy="130" rx="250" ry="140" fill="url(#neb-b)" />
            <ellipse cx="520" cy="470" rx="320" ry="170" fill="url(#neb-c)" />
            <ellipse cx="130" cy="680" rx="260" ry="120" fill="url(#neb-b)" />

            {/* galaxia espiral al fondo */}
            <g
              transform="translate(830 330) rotate(-24) scale(1 0.5)"
              opacity="0.55"
            >
              <circle r="90" fill="url(#gal-core)" />
              <g fill="none" stroke="#fff" strokeLinecap="round">
                <path
                  d="M0 0 C 40 -30 110 -20 130 30 S 90 120 20 110"
                  strokeOpacity="0.5"
                  strokeWidth="6"
                />
                <path
                  d="M0 0 C -40 30 -110 20 -130 -30 S -90 -120 -20 -110"
                  strokeOpacity="0.5"
                  strokeWidth="6"
                />
                <path
                  d="M0 0 C 30 40 20 110 -40 130"
                  strokeOpacity="0.3"
                  strokeWidth="4"
                />
              </g>
            </g>

            {/* órbitas tenues */}
            <g
              fill="none"
              stroke="#9fdcff"
              strokeOpacity="0.1"
              strokeDasharray="3 8"
            >
              <circle cx="500" cy="760" r="330" />
              <circle cx="500" cy="760" r="520" />
              <circle cx="500" cy="760" r="720" />
            </g>

            {STARS.map((s, i) => (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.r}
                fill="#fff"
                opacity={s.o}
                className={s.tw ? "cosmos-twinkle" : undefined}
                style={
                  s.tw
                    ? ({
                        "--o": s.o,
                        animationDelay: `${(i % 9) * -0.6}s`,
                      } as React.CSSProperties)
                    : undefined
                }
              />
            ))}

            {/* estrellas fugaces */}
            <g className="meteor" style={{ animationDelay: "1s" }}>
              <line
                x1="700"
                y1="40"
                x2="640"
                y2="70"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
            <g
              className="meteor"
              style={{ animationDelay: "6s", animationDuration: "11s" }}
            >
              <line
                x1="320"
                y1="110"
                x2="262"
                y2="138"
                stroke="#9fefff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* ruta de hiperespacio */}
            <g strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path
                d={TRAIL}
                stroke="url(#lane)"
                strokeWidth="26"
                opacity="0.4"
                filter="url(#blur6)"
              />
              <path d={TRAIL} stroke="#0a0a33" strokeWidth="12" opacity="0.7" />
              <path
                d={TRAIL}
                stroke="url(#lane)"
                strokeWidth="5"
                opacity="0.95"
              />
              <path
                className="rainbow-flow"
                d={TRAIL}
                stroke="#fff"
                strokeWidth="3"
                strokeDasharray="2 34"
                opacity="0.95"
              />
              <path
                className="rainbow-flow-b"
                d={TRAIL}
                stroke="#7df9ff"
                strokeWidth="2.5"
                strokeDasharray="12 80"
                opacity="0.9"
              />
            </g>
          </svg>

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

          <MapRocket nodes={NODES} trail={TRAIL} />
        </div>
      </div>
    </div>
  );
}
