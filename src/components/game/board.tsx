"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseLevel } from "@/engine/interpreter";
import type { Level, Snapshot } from "@/engine/types";
import { Fuzzy, type FuzzyVariant } from "./fuzzy";

// Escenario 3D con CSS: el tablero es un plano inclinado y los objetos son "carteles"
// que se enderezan para quedar de pie sobre él.
const S = 64; // lado de una casilla (px)
const TILT = 58; // inclinación de la cámara (grados)
const FLOOR_H = 10; // grosor del suelo
const WALL_H = 24; // altura de los bloques de pared
const PAD = 56;
const COS = Math.cos((TILT * Math.PI) / 180);

const hash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

function useFit(natW: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1.35, el.clientWidth / natW));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [natW]);
  return { ref, scale };
}

function Tree({ big }: { big: boolean }) {
  const w = big ? 46 : 36;
  return (
    <svg viewBox="0 0 40 50" width={w} height={w * 1.25} aria-hidden>
      <rect x="17" y="30" width="6" height="18" rx="2" fill="#8a5a2b" />
      <circle cx="20" cy="22" r="15" fill="#2f9e44" />
      <circle cx="14" cy="26" r="9" fill="#37b24d" />
      <circle cx="27" cy="19" r="9" fill="#51cf66" />
      <circle cx="16" cy="15" r="4" fill="#8ce99a" opacity="0.7" />
    </svg>
  );
}

function Flag() {
  return (
    <svg viewBox="0 0 40 60" width={44} height={66} aria-hidden>
      <rect x="8" y="6" width="3.5" height="52" rx="1.5" fill="#eceff4" />
      <circle cx="9.7" cy="6" r="3.5" fill="#ffc524" />
      <g className="bd-wave" style={{ transformOrigin: "11px 14px" }}>
        <path d="M11.5 8 H35 L29 17 L35 26 H11.5 Z" fill="#ff4d6d" />
        <path d="M11.5 8 H23 V26 H11.5 Z" fill="#fff" opacity="0.25" />
      </g>
    </svg>
  );
}

function Coin() {
  return (
    <div className="bd-coin" style={{ width: 28, height: 28 }}>
      <svg viewBox="0 0 28 28" width={28} height={28} aria-hidden>
        <circle cx="14" cy="14" r="12" fill="#ffc524" stroke="#d99a00" strokeWidth="2" />
        <circle cx="14" cy="14" r="8" fill="none" stroke="#fff3b0" strokeWidth="1.6" />
        <path d="M11 14 l2 2 l4 -5" stroke="#d99a00" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

type Billboard = { x: number; y: number; z?: number; w: number; h: number; children: React.ReactNode; slide?: boolean };

/** Objeto de pie sobre el tablero (se contrarresta la inclinación de la cámara). */
function Stand({ x, y, z = FLOOR_H, w, h, children, slide }: Billboard) {
  return (
    <div
      style={{
        position: "absolute",
        left: x * S,
        top: y * S,
        width: S,
        height: S,
        transformStyle: "preserve-3d",
        transition: slide ? "left 280ms cubic-bezier(.3,.7,.3,1), top 280ms cubic-bezier(.3,.7,.3,1)" : undefined,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: w,
          height: h,
          marginLeft: -w / 2,
          marginTop: -h,
          transformOrigin: "50% 100%",
          transform: `translateZ(${z}px) rotateX(${-TILT}deg)`,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
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
  const H = rows * S;
  const natW = cols * S + PAD * 2;
  const natH = Math.ceil(H * COS + WALL_H * Math.sin((TILT * Math.PI) / 180) + 150);
  const { ref, scale } = useFit(natW);

  const i = Math.min(index, snapshots.length - 1);
  const current = snapshots[i];
  const prev = i > 0 ? snapshots[i - 1] : undefined;
  const moved = prev && (prev.x !== current.x || prev.y !== current.y);
  const turned = prev && !moved && prev.dir !== current.dir;
  const mood = current.bump ? "bump" : celebrate ? "happy" : "idle";

  const taken = new Set<string>();
  for (let k = 0; k <= i; k++) taken.add(`${snapshots[k].x},${snapshots[k].y}`);

  const cells: { x: number; y: number; ch: string }[] = [];
  level.rows.forEach((row, y) => [...row].forEach((ch, x) => cells.push({ x, y, ch })));

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-border shadow-card"
      style={{ height: natH * scale, background: "linear-gradient(180deg,#5cc8ff 0%,#a8e4ff 55%,#d7f3ff 100%)" }}
    >
      {/* decorado del cielo */}
      <div aria-hidden className="bd-cloud" style={{ top: "8%", left: "6%", width: 90 * scale, height: 28 * scale }} />
      <div aria-hidden className="bd-cloud bd-cloud-slow" style={{ top: "20%", right: "8%", width: 120 * scale, height: 36 * scale }} />
      <div aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full" style={{ background: "radial-gradient(circle,#fff6b0 0%,#ffe066 45%,rgba(255,224,102,0) 70%)" }} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          marginLeft: -natW / 2,
          width: natW,
          height: natH,
          transform: `scale(${scale})`,
          transformOrigin: "50% 0",
        }}
      >
        <div style={{ perspective: 1100, width: natW, height: natH, position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              left: PAD,
              top: natH - 28 - H,
              width: cols * S,
              height: H,
              transformStyle: "preserve-3d",
              transform: `rotateX(${TILT}deg)`,
              transformOrigin: "50% 100%",
            }}
          >
            {/* base y sombra del islote */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: -10,
                borderRadius: 24,
                background: "rgba(20,60,120,0.18)",
                filter: "blur(10px)",
                transform: "translateZ(-2px)",
              }}
            />

            {cells.map(({ x, y, ch }) => {
              const wall = ch === "#";
              const h = wall ? WALL_H : FLOOR_H;
              const goal = ch === "G";
              return (
                <div
                  key={`${x}-${y}`}
                  style={{ position: "absolute", left: x * S, top: y * S, width: S, height: S, transformStyle: "preserve-3d" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 1.5,
                      borderRadius: wall ? 12 : 10,
                      transform: `translateZ(${h}px)`,
                      background: wall
                        ? "linear-gradient(135deg,#9be37f 0%,#58c154 100%)"
                        : goal
                          ? "linear-gradient(135deg,#fff3b0 0%,#ffd84d 100%)"
                          : ch === "S"
                            ? "linear-gradient(135deg,#d9fbff 0%,#8fe6f7 100%)"
                            : "linear-gradient(135deg,#ffffff 0%,#d6ecff 100%)",
                      boxShadow: wall ? "inset 0 0 0 2px rgba(255,255,255,0.35)" : "inset 0 0 0 2px rgba(255,255,255,0.8)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 1.5,
                      right: 1.5,
                      top: S - 1.5,
                      height: h,
                      transformOrigin: "top",
                      transform: "rotateX(90deg)",
                      borderRadius: "0 0 10px 10px",
                      background: wall
                        ? "linear-gradient(180deg,#3f9a43 0%,#2c7a35 100%)"
                        : goal
                          ? "linear-gradient(180deg,#e0b400 0%,#b98900 100%)"
                          : "linear-gradient(180deg,#8fbbe8 0%,#6c9bd1 100%)",
                    }}
                  />
                  {goal && (
                    <div
                      aria-hidden
                      className="bd-ring"
                      style={{ position: "absolute", left: 8, top: 8, right: 8, bottom: 8, borderRadius: "50%", transform: `translateZ(${FLOOR_H + 1}px)` }}
                    />
                  )}
                </div>
              );
            })}

            {/* árboles sobre algunos bloques de pared */}
            {cells
              .filter((c) => c.ch === "#" && hash(c.x, c.y) > 0.45)
              .map((c) => (
                <Stand key={`t-${c.x}-${c.y}`} x={c.x} y={c.y} z={WALL_H} w={52} h={62}>
                  <Tree big={hash(c.y, c.x) > 0.6} />
                </Stand>
              ))}

            {/* monedas */}
            {cells
              .filter((c) => c.ch === "*" && !taken.has(`${c.x},${c.y}`))
              .map((c) => (
                <Stand key={`c-${c.x}-${c.y}`} x={c.x} y={c.y} z={FLOOR_H + 6} w={30} h={30}>
                  <Coin />
                </Stand>
              ))}

            {/* meta */}
            <Stand x={map.goal.x} y={map.goal.y} w={44} h={66}>
              <Flag />
            </Stand>

            {/* sombra del personaje */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: current.x * S,
                top: current.y * S,
                width: S,
                height: S,
                transformStyle: "preserve-3d",
                transition: "left 280ms cubic-bezier(.3,.7,.3,1), top 280ms cubic-bezier(.3,.7,.3,1)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  top: 14,
                  bottom: 14,
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse, rgba(10,30,70,0.45) 0%, rgba(10,30,70,0) 70%)",
                  transform: `translateZ(${FLOOR_H + 0.5}px)`,
                }}
              />
            </div>

            {/* personaje */}
            <Stand x={current.x} y={current.y} w={70} h={70} slide>
              <div key={i} className={current.bump ? "fz-bump" : moved ? "fz-hop" : turned ? "fz-turn" : celebrate ? "fz-cheer" : "fz-idle"}>
                <Fuzzy variant={variant} dir={current.dir} mood={mood} size={66} />
              </div>
            </Stand>
          </div>
        </div>
      </div>
    </div>
  );
}
