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
});
