import type { Atom, Block, Cond, CondExpr, Turn } from "@/engine/types";

export type Lang = "js" | "python";

const CALL: Record<Lang, Record<"move" | "left" | "right", string>> = {
  js: {
    move: "avanzar();",
    left: "girarIzquierda();",
    right: "girarDerecha();",
  },
  python: {
    move: "avanzar()",
    left: "girar_izquierda()",
    right: "girar_derecha()",
  },
};

const ATOM: Record<Lang, Record<Atom["kind"], string>> = {
  js: {
    wall: "hayPared()",
    free: "hayCaminoLibre()",
    coin: "hayMoneda()",
    goal: "esLaMeta()",
  },
  python: {
    wall: "hay_pared()",
    free: "hay_camino_libre()",
    coin: "hay_moneda()",
    goal: "es_la_meta()",
  },
};
const TURN_NAME: Record<Turn, string> = {
  L: "izquierda",
  R: "derecha",
  S: "recto",
};

/** Variables de los bucles anidados en JavaScript: i, j, k… */
const LOOP_VARS = ["i", "j", "k", "m", "n"];

function condCode(cond: Cond | CondExpr, lang: Lang): string {
  const c: CondExpr =
    typeof cond === "string" ? { a: { kind: cond, not: false } } : cond;
  const atom = (a: Atom) =>
    (a.not ? (lang === "js" ? "!" : "not ") : "") + ATOM[lang][a.kind];
  if (!c.b || !c.op) return atom(c.a);
  const join =
    c.op === "and"
      ? lang === "js"
        ? " && "
        : " and "
      : lang === "js"
        ? " || "
        : " or ";
  return atom(c.a) + join + atom(c.b);
}

const usesVar = (blocks: Block[]): boolean =>
  blocks.some(
    (b) =>
      b.type === "setvar" ||
      b.type === "addvar" ||
      b.type === "movevar" ||
      ("body" in b && usesVar(b.body)),
  );

/** Traduce un programa de bloques a JavaScript o Python reales (con la misma lógica que el juego). */
export function toCode(program: Block[], lang: Lang): string {
  const unit = lang === "js" ? "  " : "    ";
  const empty = (depth: number) => [
    `${unit.repeat(depth)}${lang === "js" ? "// (vacío)" : "pass"}`,
  ];

  const emit = (blocks: Block[], depth: number): string[] => {
    const pad = unit.repeat(depth);
    const lines: string[] = [];
    const open = (head: string, body: Block[]) => {
      const inner = emit(body, depth + 1);
      lines.push(`${pad}${head}${lang === "js" ? " {" : ":"}`);
      lines.push(...(inner.length ? inner : empty(depth + 1)));
      if (lang === "js") lines.push(`${pad}}`);
    };
    for (const b of blocks) {
      switch (b.type) {
        case "move":
        case "left":
        case "right":
          lines.push(pad + CALL[lang][b.type]);
          break;
        case "repeat": {
          const v = LOOP_VARS[depth % LOOP_VARS.length];
          open(
            lang === "js"
              ? `for (let ${v} = 0; ${v} < ${b.times}; ${v}++)`
              : `for _ in range(${b.times})`,
            b.body,
          );
          break;
        }
        case "if":
          open(
            lang === "js"
              ? `if (${condCode(b.cond, lang)})`
              : `if ${condCode(b.cond, lang)}`,
            b.body,
          );
          break;
        case "while":
          open(
            lang === "js"
              ? `while (${condCode(b.cond, lang)})`
              : `while ${condCode(b.cond, lang)}`,
            b.body,
          );
          break;
        case "def":
          open(
            lang === "js"
              ? `function bloque${b.name}()`
              : `def bloque_${b.name.toLowerCase()}()`,
            b.body,
          );
          break;
        case "call":
          lines.push(
            pad +
              (lang === "js"
                ? `bloque${b.name}();`
                : `bloque_${b.name.toLowerCase()}()`),
          );
          break;
        case "setvar":
          lines.push(
            pad +
              (lang === "js" ? `pasos = ${b.value};` : `pasos = ${b.value}`),
          );
          break;
        case "addvar": {
          const op = b.op === "*" ? "*" : b.op;
          lines.push(
            pad + `pasos = pasos ${op} ${b.value}` + (lang === "js" ? ";" : ""),
          );
          break;
        }
        case "movevar":
          lines.push(
            pad + (lang === "js" ? "avanzar(pasos);" : "avanzar(pasos)"),
          );
          break;
        case "list":
          lines.push(
            pad +
              `giros = [${b.items.map((t) => `"${TURN_NAME[t]}"`).join(", ")}]`.replace(
                /^/,
                lang === "js" ? "let " : "",
              ) +
              (lang === "js" ? ";" : ""),
          );
          break;
        case "foreach":
          open(
            lang === "js" ? "for (const giro of giros)" : "for giro in giros",
            b.body,
          );
          break;
        case "turnitem":
          lines.push(pad + (lang === "js" ? "girar(giro);" : "girar(giro)"));
          break;
      }
    }
    return lines;
  };

  const lines = emit(program, 0);
  if (lines.length === 0) return lang === "js" ? "// (programa vacío)" : "pass";
  if (usesVar(program))
    lines.unshift(lang === "js" ? "let pasos = 1;" : "pasos = 1");
  return lines.join("\n");
}
