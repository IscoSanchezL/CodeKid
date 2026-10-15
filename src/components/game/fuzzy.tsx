"use client";

import { useId } from "react";
import type { Dir } from "@/engine/types";
import { Glasses, Hat, Neck, NECK_BEHIND, NeckFront } from "./outfits";

export type FuzzyVariant = "cyan" | "purple" | "orange" | "green" | "rainbow" | "pink" | "red" | "gold";
export type FuzzyMood = "idle" | "happy" | "bump";

const PALETTE: Record<FuzzyVariant, { light: string; base: string; dark: string }> = {
  cyan: { light: "#7BEBFF", base: "#1FC8E8", dark: "#0B7FA6" },
  purple: { light: "#C4A8FF", base: "#8B5CF6", dark: "#5330B5" },
  orange: { light: "#FFC38A", base: "#FF8A3D", dark: "#C4571A" },
  green: { light: "#9CF08A", base: "#35C759", dark: "#1B8A3A" },
  rainbow: { light: "#FFE27A", base: "#FF7AB6", dark: "#6C5CE7" },
  pink: { light: "#FFC2E2", base: "#FF6FB1", dark: "#C23B80" },
  red: { light: "#FF9F9F", base: "#EF4444", dark: "#A81818" },
  gold: { light: "#FFF3A8", base: "#FFC524", dark: "#B8860B" },
};

/** Hacia dónde mira: se desplaza la cara para dar sensación de volumen. */
const LOOK: Record<Dir, { dx: number; dy: number }> = {
  0: { dx: 0, dy: -4 },
  1: { dx: 6, dy: 0 },
  2: { dx: 0, dy: 4 },
  3: { dx: -6, dy: 0 },
};

export type Outfit = { hat?: string; glasses?: string; neck?: string };

type Props = {
  variant?: FuzzyVariant;
  outfit?: Outfit;
  dir?: Dir;
  mood?: FuzzyMood;
  size?: number;
  className?: string;
};

/** Bit: robot-chip de píxeles con cara de pantalla y el símbolo </> en la frente. SVG con degradados (sin filtros pesados). */
export function Fuzzy({ variant = "cyan", outfit, dir = 2, mood = "idle", size = 80, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const c = PALETTE[variant];
  const look = LOOK[dir];
  const fx = look.dx * 0.6;
  const fy = look.dy * 0.6;
  const glow = variant === "rainbow" ? "#8af0ff" : c.light;
  const eyeH = mood === "happy" ? 16 : 20;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Personaje" overflow="visible">
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="45%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.dark} />
        </linearGradient>
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
      </defs>

      {outfit?.neck && NECK_BEHIND.has(outfit.neck) && <Neck id={outfit.neck} />}

      {/* patitas */}
      <rect x="27" y="82" width="17" height="15" rx="5" fill={c.dark} />
      <rect x="56" y="82" width="17" height="15" rx="5" fill={c.dark} />

      {/* cuerpo */}
      <rect x="10" y="12" width="80" height="78" rx="22" fill={`url(#body-${uid})`} />
      {variant === "rainbow" && <rect x="10" y="12" width="80" height="78" rx="22" fill={`url(#rb-${uid})`} opacity="0.85" />}
      <rect x="10" y="12" width="80" height="78" rx="22" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" />

      {outfit?.neck && <NeckFront id={outfit.neck} />}

      {/* símbolo de código en la frente */}
      <text x="50" y="25" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="monospace" fill="#fff" fillOpacity="0.92">
        {"</>"}
      </text>

      {/* pantalla */}
      <rect x="19" y="29" width="62" height="52" rx="14" fill="#08123a" />
      <rect x="19" y="29" width="62" height="52" rx="14" fill="none" stroke={glow} strokeOpacity="0.35" strokeWidth="1.5" />

      <g transform={`translate(${fx} ${fy})`} fill={glow}>
        {mood === "bump" ? (
          <g stroke={glow} strokeWidth="4" strokeLinecap="round">
            <path d="M28 38 L42 54 M42 38 L28 54" />
            <path d="M58 38 L72 54 M72 38 L58 54" />
            <rect x="42" y="64" width="16" height="6" rx="2" stroke="none" />
          </g>
        ) : (
          <>
            <rect x="28" y={47 - eyeH / 2} width="14" height={eyeH} rx="4" />
            <rect x="58" y={47 - eyeH / 2} width="14" height={eyeH} rx="4" />
            <rect x="28" y={47 - eyeH / 2} width="5" height="5" rx="1.5" fill="#fff" fillOpacity="0.8" />
            <rect x="58" y={47 - eyeH / 2} width="5" height="5" rx="1.5" fill="#fff" fillOpacity="0.8" />
            {mood === "happy" ? (
              <>
                <rect x="30" y="62" width="7" height="6" />
                <rect x="63" y="62" width="7" height="6" />
                <rect x="37" y="68" width="26" height="6" />
              </>
            ) : (
              <>
                <rect x="36" y="62" width="7" height="6" />
                <rect x="57" y="62" width="7" height="6" />
                <rect x="43" y="68" width="14" height="5" />
              </>
            )}
          </>
        )}
        {outfit?.glasses && mood !== "bump" && <Glasses id={outfit.glasses} />}
      </g>

      {/* brillo y píxeles decorativos */}
      <rect x="18" y="16" width="22" height="5" rx="2.5" fill="#fff" fillOpacity="0.4" />
      <g fill="#fff" fillOpacity="0.55">
        <rect x="16" y="84" width="4" height="4" />
        <rect x="23" y="84" width="4" height="4" fillOpacity="0.5" />
        <rect x="80" y="84" width="4" height="4" fillOpacity="0.5" />
      </g>

      {outfit?.hat && <Hat id={outfit.hat} />}
    </svg>
  );
}
