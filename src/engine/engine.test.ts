import { describe, expect, it } from "vitest";
import { run } from "./interpreter";
import { CHALLENGES } from "./levels";
import { addBlock, countBlocks, findBlock, insertAt, locate, makeBlock, moveBlock, removeBlock, setCond, setTimes } from "./program";
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
      const p = c.level > 10 ? c.level - 10 : c.level;
      expect(c.allowed.includes("repeat")).toBe(p >= 2 && p !== 4 && p !== 7);
    }
  });
});

describe("condicionales", () => {
  it("«si» solo está permitido desde el nivel 3", () => {
    for (const c of CHALLENGES) {
      const p = c.level > 10 ? c.level - 10 : c.level;
      expect(c.allowed.includes("if")).toBe(p === 3 || p >= 7);
    }
  });

  it("ejecuta el cuerpo solo si se cumple la condición", () => {
    const c = CHALLENGES.find((x) => x.level === 3 && x.challenge === 1) as Level;
    // de frente hay camino libre: avanza; «si hay pared» no se cumple y no gira
    const ok = run(c, [
      { id: "a", type: "if", cond: "free", body: [makeBlock("move")] },
      { id: "b", type: "if", cond: "wall", body: [makeBlock("left")] },
    ]);
    expect(ok.snapshots).toHaveLength(2);
    expect(ok.snapshots.at(-1)?.x).toBe(1);
  });

  it("cambia la condición de un «si»", () => {
    const iff = makeBlock("if");
    expect((iff as Extract<Block, { type: "if" }>).cond).toEqual({ a: { kind: "wall", not: false } });
    const p = setCond([iff], iff.id, "free");
    expect((p[0] as Extract<Block, { type: "if" }>).cond).toEqual({ a: { kind: "free", not: false } });
  });

  it("corta los bucles anidados vacíos (no se cuelga)", () => {
    const empty = (times: number, body: Block[]): Block => ({ id: `e${times}${body.length}`, type: "repeat", times, body });
    let p: Block = empty(9, []);
    for (let i = 0; i < 6; i++) p = empty(9, [p]);
    const r = run(base, [p]);
    expect(r.reason).toBe("step-limit");
  });
});

describe("pruebas automáticas", () => {
  const c = CHALLENGES.find((x) => x.level === 9 && x.challenge === 1) as Level;

  it("un programa hecho solo para el mapa principal falla las otras pruebas", () => {
    const r = run(c, [{ id: "r", type: "repeat", times: 9, body: [makeBlock("move")] }]);
    expect(r.status).toBe("fail");
    expect(r.reason).toBe("tests");
    expect(r.tests?.some((t) => !t.passed)).toBe(true);
  });

  it("el programa general pasa todas", () => {
    const r = run(c, c.solution);
    expect(r.status).toBe("win");
    expect(r.tests?.every((t) => t.passed)).toBe(true);
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

describe("arrastrar bloques", () => {
  const mk = (type: Parameters<typeof makeBlock>[0]) => makeBlock(type);
  const types = (p: Block[]) => p.map((b) => b.type);

  it("inserta en una posición concreta, incluso dentro de un «repetir»", () => {
    const [a, b] = [mk("move"), mk("left")];
    let p = insertAt([], null, 0, a);
    p = insertAt(p, null, 0, b);
    expect(types(p)).toEqual(["left", "move"]);
    p = insertAt(p, null, 99, mk("right")); // fuera de rango: al final
    expect(types(p)).toEqual(["left", "move", "right"]);

    const rep = mk("repeat");
    p = insertAt(p, null, 1, rep);
    p = insertAt(p, rep.id, 0, mk("move"));
    p = insertAt(p, rep.id, 0, mk("right"));
    expect(types((p[1] as Extract<Block, { type: "repeat" }>).body)).toEqual(["right", "move"]);
  });

  it("reordena sin duplicar ni perder bloques (corrige el desplazamiento de índices)", () => {
    const [a, b, c] = [mk("move"), mk("left"), mk("right")];
    const p = [a, b, c];
    expect(types(moveBlock(p, a.id, null, 3))).toEqual(["left", "right", "move"]); // al final
    expect(types(moveBlock(p, c.id, null, 0))).toEqual(["right", "move", "left"]); // al principio
    expect(types(moveBlock(p, a.id, null, 1))).toEqual(["move", "left", "right"]); // misma posición
    expect(types(moveBlock(p, a.id, null, 2))).toEqual(["left", "move", "right"]);
    expect(countBlocks(moveBlock(p, b.id, null, 0))).toBe(3);
  });

  it("mete y saca bloques de un «repetir»", () => {
    const rep = mk("repeat");
    const m = mk("move");
    let p: Block[] = [m, rep];
    p = moveBlock(p, m.id, rep.id, 0);
    expect(p).toHaveLength(1);
    expect((p[0] as Extract<Block, { type: "repeat" }>).body).toHaveLength(1);
    p = moveBlock(p, m.id, null, 1);
    expect(types(p)).toEqual(["repeat", "move"]);
    expect((p[0] as Extract<Block, { type: "repeat" }>).body).toHaveLength(0);
  });

  it("no deja meter un «repetir» dentro de sí mismo ni de sus hijos", () => {
    const inner = mk("repeat");
    const outer = { ...(mk("repeat") as Extract<Block, { type: "repeat" }>), body: [inner] };
    const p: Block[] = [outer];
    expect(moveBlock(p, outer.id, outer.id, 0)).toBe(p);
    expect(moveBlock(p, outer.id, inner.id, 0)).toBe(p);
  });

  it("mover un «repetir» se lleva todo su contenido", () => {
    const rep = mk("repeat");
    const m = mk("move");
    const tail = mk("left");
    let p: Block[] = [rep, tail];
    p = insertAt(p, rep.id, 0, m);
    p = moveBlock(p, rep.id, null, 2);
    expect(types(p)).toEqual(["left", "repeat"]);
    expect(countBlocks(p)).toBe(3);
    expect(locate(p, m.id)).toEqual({ containerId: rep.id, index: 0 });
  });

  it("localiza y encuentra bloques anidados", () => {
    const rep = mk("repeat");
    const m = mk("move");
    const p = insertAt([rep], rep.id, 0, m);
    expect(findBlock(p, m.id)?.type).toBe("move");
    expect(findBlock(p, "nope")).toBeNull();
    expect(locate(p, "nope")).toBeNull();
  });
});
