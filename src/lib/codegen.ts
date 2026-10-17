import type { Atom, Block, Cond, CondExpr } from "@/engine/types";
import { NAMES, type Api } from "@/lib/code-names";

export type Lang = "js" | "python";

const call = (lang: Lang, name: string) => (lang === "js" ? `${name}();` : `${name}()`);

/** Variables de los bucles anidados en JavaScript: i, j, k… */
const LOOP_VARS = ["i", "j", "k", "m", "n"];

function condCode(cond: Cond | CondExpr, lang: Lang, api: Api): string {
  const c: CondExpr =
    typeof cond === "string" ? { a: { kind: cond, not: false } } : cond;
  const atom = (a: Atom) =>
    (a.not ? (lang === "js" ? "!" : "not ") : "") + NAMES[lang][api].atoms[a.kind] + "()";
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
export function toCode(program: Block[], lang: Lang, api: Api = "es"): string {
  const n = NAMES[lang][api];
  const unit = lang === "js" ? "  " : "    ";
  const empty = (depth: number) => [
    `${unit.repeat(depth)}${lang === "js" ? (api === "en" ? "// (empty)" : "// (vacío)") : "pass"}`,
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
          lines.push(pad + call(lang, n[b.type]));
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
              ? `if (${condCode(b.cond, lang, api)})`
              : `if ${condCode(b.cond, lang, api)}`,
            b.body,
          );
          break;
        case "while":
          open(
            lang === "js"
              ? `while (${condCode(b.cond, lang, api)})`
              : `while ${condCode(b.cond, lang, api)}`,
            b.body,
          );
          break;
        case "def":
          open(
            lang === "js"
              ? `function ${n.block(b.name)}()`
              : `def ${n.block(b.name)}()`,
            b.body,
          );
          break;
        case "call":
          lines.push(pad + call(lang, n.block(b.name)));
          break;
        case "setvar":
          lines.push(
            pad +
              (lang === "js" ? `${n.steps} = ${b.value};` : `${n.steps} = ${b.value}`),
          );
          break;
        case "addvar": {
          const op = b.op === "*" ? "*" : b.op;
          lines.push(
            pad + `${n.steps} = ${n.steps} ${op} ${b.value}` + (lang === "js" ? ";" : ""),
          );
          break;
        }
        case "movevar":
          lines.push(
            pad + (lang === "js" ? `${n.move}(${n.steps});` : `${n.move}(${n.steps})`),
          );
          break;
        case "list":
          lines.push(
            pad +
              `${n.turns} = [${b.items.map((t) => `"${n.words[t]}"`).join(", ")}]`.replace(
                /^/,
                lang === "js" ? "let " : "",
              ) +
              (lang === "js" ? ";" : ""),
          );
          break;
        case "foreach":
          open(
            lang === "js" ? `for (const ${n.item} of ${n.turns})` : `for ${n.item} in ${n.turns}`,
            b.body,
          );
          break;
        case "turnitem":
          lines.push(pad + (lang === "js" ? `${n.turn}(${n.item});` : `${n.turn}(${n.item})`));
          break;
      }
    }
    return lines;
  };

  const lines = emit(program, 0);
  if (lines.length === 0) return lang === "js" ? (api === "en" ? "// (empty program)" : "// (programa vacío)") : "pass";
  // JavaScript declara la variable al principio; Python solo la crea si el programa no empieza ya con «pasos = n»
  if (usesVar(program) && (lang === "js" || program[0]?.type !== "setvar"))
    lines.unshift(lang === "js" ? `let ${n.steps} = 1;` : `${n.steps} = 1`);
  return lines.join("\n");
}
