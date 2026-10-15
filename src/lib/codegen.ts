import type { Block } from "@/engine/types";

export type Lang = "js" | "python";

const COND: Record<Lang, Record<"wall" | "free", string>> = {
  js: { wall: "hayPared()", free: "hayCaminoLibre()" },
  python: { wall: "hay_pared()", free: "hay_camino_libre()" },
};

const CALL: Record<Lang, Record<"move" | "left" | "right", string>> = {
  js: { move: "avanzar();", left: "girarIzquierda();", right: "girarDerecha();" },
  python: { move: "avanzar()", left: "girar_izquierda()", right: "girar_derecha()" },
};

/** Variables de los bucles anidados en JavaScript: i, j, k… */
const LOOP_VARS = ["i", "j", "k", "m", "n"];

/** Traduce un programa de bloques a JavaScript o Python reales (con la misma lógica que el juego). */
export function toCode(program: Block[], lang: Lang): string {
  const unit = lang === "js" ? "  " : "    ";

  const emit = (blocks: Block[], depth: number): string[] => {
    const pad = unit.repeat(depth);
    const lines: string[] = [];
    for (const b of blocks) {
      if (b.type !== "repeat" && b.type !== "if") {
        lines.push(pad + CALL[lang][b.type]);
        continue;
      }
      const inner = emit(b.body, depth + 1);
      if (b.type === "if") {
        if (lang === "js") {
          lines.push(`${pad}if (${COND.js[b.cond]}) {`);
          lines.push(...(inner.length ? inner : [`${unit.repeat(depth + 1)}// (vacío)`]));
          lines.push(`${pad}}`);
        } else {
          lines.push(`${pad}if ${COND.python[b.cond]}:`);
          lines.push(...(inner.length ? inner : [`${unit.repeat(depth + 1)}pass`]));
        }
        continue;
      }
      if (lang === "js") {
        const v = LOOP_VARS[depth % LOOP_VARS.length];
        lines.push(`${pad}for (let ${v} = 0; ${v} < ${b.times}; ${v}++) {`);
        lines.push(...(inner.length ? inner : [`${unit.repeat(depth + 1)}// (vacío)`]));
        lines.push(`${pad}}`);
      } else {
        lines.push(`${pad}for _ in range(${b.times}):`);
        lines.push(...(inner.length ? inner : [`${unit.repeat(depth + 1)}pass`]));
      }
    }
    return lines;
  };

  const lines = emit(program, 0);
  if (lines.length === 0) return lang === "js" ? "// (programa vacío)" : "pass";
  return lines.join("\n");
}
