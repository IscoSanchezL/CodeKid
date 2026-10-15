/** Trajes del personaje dibujados en SVG (viewBox 0 0 100 100; la cabeza es un círculo en (50,52) de radio 40). */

const STAR = "M0 -8 L2.4 -2.6 L8 -2.4 L3.6 1.2 L5 7 L0 3.8 L-5 7 L-3.6 1.2 L-8 -2.4 L-2.4 -2.6 Z";

export function Hat({ id }: { id: string }) {
  switch (id) {
    case "hat-cap":
      return (
        <g>
          <path d="M22 26 Q50 -8 78 26 Z" fill="#ef4444" />
          <path d="M58 22 Q92 20 94 31 Q72 30 54 27 Z" fill="#b91c1c" />
          <circle cx="50" cy="6" r="4" fill="#fecaca" />
          <path d="M30 18 Q50 4 70 18" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "hat-chef":
      return (
        <g>
          <circle cx="34" cy="8" r="12" fill="#fff" />
          <circle cx="50" cy="0" r="13" fill="#fff" />
          <circle cx="66" cy="8" r="12" fill="#fff" />
          <rect x="30" y="12" width="40" height="14" rx="3" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
        </g>
      );
    case "hat-cowboy":
      return (
        <g>
          <ellipse cx="50" cy="20" rx="44" ry="9" fill="#a16207" />
          <path d="M31 20 Q32 -4 50 -2 Q68 -4 69 20 Z" fill="#ca8a04" />
          <rect x="31" y="12" width="38" height="6" fill="#7c2d12" />
        </g>
      );
    case "hat-top":
      return (
        <g>
          <ellipse cx="50" cy="20" rx="30" ry="6" fill="#0f172a" />
          <rect x="34" y="-10" width="32" height="30" rx="3" fill="#111827" />
          <rect x="34" y="10" width="32" height="6" fill="#ef4444" />
          <rect x="38" y="-6" width="5" height="18" rx="2" fill="#fff" opacity="0.15" />
        </g>
      );
    case "hat-wizard":
      return (
        <g>
          <ellipse cx="50" cy="22" rx="38" ry="7" fill="#5b21b6" />
          <path d="M30 22 L52 -36 L72 22 Z" fill="#7c3aed" />
          <path d="M40 8 L56 8 L58 14 L38 14 Z" fill="#fbbf24" opacity="0.9" />
          <g transform="translate(52 -10)" fill="#fde047">
            <path d={STAR} />
          </g>
        </g>
      );
    case "hat-crown":
      return (
        <g>
          <path d="M26 24 L28 0 L40 14 L50 -6 L60 14 L72 0 L74 24 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="50" cy="12" r="3.5" fill="#ef4444" />
          <circle cx="36" cy="18" r="2.6" fill="#38bdf8" />
          <circle cx="64" cy="18" r="2.6" fill="#38bdf8" />
        </g>
      );
    case "hat-astro":
      return (
        <g>
          <circle cx="50" cy="52" r="46" fill="#bae6fd" fillOpacity="0.22" stroke="#e2e8f0" strokeWidth="4" />
          <path d="M22 26 Q34 8 54 6" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
          <rect x="44" y="92" width="12" height="6" rx="2" fill="#94a3b8" />
        </g>
      );
    case "hat-antenna":
      return (
        <g stroke="#475569" strokeWidth="3" strokeLinecap="round">
          <path d="M38 16 Q34 0 28 -8" fill="none" />
          <path d="M62 16 Q66 0 72 -8" fill="none" />
          <circle cx="28" cy="-9" r="5" fill="#f43f5e" stroke="none" />
          <circle cx="72" cy="-9" r="5" fill="#22d3ee" stroke="none" />
        </g>
      );
    case "hat-flower":
      return (
        <g transform="translate(68 12)">
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 7} cy={Math.sin((a * Math.PI) / 180) * 7} r="6" fill="#f472b6" />
          ))}
          <circle r="4.5" fill="#fde047" />
        </g>
      );
    case "hat-pirate":
      return (
        <g>
          <path d="M14 26 Q50 -26 86 26 Q50 12 14 26 Z" fill="#111827" />
          <circle cx="50" cy="8" r="6" fill="#fff" />
          <circle cx="47.5" cy="7" r="1.4" fill="#111827" />
          <circle cx="52.5" cy="7" r="1.4" fill="#111827" />
          <rect x="47" y="12" width="6" height="2" rx="1" fill="#111827" />
        </g>
      );
    default:
      return null;
  }
}

export function Glasses({ id }: { id: string }) {
  switch (id) {
    case "gl-round":
      return (
        <g fill="rgba(255,255,255,0.18)" stroke="#1f2937" strokeWidth="3">
          <circle cx="36" cy="47" r="14" />
          <circle cx="64" cy="47" r="14" />
          <path d="M50 46 H50" />
          <path d="M48 45 Q50 42 52 45" fill="none" />
          <path d="M22 44 L14 40 M78 44 L86 40" fill="none" strokeLinecap="round" />
        </g>
      );
    case "gl-sun":
      return (
        <g>
          <rect x="21" y="38" width="29" height="19" rx="8" fill="#0f172a" />
          <rect x="52" y="38" width="29" height="19" rx="8" fill="#0f172a" />
          <path d="M48 44 H54" stroke="#0f172a" strokeWidth="3" />
          <path d="M26 42 L34 42" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
          <path d="M57 42 L65 42" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "gl-heart":
      return (
        <g fill="#ec4899" stroke="#9d174d" strokeWidth="2">
          <path d="M36 58 C20 48 22 36 32 36 C35 36 36 38 36 40 C36 38 38 36 41 36 C51 36 52 48 36 58 Z" />
          <path d="M64 58 C48 48 50 36 60 36 C63 36 64 38 64 40 C64 38 66 36 69 36 C79 36 80 48 64 58 Z" />
        </g>
      );
    case "gl-nerd":
      return (
        <g>
          <rect x="17" y="35" width="66" height="26" rx="12" fill="#0b1440" fillOpacity="0.88" stroke="#5ee3ff" strokeWidth="3" />
          <text x="50" y="53" textAnchor="middle" fontSize="13" fontWeight="800" fill="#5ee3ff" fontFamily="monospace">
            {"</>"}
          </text>
          <path d="M17 46 L9 44 M83 46 L91 44" stroke="#5ee3ff" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "gl-monocle":
      return (
        <g fill="none" stroke="#d97706" strokeWidth="3.5">
          <circle cx="64" cy="47" r="15" fill="rgba(255,255,255,0.2)" />
          <path d="M70 61 Q76 80 70 96" strokeLinecap="round" strokeWidth="2" />
        </g>
      );
    case "gl-star":
      return (
        <g fill="#fbbf24" stroke="#b45309" strokeWidth="1.6" strokeLinejoin="round">
          <g transform="translate(36 47) scale(2)">
            <path d={STAR} />
          </g>
          <g transform="translate(64 47) scale(2)">
            <path d={STAR} />
          </g>
        </g>
      );
    default:
      return null;
  }
}

/** Accesorios de cuello: algunos van detrás del cuerpo (capa, alas) y otros delante. */
export const NECK_BEHIND = new Set(["neck-cape", "neck-wings"]);

export function Neck({ id }: { id: string }) {
  switch (id) {
    case "neck-bow":
      return (
        <g transform="translate(50 86)">
          <path d="M0 0 L-17 -9 V9 Z" fill="#ef4444" />
          <path d="M0 0 L17 -9 V9 Z" fill="#ef4444" />
          <circle r="5" fill="#b91c1c" />
        </g>
      );
    case "neck-scarf":
      return (
        <g>
          <path d="M16 78 Q50 104 84 78" fill="none" stroke="#f97316" strokeWidth="12" strokeLinecap="round" />
          <path d="M16 78 Q50 104 84 78" fill="none" stroke="#fdba74" strokeWidth="3" strokeDasharray="5 8" strokeLinecap="round" />
          <rect x="66" y="84" width="11" height="20" rx="4" fill="#ea580c" transform="rotate(-10 70 84)" />
        </g>
      );
    case "neck-medal":
      return (
        <g transform="translate(50 82)">
          <path d="M-10 -8 L0 8 L10 -8" fill="none" stroke="#2563eb" strokeWidth="6" />
          <circle cy="12" r="9" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
          <g transform="translate(0 12) scale(0.9)" fill="#fff7c2">
            <path d={STAR} />
          </g>
        </g>
      );
    case "neck-cape":
      return (
        <g>
          <path d="M14 56 Q50 134 86 56 L98 100 Q50 124 2 100 Z" fill="#dc2626" />
          <path d="M20 66 Q50 120 80 66" fill="none" stroke="#fca5a5" strokeOpacity="0.5" strokeWidth="3" />
        </g>
      );
    case "neck-wings":
      return (
        <g fill="#fff" stroke="#cbd5e1" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M16 56 Q-22 28 -14 76 Q-6 70 0 84 Q8 74 18 88 Z" />
          <path d="M84 56 Q122 28 114 76 Q106 70 100 84 Q92 74 82 88 Z" />
        </g>
      );
    default:
      return null;
  }
}

/** Parte delantera del accesorio (la medalla, el corbatín…). La capa se ve también delante con un broche. */
export function NeckFront({ id }: { id: string }) {
  if (id === "neck-cape") {
    return <circle cx="50" cy="88" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />;
  }
  return NECK_BEHIND.has(id) ? null : <Neck id={id} />;
}
