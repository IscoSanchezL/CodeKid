"use client";

import Link from "next/link";
import { useMapProgress } from "./use-current-level";
import { Fuzzy } from "@/components/game/fuzzy";
import { LevelStars } from "./level-stars";
import { WORLDS } from "./island";

/** Cofre del nivel: cerrado con candado mientras falta algo, abierto y brillando al completarlo. */
function Chest({ x, y, open }: { x: number; y: number; open: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(0.9)`}>
      {open && <circle cx="0" cy="-8" r="16" fill="#ffe66d" opacity="0.5" />}
      <rect x="-14" y="-2" width="28" height="16" rx="3" fill="#a8522a" />
      <rect x="-14" y="-2" width="28" height="5" fill="#7c3a1b" />
      <rect x="-14" y="6" width="28" height="3" fill="#ffd54a" />
      {open ? (
        <>
          <path
            d="M-14 -2 L-12 -14 H12 L14 -2 Z"
            fill="#c4683a"
            transform="rotate(-18 -14 -2)"
          />
          <circle cx="0" cy="-6" r="3.5" fill="#fff3a0" />
        </>
      ) : (
        <>
          <path d="M-14 -2 Q0 -18 14 -2 Z" fill="#c4683a" />
          <rect
            x="-3"
            y="1"
            width="6"
            height="7"
            rx="1.5"
            fill="#ffd54a"
            stroke="#b8860b"
            strokeWidth="1"
          />
        </>
      )}
    </g>
  );
}

type Props = {
  level: number;
  title: string;
  icon: string;
  x: number;
  y: number;
  open: boolean;
};

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
        <svg
          viewBox="0 0 170 120"
          className="w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={`cl-${level}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d9e4ff" />
            </linearGradient>
          </defs>
          <ellipse
            cx="85"
            cy="104"
            rx="70"
            ry="9"
            fill="#4d54b8"
            opacity="0.22"
          />
          <g fill={`url(#cl-${level})`}>
            <circle cx="28" cy="70" r="24" />
            <circle cx="60" cy="54" r="30" />
            <circle cx="106" cy="55" r="30" />
            <circle cx="142" cy="70" r="24" />
            <rect x="22" y="66" width="126" height="34" rx="17" />
          </g>
          {open && (
            <>
              <ellipse
                cx="85"
                cy="62"
                rx="76"
                ry="40"
                fill="none"
                stroke="#fff3a0"
                strokeWidth="9"
                opacity="0.35"
              />
              <ellipse
                cx="85"
                cy="62"
                rx="76"
                ry="40"
                fill="none"
                stroke="#ffe66d"
                strokeWidth="4"
                opacity="0.95"
              />
            </>
          )}
          <path
            d="M26 88 Q85 106 144 88"
            fill="none"
            stroke="#c4d2fb"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect
            x="52"
            y="82"
            width="66"
            height="9"
            rx="4.5"
            fill="#fff"
            opacity="0.8"
          />
          <rect
            x="52"
            y="82"
            width={complete ? 66 : 0}
            height="9"
            rx="4.5"
            fill="#ffe66d"
          />
          {open && <Chest x={140} y={64} open={complete} />}
          <g transform="translate(15.3 -3) scale(0.82)">
            <polygon
              points="35,52 35,66 60,92 110,92 135,66 135,52 110,78 60,78"
              fill={side}
            />
            <polygon
              points="35,52 60,26 110,26 135,52 110,78 60,78"
              fill={top}
            />
            <polygon
              points="50,52 66,34 104,34 120,52 104,70 66,70"
              fill="#fff"
              opacity="0.22"
            />
            {current && (
              <polygon
                className="map-pulse"
                points="35,52 60,26 110,26 135,52 110,78 60,78"
                fill="none"
                stroke="#ffd43b"
                strokeWidth="5"
              />
            )}
            <text
              x="85"
              y="49"
              textAnchor="middle"
              fontSize="28"
              opacity={open ? 1 : 0.5}
            >
              {open ? icon : "🔒"}
            </text>
            {complete && (
              <g transform="translate(128 32)">
                <circle r="15" fill="#22c55e" stroke="#fff" strokeWidth="4" />
                <path
                  d="M-7 0 L-2 6 L8 -6"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
            <circle
              cx="85"
              cy="70"
              r="12"
              fill="#fff"
              stroke={side}
              strokeWidth="3"
            />
            <text
              x="85"
              y="75"
              textAnchor="middle"
              fontSize="14"
              fontWeight="800"
              fill="#0b1440"
              fontFamily="inherit"
            >
              {level}
            </text>
          </g>
        </svg>
        {current && (
          <div className="pointer-events-none absolute -top-[26%] left-1/2 w-[36%] -translate-x-1/2">
            <div className="fz-idle">
              <Fuzzy
                variant="cyan"
                size={64}
                dir={2}
                mood="happy"
                className="h-auto w-full"
              />
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
            <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold text-white">
              Próximamente
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <li
      className="absolute"
      style={{
        left: `${x / 10}%`,
        top: `${y / 7}%`,
        width: "17%",
        transform: "translate(-50%,-47%)",
      }}
    >
      {open ? (
        <Link
          href={`/nivel/${level}`}
          className="block transition-transform hover:-translate-y-1 focus-visible:-translate-y-1"
        >
          {body}
        </Link>
      ) : (
        <div>{body}</div>
      )}
    </li>
  );
}
