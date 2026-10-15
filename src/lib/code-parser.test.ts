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
