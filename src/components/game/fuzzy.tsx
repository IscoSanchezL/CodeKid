"use client";

import { useId, useMemo } from "react";
import type { Dir } from "@/engine/types";

export type FuzzyVariant = "cyan" | "purple" | "orange" | "green" | "rainbow";
export type FuzzyMood = "idle" | "happy" | "bump";

const PALETTE: Record<FuzzyVariant, { light: string; base: string; dark: string }> = {
  cyan: { light: "#7BEBFF", base: "#1FC8E8", dark: "#0B7FA6" },
  purple: { light: "#C4A8FF", base: "#8B5CF6", dark: "#5330B5" },
  orange: { light: "#FFC38A", base: "#FF8A3D", dark: "#C4571A" },
  green: { light: "#9CF08A", base: "#35C759", dark: "#1B8A3A" },
  rainbow: { light: "#FFE27A", base: "#FF7AB6", dark: "#6C5CE7" },
};

/** Hacia dónde mira: se desplaza la cara para dar sensación de volumen. */
const LOOK: Record<Dir, { dx: number; dy: number }> = {
  0: { dx: 0, dy: -4 },
  1: { dx: 6, dy: 0 },
  2: { dx: 0, dy: 4 },
  3: { dx: -6, dy: 0 },
};

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

type Props = {
  variant?: FuzzyVariant;
  dir?: Dir;
  mood?: FuzzyMood;
  size?: number;
  className?: string;
};

/** Personaje peludo con volumen (degradados, pelaje, brillo) dibujado en SVG. */
export function Fuzzy({ variant = "cyan", dir = 2, mood = "idle", size = 80, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const c = PALETTE[variant];
  const look = LOOK[dir];

  const fur = useMemo(() => {
    const rand = rng(variant.length * 97 + 13);
    const strokes: { d: string; tone: "light" | "dark"; w: number; o: number }[] = [];
    for (let i = 0; i < 120; i++) {
      const ang = rand() * Math.PI * 2;
      const rad = 8 + rand() * 33;
      const len = 5 + rand() * 9;
      const bend = (rand() - 0.5) * 6;
      const x1 = 50 + Math.cos(ang) * rad;
      const y1 = 52 + Math.sin(ang) * rad;
      const x2 = 50 + Math.cos(ang) * (rad + len);
      const y2 = 52 + Math.sin(ang) * (rad + len);
      const cx = (x1 + x2) / 2 + Math.cos(ang + 1.57) * bend;
      const cy = (y1 + y2) / 2 + Math.sin(ang + 1.57) * bend;
      strokes.push({
        d: `M${r2(x1)} ${r2(y1)} Q${r2(cx)} ${r2(cy)} ${r2(x2)} ${r2(y2)}`,
        tone: rand() > 0.5 ? "light" : "dark",
        w: r2(1.4 + rand() * 1.6),
        o: r2(0.25 + rand() * 0.35),
      });
    }
    return strokes;
  }, [variant]);

  const eyeY = 47;
  const fx = look.dx * 0.8;
  const fy = look.dy * 0.8;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Personaje">
      <defs>
        <radialGradient id={`body-${uid}`} cx="36%" cy="28%" r="80%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
        {variant === "rainbow" && (
          <linearGradient id={`rb-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF5C5C" />
            <stop offset="22%" stopColor="#FFB84D" />
            <stop offset="42%" stopColor="#FFE14D" />
            <stop offset="62%" stopColor="#5CDB7A" />
            <stop offset="82%" stopColor="#4DB8FF" />
            <stop offset="100%" stopColor="#A56BFF" />
          </linearGradient>
        )}
        <filter id={`fur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <clipPath id={`clip-${uid}`}>
          <circle cx="50" cy="52" r="41" />
        </clipPath>
      </defs>

      <g filter={`url(#fur-${uid})`}>
        <circle cx="50" cy="52" r="40" fill={`url(#body-${uid})`} />
        {variant === "rainbow" && (
          <circle cx="50" cy="52" r="40" fill={`url(#rb-${uid})`} opacity="0.85" />
        )}
        <g clipPath={`url(#clip-${uid})`}>
          {fur.map((s, i) => (
            <path
              key={i}
              d={s.d}
              fill="none"
              strokeLinecap="round"
              strokeWidth={s.w}
              stroke={s.tone === "light" ? c.light : c.dark}
              opacity={s.o}
            />
          ))}
        </g>
      </g>

      {/* sombra interior y brillo para dar volumen */}
      <ellipse cx="34" cy="30" rx="15" ry="9" fill="#fff" opacity="0.22" transform="rotate(-25 34 30)" />

      <g transform={`translate(${fx} ${fy})`}>
        {mood === "bump" ? (
          <>
            <path d="M31 41 L43 47 L31 53" fill="none" stroke="#1a1030" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M69 41 L57 47 L69 53" fill="none" stroke="#1a1030" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="50" cy="68" rx="6" ry="7" fill="#3a0f1f" />
          </>
        ) : (
          <>
            {[36, 64].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy={eyeY} rx="11" ry="12.5" fill="#fff" />
                <ellipse cx={x} cy={eyeY} rx="11" ry="12.5" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="1" />
                <circle cx={x + look.dx * 0.55} cy={eyeY + look.dy * 0.55 + 1} r="6.2" fill="#1a1030" />
                <circle cx={x + look.dx * 0.55 - 2} cy={eyeY + look.dy * 0.55 - 2} r="2.1" fill="#fff" />
              </g>
            ))}
            {mood === "happy" ? (
              <>
                <path d="M34 61 Q50 86 66 61 Q50 67 34 61 Z" fill="#3a0f1f" />
                <ellipse cx="50" cy="73" rx="8" ry="4" fill="#FF7A9C" />
              </>
            ) : (
              <>
                <path d="M38 62 Q50 76 62 62 Q50 67 38 62 Z" fill="#3a0f1f" />
                <ellipse cx="50" cy="70" rx="5.5" ry="2.8" fill="#FF7A9C" />
              </>
            )}
            <ellipse cx="24" cy="62" rx="5" ry="3" fill="#FF8FB0" opacity="0.45" />
            <ellipse cx="76" cy="62" rx="5" ry="3" fill="#FF8FB0" opacity="0.45" />
          </>
        )}
      </g>
    </svg>
  );
}
