"use client";

import Link from "next/link";
import { useMapProgress } from "./use-current-level";
import { Fuzzy } from "@/components/game/fuzzy";
import { LevelStars } from "./level-stars";
import { WORLDS } from "./island";

/** Cristal de recompensa: apagado mientras falta algo y brillante al completar el nivel. */
function Crystal({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {lit && <circle r="18" fill="#7df9ff" opacity="0.45" className="glint" />}
      <polygon
        points="0,-15 9,0 0,15 -9,0"
        fill={lit ? "#9ff8ff" : "#c9d3f5"}
        fillOpacity={lit ? 0.95 : 0.55}
        stroke="#fff"
        strokeOpacity="0.9"
        strokeWidth="1.5"
      />
      <polygon points="0,-15 9,0 0,3" fill="#fff" opacity={lit ? 0.7 : 0.35} />
      <line x1="0" y1="-15" x2="0" y2="15" stroke="#fff" strokeOpacity="0.5" />
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
            <linearGradient id={`gl-${level}`} x1="0" y1="0" x2="1" y2="1">
              <stop
                offset="0%"
                stopColor="#ffffff"
                stopOpacity={open ? 0.7 : 0.35}
              />
              <stop
                offset="100%"
                stopColor={open ? "#8fd8ff" : "#b8c0e0"}
                stopOpacity={open ? 0.3 : 0.22}
              />
            </linearGradient>
            <linearGradient id={`gs-${level}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={open ? "#7fb6ff" : "#98a0c8"}
                stopOpacity="0.55"
              />
              <stop
                offset="100%"
                stopColor={open ? "#5a46e0" : "#59608a"}
                stopOpacity="0.5"
              />
            </linearGradient>
          </defs>
          <ellipse
            cx="85"
            cy="106"
            rx="68"
            ry="9"
            fill={open ? "#53f3ee" : "#6a72b8"}
            opacity="0.35"
          />
          <polygon
            points="14,62 14,74 44,96 126,96 156,74 156,62 126,84 44,84"
            fill={`url(#gs-${level})`}
            stroke="#fff"
            strokeOpacity="0.7"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <polygon
            points="14,62 44,40 126,40 156,62 126,84 44,84"
            fill={`url(#gl-${level})`}
            stroke="#fff"
            strokeOpacity="0.95"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon
            points="32,62 52,47 118,47 138,62 118,77 52,77"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <polygon
            points="44,40 90,40 62,84 44,84 14,62"
            fill="#fff"
            opacity="0.14"
          />
          <line
            x1="44"
            y1="40"
            x2="44"
            y2="84"
            stroke="#fff"
            strokeOpacity="0.3"
          />
          <line
            x1="126"
            y1="40"
            x2="126"
            y2="84"
            stroke="#fff"
            strokeOpacity="0.3"
          />
          {open && (
            <>
              <polygon
                className="holo-dash"
                points="8,62 42,34 128,34 162,62 128,90 42,90"
                fill="none"
                stroke="#7df9ff"
                strokeWidth="2.5"
                strokeDasharray="8 6"
                opacity="0.95"
              />
              <polygon
                points="8,62 42,34 128,34 162,62 128,90 42,90"
                fill="none"
                stroke="#7df9ff"
                strokeWidth="9"
                opacity="0.18"
              />
            </>
          )}
          <rect
            x="52"
            y="101"
            width="66"
            height="7"
            rx="3.5"
            fill="#fff"
            opacity="0.25"
          />
          <rect
            x="52"
            y="101"
            width={complete ? 66 : 0}
            height="7"
            rx="3.5"
            fill="#7df9ff"
          />
          {open && <Crystal x={146} y={50} lit={complete} />}
          <g transform="translate(15.3 8) scale(0.82)">
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
