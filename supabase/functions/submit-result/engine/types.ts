// GENERADO por scripts/sync-edge-engine.mjs a partir de src/engine/types.ts. No editar a mano.
/** 0 = arriba, 1 = derecha, 2 = abajo, 3 = izquierda */
export type Dir = 0 | 1 | 2 | 3;

export type ActionType = "move" | "left" | "right";
export type BlockType =
  | ActionType
  | "repeat"
  | "if"
  | "while"
  | "def"
  | "call"
  | "setvar"
  | "addvar"
  | "movevar"
  | "list"
  | "foreach"
  | "turnitem";

/** Lo que se puede preguntar al robot: pared delante, camino libre, moneda delante o meta delante. */
export type AtomKind = "wall" | "free" | "coin" | "goal";
/** Forma antigua de la condición de «si» (todavía se acepta). */
export type Cond = "wall" | "free";
export type Atom = { kind: AtomKind; not: boolean };
/** Condición completa: una pregunta, o dos unidas con «y» / «o», cada una con «no» opcional. */
export type CondExpr = { a: Atom; op?: "and" | "or"; b?: Atom };

export type FnName = "A" | "B";
/** Giro de una lista: izquierda, derecha o seguir recto. */
export type Turn = "L" | "R" | "S";

export type ActionBlock = { id: string; type: ActionType };
export type RepeatBlock = { id: string; type: "repeat"; times: number; body: Block[] };
export type IfBlock = { id: string; type: "if"; cond: Cond | CondExpr; body: Block[] };
export type WhileBlock = { id: string; type: "while"; cond: CondExpr; body: Block[] };
export type DefBlock = { id: string; type: "def"; name: FnName; body: Block[] };
export type CallBlock = { id: string; type: "call"; name: FnName };
export type SetVarBlock = { id: string; type: "setvar"; value: number };
export type AddVarBlock = { id: string; type: "addvar"; op: "+" | "-" | "*"; value: number };
export type MoveVarBlock = { id: string; type: "movevar" };
export type ListBlock = { id: string; type: "list"; items: Turn[] };
export type ForEachBlock = { id: string; type: "foreach"; body: Block[] };
export type TurnItemBlock = { id: string; type: "turnitem" };

export type Block =
  | ActionBlock
  | RepeatBlock
  | IfBlock
  | WhileBlock
  | DefBlock
  | CallBlock
  | SetVarBlock
  | AddVarBlock
  | MoveVarBlock
  | ListBlock
  | ForEachBlock
  | TurnItemBlock;
/** Bloques que llevan otros bloques dentro. */
export type ContainerBlock = RepeatBlock | IfBlock | WhileBlock | DefBlock | ForEachBlock;

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
  /** «blocks» (por defecto): se arma con bloques. «code»: el alumno escribe JavaScript o Python. */
  mode?: "blocks" | "code";
  /** Código inicial del editor (retos de código). */
  starter?: { js: string; python: string };
  /** Pruebas automáticas: otros mapas en los que el mismo programa también debe ganar. */
  tests?: { rows: string[]; startDir?: Dir }[];
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

export type FailReason = "wall" | "step-limit" | "not-at-goal" | "empty" | "tests";

export type RunResult = {
  snapshots: Snapshot[];
  status: "win" | "fail";
  reason?: FailReason;
  coinsCollected: number;
  coinsTotal: number;
  blocks: number;
  /** 0 si no ganó; 1 por ganar, +1 por usar ≤ par bloques, +1 por todas las monedas */
  stars: 0 | 1 | 2 | 3;
  /** Resultado de cada prueba automática (solo si el reto las tiene y el mapa principal se ganó). */
  tests?: { passed: boolean }[];
};
