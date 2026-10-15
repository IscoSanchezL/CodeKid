import { describe, expect, it } from "vitest";
import { run } from "./interpreter";
import { CHALLENGES } from "./levels";
import { addBlock, countBlocks, makeBlock, removeBlock, setTimes } from "./program";
import type { Block, Level } from "./types";

const base = CHALLENGES[0] as Level;

describe("niveles de referencia", () => {
  it.each(CHALLENGES.map((c) => [`${c.level}-${c.challenge}`, c] as const))(
    "el reto %s se resuelve con su solución y es óptima",
    (_name, c) => {
      const r = run(c, c.solution);
      expect(r.status).toBe("win");
      expect(r.blocks).toBe(c.par);
      expect(r.coinsCollected).toBe(r.coinsTotal);
      expect(r.stars).toBe(3);
    },
  );

  it("todas las filas de un mapa miden lo mismo y hay una S y una G", () => {
    for (const c of CHALLENGES) {
      expect(new Set(c.rows.map((r) => r.length)).size).toBe(1);
      const joined = c.rows.join("");
      expect([...joined].filter((ch) => ch === "S")).toHaveLength(1);
      expect([...joined].filter((ch) => ch === "G")).toHaveLength(1);
    }
  });

  it("solo los niveles de bucles permiten «repetir»", () => {
    for (const c of CHALLENGES) {
      expect(c.allowed.includes("repeat")).toBe(c.level >= 2);
    }
  });
});

describe("intérprete", () => {
  it("falla con programa vacío", () => {
    const r = run(base, []);
    expect(r.status).toBe("fail");
    expect(r.reason).toBe("empty");
  });

  it("falla al chocar con una pared y marca el choque", () => {
    const r = run(base, [makeBlock("left"), makeBlock("move")]);
    expect(r.status).toBe("fail");
    expect(r.reason).toBe("wall");
    expect(r.snapshots.at(-1)?.bump).toBe(true);
  });

  it("falla si termina sin llegar a la meta", () => {
    const r = run(base, [makeBlock("move")]);
    expect(r.status).toBe("fail");
    expect(r.reason).toBe("not-at-goal");
  });

  it("corta los bucles que no terminan de forma útil (límite de pasos)", () => {
    const loop: Block = { id: "x", type: "repeat", times: 9, body: [] };
    const inner: Block = { id: "y", type: "repeat", times: 9, body: [] };
    const deep: Block = { id: "z", type: "repeat", times: 9, body: [{ id: "m", type: "left" }] };
    inner.body = [deep];
    loop.body = [inner];
    // 9*9*9 = 729 giros > 500
    const r = run(base, [loop]);
    expect(r.reason).toBe("step-limit");
  });

  it("da 2 estrellas si usa más bloques que el par pero gana", () => {
    const c = CHALLENGES.find((x) => x.level === 2 && x.challenge === 1) as Level;
    const moves = Array.from({ length: 5 }, () => makeBlock("move"));
    const r = run(c, moves);
    expect(r.status).toBe("win");
    expect(r.stars).toBe(2);
  });

  it("da 2 estrellas si gana dentro del par pero sin todas las monedas", () => {
    const c = CHALLENGES.find((x) => x.level === 1 && x.challenge === 3) as Level;
    // Mapa con dos caminos: el corto no pasa por la moneda
    const custom: Level = { ...c, rows: ["S.G", ".#.", "..*"], par: 2, solution: [] };
    const r = run(custom, [makeBlock("move"), makeBlock("move")]);
    expect(r.status).toBe("win");
    expect(r.coinsCollected).toBe(0);
    expect(r.coinsTotal).toBe(1);
    expect(r.stars).toBe(2);
  });
});

describe("edición del programa", () => {
  it("añade dentro de un «repetir», cambia las veces y elimina", () => {
    const rep = makeBlock("repeat");
    let p: Block[] = addBlock([], null, rep);
    p = addBlock(p, rep.id, makeBlock("move"));
    expect(countBlocks(p)).toBe(2);

    p = setTimes(p, rep.id, 5);
    expect((p[0] as Extract<Block, { type: "repeat" }>).times).toBe(5);
    p = setTimes(p, rep.id, 99);
    expect((p[0] as Extract<Block, { type: "repeat" }>).times).toBe(9);

    p = removeBlock(p, rep.id);
    expect(p).toEqual([]);
  });
});
