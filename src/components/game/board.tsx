"use client";

import { useMemo } from "react";
import { parseLevel } from "@/engine/interpreter";
import type { Level, Snapshot } from "@/engine/types";

const CELL = 56;

/** Ángulos acumulados para que el robot gire por el camino corto (sin dar vueltas de 270°). */
function unwrapAngles(snapshots: Snapshot[]): number[] {
  const out: number[] = [];
  let prev = 0;
  snapshots.forEach((s, i) => {
    let a = s.dir * 90;
    if (i > 0) {
      const base = out[i - 1];
      let diff = a - (prev % 360);
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      a = base + diff;
    }
    out.push(a);
    prev = a;
  });
  return out;
}

export function Board({ level, snapshots, index }: { level: Level; snapshots: Snapshot[]; index: number }) {
  const map = useMemo(() => parseLevel(level), [level]);
  const angles = useMemo(() => unwrapAngles(snapshots), [snapshots]);
  const current = snapshots[Math.min(index, snapshots.length - 1)];
  const angle = angles[Math.min(index, angles.length - 1)] ?? 0;

  // Monedas ya recogidas hasta el paso actual
  const taken = new Set<string>();
  for (let i = 0; i <= Math.min(index, snapshots.length - 1); i++) {
    const s = snapshots[i];
    if (s) taken.add(`${s.x},${s.y}`);
  }

  const w = map.width * CELL;
  const h = map.height * CELL;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-surface-2 p-2 shadow-card"
      role="img"
      aria-label="Mapa del reto"
    >
      {level.rows.map((row, y) =>
        [...row].map((ch, x) => {
          const key = `${x},${y}`;
          const wall = ch === "#";
          return (
            <g key={key} transform={`translate(${x * CELL} ${y * CELL})`}>
              <rect
                x={2}
                y={2}
                width={CELL - 4}
                height={CELL - 4}
                rx={10}
                className={wall ? "fill-fg/15" : "fill-surface"}
              />
              {ch === "G" && (
                <text x={CELL / 2} y={CELL / 2 + 9} textAnchor="middle" fontSize={28}>
                  🏁
                </text>
              )}
              {ch === "*" && !taken.has(key) && (
                <circle cx={CELL / 2} cy={CELL / 2} r={9} className="fill-warn stroke-accent" strokeWidth={3} />
              )}
            </g>
          );
        }),
      )}

      {current && (
        <g
          style={{
            transform: `translate(${current.x * CELL}px, ${current.y * CELL}px)`,
            transition: "transform 220ms ease",
          }}
        >
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: `${CELL / 2}px ${CELL / 2}px`,
              transition: "transform 220ms ease",
            }}
          >
            <rect x={8} y={8} width={CELL - 16} height={CELL - 16} rx={12} className="fill-brand" />
            <circle cx={CELL / 2 - 7} cy={CELL / 2 - 4} r={4} className="fill-white" />
            <circle cx={CELL / 2 + 7} cy={CELL / 2 - 4} r={4} className="fill-white" />
            <path d={`M${CELL / 2 - 6} 8 L${CELL / 2} 1 L${CELL / 2 + 6} 8 Z`} className="fill-accent" />
          </g>
          {current.bump && (
            <text x={CELL / 2} y={-2} textAnchor="middle" fontSize={22}>
              💥
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
