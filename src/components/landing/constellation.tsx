"use client";

import { smoothPath, type Pt } from "@/components/map/path";
import { WORLDS } from "@/components/map/island";
import { PLAYABLE_LEVELS } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";
import { useT } from "@/i18n";

const ICONS = ["🚩", "🔁", "🔀", "⚙️", "➕", "📋", "🧠", "💻", "🐍", "🏆"];

const POINTS: Pt[] = LEVELS.map((_, i) => [70 + i * 95.5, 175 + Math.sin(i * 1.15) * 78] as const);
const { d: PATH } = smoothPath(POINTS);

/** Las 10 etapas como planetas unidos por una ruta de luz. Los dos primeros ya se pueden jugar. */
export function Constellation() {
  const t = useT();
  return (
    <div className="overflow-x-auto pb-2">
      <svg viewBox="0 0 1000 380" className="mx-auto min-w-[760px] max-w-5xl" role="img" aria-label={t("land.constAria")}>
        <defs>
          <filter id="cs-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <linearGradient id="cs-path" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#8b5cff" />
            <stop offset="100%" stopColor="#ff8a3d" />
          </linearGradient>
          {WORLDS.map((w, i) => (
            <radialGradient key={i} id={`cs-p${i}`} cx="34%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="35%" stopColor={w.top} />
              <stop offset="100%" stopColor={w.side} />
            </radialGradient>
          ))}
        </defs>

        <path d={PATH} fill="none" stroke="url(#cs-path)" strokeWidth="10" opacity="0.35" filter="url(#cs-glow)" />
        <path d={PATH} fill="none" stroke="url(#cs-path)" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" opacity="0.9" />

        {LEVELS.map((l, i) => {
          const [x, y] = POINTS[i];
          const open = PLAYABLE_LEVELS.includes(l.id);
          const r = 26 + (i % 3) * 3;
          return (
            <g key={l.id} opacity={open ? 1 : 0.55}>
              <circle cx={x} cy={y} r={r + 12} fill={WORLDS[i].top} opacity={open ? 0.4 : 0.12} filter="url(#cs-glow)" />
              {open && <circle className="map-pulse" cx={x} cy={y} r={r + 7} fill="none" stroke="#ffd43b" strokeWidth="3" />}
              <ellipse cx={x} cy={y} rx={r + 17} ry={(r + 17) * 0.28} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" transform={`rotate(-20 ${x} ${y})`} />
              <circle cx={x} cy={y} r={r} fill={`url(#cs-p${i})`} style={open ? undefined : { filter: "grayscale(0.7)" }} />
              <text x={x} y={y + 9} textAnchor="middle" fontSize="26">
                {open ? ICONS[i] : "🔒"}
              </text>
              <circle cx={x + r * 0.78} cy={y - r * 0.78} r="11" fill="#fff" />
              <text x={x + r * 0.78} y={y - r * 0.78 + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#03051a" fontFamily="inherit">
                {l.id}
              </text>
              <text x={x} y={y + r + 30} textAnchor="middle" fontSize="14" fontWeight="700" fill="#eef2ff" fontFamily="inherit">
                {t(`lv.${l.id}.short`)}
              </text>
              {!open && (
                <text x={x} y={y + r + 48} textAnchor="middle" fontSize="11" fill="#9fb0e0" fontFamily="inherit">
                  {t("lv.comingSoon")}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
