import { describe, expect, it } from "vitest";
import { run } from "@/engine/interpreter";
import { CHALLENGES } from "@/engine/levels";
import type { Block } from "@/engine/types";
import { parseCode } from "./code-parser";
import { toCode, type Lang } from "./codegen";

/** Quita los ids y unifica la forma de las condiciones para comparar programas. */
function norm(blocks: Block[]): unknown {
  return blocks.map((b) => {
    const { id: _id, ...rest } = b as Block & Record<string, unknown>;
    void _id;
    const o: Record<string, unknown> = { ...rest };
    if ("cond" in b && typeof b.cond === "string")
      o.cond = { a: { kind: b.cond, not: false } };
    if ("body" in b) o.body = norm(b.body);
    return o;
  });
}

describe("del texto a los bloques", () => {
  for (const lang of ["js", "python"] as Lang[]) {
    it.each(CHALLENGES.map((c) => [`${c.level}-${c.challenge}`, c] as const))(
      `%s: el código de la solución (${lang}) vuelve a ser la misma solución`,
      (_n, c) => {
        const code = toCode(c.solution, lang);
        const r = parseCode(code, lang);
        expect(r.ok, code).toBe(true);
        if (!r.ok) return;
        expect(norm(r.program)).toEqual(norm(c.solution));
        expect(run(c, r.program).status).toBe("win");
      },
    );
  }

  it("avisa con la línea y sugiere el nombre correcto", () => {
    const r = parseCode("avanzar();\navansar();", "js");
    expect(r).toMatchObject({ ok: false, line: 2 });
    expect(!r.ok && r.message).toContain("avanzar");
  });

  it("avisa cuando falta una llave o la sangría", () => {
    expect(
      parseCode("while (hayCaminoLibre()) {\n  avanzar();", "js"),
    ).toMatchObject({ ok: false });
    expect(
      parseCode("while hay_camino_libre():\navanzar()", "python"),
    ).toMatchObject({ ok: false, line: 1 });
  });

  it("acepta punto y coma opcional y comentarios", () => {
    const r = parseCode("// hola\navanzar()\ngirarDerecha();\n", "js");
    expect(r.ok && r.program.map((b) => b.type)).toEqual(["move", "right"]);
  });

  it("un bucle de 1 vuelta se desarma y de 10 se rechaza", () => {
    const ok = parseCode("for (let i = 0; i < 1; i++) { avanzar(); }", "js");
    expect(ok.ok && ok.program.map((b) => b.type)).toEqual(["move"]);
    expect(
      parseCode("for (let i = 0; i < 10; i++) { avanzar(); }", "js"),
    ).toMatchObject({ ok: false });
  });
});

describe("nombres en inglés (retos de código bilingües)", () => {
  const en = (p: Block[], lang: "js" | "python") => toCode(p, lang, "en");

  it("el código generado en inglés se vuelve a leer igual que el original", () => {
    const programs: Block[] = [
      { id: "1", type: "setvar", value: 2 },
      {
        id: "2",
        type: "while",
        cond: { a: { kind: "free", not: false }, op: "and", b: { kind: "wall", not: true } },
        body: [
          { id: "3", type: "movevar" },
          { id: "4", type: "if", cond: { a: { kind: "wall", not: false } }, body: [{ id: "5", type: "right" }] },
          { id: "6", type: "addvar", op: "+", value: 1 },
        ],
      },
      { id: "7", type: "list", items: ["L", "R", "S"] },
      { id: "8", type: "foreach", body: [{ id: "9", type: "move" }, { id: "10", type: "turnitem" }] },
      { id: "11", type: "def", name: "A", body: [{ id: "12", type: "left" }] },
      { id: "13", type: "call", name: "A" },
    ];
    for (const lang of ["js", "python"] as const) {
      const code = en(programs, lang);
      expect(code).not.toMatch(/avanzar|girar|hay|pasos|giros|bloque/);
      const r = parseCode(code, lang, "en");
      expect(r.ok).toBe(true);
      if (r.ok) expect(JSON.stringify(norm(r.program))).toBe(JSON.stringify(norm(programs)));
      // y el mismo programa en español da el mismo resultado
      const es = parseCode(toCode(programs, lang), lang, "es");
      expect(es.ok && JSON.stringify(norm(es.program))).toBe(JSON.stringify(norm(programs)));
    }
  });

  it("entiende los nombres de los dos idiomas aunque la interfaz esté en uno solo", () => {
    expect(parseCode("move();\nturnRight();\navanzar();", "js", "en").ok).toBe(true);
    expect(parseCode("move()\nturn_left()\ngirar_derecha()", "python", "es").ok).toBe(true);
  });

  it("los mensajes de error salen en el idioma pedido", () => {
    const e1 = parseCode("moev();", "js", "en");
    expect(e1.ok).toBe(false);
    if (!e1.ok) expect(e1.message).toBe("I don't know “moev”. Did you mean “move”?");
    const e2 = parseCode("avansar();", "js", "es");
    if (!e2.ok) expect(e2.message).toBe("No conozco «avansar». ¿Quisiste decir «avanzar»?");
  });
});

describe("código inicial en inglés", () => {
  it("el código inicial de cada reto se traduce sin dejar nombres en español", async () => {
    const { starterIn } = await import("./code-names");
    for (const c of CHALLENGES.filter((x) => x.starter)) {
      for (const lang of ["js", "python"] as const) {
        const code = starterIn(c.starter![lang === "js" ? "js" : "python"], lang, "en");
        expect(code, `${c.level}-${c.challenge}`).not.toMatch(/avanz|avans|girar|girarI|hay[A-Z_]|pared|bloque|pasos|esLaMeta|es_la_meta/);
        // el código inicial de los retos de corrección debe seguir fallando igual que el original
        const a = parseCode(code, lang, "en");
        const b = parseCode(c.starter![lang === "js" ? "js" : "python"], lang, "es");
        expect(a.ok, `${c.level}-${c.challenge} ${lang}`).toBe(b.ok);
      }
    }
  });
});
