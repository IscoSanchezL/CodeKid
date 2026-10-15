/**
 * Piezas de paisaje dibujadas en SVG. Cada una se coloca con (x, y) en la base de la pieza
 * y crece hacia arriba. `s` es la escala. Se usan en el mapa y en el tablero de los retos.
 */
type P = { x: number; y: number; s?: number };

const g = ({ x, y, s = 1 }: P) => `translate(${x} ${y}) scale(${s})`;

const FROND = "M0 0 Q22 -24 50 4 Q26 -6 0 0 Z";

export function Palm({ x, y, s = 1 }: P) {
  const fronds = [-42, -8, 28, 152, 188, 224, -90];
  return (
    <g transform={g({ x, y, s })}>
      <ellipse cx="0" cy="2" rx="16" ry="5" fill="#000" opacity="0.14" />
      <path d="M0 0 C-5 -20 7 -42 2 -64" fill="none" stroke="#7a4e22" strokeWidth="8" strokeLinecap="round" />
      <path d="M0 0 C-5 -20 7 -42 2 -64" fill="none" stroke="#a9763e" strokeWidth="3" strokeLinecap="round" transform="translate(-1.5 0)" />
      <g transform="translate(2 -64)">
        {fronds.map((a, i) => (
          <path key={a} d={FROND} transform={`rotate(${a}) scale(${a === -90 ? 0.7 : 1})`} fill={i % 2 ? "#37b24d" : "#2b8a3e"} />
        ))}
        <circle cx="-3" cy="3" r="4" fill="#6b3f17" />
        <circle cx="4" cy="4" r="4" fill="#7a4e22" />
      </g>
    </g>
  );
}

export function RoundTree({ x, y, s = 1 }: P) {
  return (
    <g transform={g({ x, y, s })}>
      <ellipse cx="0" cy="2" rx="18" ry="5" fill="#000" opacity="0.14" />
      <rect x="-4" y="-24" width="8" height="26" rx="3" fill="#7a4e22" />
      <circle cx="0" cy="-38" r="19" fill="#2b8a3e" />
      <circle cx="-11" cy="-30" r="12" fill="#37b24d" />
      <circle cx="12" cy="-42" r="12" fill="#51cf66" />
      <circle cx="-6" cy="-47" r="5" fill="#b2f2bb" opacity="0.7" />
    </g>
  );
}

export function Pine({ x, y, s = 1 }: P) {
  return (
    <g transform={g({ x, y, s })}>
      <ellipse cx="0" cy="2" rx="15" ry="4.5" fill="#000" opacity="0.14" />
      <rect x="-3.5" y="-14" width="7" height="16" rx="2" fill="#7a4e22" />
      <path d="M0 -70 L-17 -34 H17 Z" fill="#40c057" />
      <path d="M0 -54 L-21 -18 H21 Z" fill="#37b24d" />
      <path d="M0 -38 L-25 -4 H25 Z" fill="#2b8a3e" />
    </g>
  );
}

export function Bush({ x, y, s = 1 }: P) {
  return (
    <g transform={g({ x, y, s })}>
      <ellipse cx="0" cy="2" rx="20" ry="5" fill="#000" opacity="0.14" />
      <circle cx="-11" cy="-8" r="11" fill="#2b8a3e" />
      <circle cx="11" cy="-8" r="11" fill="#2b8a3e" />
      <circle cx="0" cy="-13" r="13" fill="#37b24d" />
      <circle cx="-4" cy="-17" r="5" fill="#8ce99a" opacity="0.7" />
    </g>
  );
}

export function Flower({ x, y, s = 1, color = "#ff6b9d" }: P & { color?: string }) {
  return (
    <g transform={g({ x, y, s })}>
      <path d="M0 0 V-14" stroke="#2b8a3e" strokeWidth="2.5" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 5} cy={-16 + Math.sin((a * Math.PI) / 180) * 5} r="4" fill={color} />
      ))}
      <circle cx="0" cy="-16" r="3" fill="#ffd43b" />
    </g>
  );
}

export function Rock({ x, y, s = 1 }: P) {
  return (
    <g transform={g({ x, y, s })}>
      <ellipse cx="0" cy="2" rx="16" ry="4.5" fill="#000" opacity="0.14" />
      <path d="M-15 0 Q-17 -14 -4 -16 Q10 -18 15 -6 Q17 0 15 0 Z" fill="#9aa5b4" />
      <path d="M-4 -16 Q10 -18 15 -6 Q8 -10 -2 -9 Z" fill="#c4cdd8" />
      <circle cx="-8" cy="-6" r="2" fill="#7f8b9a" />
    </g>
  );
}

export function Tuft({ x, y, s = 1 }: P) {
  return (
    <g transform={g({ x, y, s })} fill="none" strokeLinecap="round">
      <path d="M-6 0 Q-9 -9 -12 -14" stroke="#2f9e44" strokeWidth="3" />
      <path d="M0 0 Q0 -11 2 -17" stroke="#37b24d" strokeWidth="3" />
      <path d="M6 0 Q9 -8 13 -12" stroke="#2b8a3e" strokeWidth="3" />
    </g>
  );
}

export function Pond({ x, y, s = 1 }: P) {
  return (
    <g transform={g({ x, y, s })}>
      <ellipse cx="0" cy="0" rx="52" ry="30" fill="#2aa7e0" />
      <ellipse cx="0" cy="-2" rx="46" ry="26" fill="#66d3ff" />
      <ellipse cx="-10" cy="-8" rx="22" ry="8" fill="#fff" opacity="0.25" />
      <ellipse cx="18" cy="6" rx="9" ry="5" fill="#40c057" />
      <ellipse cx="-22" cy="8" rx="7" ry="4" fill="#51cf66" />
      <circle cx="18" cy="5" r="2.5" fill="#ffa8cc" />
    </g>
  );
}

export function Duck({ x, y, s = 1 }: P) {
  return (
    <g transform={g({ x, y, s })}>
      <ellipse cx="0" cy="2" rx="13" ry="4" fill="#000" opacity="0.14" />
      <ellipse cx="0" cy="-8" rx="13" ry="9" fill="#fff" />
      <circle cx="9" cy="-18" r="7" fill="#fff" />
      <path d="M14 -18 L22 -16 L14 -14 Z" fill="#ff922b" />
      <circle cx="11" cy="-20" r="1.6" fill="#1a1030" />
      <path d="M-10 -10 Q-4 -4 4 -9" fill="none" stroke="#ced4da" strokeWidth="2" />
    </g>
  );
}

export const PIECES = { palm: Palm, tree: RoundTree, pine: Pine, bush: Bush, rock: Rock, tuft: Tuft } as const;
export type PieceKind = keyof typeof PIECES | "flower";

const FLOWER_COLORS = ["#ff6b9d", "#ffd43b", "#ffffff", "#b197fc", "#ff922b"];

export function Piece({ kind, x, y, s = 1, variant = 0 }: P & { kind: PieceKind; variant?: number }) {
  if (kind === "flower") return <Flower x={x} y={y} s={s} color={FLOWER_COLORS[variant % FLOWER_COLORS.length]} />;
  const C = PIECES[kind];
  return <C x={x} y={y} s={s} />;
}
