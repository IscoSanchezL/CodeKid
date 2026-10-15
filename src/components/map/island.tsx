import { Fuzzy } from "@/components/game/fuzzy";

export type World = { name: string; top: string; side: string };

/** Un mundo por nivel: cada isla tiene sus colores. */
export const WORLDS: World[] = [
  { name: "Pradera", top: "#7fdc63", side: "#3f9a43" },
  { name: "Bosque", top: "#4fc58a", side: "#2c8a5f" },
  { name: "Playa", top: "#ffe29a", side: "#d9a441" },
  { name: "Cristales", top: "#b79cff", side: "#7b5ad8" },
  { name: "Volcán", top: "#ff9a62", side: "#c4571a" },
  { name: "Algodón", top: "#ff9ccf", side: "#d1568f" },
  { name: "Hielo", top: "#bfeaff", side: "#6fb5de" },
  { name: "Selva", top: "#9be37f", side: "#4a9e35" },
  { name: "Galaxia", top: "#7c8cff", side: "#4352c9" },
  { name: "Castillo", top: "#ffd84d", side: "#c79a00" },
];

type Props = { level: number; open: boolean; current?: boolean };

/** Isla flotante dibujada en SVG, con grosor, sombra y detalles. */
export function Island({ level, open, current }: Props) {
  const w = WORLDS[(level - 1) % WORLDS.length];
  return (
    <div className="relative mx-auto h-[130px] w-[180px]" style={{ filter: open ? undefined : "grayscale(0.85) brightness(0.92)" }}>
      <svg viewBox="0 0 180 130" width="180" height="130" aria-hidden className="absolute inset-0 overflow-visible">
        <ellipse cx="90" cy="116" rx="62" ry="9" fill="rgba(10,30,70,0.2)" />
        <path d="M20 58 L20 78 A70 34 0 0 0 160 78 L160 58 A70 34 0 0 1 20 58 Z" fill={w.side} />
        <ellipse cx="90" cy="58" rx="70" ry="34" fill={w.top} />
        <ellipse cx="90" cy="58" rx="58" ry="26" fill="#fff" opacity="0.22" />
        <circle cx="44" cy="52" r="7" fill={w.side} opacity="0.55" />
        <circle cx="140" cy="62" r="6" fill={w.side} opacity="0.55" />
        <circle cx="128" cy="44" r="4" fill="#fff" opacity="0.5" />
        <circle cx="90" cy="56" r="17" fill="#fff" />
        <circle cx="90" cy="56" r="17" fill="none" stroke={w.side} strokeWidth="3" />
        <text x="90" y="62" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0b1440" fontFamily="inherit">
          {level}
        </text>
      </svg>
      {current && (
        <div className="fz-idle absolute left-1/2 -top-9 -translate-x-1/2">
          <Fuzzy variant="cyan" size={64} dir={2} mood="happy" />
        </div>
      )}
      {!open && (
        <span aria-hidden className="absolute left-1/2 top-[34px] -translate-x-1/2 text-2xl">
          🔒
        </span>
      )}
    </div>
  );
}
