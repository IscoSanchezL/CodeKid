// GENERADO por scripts/sync-edge-engine.mjs a partir de src/engine/types.ts. No editar a mano.
/** 0 = arriba, 1 = derecha, 2 = abajo, 3 = izquierda */
export type Dir = 0 | 1 | 2 | 3;

export type ActionType = "move" | "left" | "right";
export type BlockType = ActionType | "repeat";

export type ActionBlock = { id: string; type: ActionType };
export type RepeatBlock = { id: string; type: "repeat"; times: number; body: Block[] };
export type Block = ActionBlock | RepeatBlock;

/**
 * Mapa en texto. '#' pared, '.' suelo, 'S' inicio, 'G' meta, '*' moneda.
 * Todas las filas deben tener el mismo largo.
 */
export type Level = {
  level: number;
  challenge: number;
  title: string;
  hint: string;
  rows: string[];
  startDir: Dir;
  /** Bloques permitidos en la paleta */
  allowed: BlockType[];
  /** Cantidad de bloques de la solución óptima (para la 2.ª estrella) */
  par: number;
  /** Solución de referencia, la usan los tests para validar el nivel */
  solution: Block[];
};

export type Snapshot = {
  x: number;
  y: number;
  dir: Dir;
  coins: number;
  /** Bloque que produjo este paso (para resaltarlo en el editor) */
  blockId: string | null;
  bump: boolean;
};

export type FailReason = "wall" | "step-limit" | "not-at-goal" | "empty";

export type RunResult = {
  snapshots: Snapshot[];
  status: "win" | "fail";
  reason?: FailReason;
  coinsCollected: number;
  coinsTotal: number;
  blocks: number;
  /** 0 si no ganó; 1 por ganar, +1 por usar ≤ par bloques, +1 por todas las monedas */
  stars: 0 | 1 | 2 | 3;
};
