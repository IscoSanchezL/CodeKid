// GENERADO por scripts/sync-edge-engine.mjs a partir de src/engine/program.ts. No editar a mano.
import type { ActionType, Block, BlockType } from "./types.ts";

let counter = 0;
function nextId() {
  counter += 1;
  return `b${counter}`;
}

export function makeBlock(type: BlockType): Block {
  return type === "repeat"
    ? { id: nextId(), type, times: 2, body: [] }
    : { id: nextId(), type: type as ActionType };
}

/** Añade un bloque al final del programa (containerId = null) o dentro de un "repetir". */
export function addBlock(program: Block[], containerId: string | null, block: Block): Block[] {
  if (containerId === null) return [...program, block];
  return program.map((b) => {
    if (b.type !== "repeat") return b;
    if (b.id === containerId) return { ...b, body: [...b.body, block] };
    return { ...b, body: addBlock(b.body, containerId, block) };
  });
}

export function removeBlock(program: Block[], id: string): Block[] {
  return program
    .filter((b) => b.id !== id)
    .map((b) => (b.type === "repeat" ? { ...b, body: removeBlock(b.body, id) } : b));
}

export function setTimes(program: Block[], id: string, times: number): Block[] {
  const safe = Math.min(9, Math.max(2, Math.round(times)));
  return program.map((b) => {
    if (b.type !== "repeat") return b;
    return b.id === id ? { ...b, times: safe } : { ...b, body: setTimes(b.body, id, safe) };
  });
}

export function containsId(program: Block[], id: string): boolean {
  return program.some((b) => b.id === id || (b.type === "repeat" && containsId(b.body, id)));
}

/** Cuenta cada bloque, incluidos los "repetir" y su contenido. */
export function countBlocks(program: Block[]): number {
  return program.reduce((n, b) => n + 1 + (b.type === "repeat" ? countBlocks(b.body) : 0), 0);
}

/** Busca un bloque por id en cualquier nivel de anidación. */
export function findBlock(program: Block[], id: string): Block | null {
  for (const b of program) {
    if (b.id === id) return b;
    if (b.type === "repeat") {
      const inner = findBlock(b.body, id);
      if (inner) return inner;
    }
  }
  return null;
}

/** Dónde está un bloque: en qué contenedor (null = programa principal) y en qué posición. */
export function locate(
  program: Block[],
  id: string,
  containerId: string | null = null,
): { containerId: string | null; index: number } | null {
  for (let i = 0; i < program.length; i++) {
    const b = program[i];
    if (b.id === id) return { containerId, index: i };
    if (b.type === "repeat") {
      const inner = locate(b.body, id, b.id);
      if (inner) return inner;
    }
  }
  return null;
}

/** Inserta un bloque en una posición concreta del programa principal (containerId = null) o de un «repetir». */
export function insertAt(program: Block[], containerId: string | null, index: number, block: Block): Block[] {
  if (containerId === null) {
    const at = Math.max(0, Math.min(program.length, index));
    return [...program.slice(0, at), block, ...program.slice(at)];
  }
  return program.map((b) => {
    if (b.type !== "repeat") return b;
    if (b.id === containerId) return { ...b, body: insertAt(b.body, null, index, block) };
    return { ...b, body: insertAt(b.body, containerId, index, block) };
  });
}

/** Ids de un bloque y de todo lo que lleva dentro: un «repetir» no puede soltarse dentro de sí mismo. */
export function selfAndInnerIds(block: Block): Set<string> {
  const ids = new Set<string>([block.id]);
  if (block.type === "repeat") for (const child of block.body) selfAndInnerIds(child).forEach((i) => ids.add(i));
  return ids;
}

/**
 * Mueve un bloque (con todo su contenido) a otra posición. `toIndex` se refiere a la lista ANTES de
 * sacar el bloque, que es lo que ve el usuario al arrastrar; aquí se corrige el desplazamiento.
 */
export function moveBlock(program: Block[], id: string, toContainerId: string | null, toIndex: number): Block[] {
  const block = findBlock(program, id);
  const from = locate(program, id);
  if (!block || !from) return program;
  if (toContainerId !== null && selfAndInnerIds(block).has(toContainerId)) return program;
  const index = from.containerId === toContainerId && from.index < toIndex ? toIndex - 1 : toIndex;
  return insertAt(removeBlock(program, id), toContainerId, index, block);
}
