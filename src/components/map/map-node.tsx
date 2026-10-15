"use client";

import Link from "next/link";
import { useMapProgress } from "./use-current-level";
import { Fuzzy } from "@/components/game/fuzzy";
import { LevelStars } from "./level-stars";
import { WORLDS } from "./island";

type Props = { level: number; title: string; icon: string; x: number; y: number; open: boolean };

/** Plataforma hexagonal sobre el agua, con el icono del tema del nivel. Se coloca en % sobre el mapa (viewBox 1000×700). */
export function MapNode({ level, title, icon, x, y, open }: Props) {
  const { current: here, done } = useMapProgress();
  const current = open && here === level;
  const complete = open && done.has(level);
  const w = WORLDS[(level - 1) % WORLDS.length];
  const top = open ? w.top : "#6b7385";
  const side = open ? w.side : "#454c5c";

  const body = (
    <>
      <div className={`relative ${open ? "node-float" : ""}`}>
        {current && (
          <>
            <span aria-hidden className="node-aura" />
            <span aria-hidden className="node-aura b" />
          </>
        )}
        <svg viewBox="0 0 170 120" className="w-full overflow-visible" aria-hidden>
          <ellipse cx="85" cy="100" rx="66" ry="9" fill="#5a67c8" opacity="0.22" />
          <g fill="#fff">
            <circle cx="30" cy="68" r="24" />
            <circle cx="62" cy="52" r="30" />
            <circle cx="104" cy="54" r="30" />
            <circle cx="140" cy="68" r="24" />
            <rect x="24" y="64" width="122" height="32" rx="16" />
          </g>
          <path d="M26 86 Q85 104 144 86" fill="none" stroke="#c9d6ff" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="85" cy="62" rx="62" ry="30" fill="#e6efff" />
          <polygon points="35,52 35,66 60,92 110,92 135,66 135,52 110,78 60,78" fill={side} />
          <polygon points="35,52 60,26 110,26 135,52 110,78 60,78" fill={top} />
          <polygon points="50,52 66,34 104,34 120,52 104,70 66,70" fill="#fff" opacity="0.22" />
          {current && (
            <polygon className="map-pulse" points="35,52 60,26 110,26 135,52 110,78 60,78" fill="none" stroke="#ffd43b" strokeWidth="5" />
          )}
          <text x="85" y="49" textAnchor="middle" fontSize="28" opacity={open ? 1 : 0.5}>
            {open ? icon : "🔒"}
          </text>
          {complete && (
            <g transform="translate(128 32)">
              <circle r="15" fill="#22c55e" stroke="#fff" strokeWidth="4" />
              <path d="M-7 0 L-2 6 L8 -6" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          <circle cx="85" cy="70" r="12" fill="#fff" stroke={side} strokeWidth="3" />
          <text x="85" y="75" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0b1440" fontFamily="inherit">
            {level}
          </text>
        </svg>
        {current && (
          <div className="pointer-events-none absolute -top-[26%] left-1/2 w-[36%] -translate-x-1/2">
            <div className="fz-idle">
              <Fuzzy variant="cyan" size={64} dir={2} mood="happy" className="h-auto w-full" />
            </div>
          </div>
        )}
      </div>
      <div className="-mt-[3%] text-center">
        <span className="inline-block rounded-full bg-white/95 px-[6%] py-[1%] text-[clamp(9px,1.4cqw,15px)] font-extrabold leading-tight text-[#0b1440] shadow">
          {title}
        </span>
        <div className="mt-0.5 leading-none">
          {open ? (
            <LevelStars level={level} />
          ) : (
            <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold text-white">Próximamente</span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <li className="absolute" style={{ left: `${x / 10}%`, top: `${y / 7}%`, width: "17%", transform: "translate(-50%,-47%)" }}>
      {open ? (
        <Link href={`/nivel/${level}`} className="block transition-transform hover:-translate-y-1 focus-visible:-translate-y-1">
          {body}
        </Link>
      ) : (
        <div>{body}</div>
      )}
    </li>
  );
}
