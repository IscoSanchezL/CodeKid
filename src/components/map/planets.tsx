/** Superficies de los planetas del mapa: cada nivel tiene el suyo (océanos, gigante de gas, lava, hielo…). Centro (85,56), radio 38. */

type Surface = { base: [string, string]; draw: () => React.ReactNode };

const cloud = (d: string, w = 5, o = 0.55) => (
  <path
    d={d}
    fill="none"
    stroke="#fff"
    strokeWidth={w}
    strokeOpacity={o}
    strokeLinecap="round"
  />
);

const SURFACES: Record<number, Surface> = {
  // 1 · Tierra: océanos, continentes, nubes y casquete polar
  1: {
    base: ["#4fb4ff", "#0f4fb8"],
    draw: () => (
      <>
        <path
          d="M58 40 Q64 28 78 32 Q86 36 80 46 Q72 52 66 50 Q56 50 58 40Z"
          fill="#4cc35c"
        />
        <path
          d="M92 52 Q104 44 114 54 Q118 64 108 72 Q98 76 94 66 Q88 58 92 52Z"
          fill="#3fae52"
        />
        <path
          d="M64 66 Q72 62 76 72 Q74 84 66 82 Q60 76 64 66Z"
          fill="#5cd16a"
        />
        <path
          d="M62 36 Q68 32 74 36"
          fill="none"
          stroke="#b9f08a"
          strokeWidth="2"
          strokeOpacity="0.7"
        />
        {cloud("M52 52 Q66 44 80 54 T112 48", 5, 0.6)}
        {cloud("M56 74 Q74 66 92 76 T122 70", 4, 0.5)}
        {cloud("M70 26 Q86 22 100 28", 3.5, 0.5)}
        <ellipse
          cx="85"
          cy="19"
          rx="22"
          ry="6"
          fill="#fff"
          fillOpacity="0.85"
        />
        <ellipse cx="85" cy="93" rx="18" ry="5" fill="#fff" fillOpacity="0.7" />
      </>
    ),
  },
  // 2 · Bosque: verdes profundos, ríos y nubes
  2: {
    base: ["#3fd08a", "#0b5a44"],
    draw: () => (
      <>
        <path
          d="M50 38 Q66 30 80 40 Q70 54 56 52Z"
          fill="#0b4d35"
          fillOpacity="0.55"
        />
        <path
          d="M92 60 Q108 50 122 62 Q112 80 94 76Z"
          fill="#0b4d35"
          fillOpacity="0.5"
        />
        <path
          d="M70 70 Q82 66 88 78 Q78 90 66 84Z"
          fill="#7df0b5"
          fillOpacity="0.35"
        />
        <path
          d="M62 28 Q72 50 64 68 T78 94"
          fill="none"
          stroke="#b6ffe0"
          strokeWidth="1.8"
          strokeOpacity="0.7"
        />
        <path
          d="M100 26 Q96 44 108 56 T112 90"
          fill="none"
          stroke="#b6ffe0"
          strokeWidth="1.5"
          strokeOpacity="0.55"
        />
        {cloud("M48 60 Q66 52 82 62 T120 58", 4, 0.45)}
      </>
    ),
  },
  // 3 · Gigante de gas dorado con tormenta
  3: {
    base: ["#ffe08a", "#c97a1e"],
    draw: () => (
      <>
        <path
          d="M44 32 Q85 24 126 32"
          fill="none"
          stroke="#e8a43a"
          strokeWidth="9"
        />
        <path
          d="M44 44 Q85 36 126 44"
          fill="none"
          stroke="#fff0b8"
          strokeWidth="6"
          strokeOpacity="0.85"
        />
        <path
          d="M44 56 Q85 48 126 56"
          fill="none"
          stroke="#c9791f"
          strokeWidth="8"
        />
        <path
          d="M44 68 Q85 60 126 68"
          fill="none"
          stroke="#ffe08a"
          strokeWidth="6"
          strokeOpacity="0.9"
        />
        <path
          d="M44 80 Q85 72 126 80"
          fill="none"
          stroke="#d99033"
          strokeWidth="9"
        />
        <ellipse
          cx="102"
          cy="66"
          rx="8"
          ry="4.5"
          fill="#b5472a"
          fillOpacity="0.9"
        />
        <ellipse
          cx="102"
          cy="66"
          rx="4"
          ry="2"
          fill="#ff9a6a"
          fillOpacity="0.8"
        />
      </>
    ),
  },
  // 4 · Cristal facetado
  4: {
    base: ["#c6a4ff", "#4a2bb5"],
    draw: () => (
      <>
        {[
          ["85,14 123,56 85,56", 0.2],
          ["85,14 85,56 47,56", 0.05],
          ["47,56 85,56 66,98", 0.22],
          ["85,56 123,56 104,98", 0.07],
          ["47,56 66,98 30,80", 0.1],
          ["123,56 140,40 123,22", 0.12],
          ["85,14 123,22 123,56", 0.1],
          ["66,98 104,98 85,56", 0.16],
        ].map(([pts, o], i) => (
          <polygon
            key={i}
            points={pts as string}
            fill="#fff"
            fillOpacity={o as number}
            stroke="#fff"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
        ))}
        <polygon
          points="85,56 96,44 108,56 96,68"
          fill="#fff"
          fillOpacity="0.35"
        />
      </>
    ),
  },
  // 5 · Volcánico: roca oscura y grietas de lava
  5: {
    base: ["#7a2a1a", "#240806"],
    draw: () => (
      <>
        <circle cx="85" cy="56" r="30" fill="#ff5a1f" fillOpacity="0.22" />
        {[
          "M54 40 L68 46 L66 58 L80 62 L78 76 L92 82",
          "M100 26 L96 42 L108 50 L104 64 L116 72",
          "M68 28 L76 38 L88 36 L90 48",
        ].map((d, i) => (
          <g key={i} fill="none" strokeLinejoin="round" strokeLinecap="round">
            <path d={d} stroke="#ff5a1f" strokeWidth="5" strokeOpacity="0.5" />
            <path d={d} stroke="#ffc44a" strokeWidth="2.2" />
          </g>
        ))}
        <circle cx="62" cy="74" r="4" fill="#000" fillOpacity="0.3" />
        <circle cx="108" cy="40" r="3" fill="#000" fillOpacity="0.3" />
      </>
    ),
  },
  // 6 · Algodón: gigante rosa con remolinos
  6: {
    base: ["#ffc2e2", "#c23b8a"],
    draw: () => (
      <>
        <path
          d="M44 34 Q85 26 126 34"
          fill="none"
          stroke="#ff8fc7"
          strokeWidth="8"
        />
        <path
          d="M44 46 Q85 38 126 46"
          fill="none"
          stroke="#fff0f8"
          strokeWidth="5"
          strokeOpacity="0.9"
        />
        <path
          d="M44 58 Q85 50 126 58"
          fill="none"
          stroke="#e259a3"
          strokeWidth="8"
        />
        <path
          d="M44 70 Q85 62 126 70"
          fill="none"
          stroke="#ffd0e8"
          strokeWidth="6"
          strokeOpacity="0.9"
        />
        <path
          d="M44 82 Q85 74 126 82"
          fill="none"
          stroke="#f27bbd"
          strokeWidth="8"
        />
        <path
          d="M92 56 Q104 48 112 58 Q108 66 98 64"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeOpacity="0.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  // 7 · Hielo: grietas y cráteres
  7: {
    base: ["#e9f7ff", "#6fa8dc"],
    draw: () => (
      <>
        <path
          d="M52 40 L70 52 L66 70 L84 84"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeOpacity="0.9"
        />
        <path
          d="M110 30 L100 48 L112 62 L104 80"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeOpacity="0.8"
        />
        <path
          d="M70 52 L92 50"
          fill="none"
          stroke="#9fd0f2"
          strokeWidth="1.4"
        />
        {[
          [66, 44, 7],
          [100, 66, 9],
          [88, 32, 4.5],
          [74, 78, 5],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <ellipse
              cx={x}
              cy={y}
              rx={r}
              ry={r * 0.7}
              fill="#5d93c8"
              fillOpacity="0.35"
              stroke="#4a82b8"
              strokeOpacity="0.5"
            />
            <ellipse
              cx={x - r * 0.2}
              cy={y - r * 0.2}
              rx={r * 0.5}
              ry={r * 0.3}
              fill="#fff"
              fillOpacity="0.45"
            />
          </g>
        ))}
        <ellipse
          cx="85"
          cy="19"
          rx="26"
          ry="8"
          fill="#fff"
          fillOpacity="0.85"
        />
      </>
    ),
  },
  // 8 · Selva: lagos turquesa y bosque denso
  8: {
    base: ["#b6f26b", "#2f8f3c"],
    draw: () => (
      <>
        <path
          d="M50 44 Q66 34 82 46 Q76 60 58 58Z"
          fill="#1c6b2a"
          fillOpacity="0.5"
        />
        <path
          d="M96 62 Q112 54 124 68 Q114 84 98 78Z"
          fill="#1c6b2a"
          fillOpacity="0.5"
        />
        <ellipse
          cx="70"
          cy="50"
          rx="9"
          ry="5"
          fill="#3fd0e8"
          fillOpacity="0.85"
        />
        <ellipse
          cx="102"
          cy="40"
          rx="6"
          ry="3.5"
          fill="#3fd0e8"
          fillOpacity="0.8"
        />
        <ellipse
          cx="94"
          cy="70"
          rx="11"
          ry="5.5"
          fill="#3fd0e8"
          fillOpacity="0.85"
        />
        <path
          d="M66 52 Q80 60 90 68"
          fill="none"
          stroke="#3fd0e8"
          strokeWidth="1.6"
          strokeOpacity="0.8"
        />
        {cloud("M50 68 Q68 60 86 70 T122 64", 4, 0.5)}
      </>
    ),
  },
  // 9 · Galáctico: remolinos de neón y estrellas
  9: {
    base: ["#5a4fe0", "#0a0838"],
    draw: () => (
      <>
        <circle cx="85" cy="56" r="14" fill="#9f8cff" fillOpacity="0.45" />
        <path
          d="M85 56 C100 40 118 52 108 66 S80 80 70 62"
          fill="none"
          stroke="#bda8ff"
          strokeWidth="3"
          strokeOpacity="0.85"
          strokeLinecap="round"
        />
        <path
          d="M85 56 C70 72 52 60 62 46 S90 32 100 50"
          fill="none"
          stroke="#7df9ff"
          strokeWidth="2.5"
          strokeOpacity="0.8"
          strokeLinecap="round"
        />
        <circle cx="85" cy="56" r="4" fill="#fff" />
        {[
          [60, 34],
          [112, 36],
          [70, 84],
          [108, 82],
          [54, 62],
          [118, 58],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.3" fill="#fff" />
        ))}
      </>
    ),
  },
  // 10 · Castillo: oro con cráteres
  10: {
    base: ["#fff0a0", "#c98a10"],
    draw: () => (
      <>
        {[
          [64, 44, 9],
          [102, 40, 6],
          [96, 72, 10],
          [68, 76, 6],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <ellipse
              cx={x}
              cy={y}
              rx={r}
              ry={r * 0.65}
              fill="#a86a00"
              fillOpacity="0.3"
              stroke="#a86a00"
              strokeOpacity="0.45"
            />
            <ellipse
              cx={x - r * 0.2}
              cy={y - r * 0.2}
              rx={r * 0.45}
              ry={r * 0.25}
              fill="#fff"
              fillOpacity="0.45"
            />
          </g>
        ))}
        <path
          d="M44 56 Q85 46 126 56"
          fill="none"
          stroke="#fff3b0"
          strokeWidth="3"
          strokeOpacity="0.6"
        />
      </>
    ),
  },
};

const MOONS = new Set([1, 10]);

/** Esfera del planeta con su superficie propia, sombra nocturna y brillo del borde. */
export function Planet({ level, open }: { level: number; open: boolean }) {
  const s = SURFACES[((level - 1) % 10) + 1] ?? SURFACES[1];
  const id = `pl-${level}`;
  return (
    <g
      style={
        open
          ? undefined
          : { filter: "grayscale(1) brightness(0.55) contrast(0.95)" }
      }
    >
      <defs>
        <radialGradient id={`${id}-base`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor={s.base[0]} />
          <stop offset="100%" stopColor={s.base[1]} />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="0.7" cy="0.75" r="0.8">
          <stop offset="30%" stopColor="#02031a" stopOpacity="0" />
          <stop offset="100%" stopColor="#02031a" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id={`${id}-limb`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="78%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#bfe9ff" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={`${id}-spec`} cx="0.3" cy="0.25" r="0.4">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-shade" cx="0.7" cy="0.75" r="0.8">
          <stop offset="30%" stopColor="#02031a" stopOpacity="0" />
          <stop offset="100%" stopColor="#02031a" stopOpacity="0.6" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="85" cy="56" r="38" />
        </clipPath>
      </defs>
      <circle cx="85" cy="56" r="38" fill={`url(#${id}-base)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {s.draw()}
        <circle cx="85" cy="56" r="38" fill={`url(#${id}-spec)`} />
        <circle cx="85" cy="56" r="38" fill={`url(#${id}-shade)`} />
        <circle cx="85" cy="56" r="38" fill={`url(#${id}-limb)`} />
      </g>
      {MOONS.has(level) && (
        <g transform="translate(132 24)">
          <circle r="7" fill="#cfd6e6" />
          <circle cx="-2" cy="-2" r="2.2" fill="#9aa3bd" />
          <circle cx="2.5" cy="2.5" r="1.4" fill="#9aa3bd" />
          <circle r="7" fill="url(#moon-shade)" />
        </g>
      )}
      <circle
        cx="85"
        cy="56"
        r="38"
        fill="none"
        stroke="#fff"
        strokeOpacity={open ? 0.45 : 0.2}
        strokeWidth="1.2"
      />
    </g>
  );
}
