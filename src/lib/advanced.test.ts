import { describe, expect, it } from "vitest";
import { CHALLENGES } from "@/engine/levels";
import { run } from "@/engine/interpreter";
import { parseCode } from "./code-parser";

const ADV = CHALLENGES.filter((c) => c.level > 10);

/** Correcciones que arreglan el código inicial de los retos «arregla el código» (planeta avanzado 18). */
const FIXES: Record<string, { js: [string, string][]; python: [string, string][] }> = {
  "18-1": { js: [["while (esLaMeta())", "while (!esLaMeta())"]], python: [["while es_la_meta():", "while not es_la_meta():"]] },
  "18-2": { js: [["girarDerecha();\n}", "girarIzquierda();\n}"]], python: [["girar_derecha()", "girar_izquierda()"]] },
  "18-3": { js: [["girarIzquierda();\n  }", "girarIzquierda();\n    girarIzquierda();\n  }"]], python: [["girar_izquierda()\n", "girar_izquierda()\n        girar_izquierda()\n"]] },
  "18-4": { js: [["while (hayPared()) {\n    avanzar", "while (hayCaminoLibre()) {\n    avanzar"], ["girarDerecha();\n    girarDerecha();", "girarIzquierda();\n    girarIzquierda();"]], python: [["while hay_pared():\n        avanzar", "while hay_camino_libre():\n        avanzar"], ["girar_derecha()\n        girar_derecha()", "girar_izquierda()\n        girar_izquierda()"]] },
  "18-5": { js: [["i < 2", "i < 6"], ["pasos - 1", "pasos + 1"]], python: [["range(2)", "range(6)"], ["pasos - 1", "pasos + 1"]] },
};

describe("fase 2 · modo avanzado", () => {
  it("hay 5 retos por cada uno de los 10 planetas avanzados", () => {
    for (let lv = 11; lv <= 20; lv++) expect(ADV.filter((c) => c.level === lv)).toHaveLength(5);
  });

  it("los planetas avanzados 18–20 son de código", () => {
    for (const c of ADV) expect(c.mode === "code").toBe(c.level >= 18);
  });

  it.each(["js", "python"] as const)("el código inicial de los retos 18 se arregla con las correcciones (%s)", (lang) => {
    for (const c of ADV.filter((x) => x.level === 18)) {
      let code = c.starter?.[lang] ?? "";
      // el código inicial no gana tal cual
      const before = parseCode(code, lang);
      if (before.ok) expect(run(c, before.program).status).not.toBe("win");
      for (const [from, to] of FIXES[`${c.level}-${c.challenge}`][lang]) {
        expect(code).toContain(from);
        code = code.replace(from, to);
      }
      const after = parseCode(code, lang);
      expect(after.ok, `${c.level}-${c.challenge} ${lang}`).toBe(true);
      if (after.ok) expect(run(c, after.program).status, `${c.level}-${c.challenge} ${lang}`).toBe("win");
    }
  });
});
