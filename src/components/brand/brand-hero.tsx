"use client";

import { useState } from "react";
import Image from "next/image";
import { Fuzzy } from "@/components/game/fuzzy";

/**
 * Imagen principal de la marca. Busca el archivo en /public/brand (jpg, png o webp).
 * Si todavía no existe, muestra un logo provisional dibujado en vector.
 */
const SOURCES = ["/brand/codekid-logo.jpg", "/brand/codekid-logo.png", "/brand/codekid-logo.webp"];

function Placeholder() {
  return (
    <svg viewBox="0 0 600 400" className="block h-auto w-full" role="img" aria-label="CodeKid — Juega. Crea. Programa.">
      <defs>
        <radialGradient id="bh-glow" cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#12306e" />
          <stop offset="100%" stopColor="#02040f" />
        </radialGradient>
        <linearGradient id="bh-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5ee3ff" />
          <stop offset="100%" stopColor="#1f63f0" />
        </linearGradient>
        <linearGradient id="bh-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd43b" />
          <stop offset="100%" stopColor="#ff8a3d" />
        </linearGradient>
        <linearGradient id="bh-silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#c9d3e6" />
          <stop offset="100%" stopColor="#8d9bb8" />
        </linearGradient>
        <linearGradient id="bh-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8af0ff" />
          <stop offset="100%" stopColor="#1ab4ff" />
        </linearGradient>
        <filter id="bh-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect width="600" height="400" fill="url(#bh-glow)" />
      <g filter="url(#bh-blur)" opacity="0.7">
        <path d="M205 80 L110 160 L205 240" fill="none" stroke="#1f9bff" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M395 80 L490 160 L395 240" fill="none" stroke="#ff9a2e" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M205 80 L110 160 L205 240" fill="none" stroke="url(#bh-blue)" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M395 80 L490 160 L395 240" fill="none" stroke="url(#bh-orange)" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
      <foreignObject x="225" y="62" width="150" height="150">
        <div className="fz-idle">
          <Fuzzy variant="cyan" size={150} dir={1} mood="happy" outfit={{ glasses: "gl-nerd" }} />
        </div>
      </foreignObject>
      <g fontFamily="inherit" fontWeight="900" fontSize="98" textAnchor="middle">
        <text x="300" y="352" fill="#0a2a6a" transform="translate(5 6)">
          Code<tspan>Kid</tspan>
        </text>
        <text x="300" y="352" stroke="#0a1a40" strokeWidth="5" paintOrder="stroke" fill="url(#bh-silver)">
          Code<tspan fill="url(#bh-cyan)">Kid</tspan>
        </text>
      </g>
      <text x="300" y="385" textAnchor="middle" fill="#9fb4e6" fontSize="17" fontWeight="700" letterSpacing="4">
        JUEGA · CREA · PROGRAMA
      </text>
    </svg>
  );
}

export function BrandHero({ className = "" }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-black shadow-[0_0_0_2px_rgba(95,216,255,0.25),0_20px_50px_-12px_rgba(31,155,255,0.55)] ${className}`}
    >
      {idx < SOURCES.length ? (
        <Image
          src={SOURCES[idx]}
          alt="CodeKid — Juega. Crea. Programa."
          width={1536}
          height={1024}
          priority
          unoptimized
          className="block h-auto w-full"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <Placeholder />
      )}
    </div>
  );
}
