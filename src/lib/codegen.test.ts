import { describe, expect, it } from "vitest";
import { toCode } from "./codegen";
import type { Block } from "@/engine/types";

const mv: Block = { id: "a", type: "move" };
const lf: Block = { id: "b", type: "left" };
const rt: Block = { id: "c", type: "right" };
const rep = (times: number, ...body: Block[]): Block => ({ id: `r${times}`, type: "repeat", times, body });

describe("de bloques a código", () => {
  it("secuencia simple en JavaScript y Python", () => {
    expect(toCode([mv, rt, mv], "js")).toBe("avanzar();\ngirarDerecha();\navanzar();");
    expect(toCode([mv, rt, mv], "python")).toBe("avanzar()\ngirar_derecha()\navanzar()");
  });

  it("un «repetir» se vuelve un bucle for", () => {
    const p = [rep(3, mv, rt, mv, lf)];
    expect(toCode(p, "js")).toBe(
      "for (let i = 0; i < 3; i++) {\n  avanzar();\n  girarDerecha();\n  avanzar();\n  girarIzquierda();\n}",
    );
    expect(toCode(p, "python")).toBe(
      "for _ in range(3):\n    avanzar()\n    girar_derecha()\n    avanzar()\n    girar_izquierda()",
    );
  });

  it("los bucles anidados usan variables distintas y sangrado correcto", () => {
    const p = [mv, rep(2, rep(4, mv), rt)];
    expect(toCode(p, "js")).toBe(
      "avanzar();\nfor (let i = 0; i < 2; i++) {\n  for (let j = 0; j < 4; j++) {\n    avanzar();\n  }\n  girarDerecha();\n}",
    );
    expect(toCode(p, "python")).toBe(
      "avanzar()\nfor _ in range(2):\n    for _ in range(4):\n        avanzar()\n    girar_derecha()",
    );
  });

  it("programas y bucles vacíos producen código válido", () => {
    expect(toCode([], "js")).toBe("// (programa vacío)");
    expect(toCode([], "python")).toBe("pass");
    expect(toCode([rep(2)], "python")).toBe("for _ in range(2):\n    pass");
    expect(toCode([rep(2)], "js")).toBe("for (let i = 0; i < 2; i++) {\n  // (vacío)\n}");
  });

  it("un «si» se vuelve un if con su condición", () => {
    const iff: Block = { id: "i", type: "if", cond: "free", body: [mv] };
    const iw: Block = { id: "j", type: "if", cond: "wall", body: [rt] };
    expect(toCode([rep(2, iff, iw)], "js")).toBe(
      "for (let i = 0; i < 2; i++) {\n  if (hayCaminoLibre()) {\n    avanzar();\n  }\n  if (hayPared()) {\n    girarDerecha();\n  }\n}",
    );
    expect(toCode([iw], "python")).toBe("if hay_pared():\n    girar_derecha()");
  });

  it("bloques, variables, listas y condiciones compuestas", () => {
    const prog: Block[] = [
      { id: "d", type: "def", name: "A", body: [mv, rt] },
      { id: "c", type: "call", name: "A" },
      { id: "s", type: "setvar", value: 3 },
      { id: "a", type: "addvar", op: "*", value: 2 },
      { id: "m", type: "movevar" },
      { id: "l", type: "list", items: ["R", "S", "L"] },
      { id: "f", type: "foreach", body: [{ id: "t", type: "turnitem" }] },
      {
        id: "w",
        type: "while",
        cond: { a: { kind: "goal", not: true }, op: "and", b: { kind: "free", not: false } },
        body: [mv],
      },
    ];
    expect(toCode(prog, "js")).toBe(
      [
        "let pasos = 1;",
        "function bloqueA() {",
        "  avanzar();",
        "  girarDerecha();",
        "}",
        "bloqueA();",
        "pasos = 3;",
        "pasos = pasos * 2;",
        "avanzar(pasos);",
        'let giros = ["derecha", "recto", "izquierda"];',
        "for (const giro of giros) {",
        "  girar(giro);",
        "}",
        "while (!esLaMeta() && hayCaminoLibre()) {",
        "  avanzar();",
        "}",
      ].join("\n"),
    );
    expect(toCode(prog, "python")).toContain("while not es_la_meta() and hay_camino_libre():");
    expect(toCode(prog, "python")).toContain("def bloque_a():");
  });
});
