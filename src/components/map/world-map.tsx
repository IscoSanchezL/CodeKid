import Link from "next/link";
import { Sparkles } from "@/components/fx/fx";
import { UserBar } from "@/components/brand/user-bar";
import { Fuzzy, type FuzzyVariant } from "@/components/game/fuzzy";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";
import { Duck, Piece, Pond, type PieceKind } from "@/components/scenery/pieces";
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
const PONDS: Pt[] = [
  [90, 430],
  [905, 610],
];
const FRIENDS: { variant: FuzzyVariant; x: number; y: number; size: number }[] =
  [
    { variant: "rainbow", x: 92, y: 40, size: 54 },
    { variant: "purple", x: 84, y: 15, size: 52 },
    { variant: "orange", x: 62, y: 88, size: 50 },
  ];

const { d: RIVER, samples: RIVER_PTS } = smoothPath(NODES);

type Item = { kind: PieceKind; x: number; y: number; s: number; v: number };

/** Paisaje repartido al azar (con semilla) evitando el río, las islas y sus carteles. */
const DECOR: Item[] = (() => {
  const r = rng(11);
  const items: Item[] = [];
  const dist = (a: Pt, bx: number, by: number) =>
    Math.hypot(a[0] - bx, a[1] - by);
  for (let tries = 0; tries < 2500 && items.length < 110; tries++) {
    const x = 28 + r() * 944;
    const y = 100 + r() * 585;
    const roll = r();
    const kind: PieceKind =
      roll < 0.16
        ? "palm"
        : roll < 0.3
          ? "tree"
          : roll < 0.42
            ? "pine"
            : roll < 0.54
              ? "bush"
              : roll < 0.78
                ? "flower"
                : roll < 0.88
                  ? "rock"
                  : "tuft";
    const tall = kind === "palm" || kind === "tree" || kind === "pine";
    const riverGap = tall ? 56 : 38;
    const nodeGap = tall ? 112 : 88;
    if (RIVER_PTS.some((p) => dist(p, x, y) < riverGap)) continue;
    if (NODES.some((n) => dist(n, x, y) < nodeGap)) continue;
    if (
      NODES.some(
        (n) => Math.abs(x - n[0]) < 96 && y > n[1] + 30 && y < n[1] + 112,
      )
    )
      continue; // carteles
    if (PONDS.some((p) => Math.abs(x - p[0]) < 70 && Math.abs(y - p[1]) < 46))
      continue;
    if (items.some((it) => Math.hypot(it.x - x, it.y - y) < (tall ? 46 : 28)))
      continue;
    items.push({
      kind,
      x,
      y,
      s: kind === "flower" ? 0.9 + r() * 0.5 : 0.8 + r() * 0.5,
      v: Math.floor(r() * 5),
    });
  }
  return items.sort((a, b) => a.y - b.y);
})();

/** Mapa ilustrado del mundo CodeKid: río, islas por nivel, paisaje y personajes. */
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
              <linearGradient id="map-grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: "var(--map-grass-1)" }} />
                <stop
                  offset="100%"
                  style={{ stopColor: "var(--map-grass-2)" }}
                />
              </linearGradient>
            </defs>
            <rect width="1000" height="700" fill="url(#map-grass)" />
            <ellipse
              cx="220"
              cy="180"
              rx="260"
              ry="120"
              fill="#fff"
              opacity="0.05"
            />
            <ellipse
              cx="760"
              cy="560"
              rx="300"
              ry="130"
              fill="#fff"
              opacity="0.05"
            />

            {PONDS.map(([x, y], i) => (
              <g key={i}>
                <Pond x={x} y={y} s={1.1} />
                <Duck x={x + 8} y={y + 4} s={0.9} />
              </g>
            ))}

            {/* río */}
            <path
              d={RIVER}
              fill="none"
              stroke="#1f9bd6"
              strokeWidth="60"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={RIVER}
              fill="none"
              stroke="#59cdf8"
              strokeWidth="50"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={RIVER}
              fill="none"
              stroke="#a5ebff"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <path
              className="map-flow"
              d={RIVER}
              fill="none"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="2 28"
              opacity="0.6"
            />

            {DECOR.map((it, i) => (
              <Piece
                key={i}
                kind={it.kind}
                x={it.x}
                y={it.y}
                s={it.s}
                variant={it.v}
              />
            ))}

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
