"use client";

import Link from "next/link";
import { LevelStars } from "./level-stars";
import { WORLDS } from "./island";
import { Planet } from "./planets";
import { useMapState } from "./use-current-level";
import { PASS_STARS, maxStars } from "@/lib/unlock";
import { ADV_OFFSET } from "@/lib/levels";
import { PLAYABLE_LEVELS } from "@/engine/levels";

type Props = {
  level: number;
  title: string;
  icon: string;
  x: number;
  y: number;
  open: boolean;
};

/** Planetas con anillos (niveles 3, 6 y 9). */
const RINGED = new Set([3, 6, 9]);

/** Planeta de un nivel: esfera con atmósfera, bandas, cráteres y su insignia. Se coloca en % sobre el mapa (viewBox 1000×700). */
export function MapNode({ level, title, icon, x, y, open: exists }: Props) {
  const { current: here, done, unlocked, ready, stars } = useMapState();
  // «exists»: el nivel tiene retos. «open»: además el jugador ya lo desbloqueó (11 estrellas en el planeta anterior).
  const open =
    exists && (unlocked.has(level) || !ready) && (ready || level === 1);
  const current = open && here === level;
  const complete = open && done.has(level);
  const w = WORLDS[(level - 1) % WORLDS.length];
  const top = open ? w.top : "#5b6285";
  const side = open ? w.side : "#262b49";
  const id = `pl-${level}`;
  const ringed = RINGED.has(level);

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
            <radialGradient id={`${id}-body`} cx="0.34" cy="0.3" r="0.85">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="26%" stopColor={top} />
              <stop offset="100%" stopColor={side} />
            </radialGradient>
            <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
              <stop
                offset="55%"
                stopColor={top}
                stopOpacity={open ? 0.55 : 0.12}
              />
              <stop offset="100%" stopColor={top} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-shade-old`} cx="0.72" cy="0.78" r="0.75">
              <stop offset="35%" stopColor="#02031a" stopOpacity="0" />
              <stop offset="100%" stopColor="#02031a" stopOpacity="0.42" />
            </radialGradient>
            <clipPath id={`${id}-clip`}>
              <circle cx="85" cy="56" r="37" />
            </clipPath>
          </defs>
          {/* atmósfera */}
          <circle
            cx="85"
            cy="56"
            r="58"
            fill={`url(#${id}-glow)`}
            className={open ? "glint" : undefined}
          />
          {ringed && (
            <g transform="rotate(-18 85 60)">
              <ellipse
                cx="85"
                cy="60"
                rx="70"
                ry="15"
                fill="none"
                stroke={open ? "#bfe9ff" : "#7a82a8"}
                strokeOpacity="0.55"
                strokeWidth="5"
              />
              <ellipse
                cx="85"
                cy="60"
                rx="60"
                ry="12"
                fill="none"
                stroke={open ? "#ffd9fb" : "#6a7298"}
                strokeOpacity="0.35"
                strokeWidth="3"
              />
            </g>
          )}
          <Planet level={level} open={open} />
          {ringed && (
            <path
              d="M16 64 A70 15 0 0 0 154 64"
              fill="none"
              stroke={open ? "#bfe9ff" : "#7a82a8"}
              strokeOpacity="0.85"
              strokeWidth="5"
              transform="rotate(-18 85 60)"
            />
          )}
          {/* candado en el centro si está bloqueado; si no, insignia del tema */}
          {open ? (
            <g>
              <circle
                cx="48"
                cy="92"
                r="12"
                fill="#070a2c"
                stroke="#7df9ff"
                strokeWidth="2.5"
              />
              <text x="48" y="97" textAnchor="middle" fontSize="13">
                {icon}
              </text>
            </g>
          ) : (
            <text
              x="85"
              y="66"
              textAnchor="middle"
              fontSize="26"
              style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.6))" }}
            >
              🔒
            </text>
          )}
          {/* número del nivel */}
          <circle
            cx="122"
            cy="92"
            r="12"
            fill="#070a2c"
            stroke={open ? "#7df9ff" : "#5b6285"}
            strokeWidth="2.5"
          />
          <text
            x="122"
            y="97"
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="#fff"
            fontFamily="inherit"
          >
            {level}
          </text>
          {complete && (
            <g transform="translate(124 28)">
              <circle r="14" fill="#22c55e" stroke="#fff" strokeWidth="3.5" />
              <path
                d="M-6.5 0 L-2 5.5 L7.5 -5.5"
                fill="none"
                stroke="#fff"
                strokeWidth="4.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
      </div>
      <div className="-mt-[3%] text-center">
        <span className="inline-block rounded-full border border-cyan-300/40 bg-[#070a2c]/75 px-[6%] py-[1%] text-[clamp(9px,1.4cqw,15px)] font-extrabold leading-tight text-white shadow-[0_0_14px_-4px_rgba(94,227,255,0.8)] backdrop-blur">
          {title}
        </span>
        <div className="mt-0.5 leading-none">
          {open ? (
            <LevelStars level={level} />
          ) : (
            <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white/70">
              {exists ? `🔒 Saca ${PASS_STARS}★ antes` : "Próximamente"}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const advLevel = level + ADV_OFFSET;
  const advStars = stars(advLevel);
  const advDone = advStars >= Math.min(PASS_STARS, maxStars(advLevel));
  const showAdv = complete && PLAYABLE_LEVELS.includes(advLevel);

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
      {showAdv && (
        <Link
          href={`/nivel/${advLevel}`}
          aria-label={`Modo avanzado de ${title}: ${advStars} estrellas`}
          title={`⚡ Modo avanzado · ${advStars}★`}
          className={`btn-gloss absolute -right-[2%] top-[2%] z-10 grid h-[clamp(26px,4.2cqw,44px)] w-[clamp(26px,4.2cqw,44px)] place-items-center rounded-full border-2 text-[clamp(12px,2cqw,22px)] shadow-[0_0_16px_rgba(255,120,240,0.8)] ${advDone ? "border-yellow-200 bg-gradient-to-b from-yellow-300 to-orange-400" : "border-fuchsia-200 bg-gradient-to-b from-fuchsia-500 to-indigo-600"}`}
        >
          <span aria-hidden>{advDone ? "🏅" : "⚡"}</span>
        </Link>
      )}
      {open ? (
        <Link
          href={`/nivel/${level}`}
          className="block transition-transform hover:scale-[1.06] focus-visible:scale-[1.06]"
        >
          {body}
        </Link>
      ) : (
        <div>{body}</div>
      )}
    </li>
  );
}
