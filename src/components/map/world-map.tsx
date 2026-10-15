import Link from "next/link";
import { Sparkles } from "@/components/fx/fx";
import { UserBar } from "@/components/brand/user-bar";
import { Fuzzy, type FuzzyVariant } from "@/components/game/fuzzy";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";
import { Balloon, Cloud } from "@/components/scenery/sky";
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
  kind: "balloon" | "cloud";
  x: number;
  y: number;
  s: number;
  v: number;
};

/** Pocos adornos y suaves (semilla fija): nubes lejanas y algún globo pequeño, siempre lejos del camino. */
const DECOR: Deco[] = (() => {
  const r = rng(31);
  const items: Deco[] = [];
  const dist = (a: Pt, bx: number, by: number) =>
    Math.hypot(a[0] - bx, a[1] - by);
  for (let tries = 0; tries < 3000 && items.length < 13; tries++) {
    const x = 40 + r() * 920;
    const y = 90 + r() * 560;
    const kind: Deco["kind"] = items.length % 2 === 0 ? "cloud" : "balloon";
    const gap = kind === "cloud" ? 90 : 60;
    if (TRAIL_PTS.some((p) => dist(p, x, y) < gap)) continue;
    if (NODES.some((n) => dist(n, x, y) < gap + 70)) continue;
    if (
      NODES.some(
        (n) => Math.abs(x - n[0]) < 100 && y > n[1] + 30 && y < n[1] + 112,
      )
    )
      continue;
    if (items.some((it) => Math.hypot(it.x - x, it.y - y) < 120)) continue;
    items.push({
      kind,
      x,
      y,
      s: kind === "cloud" ? 1.3 + r() * 1 : 0.38 + r() * 0.22,
      v: Math.floor(r() * 6),
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
                <stop offset="0%" stopColor="#7c82e6" />
                <stop offset="50%" stopColor="#a3a9f2" />
                <stop offset="100%" stopColor="#cfd3fb" />
              </linearGradient>
              <linearGradient id="sky-ray" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <rect width="1000" height="700" fill="url(#sky-bg)" />
            {/* rayos de luz, anchos y suaves */}
            <polygon points="90,0 250,0 470,700 150,700" fill="url(#sky-ray)" />
            <polygon
              points="430,0 540,0 800,700 560,700"
              fill="url(#sky-ray)"
              opacity="0.8"
            />
            <polygon
              points="760,0 900,0 1000,420 1000,700"
              fill="url(#sky-ray)"
              opacity="0.7"
            />
            {/* neblina de nubes abajo */}
            <ellipse
              cx="500"
              cy="730"
              rx="700"
              ry="120"
              fill="#f1f2ff"
              opacity="0.75"
            />
            <ellipse
              cx="120"
              cy="700"
              rx="260"
              ry="60"
              fill="#fff"
              opacity="0.55"
            />
            <ellipse
              cx="880"
              cy="710"
              rx="280"
              ry="60"
              fill="#fff"
              opacity="0.55"
            />

            {/* camino: cinta pastel translucida */}
            <g strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path
                d={TRAIL}
                stroke="#5b61c4"
                strokeWidth="54"
                opacity="0.25"
                transform="translate(0 7)"
                filter="url(#soft)"
              />
              <path d={TRAIL} stroke="#fff" strokeWidth="52" opacity="0.5" />
              <path
                d={TRAIL}
                stroke="#ffb7cc"
                strokeWidth="44"
                opacity="0.92"
              />
              <path
                d={TRAIL}
                stroke="#ffe48e"
                strokeWidth="32"
                opacity="0.95"
              />
              <path
                d={TRAIL}
                stroke="#b4efc6"
                strokeWidth="20"
                opacity="0.95"
              />
              <path d={TRAIL} stroke="#bfe3ff" strokeWidth="8" opacity="0.95" />
              <path
                className="rainbow-flow"
                d={TRAIL}
                stroke="#fff"
                strokeWidth="3"
                strokeDasharray="2 46"
                opacity="0.8"
              />
            </g>

            {DECOR.map((d, i) => (
              <g
                key={i}
                className={d.kind === "cloud" ? "sky-drift" : "sky-bob"}
                style={{ animationDelay: `${(i % 6) * -1.3}s` }}
                opacity={d.kind === "cloud" ? 0.5 : 0.75}
              >
                {d.kind === "cloud" ? (
                  <Cloud x={d.x} y={d.y} s={d.s} o={0.95} />
                ) : (
                  <Balloon x={d.x} y={d.y} s={d.s} v={d.v} />
                )}
              </g>
            ))}
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
