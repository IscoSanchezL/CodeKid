// GENERADO por scripts/sync-edge-engine.mjs a partir de src/engine/dsl.ts. No editar a mano.
import type { AtomKind, Block, Level, Turn } from "./types.ts";

// Atajos para escribir las soluciones de referencia
let n = 0;
export const id = () => `s${(n += 1)}`;
export const move = (): Block => ({ id: id(), type: "move" });
export const left = (): Block => ({ id: id(), type: "left" });
export const right = (): Block => ({ id: id(), type: "right" });
export const repeat = (times: number, ...body: Block[]): Block => ({ id: id(), type: "repeat", times, body });
export const ifWall = (...body: Block[]): Block => ({ id: id(), type: "if", cond: "wall", body });
export const ifFree = (...body: Block[]): Block => ({ id: id(), type: "if", cond: "free", body });
export const def = (name: "A" | "B", ...body: Block[]): Block => ({ id: id(), type: "def", name, body });
export const call = (name: "A" | "B"): Block => ({ id: id(), type: "call", name });
export const setv = (value: number): Block => ({ id: id(), type: "setvar", value });
export const addv = (op: "+" | "-" | "*", value: number): Block => ({ id: id(), type: "addvar", op, value });
export const movev = (): Block => ({ id: id(), type: "movevar" });
export const list = (...items: Turn[]): Block => ({ id: id(), type: "list", items });
export const each = (...body: Block[]): Block => ({ id: id(), type: "foreach", body });
export const turn = (): Block => ({ id: id(), type: "turnitem" });
export const whileC = (kind: AtomKind, not: boolean, ...body: Block[]): Block => ({ id: id(), type: "while", cond: { a: { kind, not } }, body });
export const ifC = (kind: AtomKind, not: boolean, ...body: Block[]): Block => ({ id: id(), type: "if", cond: { a: { kind, not } }, body });
/** Patrón de «camina y gira al chocar»: si hay camino, avanza; si hay pared, gira. */
export const walk = (turn: () => Block): Block[] => [ifFree(move()), ifWall(turn())];

export const SEQ: Level["allowed"] = ["move", "left", "right"];
export const LOOP: Level["allowed"] = ["move", "left", "right", "repeat"];
export const LOGIC: Level["allowed"] = ["move", "left", "right", "repeat", "if"];
export const FUNCS: Level["allowed"] = ["move", "left", "right", "def", "call"];
export const VARS: Level["allowed"] = ["move", "left", "right", "repeat", "setvar", "addvar", "movevar"];
export const LISTS: Level["allowed"] = ["move", "left", "right", "repeat", "list", "foreach", "turnitem"];
export const WHILES: Level["allowed"] = ["move", "left", "right", "if", "while"];
/** Retos de código: el programa se escribe en texto y puede usar cualquier bloque. */
export const ALL: Level["allowed"] = ["move", "left", "right", "repeat", "if", "while", "def", "call", "setvar", "addvar", "movevar", "list", "foreach", "turnitem"];
/** Recorre un camino de un solo carril: avanza mientras haya camino y gira; para cuando la meta está delante. */
export const follow = (...turns: Block[]): Block => whileC("goal", true, whileC("free", false, move()), ...turns);

