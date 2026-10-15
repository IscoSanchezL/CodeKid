import type {
  Atom,
  AtomKind,
  Block,
  CondExpr,
  FnName,
  Turn,
} from "@/engine/types";

/** Lee el código que escribe el alumno (JavaScript o Python sencillos) y lo convierte en bloques del juego. */
export type Lang = "js" | "python";
export type ParseResult =
  | { ok: true; program: Block[]; lineOf: Record<string, number> }
  | { ok: false; line: number; message: string };

class ParseError extends Error {
  constructor(
    public line: number,
    message: string,
  ) {
    super(message);
  }
}

const NAMES = {
  js: {
    move: "avanzar",
    left: "girarIzquierda",
    right: "girarDerecha",
    turn: "girar",
    atoms: {
      hayPared: "wall",
      hayCaminoLibre: "free",
      hayMoneda: "coin",
      esLaMeta: "goal",
    } as Record<string, AtomKind>,
  },
  python: {
    move: "avanzar",
    left: "girar_izquierda",
    right: "girar_derecha",
    turn: "girar",
    atoms: {
      hay_pared: "wall",
      hay_camino_libre: "free",
      hay_moneda: "coin",
      es_la_meta: "goal",
    } as Record<string, AtomKind>,
  },
};
const TURN_WORD: Record<string, Turn> = {
  izquierda: "L",
  derecha: "R",
  recto: "S",
};

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[a.length][b.length];
}

function unknown(line: number, word: string, known: string[]): ParseError {
  const near = known
    .map((k) => ({ k, d: distance(word.toLowerCase(), k.toLowerCase()) }))
    .sort((a, b) => a.d - b.d)[0];
  const hint = near && near.d <= 3 ? ` ¿Quisiste decir «${near.k}»?` : "";
  return new ParseError(line, `No conozco «${word}».${hint}`);
}

type DistributiveOmit<T> = T extends unknown ? Omit<T, "id"> : never;

/** Constructor común de bloques, con el número de línea de cada uno. */
class Builder {
  private n = 0;
  lineOf: Record<string, number> = {};
  make(line: number, b: DistributiveOmit<Block>): Block {
    this.n += 1;
    const block = { ...b, id: `c${this.n}` } as Block;
    this.lineOf[block.id] = line;
    return block;
  }
}

function repeatCount(line: number, n: number): number {
  if (!Number.isInteger(n) || n < 1 || n > 9)
    throw new ParseError(line, "Repetir va de 1 a 9 veces.");
  return n;
}

function pasosValue(line: number, n: number, max = 9, min = 0): number {
  if (!Number.isInteger(n) || n < min || n > max)
    throw new ParseError(line, `Aquí el número va de ${min} a ${max}.`);
  return n;
}

function turnList(line: number, words: string[]): Turn[] {
  if (words.length === 0)
    throw new ParseError(line, "La lista de giros no puede estar vacía.");
  if (words.length > 12)
    throw new ParseError(line, "La lista admite hasta 12 giros.");
  return words.map((w) => {
    const t = TURN_WORD[w];
    if (!t)
      throw new ParseError(
        line,
        `El giro «${w}» no existe. Usa "izquierda", "derecha" o "recto".`,
      );
    return t;
  });
}

const known = (lang: Lang) => {
  const n = NAMES[lang];
  return [
    n.move,
    n.left,
    n.right,
    n.turn,
    ...Object.keys(n.atoms),
    ...(lang === "js" ? ["bloqueA", "bloqueB"] : ["bloque_a", "bloque_b"]),
  ];
};

// ───────────────────────────── JavaScript ─────────────────────────────
type Tok = { t: "id" | "num" | "str" | "p"; v: string; line: number };

function tokenizeJs(src: string): Tok[] {
  const toks: Tok[] = [];
  let line = 1;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "\n") {
      line += 1;
      i += 1;
    } else if (/\s/.test(c)) i += 1;
    else if (c === "/" && src[i + 1] === "/")
      while (i < src.length && src[i] !== "\n") i += 1;
    else if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") line += 1;
        i += 1;
      }
      i += 2;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /\w/.test(src[j])) j += 1;
      toks.push({ t: "id", v: src.slice(i, j), line });
      i = j;
    } else if (/\d/.test(c)) {
      let j = i;
      while (j < src.length && /\d/.test(src[j])) j += 1;
      toks.push({ t: "num", v: src.slice(i, j), line });
      i = j;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== "\n") j += 1;
      if (src[j] !== c)
        throw new ParseError(line, "Falta cerrar las comillas del texto.");
      toks.push({ t: "str", v: src.slice(i + 1, j), line });
      i = j + 1;
    } else {
      const two = src.slice(i, i + 2);
      if (["&&", "||", "++"].includes(two)) {
        toks.push({ t: "p", v: two, line });
        i += 2;
      } else if ("(){}[];,=<>+-*!".includes(c)) {
        toks.push({ t: "p", v: c, line });
        i += 1;
      } else throw new ParseError(line, `No entiendo el símbolo «${c}».`);
    }
  }
  return toks;
}

function parseJs(src: string): {
  program: Block[];
  lineOf: Record<string, number>;
} {
  const toks = tokenizeJs(src);
  const b = new Builder();
  let p = 0;
  const lastLine = () => toks[toks.length - 1]?.line ?? 1;
  const peek = () => toks[p];
  const next = () => {
    const t = toks[p];
    if (!t)
      throw new ParseError(
        lastLine(),
        "El programa termina antes de tiempo. ¿Falta cerrar una llave }?",
      );
    p += 1;
    return t;
  };
  const isP = (v: string) => peek()?.t === "p" && peek()?.v === v;
  const expectP = (v: string, why = "") => {
    const t = toks[p];
    if (!t || t.t !== "p" || t.v !== v)
      throw new ParseError(
        t?.line ?? lastLine(),
        `Falta «${v}»${why ? " " + why : ""}.`,
      );
    p += 1;
  };
  const optSemi = () => {
    if (isP(";")) p += 1;
  };

  function atom(): Atom {
    let not = false;
    if (isP("!")) {
      not = true;
      p += 1;
    }
    const t = next();
    if (t.t !== "id")
      throw new ParseError(t.line, "Aquí va una pregunta, como hayPared().");
    const kind = NAMES.js.atoms[t.v];
    if (!kind) throw unknown(t.line, t.v, Object.keys(NAMES.js.atoms));
    expectP("(");
    expectP(")");
    return { kind, not };
  }
  function cond(): CondExpr {
    expectP("(", "antes de la condición");
    const a = atom();
    let res: CondExpr = { a };
    if (isP("&&") || isP("||")) {
      const op = next().v === "&&" ? "and" : "or";
      res = { a, op, b: atom() };
    }
    expectP(")", "al terminar la condición");
    return res;
  }
  function body(): Block[] {
    expectP("{", "para abrir el bloque");
    const out: Block[] = [];
    while (!isP("}")) {
      if (!peek())
        throw new ParseError(lastLine(), "Falta cerrar una llave }.");
      out.push(...stmt());
    }
    expectP("}");
    return out;
  }
  function stmt(): Block[] {
    const t = next();
    if (t.t === "p" && t.v === ";") return [];
    if (t.t !== "id")
      throw new ParseError(t.line, `No entiendo «${t.v}» aquí.`);
    const line = t.line;
    switch (t.v) {
      case "function": {
        const name = next();
        const m = /^bloque([AB])$/.exec(name.v);
        if (!m)
          throw new ParseError(
            name.line,
            "Tus bloques se llaman bloqueA y bloqueB.",
          );
        expectP("(");
        expectP(")");
        return [
          b.make(line, { type: "def", name: m[1] as FnName, body: body() }),
        ];
      }
      case "let": {
        const v = next();
        expectP("=");
        if (v.v === "pasos") {
          const n = next();
          if (n.t !== "num")
            throw new ParseError(n.line, "«pasos» vale un número.");
          optSemi();
          const value = pasosValue(n.line, Number(n.v));
          return value === 1 ? [] : [b.make(line, { type: "setvar", value })];
        }
        if (v.v === "giros") {
          expectP("[");
          const words: string[] = [];
          while (!isP("]")) {
            const s = next();
            if (s.t !== "str")
              throw new ParseError(
                s.line,
                'Cada giro va entre comillas, como "derecha".',
              );
            words.push(s.v);
            if (isP(",")) p += 1;
          }
          expectP("]");
          optSemi();
          return [b.make(line, { type: "list", items: turnList(line, words) })];
        }
        throw new ParseError(
          v.line,
          "Solo puedes crear las variables «pasos» y «giros».",
        );
      }
      case "for": {
        expectP("(");
        const kw = next();
        if (kw.v === "const") {
          next();
          const of = next();
          const lst = next();
          if (of.v !== "of" || lst.v !== "giros")
            throw new ParseError(
              line,
              "Para recorrer la lista escribe: for (const giro of giros)",
            );
          expectP(")");
          return [b.make(line, { type: "foreach", body: body() })];
        }
        if (kw.v !== "let")
          throw new ParseError(
            line,
            "Un bucle va así: for (let i = 0; i < 3; i++) { … }",
          );
        const v = next().v;
        expectP("=");
        const zero = next();
        expectP(";");
        const v2 = next();
        expectP("<");
        const n = next();
        expectP(";");
        const v3 = next();
        expectP("++");
        expectP(")");
        if (zero.v !== "0" || v2.v !== v || v3.v !== v || n.t !== "num")
          throw new ParseError(
            line,
            "Un bucle va así: for (let i = 0; i < 3; i++) { … }",
          );
        const times = repeatCount(n.line, Number(n.v));
        const inner = body();
        return times === 1
          ? inner
          : [b.make(line, { type: "repeat", times, body: inner })];
      }
      case "while":
        return [b.make(line, { type: "while", cond: cond(), body: body() })];
      case "if":
        return [b.make(line, { type: "if", cond: cond(), body: body() })];
      case "pasos": {
        expectP("=");
        const first = next();
        if (first.t === "num") {
          optSemi();
          return [
            b.make(line, {
              type: "setvar",
              value: pasosValue(first.line, Number(first.v)),
            }),
          ];
        }
        if (first.v !== "pasos")
          throw new ParseError(
            first.line,
            "Escribe, por ejemplo: pasos = pasos + 1",
          );
        const op = next();
        const n = next();
        if (op.t !== "p" || !["+", "-", "*"].includes(op.v) || n.t !== "num")
          throw new ParseError(line, "Escribe, por ejemplo: pasos = pasos + 1");
        optSemi();
        return [
          b.make(line, {
            type: "addvar",
            op: op.v as "+" | "-" | "*",
            value: pasosValue(n.line, Number(n.v), 3, 1),
          }),
        ];
      }
      default: {
        expectP("(", `después de ${t.v}`);
        let arg = "";
        if (!isP(")")) arg = next().v;
        expectP(")");
        optSemi();
        const n = NAMES.js;
        if (t.v === n.move) {
          if (arg === "") return [b.make(line, { type: "move" })];
          if (arg === "pasos") return [b.make(line, { type: "movevar" })];
          throw new ParseError(
            line,
            "avanzar() va vacío, o con pasos: avanzar(pasos).",
          );
        }
        if (t.v === n.left) return [b.make(line, { type: "left" })];
        if (t.v === n.right) return [b.make(line, { type: "right" })];
        if (t.v === n.turn) return [b.make(line, { type: "turnitem" })];
        const m = /^bloque([AB])$/.exec(t.v);
        if (m) return [b.make(line, { type: "call", name: m[1] as FnName })];
        throw unknown(line, t.v, known("js"));
      }
    }
  }

  const program: Block[] = [];
  while (p < toks.length) program.push(...stmt());
  return { program, lineOf: b.lineOf };
}

// ────────────────────────────── Python ───────────────────────────────
type Line = { indent: number; text: string; line: number };

function parsePython(src: string): {
  program: Block[];
  lineOf: Record<string, number>;
} {
  const lines: Line[] = [];
  src.split("\n").forEach((raw, i) => {
    const text = raw.replace(/#.*$/, "").replace(/\s+$/, "");
    if (!text.trim()) return;
    const lead = /^[ \t]*/.exec(text)![0];
    lines.push({
      indent: lead.replace(/\t/g, "    ").length,
      text: text.trim(),
      line: i + 1,
    });
  });
  const b = new Builder();
  let p = 0;

  function cond(line: number, text: string): CondExpr {
    const parts = text.split(/\s+(and|or)\s+/);
    if (parts.length !== 1 && parts.length !== 3)
      throw new ParseError(
        line,
        "Usa como mucho dos preguntas unidas con and / or.",
      );
    const atom = (s: string): Atom => {
      let t = s.trim();
      let not = false;
      if (t.startsWith("not ")) {
        not = true;
        t = t.slice(4).trim();
      }
      const m = /^(\w+)\s*\(\s*\)$/.exec(t);
      if (!m)
        throw new ParseError(line, "Aquí va una pregunta, como hay_pared().");
      const kind = NAMES.python.atoms[m[1]];
      if (!kind) throw unknown(line, m[1], Object.keys(NAMES.python.atoms));
      return { kind, not };
    };
    if (parts.length === 1) return { a: atom(parts[0]) };
    return {
      a: atom(parts[0]),
      op: parts[1] as "and" | "or",
      b: atom(parts[2]),
    };
  }

  function block(indent: number, header: Line): Block[] {
    const first = lines[p];
    if (!first || first.indent <= indent)
      throw new ParseError(
        header.line,
        "Después de «:» va una línea con sangría (cuatro espacios).",
      );
    return seq(first.indent);
  }

  function seq(indent: number): Block[] {
    const out: Block[] = [];
    while (p < lines.length && lines[p].indent >= indent) {
      const l = lines[p];
      if (l.indent > indent)
        throw new ParseError(
          l.line,
          "Esta línea tiene más sangría de la que toca.",
        );
      p += 1;
      out.push(...stmt(l));
    }
    return out;
  }

  function stmt(l: Line): Block[] {
    const { text, line } = l;
    let m: RegExpExecArray | null;
    if (text === "pass") return [];
    if ((m = /^def\s+bloque_([abAB])\s*\(\s*\)\s*:$/.exec(text)))
      return [
        b.make(line, {
          type: "def",
          name: m[1].toUpperCase() as FnName,
          body: block(l.indent, l),
        }),
      ];
    if (/^def\s/.test(text))
      throw new ParseError(
        line,
        "Tus bloques se llaman bloque_a y bloque_b: def bloque_a():",
      );
    if ((m = /^for\s+giro\s+in\s+giros\s*:$/.exec(text)))
      return [b.make(line, { type: "foreach", body: block(l.indent, l) })];
    if ((m = /^for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:$/.exec(text))) {
      const times = repeatCount(line, Number(m[1]));
      const inner = block(l.indent, l);
      return times === 1
        ? inner
        : [b.make(line, { type: "repeat", times, body: inner })];
    }
    if (/^for\s/.test(text))
      throw new ParseError(
        line,
        "Un bucle va así: for _ in range(3):  o  for giro in giros:",
      );
    if ((m = /^while\s+(.+):$/.exec(text)))
      return [
        b.make(line, {
          type: "while",
          cond: cond(line, m[1]),
          body: block(l.indent, l),
        }),
      ];
    if ((m = /^if\s+(.+):$/.exec(text)))
      return [
        b.make(line, {
          type: "if",
          cond: cond(line, m[1]),
          body: block(l.indent, l),
        }),
      ];
    if ((m = /^pasos\s*=\s*(\d+)$/.exec(text)))
      return [
        b.make(line, { type: "setvar", value: pasosValue(line, Number(m[1])) }),
      ];
    if ((m = /^pasos\s*=\s*pasos\s*([+\-*])\s*(\d+)$/.exec(text)))
      return [
        b.make(line, {
          type: "addvar",
          op: m[1] as "+" | "-" | "*",
          value: pasosValue(line, Number(m[2]), 3, 1),
        }),
      ];
    if (/^pasos\s*=/.test(text))
      throw new ParseError(line, "Escribe, por ejemplo: pasos = pasos + 1");
    if ((m = /^giros\s*=\s*\[(.*)\]$/.exec(text))) {
      const words = m[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const q = /^(["'])(.*)\1$/.exec(s);
          if (!q)
            throw new ParseError(
              line,
              'Cada giro va entre comillas, como "derecha".',
            );
          return q[2];
        });
      return [b.make(line, { type: "list", items: turnList(line, words) })];
    }
    if ((m = /^(\w+)\s*\(\s*(\w*)\s*\)$/.exec(text))) {
      const [, fn, arg] = m;
      const n = NAMES.python;
      if (fn === n.move) {
        if (arg === "") return [b.make(line, { type: "move" })];
        if (arg === "pasos") return [b.make(line, { type: "movevar" })];
        throw new ParseError(
          line,
          "avanzar() va vacío, o con pasos: avanzar(pasos).",
        );
      }
      if (fn === n.left) return [b.make(line, { type: "left" })];
      if (fn === n.right) return [b.make(line, { type: "right" })];
      if (fn === n.turn) return [b.make(line, { type: "turnitem" })];
      const mm = /^bloque_([abAB])$/.exec(fn);
      if (mm)
        return [
          b.make(line, { type: "call", name: mm[1].toUpperCase() as FnName }),
        ];
      throw unknown(line, fn, known("python"));
    }
    throw new ParseError(line, `No entiendo esta línea: «${text}».`);
  }

  const program = seq(lines[0]?.indent ?? 0);
  if (p < lines.length)
    throw new ParseError(
      lines[p].line,
      "Esta línea tiene menos sangría de la que toca.",
    );
  return { program, lineOf: b.lineOf };
}

export function parseCode(src: string, lang: Lang): ParseResult {
  try {
    const r = lang === "js" ? parseJs(src) : parsePython(src);
    return { ok: true, ...r };
  } catch (e) {
    if (e instanceof ParseError)
      return { ok: false, line: e.line, message: e.message };
    throw e;
  }
}
