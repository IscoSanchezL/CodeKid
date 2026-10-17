"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseLevel } from "@/engine/interpreter";
import type { Level, Snapshot } from "@/engine/types";
import { SkyPiece, type SkyKind } from "@/components/scenery/sky";
import { Fuzzy, type FuzzyVariant, type Outfit } from "./fuzzy";
import { useT } from "@/i18n";

const T = 64; // lado de una casilla (px)

const hash = (x: number, y: number, seed: number) =>
  Math.abs(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453) % 1;

/** Mide el contenedor para que el escenario siempre lo llene por completo. */
function useBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

const STAR =
  "M0 -15 L4.4 -5 L15 -4.6 L6.9 2.4 L9.3 13 L0 7.4 L-9.3 13 L-6.9 2.4 L-15 -4.6 L-4.4 -5 Z";

function Flag() {
  const cols = 4;
  const rows = 3;
  const size = 6.5;
  return (
    <g>
      <ellipse cx="0" cy="2" rx="12" ry="4" fill="#000" opacity="0.18" />
      <rect x="-1.8" y="-46" width="3.6" height="48" rx="1.5" fill="#eef2f7" />
      <circle cx="0" cy="-47" r="4" fill="#ffc524" />
      <g className="bd-wave" style={{ transformOrigin: "2px -40px" }}>
        <rect
          x="2"
          y="-44"
          width={cols * size}
          height={rows * size}
          fill="#fff"
          stroke="#1f2937"
          strokeWidth="1"
        />
        {Array.from({ length: cols * rows }, (_, k) => {
          const cx = k % cols;
          const cy = Math.floor(k / cols);
          return (cx + cy) % 2 === 0 ? (
            <rect
              key={k}
              x={2 + cx * size}
              y={-44 + cy * size}
              width={size}
              height={size}
              fill="#1f2937"
            />
          ) : null;
        })}
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
  outfit?: Outfit;
};

export function Board({
  level,
  snapshots,
  index,
  celebrate = false,
  variant = "cyan",
  outfit,
}: Props) {
  const t = useT();
  const map = useMemo(() => parseLevel(level), [level]);
  const cols = map.width;
  const rows = map.height;
  const { ref, size } = useBox();
  // El escenario se ensancha o alarga para tener la misma forma que su contenedor (el cielo llena todo)
  const baseW = Math.max(cols + 3, 7) * T;
  const baseH = Math.max(rows + 3, 5) * T;
  const aspect = size.w > 0 && size.h > 0 ? size.w / size.h : baseW / baseH;
  const W = Math.max(baseW, baseH * aspect);
  const H = W / aspect;
  const scale = size.w > 0 ? size.w / W : 1;
  const ox = (W - cols * T) / 2;
  const oy = (H - rows * T) / 2;

  const cells = useMemo(() => {
    const out: { x: number; y: number; ch: string }[] = [];
    level.rows.forEach((row, y) =>
      [...row].forEach((ch, x) => ch !== "#" && out.push({ x, y, ch })),
    );
    return out;
  }, [level]);

  // Cielo: globos, nubes y mariposas repartidos fuera del camino (posiciones fijas por reto)
  const decor = useMemo(() => {
    const isPath = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < cols && y < rows && level.rows[y][x] !== "#";
    const seed = level.level * 10 + level.challenge;
    const items: {
      key: string;
      kind: SkyKind;
      x: number;
      y: number;
      s: number;
      v: number;
    }[] = [];
    const minX = -Math.ceil(ox / T);
    const maxX = cols + Math.ceil(ox / T);
    const minY = -Math.ceil(oy / T);
    const maxY = rows + Math.ceil(oy / T);
    for (let cy = minY; cy < maxY; cy++) {
      for (let cx = minX; cx < maxX; cx++) {
        if (isPath(cx, cy)) continue;
        const h = hash(cx, cy, seed);
        const px = ox + cx * T + T / 2 + (hash(cx, cy, seed + 1) - 0.5) * 24;
        const py = oy + cy * T + T * 0.8 + (hash(cx, cy, seed + 2) - 0.5) * 12;
        const s = 0.9 + hash(cx, cy, seed + 3) * 0.3;
        // Los globos altos no se ponen justo debajo del camino (taparían las casillas)
        const tallOk =
          !isPath(cx, cy - 1) &&
          !isPath(cx, cy - 2) &&
          !isPath(cx - 1, cy - 1) &&
          !isPath(cx + 1, cy - 1);
        let kind: SkyKind | null = null;
        if (h < 0.025) kind = tallOk ? "balloon" : null;
        else if (h < 0.04) kind = tallOk ? "bunch" : null;
        else if (h < 0.15) kind = "cloud";
        else if (h < 0.18) kind = "hole";
        else if (h < 0.19) kind = "butterfly";
        if (!kind) continue;
        items.push({
          key: `${cx},${cy}`,
          kind,
          x: px,
          y: kind === "butterfly" ? py - 22 : py,
          s,
          v: Math.floor(h * 60),
        });
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
  const slide =
    "left 280ms cubic-bezier(.3,.7,.3,1), top 280ms cubic-bezier(.3,.7,.3,1)";

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden rounded-3xl border-4 border-white shadow-card"
      style={{
        background: "linear-gradient(180deg,#c4f1ff,#a6e6fa)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginTop: -H / 2,
          marginLeft: -W / 2,
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="absolute inset-0"
          role="img"
          aria-label={t("play.board")}
        >
          <defs>
            <linearGradient id="bd-grass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4f1ff" />
              <stop offset="100%" stopColor="#a6e6fa" />
            </linearGradient>
            <linearGradient id="bd-tile" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6fe0fb" />
              <stop offset="100%" stopColor="#14b0e6" />
            </linearGradient>
            <linearGradient id="bd-start" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4fffa" />
              <stop offset="100%" stopColor="#bff3d6" />
            </linearGradient>
            <linearGradient id="bd-goal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="100%" stopColor="#ffd43b" />
            </linearGradient>
            <filter id="bd-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          <rect width={W} height={H} fill="url(#bd-grass)" />
          {/* resplandor del camino */}
          <g filter="url(#bd-glow)" opacity="0.95">
            {cells.map(({ x, y }) => (
              <rect
                key={`g${x}-${y}`}
                x={ox + x * T - 4}
                y={oy + y * T - 4}
                width={T + 8}
                height={T + 8}
                rx="18"
                fill="#ffffff"
              />
            ))}
          </g>

          {/* casillas del camino */}
          {cells.map(({ x, y, ch }) => {
            const px = ox + x * T;
            const py = oy + y * T;
            return (
              <g key={`t${x}-${y}`}>
                <rect
                  x={px + 1.5}
                  y={py + 1.5}
                  width={T - 3}
                  height={T - 3}
                  rx="9"
                  fill={
                    ch === "G"
                      ? "#ffffff"
                      : ch === "S"
                        ? "url(#bd-start)"
                        : "url(#bd-tile)"
                  }
                  stroke={ch === "S" ? "#22a45d" : "#0c92c8"}
                  strokeOpacity="0.35"
                  strokeWidth="1.5"
                />
                <rect
                  x={px + 6}
                  y={py + 5}
                  width={T - 12}
                  height={(T - 12) * 0.3}
                  rx="6"
                  fill="#fff"
                  opacity="0.32"
                />
                <rect
                  x={px + 6}
                  y={py + T - 12}
                  width={T - 12}
                  height="5"
                  rx="2.5"
                  fill="#0a7fb3"
                  opacity="0.18"
                />
                {ch === "S" && (
                  <>
                    <rect
                      x={px + 6}
                      y={py + 6}
                      width={T - 12}
                      height={T - 12}
                      rx="7"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeDasharray="5 4"
                    />
                    <g transform={`translate(${px + 14} ${py + 20})`}>
                      <rect
                        x="-1.3"
                        y="-14"
                        width="2.6"
                        height="18"
                        rx="1"
                        fill="#6b7280"
                      />
                      <path d="M1 -14 H15 L12 -9 L15 -4 H1 Z" fill="#22c55e" />
                    </g>
                  </>
                )}
                {ch === "G" && (
                  <g>
                    {Array.from({ length: 16 }, (_, k) => {
                      const cx = k % 4;
                      const cy = Math.floor(k / 4);
                      const size = (T - 12) / 4;
                      return (cx + cy) % 2 === 0 ? (
                        <rect
                          key={k}
                          x={px + 6 + cx * size}
                          y={py + 6 + cy * size}
                          width={size}
                          height={size}
                          fill="#1f2937"
                        />
                      ) : null;
                    })}
                    <rect
                      x={px + 6}
                      y={py + 6}
                      width={T - 12}
                      height={T - 12}
                      rx="3"
                      fill="none"
                      stroke="#1f2937"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* paisaje */}
          {decor.map((d) => (
            <g
              key={d.key}
              className={
                d.kind === "balloon" || d.kind === "bunch"
                  ? "sky-bob"
                  : undefined
              }
              style={{ animationDelay: `${(d.v % 5) * -1}s` }}
              opacity={d.kind === "cloud" ? 0.6 : 1}
            >
              <SkyPiece kind={d.kind} x={d.x} y={d.y} s={d.s} v={d.v} />
            </g>
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
              <g
                key={`s${c.x}-${c.y}`}
                transform={`translate(${ox + c.x * T + T / 2} ${oy + c.y * T + T / 2})`}
              >
                <g className="bd-star">
                  <path
                    d={STAR}
                    fill="#ffc524"
                    stroke="#d99a00"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0 -9 L2.4 -3 L8 -2.6 L3.6 1.4 L5 7 L0 4 L-5 7 L-3.6 1.4 L-8 -2.6 L-2.4 -3 Z"
                    fill="#fff3b0"
                    opacity="0.7"
                  />
                </g>
              </g>
            ))}
          <g
            transform={`translate(${ox + map.goal.x * T + T / 2 - 4} ${oy + map.goal.y * T + T / 2 + 14})`}
          >
            <Flag />
          </g>
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
            background:
              "radial-gradient(ellipse, rgba(8,30,60,0.45) 0%, rgba(8,30,60,0) 70%)",
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
          <div
            key={i}
            className={
              current.bump
                ? "fz-bump"
                : moved
                  ? "fz-hop"
                  : turned
                    ? "fz-turn"
                    : celebrate
                      ? "fz-cheer"
                      : "fz-idle"
            }
          >
            <Fuzzy
              variant={variant}
              outfit={outfit}
              dir={current.dir}
              mood={mood}
              size={SPR}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
