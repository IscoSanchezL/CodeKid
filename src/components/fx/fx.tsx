/** Efectos visuales ligeros: solo CSS (transform/opacity), sin librerías. */

const COLORS = ["#ffd43b", "#5ee3ff", "#ff6b9a", "#8b5cff", "#4ade80", "#ff8a3d"];

/** Explosión de confeti y estrellitas al ganar. Posiciones deterministas (sin azar). */
export function Burst({ count = 28 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + (i % 3) * 0.35;
        const d = 90 + ((i * 53) % 120);
        const star = i % 4 === 0;
        return (
          <span
            key={i}
            className="fx-p"
            style={
              {
                "--dx": `${Math.round(Math.cos(a) * d)}px`,
                "--dy": `${Math.round(Math.sin(a) * d * 0.8 - 40)}px`,
                "--rot": `${(i * 97) % 360}deg`,
                "--c": COLORS[i % COLORS.length],
                animationDelay: `${(i % 6) * 40}ms`,
                width: star ? 14 : 8,
                height: star ? 14 : 12,
                clipPath: star ? "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)" : undefined,
                borderRadius: star ? 0 : 2,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** Estrellas del resultado: aparecen una a una con rebote. */
export function PopStars({ earned, total = 3 }: { earned: number; total?: number }) {
  return (
    <p aria-label={`${earned} de ${total} estrellas`} className="mt-2 flex justify-center gap-1 text-5xl">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={i < earned ? "pop-star text-[#ffc524] drop-shadow-[0_0_14px_rgba(255,197,36,0.8)]" : "text-border"}
          style={{ animationDelay: `${0.25 + i * 0.3}s` }}
        >
          ★
        </span>
      ))}
    </p>
  );
}

/** Luciérnagas / chispas que flotan sobre un fondo. Posiciones deterministas. */
export function Sparkles({ count = 14, className = "" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="fx-spark"
          style={
            {
              left: `${(i * 37 + 11) % 97}%`,
              top: `${(i * 61 + 7) % 92}%`,
              animationDelay: `${(i % 7) * 0.6}s`,
              animationDuration: `${4 + (i % 5)}s`,
              "--s": `${3 + (i % 3) * 2}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
