"use client";

import { useMemo, useRef } from "react";
import { Fuzzy, type FuzzyVariant } from "@/components/game/fuzzy";
import { rng } from "@/components/map/path";

/**
 * «Cosmos de código»: cielo nocturno surrealista con estrellas, planetas con símbolos de código,
 * personajes astronautas y profundidad al mover el ratón. Es siempre oscuro (de noche en cualquier tema).
 * El contenido va dentro y queda por encima.
 */

const GLYPHS = ["</>", "{ }", ";", "01", "[ ]", "=>", "( )", "&&", "#", "//"];
const COLORS = ["#5ee3ff", "#ffb02e", "#ffffff", "#b99cff", "#7dffb2"];

type Star = { x: number; y: number; s: number; d: number; o: number };
type Glyph = { t: string; x: number; y: number; size: number; color: string; dur: number; delay: number };

function useScenery() {
  return useMemo(() => {
    const r = rng(2026);
    const far: Star[] = Array.from({ length: 70 }, () => ({ x: r() * 100, y: r() * 100, s: 1 + r() * 1.2, d: r() * 5, o: 0.35 + r() * 0.5 }));
    const near: Star[] = Array.from({ length: 28 }, () => ({ x: r() * 100, y: r() * 100, s: 1.8 + r() * 1.8, d: r() * 4, o: 0.6 + r() * 0.4 }));
    const glyphs: Glyph[] = Array.from({ length: 16 }, (_, i) => ({
      t: GLYPHS[i % GLYPHS.length],
      x: 4 + r() * 92,
      y: 6 + r() * 88,
      size: 13 + r() * 18,
      color: COLORS[Math.floor(r() * COLORS.length)],
      dur: 7 + r() * 8,
      delay: -r() * 10,
    }));
    return { far, near, glyphs };
  }, []);
}

function Planets() {
  return (
    <>
      {/* planeta con anillo y </> */}
      <div className="cosmos-layer absolute -left-6 bottom-[4%] hidden w-[34%] max-w-[300px] sm:block" style={{ ["--depth" as string]: 22 }}>
        <div className="cosmos-float" style={{ animationDuration: "11s" }}>
          <svg viewBox="0 0 240 170" className="w-full overflow-visible" aria-hidden>
            <defs>
              <radialGradient id="cp-a" cx="34%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#8af0ff" />
                <stop offset="55%" stopColor="#1f7bff" />
                <stop offset="100%" stopColor="#0a1a6a" />
              </radialGradient>
              <linearGradient id="cp-ring" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffd43b" />
                <stop offset="100%" stopColor="#ff7a2e" />
              </linearGradient>
              <filter id="cp-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
            </defs>
            <circle cx="120" cy="85" r="64" fill="#1f7bff" opacity="0.5" filter="url(#cp-glow)" />
            <g transform="rotate(-16 120 85)">
              <path d="M10 85 A110 28 0 0 1 230 85" fill="none" stroke="url(#cp-ring)" strokeWidth="8" opacity="0.8" />
              <circle cx="120" cy="85" r="58" fill="url(#cp-a)" />
              <ellipse cx="98" cy="62" rx="20" ry="11" fill="#fff" opacity="0.18" transform="rotate(-25 98 62)" />
              <text x="120" y="96" textAnchor="middle" fontSize="30" fontWeight="900" fill="#fff" opacity="0.9" fontFamily="monospace">
                {"</>"}
              </text>
              <path d="M10 85 A110 28 0 0 0 230 85" fill="none" stroke="url(#cp-ring)" strokeWidth="8" />
            </g>
          </svg>
        </div>
      </div>

      {/* planeta naranja con { } */}
      <div className="cosmos-layer absolute right-[4%] top-[7%] hidden w-[17%] max-w-[150px] sm:block" style={{ ["--depth" as string]: -18 }}>
        <div className="cosmos-float" style={{ animationDuration: "9s", animationDelay: "-3s" }}>
          <svg viewBox="0 0 100 100" className="w-full overflow-visible" aria-hidden>
            <defs>
              <radialGradient id="cp-b" cx="34%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#fff0a8" />
                <stop offset="55%" stopColor="#ff9a2e" />
                <stop offset="100%" stopColor="#a2410a" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="#ff9a2e" opacity="0.35" filter="url(#cp-glow)" />
            <circle cx="50" cy="50" r="40" fill="url(#cp-b)" />
            <circle cx="34" cy="62" r="7" fill="#a2410a" opacity="0.35" />
            <circle cx="66" cy="38" r="5" fill="#a2410a" opacity="0.3" />
            <text x="50" y="60" textAnchor="middle" fontSize="28" fontWeight="900" fill="#3a1500" opacity="0.8" fontFamily="monospace">
              {"{ }"}
            </text>
          </svg>
        </div>
      </div>

      {/* luna */}
      <div className="cosmos-layer absolute bottom-[10%] right-[10%] hidden w-[7%] max-w-[64px] sm:block" style={{ ["--depth" as string]: 10 }}>
        <div className="cosmos-float" style={{ animationDuration: "13s", animationDelay: "-6s" }}>
          <svg viewBox="0 0 100 100" className="w-full" aria-hidden>
            <circle cx="50" cy="50" r="44" fill="#dfe8ff" />
            <circle cx="36" cy="40" r="9" fill="#b6c4ee" />
            <circle cx="62" cy="62" r="7" fill="#b6c4ee" />
            <circle cx="64" cy="34" r="4" fill="#b6c4ee" />
          </svg>
        </div>
      </div>
    </>
  );
}

const ASTRONAUTS: { variant: FuzzyVariant; size: number; cls: string; depth: number; dur: number; delay: number }[] = [
  { variant: "cyan", size: 84, cls: "left-[7%] top-[12%] hidden sm:block", depth: 30, dur: 14, delay: 0 },
  { variant: "purple", size: 104, cls: "right-[6%] bottom-[8%] hidden sm:block", depth: 38, dur: 17, delay: -5 },
  { variant: "orange", size: 70, cls: "left-[24%] bottom-[5%] hidden sm:block", depth: 26, dur: 12, delay: -8 },
];

export function CosmosSky({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { far, near, glyphs } = useScenery();

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  }
  function onLeave() {
    ref.current?.style.setProperty("--px", "0");
    ref.current?.style.setProperty("--py", "0");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`cosmos relative isolate overflow-hidden ${className}`}
    >
      {/* nebulosas */}
      <div aria-hidden className="cosmos-layer pointer-events-none absolute inset-0" style={{ ["--depth" as string]: -6 }}>
        <div className="absolute -left-[10%] top-[10%] h-[60%] w-[60%] rounded-full bg-[#1f63f0] opacity-30 blur-[90px]" />
        <div className="absolute -right-[10%] bottom-[0%] h-[55%] w-[55%] rounded-full bg-[#8b3dff] opacity-25 blur-[100px]" />
        <div className="absolute left-[35%] top-[45%] h-[40%] w-[40%] rounded-full bg-[#ff8a3d] opacity-[0.14] blur-[90px]" />
      </div>

      {/* estrellas lejanas y cercanas */}
      {[
        { list: far, depth: 6 },
        { list: near, depth: 16 },
      ].map(({ list, depth }, li) => (
        <div key={li} aria-hidden className="cosmos-layer pointer-events-none absolute inset-0" style={{ ["--depth" as string]: depth }}>
          {list.map((s, i) => (
            <span
              key={i}
              className="cosmos-twinkle absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o, animationDelay: `${-s.d}s` }}
            />
          ))}
        </div>
      ))}

      {/* estrellas fugaces */}
      <span aria-hidden className="cosmos-shoot absolute left-[12%] top-[14%]" style={{ animationDelay: "1s" }} />
      <span aria-hidden className="cosmos-shoot absolute left-[58%] top-[6%]" style={{ animationDelay: "6.5s", animationDuration: "7s" }} />

      {/* símbolos de código flotando */}
      <div aria-hidden className="cosmos-layer pointer-events-none absolute inset-0" style={{ ["--depth" as string]: 24 }}>
        {glyphs.map((g, i) => (
          <span
            key={i}
            className="cosmos-float absolute select-none font-mono font-black"
            style={{
              left: `${g.x}%`,
              top: `${g.y}%`,
              fontSize: g.size,
              color: g.color,
              textShadow: `0 0 14px ${g.color}`,
              opacity: 0.55,
              animationDuration: `${g.dur}s`,
              animationDelay: `${g.delay}s`,
            }}
          >
            {g.t}
          </span>
        ))}
      </div>

      <Planets />

      {/* astronautas Bit */}
      {ASTRONAUTS.map((a, i) => (
        <div key={i} aria-hidden className={`cosmos-layer pointer-events-none absolute ${a.cls}`} style={{ ["--depth" as string]: a.depth }}>
          <div className="cosmos-drift" style={{ animationDuration: `${a.dur}s`, animationDelay: `${a.delay}s` }}>
            <Fuzzy variant={a.variant} outfit={{ hat: "hat-astro" }} size={a.size} dir={(i + 1) as 1 | 2 | 3} mood="happy" />
          </div>
        </div>
      ))}

      {/* Sin transform ni z-index: el logo (mix-blend-mode: screen) necesita ver el cielo que tiene detrás */}
      <div className="relative">{children}</div>
    </div>
  );
}
