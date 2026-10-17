"use client";

import { useState } from "react";
import Image from "next/image";
import { Fuzzy } from "@/components/game/fuzzy";
import { useT } from "@/i18n";

/**
 * Imagen principal de la marca. Busca el archivo en /public/brand (jpg, png o webp).
 * Si todavía no existe, muestra un logo provisional dibujado en vector.
 */
const SOURCES = ["/brand/codekid-logo.jpg", "/brand/codekid-logo.png", "/brand/codekid-logo.webp"];

function Placeholder() {
  return (
    <svg viewBox="0 0 600 260" className="block h-auto w-full" role="img" aria-label="CodeKid">
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
      <rect width="600" height="260" fill="url(#bh-glow)" />
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
    </svg>
  );
}


/** Texto de marca: «CodeKid» con degradado y relieve + el lema. Va debajo de la imagen. */
export function BrandText({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <svg viewBox="0 0 600 150" className={`block h-auto w-full ${className}`} role="img" aria-label={t("brand.tagline.aria")}>
      <defs>
        <linearGradient id="bt-silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#c9d3e6" />
          <stop offset="100%" stopColor="#8d9bb8" />
        </linearGradient>
        <linearGradient id="bt-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8af0ff" />
          <stop offset="100%" stopColor="#1ab4ff" />
        </linearGradient>
        <linearGradient id="bt-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd43b" />
          <stop offset="100%" stopColor="#ff8a3d" />
        </linearGradient>
        <filter id="bt-glow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g fontFamily="inherit" fontWeight="900" fontSize="96" textAnchor="middle">
        <text x="300" y="96" fill="#1ab4ff" opacity="0.5" filter="url(#bt-glow)">
          Code<tspan>Kid</tspan>
        </text>
        <text x="300" y="96" fill="#0a2a6a" transform="translate(5 6)">
          Code<tspan>Kid</tspan>
        </text>
        <text x="300" y="96" stroke="#0a1a40" strokeWidth="5" paintOrder="stroke" fill="url(#bt-silver)">
          Code<tspan fill="url(#bt-cyan)">Kid</tspan>
        </text>
      </g>
      <g fontFamily="inherit" fontWeight="800" fontSize="19" letterSpacing="5" textAnchor="middle">
        <text x="300" y="138" fill="#9fb4e6">
          <tspan fill="#8af0ff">{t("brand.play")}</tspan> · <tspan fill="#ffffff">{t("brand.create")}</tspan> · <tspan fill="url(#bt-orange)">{t("brand.code")}</tspan>
        </text>
      </g>
    </svg>
  );
}

/**
 * Imagen principal del logo (con respaldo en vector si el archivo no existe).
 * Con `blend`, el negro de la imagen se funde con el fondo (modo «screen»), para que flote en el cielo.
 */
export function BrandImage({ className = "", blend = false }: { className?: string; blend?: boolean }) {
  const t = useT();
  const [idx, setIdx] = useState(0);
  const style = blend
    ? { mixBlendMode: "screen" as const, WebkitMaskImage: "radial-gradient(ellipse 62% 66% at 50% 48%, #000 55%, transparent 100%)", maskImage: "radial-gradient(ellipse 62% 66% at 50% 48%, #000 55%, transparent 100%)" }
    : undefined;
  return idx < SOURCES.length ? (
    <Image
      src={SOURCES[idx]}
      alt={t("brand.alt")}
      width={1536}
      height={1024}
      priority
      unoptimized
      className={`block h-auto w-full ${className}`}
      style={style}
      onError={() => setIdx((i) => i + 1)}
    />
  ) : (
    <div className={className} style={style}>
      <Placeholder />
    </div>
  );
}
