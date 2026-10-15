import Link from "next/link";
import { Sparkles } from "@/components/fx/fx";
import { UserBar } from "@/components/brand/user-bar";
import { Fuzzy, type FuzzyVariant } from "@/components/game/fuzzy";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";
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
const FRIENDS: { variant: FuzzyVariant; x: number; y: number; size: number }[] =
  [
    { variant: "rainbow", x: 92, y: 40, size: 54 },
    { variant: "purple", x: 84, y: 15, size: 52 },
    { variant: "orange", x: 62, y: 88, size: 50 },
  ];

const { d: TRAIL, samples: TRAIL_PTS } = smoothPath(NODES);

type Deco = {
  kind: "shard" | "glow";
  x: number;
  y: number;
  s: number;
  v: number;
};

/** Cristales flotantes y destellos (semilla fija), siempre lejos del camino y de las plataformas. */
const DECOR: Deco[] = (() => {
  const r = rng(47);
  const items: Deco[] = [];
  const dist = (a: Pt, bx: number, by: number) =>
    Math.hypot(a[0] - bx, a[1] - by);
  for (let tries = 0; tries < 4000 && items.length < 16; tries++) {
    const x = 40 + r() * 920;
    const y = 80 + r() * 580;
    const kind: Deco["kind"] = items.length % 3 === 2 ? "glow" : "shard";
    const gap = kind === "glow" ? 100 : 62;
    if (TRAIL_PTS.some((p) => dist(p, x, y) < gap)) continue;
    if (NODES.some((n) => dist(n, x, y) < gap + 66)) continue;
    if (
      NODES.some(
        (n) => Math.abs(x - n[0]) < 100 && y > n[1] + 30 && y < n[1] + 112,
      )
    )
      continue;
    if (items.some((it) => Math.hypot(it.x - x, it.y - y) < 110)) continue;
    items.push({
      kind,
      x,
      y,
      s: kind === "glow" ? 1.2 + r() * 1.2 : 0.6 + r() * 0.8,
      v: Math.floor(r() * 3),
    });
  }
  return items.sort((a, b) => a.y - b.y);
})();

/** Mapa ilustrado del mundo CodeKid: cinta pastel, nubes-isla con cofre por nivel y personajes. */
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
          <svg
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="sky-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3d3bb8" />
                <stop offset="48%" stopColor="#7a68f0" />
                <stop offset="100%" stopColor="#b9a9ff" />
              </linearGradient>
              <radialGradient id="aur-a" cx="0.12" cy="0.95" r="0.6">
                <stop offset="0%" stopColor="#4ff3e6" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#4ff3e6" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="aur-b" cx="0.92" cy="0.08" r="0.55">
                <stop offset="0%" stopColor="#ff7ad9" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ff7ad9" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sky-ray" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="glass-path"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="1000"
                y2="0"
              >
                <stop offset="0%" stopColor="#5ff5ea" />
                <stop offset="50%" stopColor="#a58bff" />
                <stop offset="100%" stopColor="#ff8fe0" />
              </linearGradient>
              <linearGradient id="shard" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#7fe9ff" stopOpacity="0.18" />
              </linearGradient>
              <pattern
                id="tech-grid"
                width="46"
                height="46"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M46 0H0V46"
                  fill="none"
                  stroke="#fff"
                  strokeOpacity="0.16"
                  strokeWidth="1"
                />
              </pattern>
              <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#fff" stopOpacity="1" />
              </linearGradient>
              <mask id="grid-mask">
                <rect width="1000" height="700" fill="url(#grid-fade)" />
              </mask>
              <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            <rect width="1000" height="700" fill="url(#sky-bg)" />
            <rect width="1000" height="700" fill="url(#aur-a)" />
            <rect width="1000" height="700" fill="url(#aur-b)" />
            <rect
              width="1000"
              height="700"
              fill="url(#tech-grid)"
              mask="url(#grid-mask)"
            />
            <polygon points="90,0 230,0 470,700 150,700" fill="url(#sky-ray)" />
            <polygon
              points="470,0 560,0 820,700 580,700"
              fill="url(#sky-ray)"
              opacity="0.7"
            />
            <polygon
              points="780,0 900,0 1000,430 1000,700"
              fill="url(#sky-ray)"
              opacity="0.6"
            />

            <g strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path
                d={TRAIL}
                stroke="url(#glass-path)"
                strokeWidth="64"
                opacity="0.35"
                filter="url(#soft)"
              />
              <path d={TRAIL} stroke="#fff" strokeWidth="50" opacity="0.2" />
              <path
                d={TRAIL}
                stroke="url(#glass-path)"
                strokeWidth="22"
                opacity="0.9"
              />
              <path d={TRAIL} stroke="#fff" strokeWidth="9" opacity="0.7" />
              <path
                className="rainbow-flow"
                d={TRAIL}
                stroke="#fff"
                strokeWidth="5"
                strokeDasharray="2 34"
                opacity="0.95"
              />
              <path
                className="rainbow-flow-b"
                d={TRAIL}
                stroke="#7df9ff"
                strokeWidth="3"
                strokeDasharray="14 90"
                opacity="0.9"
              />
              <path
                d={TRAIL}
                stroke="#fff"
                strokeWidth="2"
                opacity="0.5"
                transform="translate(0 -17)"
              />
              <path
                d={TRAIL}
                stroke="#fff"
                strokeWidth="2"
                opacity="0.35"
                transform="translate(0 17)"
              />
            </g>

            {DECOR.map((d, i) =>
              d.kind === "shard" ? (
                <g
                  key={i}
                  transform={`translate(${d.x} ${d.y}) rotate(${(d.v - 1) * 14}) scale(${d.s})`}
                >
                  <g
                    className="sky-bob"
                    style={{ animationDelay: `${(i % 6) * -1.1}s` }}
                  >
                    <polygon
                      points="0,-40 17,0 0,40 -17,0"
                      fill="url(#shard)"
                      stroke="#fff"
                      strokeOpacity="0.7"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="0,-40 17,0 0,6"
                      fill="#fff"
                      opacity="0.35"
                    />
                    <line
                      x1="0"
                      y1="-40"
                      x2="0"
                      y2="40"
                      stroke="#fff"
                      strokeOpacity="0.4"
                    />
                  </g>
                </g>
              ) : (
                <circle
                  key={i}
                  className="sky-drift"
                  cx={d.x}
                  cy={d.y}
                  r={30 * d.s}
                  fill={
                    d.v === 0 ? "#6ff3ee" : d.v === 1 ? "#ff9be6" : "#b8a4ff"
                  }
                  opacity="0.2"
                  filter="url(#soft)"
                />
              ),
            )}
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
