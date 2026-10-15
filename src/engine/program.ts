import type { ActionType, Block, BlockType } from "./types";

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
