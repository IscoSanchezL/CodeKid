/** Piezas del «Cielo de código»: globos, nubes, mariposas y arcoíris dibujados en SVG ligero. */

const BALLOONS = [
  ["#ff6b6b", "#c92a2a"],
  ["#4dabf7", "#1c63b7"],
  ["#ffa94d", "#d9650a"],
  ["#69db7c", "#2b9348"],
  ["#da77f2", "#9c36b5"],
  ["#ffd43b", "#d99a00"],
] as const;

export type SkyKind = "balloon" | "bunch" | "cloud" | "butterfly" | "hole";

export function Balloon({ x, y, s = 1, v = 0 }: { x: number; y: number; s?: number; v?: number }) {
  const [a, b] = BALLOONS[v % BALLOONS.length];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 Q-6 14 2 30" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.4" />
      <path d="M0 -2 l-4 5 h8 z" fill={b} />
      <ellipse cx="0" cy="-26" rx="17" ry="22" fill={a} />
      <ellipse cx="0" cy="-26" rx="17" ry="22" fill="none" stroke={b} strokeOpacity="0.5" strokeWidth="2" />
      <ellipse cx="-6" cy="-36" rx="4.5" ry="8" fill="#fff" opacity="0.55" transform="rotate(20 -6 -36)" />
    </g>
  );
}

export function Bunch({ x, y, s = 1, v = 0 }: { x: number; y: number; s?: number; v?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Balloon x={-14} y={-6} s={0.8} v={v} />
      <Balloon x={14} y={-8} s={0.8} v={v + 2} />
      <Balloon x={0} y={-24} s={0.85} v={v + 4} />
    </g>
  );
}

export function Cloud({ x, y, s = 1, o = 0.9 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx="0" cy="6" rx="46" ry="10" fill="#9fb4ff" opacity="0.25" />
      <circle cx="-26" cy="-2" r="16" fill="#fff" />
      <circle cx="-6" cy="-14" r="22" fill="#fff" />
      <circle cx="22" cy="-6" r="18" fill="#fff" />
      <rect x="-40" y="-4" width="80" height="14" rx="7" fill="#fff" />
    </g>
  );
}

export function Butterfly({ x, y, s = 1, v = 0 }: { x: number; y: number; s?: number; v?: number }) {
  const cols = [
    ["#ff6b9a", "#ffd43b"],
    ["#5ee3ff", "#8b5cff"],
    ["#ffa94d", "#ff6b6b"],
  ][v % 3];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="bd-wave" style={{ transformOrigin: "0px 0px" }}>
        <ellipse cx="-11" cy="-5" rx="11" ry="9" fill={cols[0]} />
        <ellipse cx="11" cy="-5" rx="11" ry="9" fill={cols[0]} />
        <ellipse cx="-8" cy="7" rx="7" ry="6" fill={cols[1]} />
        <ellipse cx="8" cy="7" rx="7" ry="6" fill={cols[1]} />
      </g>
      <rect x="-2" y="-9" width="4" height="20" rx="2" fill="#5b3a8a" />
      <path d="M-1 -9 Q-6 -20 -10 -22 M1 -9 Q6 -20 10 -22" stroke="#5b3a8a" strokeWidth="1.5" fill="none" />
    </g>
  );
}

/** Agujero en las nubes por el que se ve el cielo azul profundo. */
export function Hole({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="34" ry="19" fill="#0b2a78" />
      <ellipse cx="0" cy="-3" rx="30" ry="14" fill="#1a4bb0" opacity="0.8" />
      <circle cx="-10" cy="-2" r="1.6" fill="#fff" />
      <circle cx="12" cy="2" r="1.2" fill="#fff" />
      <ellipse cx="0" cy="-17" rx="36" ry="6" fill="#fff" opacity="0.85" />
    </g>
  );
}

export function SkyPiece({ kind, x, y, s = 1, v = 0 }: { kind: SkyKind; x: number; y: number; s?: number; v?: number }) {
  switch (kind) {
    case "balloon":
      return <Balloon x={x} y={y} s={s} v={v} />;
    case "bunch":
      return <Bunch x={x} y={y} s={s} v={v} />;
    case "cloud":
      return <Cloud x={x} y={y} s={s} />;
    case "butterfly":
      return <Butterfly x={x} y={y} s={s} v={v} />;
    case "hole":
      return <Hole x={x} y={y} s={s * 0.65} />;
  }
}

/** Arco iris: rayas concéntricas (se usa como túnel de la meta). */
export const RAINBOW = ["#ff4d6d", "#ff9f43", "#ffd43b", "#51cf66", "#4dabf7", "#9775fa"] as const;
export function RainbowArch({ x, y, r = 30, w = 5 }: { x: number; y: number; r?: number; w?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {RAINBOW.map((c, i) => (
        <path key={c} d={`M${-(r - i * w)} 0 A${r - i * w} ${r - i * w} 0 0 1 ${r - i * w} 0`} fill="none" stroke={c} strokeWidth={w + 0.6} />
      ))}
    </g>
  );
}
