"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseLevel } from "@/engine/interpreter";
import type { Level, Snapshot } from "@/engine/types";
import { Duck, Piece, Pond, type PieceKind } from "@/components/scenery/pieces";
import { Fuzzy, type FuzzyVariant } from "./fuzzy";

const T = 64; // lado de una casilla (px)

const hash = (x: number, y: number, seed: number) =>
  Math.abs(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453) % 1;

function useFit(natW: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1.5, el.clientWidth / natW));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [natW]);
  return { ref, scale };
}

const STAR = "M0 -15 L4.4 -5 L15 -4.6 L6.9 2.4 L9.3 13 L0 7.4 L-9.3 13 L-6.9 2.4 L-15 -4.6 L-4.4 -5 Z";

function Flag() {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="12" ry="4" fill="#000" opacity="0.18" />
      <rect x="-1.8" y="-46" width="3.6" height="48" rx="1.5" fill="#eef2f7" />
      <circle cx="0" cy="-47" r="4" fill="#ffc524" />
      <g className="bd-wave" style={{ transformOrigin: "2px -40px" }}>
        <path d="M2 -42 H30 L24 -32 L30 -22 H2 Z" fill="#ff4d6d" />
        <path d="M2 -42 H15 V-22 H2 Z" fill="#fff" opacity="0.25" />
      </g>
    </g>
  );
}

type Props = {
  level: Level;
  snapshots: Snapshot[];
  index: number;
  celebrate?: boolean;
  variant?: FuzzyVariant;
};

export function Board({ level, snapshots, index, celebrate = false, variant = "cyan" }: Props) {
  const map = useMemo(() => parseLevel(level), [level]);
  const cols = map.width;
  const rows = map.height;
  const W = Math.max(cols + 3, 7) * T;
  const H = Math.max(rows + 3, 5) * T;
  const ox = (W - cols * T) / 2;
  const oy = (H - rows * T) / 2;
  const { ref, scale } = useFit(W);

  const cells = useMemo(() => {
    const out: { x: number; y: number; ch: string }[] = [];
    level.rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== "#" && out.push({ x, y, ch })));
    return out;
  }, [level]);

  // Setos: un borde en cada lado de una casilla que no toca otra casilla de camino
  const hedges = useMemo(() => {
    const isPath = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && level.rows[y][x] !== "#";
    const out: { key: string; x: number; y: number; w: number; h: number }[] = [];
    for (const { x, y } of cells) {
      const px = ox + x * T;
      const py = oy + y * T;
      if (!isPath(x, y - 1)) out.push({ key: `t${x}-${y}`, x: px - 3, y: py - 9, w: T + 6, h: 14 });
      if (!isPath(x, y + 1)) out.push({ key: `b${x}-${y}`, x: px - 3, y: py + T - 5, w: T + 6, h: 14 });
      if (!isPath(x - 1, y)) out.push({ key: `l${x}-${y}`, x: px - 9, y: py - 3, w: 14, h: T + 6 });
      if (!isPath(x + 1, y)) out.push({ key: `r${x}-${y}`, x: px + T - 5, y: py - 3, w: 14, h: T + 6 });
    }
    return out;
  }, [cells, cols, rows, level, ox, oy]);

  // Paisaje: se reparte por todo el césped (también fuera del mapa) sin tapar el camino
  const decor = useMemo(() => {
    const isPath = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && level.rows[y][x] !== "#";
    const seed = level.level * 10 + level.challenge;
    const items: { key: string; kind: PieceKind; x: number; y: number; s: number; v: number }[] = [];
    const minX = -Math.ceil(ox / T);
    const maxX = cols + Math.ceil(ox / T);
    const minY = -Math.ceil(oy / T);
    const maxY = rows + Math.ceil(oy / T);
    for (let cy = minY; cy < maxY; cy++) {
      for (let cx = minX; cx < maxX; cx++) {
        if (isPath(cx, cy)) continue;
        const h = hash(cx, cy, seed);
        const jx = (hash(cx, cy, seed + 1) - 0.5) * 22;
        const jy = (hash(cx, cy, seed + 2) - 0.5) * 12;
        const px = ox + cx * T + T / 2 + jx;
        const py = oy + cy * T + T * 0.82 + jy;
        const s = 0.8 + hash(cx, cy, seed + 3) * 0.3;
        // Los árboles altos no se ponen justo debajo del camino (taparían las casillas)
        const tallOk = !isPath(cx, cy - 1) && !isPath(cx, cy - 2) && !isPath(cx - 1, cy - 1) && !isPath(cx + 1, cy - 1);
        let kind: PieceKind | null = null;
        if (h < 0.1) kind = tallOk ? "palm" : "bush";
        else if (h < 0.2) kind = tallOk ? "tree" : "tuft";
        else if (h < 0.27) kind = tallOk ? "pine" : "rock";
        else if (h < 0.4) kind = "bush";
        else if (h < 0.62) kind = "flower";
        else if (h < 0.7) kind = "rock";
        else if (h < 0.86) kind = "tuft";
        if (!kind) continue;
        items.push({ key: `${cx},${cy}`, kind, x: px, y: py, s, v: Math.floor(h * 50) });
      }
    }
    return items.sort((a, b) => a.y - b.y);
  }, [level, cols, rows, ox, oy]);

  const i = Math.min(index, snapshots.length - 1);
  const current = snapshots[i];
  const prev = i > 0 ? snapshots[i - 1] : undefined;
  const moved = prev && (prev.x !== current.x || prev.y !== current.y);
  const turned = prev && !moved && prev.dir !== current.dir;
  const mood = current.bump ? "bump" : celebrate ? "happy" : "idle";

  const taken = new Set<string>();
  for (let k = 0; k <= i; k++) taken.add(`${snapshots[k].x},${snapshots[k].y}`);

  const fx = ox + current.x * T + T / 2;
  const fy = oy + current.y * T + T / 2;
  const SPR = T * 1.2;
  const slide = "left 280ms cubic-bezier(.3,.7,.3,1), top 280ms cubic-bezier(.3,.7,.3,1)";

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border-4 border-white shadow-card"
      style={{ height: H * scale }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          marginLeft: -W / 2,
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "50% 0",
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="absolute inset-0" role="img" aria-label="Mapa del reto">
          <defs>
            <linearGradient id="bd-grass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--map-grass-1)" }} />
              <stop offset="100%" style={{ stopColor: "var(--map-grass-2)" }} />
            </linearGradient>
            <linearGradient id="bd-tile" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9f7ff" />
              <stop offset="100%" stopColor="#5fd8ff" />
            </linearGradient>
            <linearGradient id="bd-goal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="100%" stopColor="#ffd43b" />
            </linearGradient>
            <filter id="bd-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          <rect width={W} height={H} fill="url(#bd-grass)" />
          {Array.from({ length: Math.ceil(H / T) }, (_, k) => (
            <rect key={k} x="0" y={k * T} width={W} height={T / 2} fill="#fff" opacity="0.045" />
          ))}

          {/* estanque con patito en una esquina libre */}
          <g>
            <Pond x={W - 70} y={H - 40} s={0.7} />
            <Duck x={W - 64} y={H - 38} s={0.6} />
          </g>

          {/* resplandor del camino */}
          <g filter="url(#bd-glow)" opacity="0.75">
            {cells.map(({ x, y }) => (
              <rect key={`g${x}-${y}`} x={ox + x * T - 4} y={oy + y * T - 4} width={T + 8} height={T + 8} rx="16" fill="#19c3f0" />
            ))}
          </g>

          {/* casillas del camino */}
          {cells.map(({ x, y, ch }) => {
            const px = ox + x * T;
            const py = oy + y * T;
            return (
              <g key={`t${x}-${y}`}>
                <rect x={px + 2.5} y={py + 2.5} width={T - 5} height={T - 5} rx="11" fill={ch === "G" ? "url(#bd-goal)" : "url(#bd-tile)"} stroke="#e9fcff" strokeWidth="2.5" />
                <rect x={px + 7} y={py + 6} width={T - 14} height={(T - 12) * 0.32} rx="7" fill="#fff" opacity="0.4" />
                {ch === "S" && <circle cx={px + T / 2} cy={py + T / 2} r="19" fill="#fff" opacity="0.35" />}
              </g>
            );
          })}

          {/* setos en los bordes */}
          {hedges.map((h) => (
            <g key={h.key}>
              <rect x={h.x} y={h.y} width={h.w} height={h.h} rx="7" fill="#2b8a3e" />
              <rect x={h.x + 1.5} y={h.y + 1.5} width={h.w - 3} height={Math.min(h.h, h.w) / 2.4} rx="4" fill="#51cf66" opacity="0.85" />
            </g>
          ))}

          {/* paisaje */}
          {decor.map((d) => (
            <Piece key={d.key} kind={d.kind} x={d.x} y={d.y} s={d.s} variant={d.v} />
          ))}

          {/* aro de la meta, estrellas y bandera */}
          <circle
            className="bd-ring"
            cx={ox + map.goal.x * T + T / 2}
            cy={oy + map.goal.y * T + T / 2}
            r="24"
            fill="none"
            stroke="#ffc524"
            strokeWidth="3"
          />
          {cells
            .filter((c) => c.ch === "*" && !taken.has(`${c.x},${c.y}`))
            .map((c) => (
              <g key={`s${c.x}-${c.y}`} transform={`translate(${ox + c.x * T + T / 2} ${oy + c.y * T + T / 2})`}>
                <g className="bd-star">
                  <path d={STAR} fill="#ffc524" stroke="#d99a00" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M0 -9 L2.4 -3 L8 -2.6 L3.6 1.4 L5 7 L0 4 L-5 7 L-3.6 1.4 L-8 -2.6 L-2.4 -3 Z" fill="#fff3b0" opacity="0.7" />
                </g>
              </g>
            ))}
          <g transform={`translate(${ox + map.goal.x * T + T / 2 - 4} ${oy + map.goal.y * T + T / 2 + 14})`}>
            <Flag />
          </g>

          <rect width={W} height={H} fill="var(--map-tint)" pointerEvents="none" />
        </svg>

        {/* sombra y personaje */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: fx - T * 0.34,
            top: fy + T * 0.2,
            width: T * 0.68,
            height: T * 0.2,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(8,30,60,0.45) 0%, rgba(8,30,60,0) 70%)",
            transition: slide,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: fx - SPR / 2,
            top: fy - SPR * 0.72,
            width: SPR,
            height: SPR,
            transition: slide,
            pointerEvents: "none",
          }}
        >
          <div key={i} className={current.bump ? "fz-bump" : moved ? "fz-hop" : turned ? "fz-turn" : celebrate ? "fz-cheer" : "fz-idle"}>
            <Fuzzy variant={variant} dir={current.dir} mood={mood} size={SPR} />
          </div>
        </div>
      </div>
    </div>
  );
}
