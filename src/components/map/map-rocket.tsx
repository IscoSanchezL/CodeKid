"use client";

import { useEffect, useRef, useState } from "react";
import { Fuzzy } from "@/components/game/fuzzy";
import { sfx } from "@/lib/audio";
import { useMapProgress } from "./use-current-level";

type Pt = readonly [number, number];
const KEY = "codekid:map:rocket";
const FLIGHT_MS = 3200;

/** Cohete con Bit: espera en el planeta actual y, cuando el alumno desbloquea uno nuevo, viaja hasta él por la ruta. */
export function MapRocket({
  nodes,
  trail,
}: {
  nodes: readonly Pt[];
  trail: string;
}) {
  const { current } = useMapProgress();
  const [pos, setPos] = useState<{
    x: number;
    y: number;
    angle: number;
  } | null>(null);
  const [flying, setFlying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (current === null) return;
    const node = nodes[current - 1];
    if (!node) return;
    let last: number | null = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      last = raw ? Number(raw) : null;
    } catch {
      last = null;
    }
    try {
      window.localStorage.setItem(KEY, String(current));
    } catch {
      // sin almacenamiento: solo se pierde la animación de viaje
    }

    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!last || last >= current || last < 1 || !nodes[last - 1] || reduce) {
      setPos({ x: node[0], y: node[1], angle: 0 });
      return;
    }

    // Longitud de la ruta donde está cada planeta
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", trail);
    const total = path.getTotalLength();
    const lengthAt = (n: Pt) => {
      let best = 0;
      let bestD = Infinity;
      for (let l = 0; l <= total; l += 3) {
        const p = path.getPointAtLength(l);
        const d = Math.hypot(p.x - n[0], p.y - n[1]);
        if (d < bestD) {
          bestD = d;
          best = l;
        }
      }
      return best;
    };
    const from = lengthAt(nodes[last - 1]);
    const to = lengthAt(node);

    setPos({ x: nodes[last - 1][0], y: nodes[last - 1][1], angle: 0 });
    const t0 = performance.now();
    const timer = window.setTimeout(() => {
      setFlying(true);
      sfx("launch");
      const step = (now: number) => {
        const k = Math.min(1, (now - t0 - 700) / FLIGHT_MS);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const l = from + (to - from) * e;
        const p = path.getPointAtLength(l);
        const q = path.getPointAtLength(Math.min(total, l + 4));
        const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 90;
        setPos({ x: p.x, y: p.y, angle: k >= 1 ? 0 : angle });
        if (k < 1) raf.current = requestAnimationFrame(step);
        else setFlying(false);
      };
      raf.current = requestAnimationFrame(step);
    }, 700);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf.current);
    };
  }, [current, nodes, trail]);

  if (!pos) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10"
      style={{
        left: `${pos.x / 10}%`,
        top: `${pos.y / 7}%`,
        width: "6.5%",
        transform: `translate(-50%, ${flying ? "-50%" : "-118%"}) rotate(${pos.angle}deg)`,
      }}
    >
      <div className={flying ? "" : "node-float"}>
        <Rocket flying={flying} />
      </div>
    </div>
  );
}

function Rocket({ flying }: { flying: boolean }) {
  return (
    <div className="relative mx-auto aspect-[3/5] w-full">
      <svg
        viewBox="0 0 60 100"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="rk-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#aab6d8" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#8f9cc4" />
          </linearGradient>
          <radialGradient id="rk-flame" cx="0.5" cy="0.2" r="0.8">
            <stop offset="0%" stopColor="#fff7c2" />
            <stop offset="45%" stopColor="#ffb03a" />
            <stop offset="100%" stopColor="#ff4d2e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g
          className={flying ? "rocket-flame fast" : "rocket-flame"}
          style={{ transformOrigin: "30px 80px" }}
        >
          <path d="M20 78 Q30 118 40 78 Z" fill="url(#rk-flame)" />
          <path d="M25 78 Q30 100 35 78 Z" fill="#fff" opacity="0.8" />
        </g>
        <path d="M14 66 L2 84 L16 80 Z" fill="#ff4d6d" />
        <path d="M46 66 L58 84 L44 80 Z" fill="#ff4d6d" />
        <path
          d="M30 2 C46 14 50 40 46 76 L14 76 C10 40 14 14 30 2 Z"
          fill="url(#rk-body)"
          stroke="#fff"
          strokeOpacity="0.7"
        />
        <path
          d="M30 2 C38 8 43 16 45 24 L15 24 C17 16 22 8 30 2 Z"
          fill="#ff4d6d"
        />
        <circle cx="30" cy="42" r="14.5" fill="#0b1440" />
        <rect x="14" y="70" width="32" height="6" rx="3" fill="#6b7aa8" />
      </svg>
      {/* Bit asomando por la ventanilla */}
      <div className="absolute left-1/2 top-[27%] w-[44%] -translate-x-1/2">
        <Fuzzy
          variant="cyan"
          size={60}
          dir={2}
          mood="happy"
          className="h-auto w-full"
        />
      </div>
      <svg
        viewBox="0 0 60 100"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <circle cx="30" cy="42" r="14.5" fill="#7df9ff" opacity="0.16" />
        <circle
          cx="30"
          cy="42"
          r="14.5"
          fill="none"
          stroke="#7df9ff"
          strokeWidth="3"
        />
        <path
          d="M21 36 Q24 31 29 30"
          stroke="#fff"
          strokeOpacity="0.8"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
