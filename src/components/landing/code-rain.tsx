import { rng } from "@/components/map/path";

const CHARS = "01{}<>/;=()[]+*&|".split("");

/** Columnas de símbolos que caen despacio, como en un sueño de programador. Es decorativo. */
export function CodeRain({ columns = 18 }: { columns?: number }) {
  const r = rng(77);
  const cols = Array.from({ length: columns }, (_, i) => ({
    left: `${(i + 0.5) * (100 / columns) + (r() - 0.5) * 3}%`,
    text: Array.from({ length: 34 }, () => CHARS[Math.floor(r() * CHARS.length)]).join("\n"),
    dur: 16 + r() * 22,
    delay: -r() * 30,
    color: r() > 0.78 ? "#ffb02e" : r() > 0.6 ? "#b99cff" : "#5ee3ff",
  }));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {cols.map((c, i) => (
        <div key={i} className="code-rain" style={{ left: c.left, color: c.color }}>
          <span style={{ animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}>{c.text}</span>
        </div>
      ))}
    </div>
  );
}
