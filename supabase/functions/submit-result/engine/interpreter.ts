// GENERADO por scripts/sync-edge-engine.mjs a partir de src/engine/interpreter.ts. No editar a mano.
import { countBlocks } from "./program.ts";
import type { Atom, Block, Cond, CondExpr, Dir, FailReason, FnName, Level, RunResult, Snapshot, Turn } from "./types.ts";

export const MAX_STEPS = 500;

const DELTAS: Record<Dir, { dx: number; dy: number }> = {
  0: { dx: 0, dy: -1 },
  1: { dx: 1, dy: 0 },
  2: { dx: 0, dy: 1 },
  3: { dx: -1, dy: 0 },
};

export function parseLevel(level: Level) {
  const walls = new Set<string>();
  const coins = new Set<string>();
  let start = { x: 0, y: 0 };
  let goal = { x: -1, y: -1 };
  level.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const key = `${x},${y}`;
      if (ch === "#") walls.add(key);
      if (ch === "*") coins.add(key);
      if (ch === "S") start = { x, y };
      if (ch === "G") goal = { x, y };
    });
  });
  return { walls, coins, start, goal, width: level.rows[0]?.length ?? 0, height: level.rows.length };
}

export const MAX_CALL_DEPTH = 24;
const VAR_MAX = 20;

/** Ejecuta el programa y devuelve la traza completa (un Snapshot por acción).
 *  Es determinista y no toca el DOM: la interfaz solo reproduce la traza. */
export function run(level: Level, program: Block[]): RunResult {
  const map = parseLevel(level);
  const blocks = countBlocks(program);
  const taken = new Set<string>();

  let x = map.start.x;
  let y = map.start.y;
  let dir: Dir = level.startDir;
  let steps = 0;
  let failure: FailReason | null = null;
  let done = false;
  // datos del programa: la variable «pasos», la lista de giros y el giro actual
  let pasos = 1;
  let list: Turn[] = [];
  let item: Turn = "S";
  let depth = 0;

  // Bloques «crear bloque» del nivel principal: se pueden usar desde cualquier parte
  const defs = new Map<FnName, Block[]>();
  for (const b of program) if (b.type === "def") defs.set(b.name, b.body);

  const snapshots: Snapshot[] = [{ x, y, dir, coins: 0, blockId: null, bump: false }];
  const push = (blockId: string, bump = false) => {
    snapshots.push({ x, y, dir, coins: taken.size, blockId, bump });
  };

  /** Cuenta un paso de ejecución; devuelve false si se pasó del límite. */
  const tick = () => {
    steps += 1;
    if (steps > MAX_STEPS) {
      failure = "step-limit";
      return false;
    }
    return true;
  };

  const ahead = () => ({ nx: x + DELTAS[dir].dx, ny: y + DELTAS[dir].dy });
  const isWall = (nx: number, ny: number) => nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || map.walls.has(`${nx},${ny}`);
  const atom = (a: Atom): boolean => {
    const { nx, ny } = ahead();
    const wall = isWall(nx, ny);
    const v =
      a.kind === "wall" ? wall : a.kind === "free" ? !wall : a.kind === "coin" ? map.coins.has(`${nx},${ny}`) && !taken.has(`${nx},${ny}`) : nx === map.goal.x && ny === map.goal.y;
    return a.not ? !v : v;
  };
  const evalCond = (c: Cond | CondExpr): boolean => {
    if (typeof c === "string") return atom({ kind: c, not: false });
    const left = atom(c.a);
    if (!c.b || !c.op) return left;
    return c.op === "and" ? left && atom(c.b) : left || atom(c.b);
  };

  /** Un paso hacia delante. Devuelve false si el robot chocó (y marca el fallo). */
  const stepForward = (blockId: string) => {
    const { nx, ny } = ahead();
    if (isWall(nx, ny)) {
      push(blockId, true);
      failure = "wall";
      return false;
    }
    x = nx;
    y = ny;
    if (map.coins.has(`${x},${y}`)) taken.add(`${x},${y}`);
    if (x === map.goal.x && y === map.goal.y) done = true;
    push(blockId);
    return true;
  };

  const exec = (list_: Block[]) => {
    for (const block of list_) {
      if (done || failure) return;
      switch (block.type) {
        case "def":
        case "list":
          if (block.type === "list") list = block.items;
          continue;
        case "repeat":
          for (let i = 0; i < block.times; i++) {
            if (!tick()) return;
            exec(block.body);
            if (done || failure) return;
          }
          continue;
        case "while": {
          while (evalCond(block.cond)) {
            if (!tick()) return;
            exec(block.body);
            if (done || failure) return;
          }
          continue;
        }
        case "if":
          if (!tick()) return;
          if (evalCond(block.cond)) exec(block.body);
          continue;
        case "call": {
          const body = defs.get(block.name);
          if (!tick()) return;
          if (!body) continue;
          if (depth >= MAX_CALL_DEPTH) {
            failure = "step-limit";
            return;
          }
          depth += 1;
          exec(body);
          depth -= 1;
          continue;
        }
        case "foreach": {
          const saved = item;
          for (const turn of list) {
            if (!tick()) return;
            item = turn;
            exec(block.body);
            if (done || failure) return;
          }
          item = saved;
          continue;
        }
        case "setvar":
          if (!tick()) return;
          pasos = Math.min(VAR_MAX, Math.max(0, Math.round(block.value)));
          continue;
        case "addvar": {
          if (!tick()) return;
          const v = Math.min(3, Math.max(1, Math.round(block.value)));
          const next = block.op === "-" ? pasos - v : block.op === "*" ? pasos * v : pasos + v;
          pasos = Math.min(VAR_MAX, Math.max(0, next));
          continue;
        }
        case "movevar":
          for (let i = 0; i < pasos; i++) {
            if (!tick()) return;
            if (!stepForward(block.id) || done) return;
          }
          continue;
        case "turnitem":
          if (!tick()) return;
          if (item === "L") dir = ((dir + 3) % 4) as Dir;
          else if (item === "R") dir = ((dir + 1) % 4) as Dir;
          else continue;
          push(block.id);
          continue;
        case "left":
        case "right":
          if (!tick()) return;
          dir = (block.type === "left" ? (dir + 3) % 4 : (dir + 1) % 4) as Dir;
          push(block.id);
          continue;
        case "move":
          if (!tick()) return;
          if (!stepForward(block.id)) return;
          continue;
      }
    }
  };

  if (program.length === 0) failure = "empty";
  else exec(program);

  const won = done && !failure;
  const coinsTotal = map.coins.size;
  const stars = won ? ((1 + (blocks <= level.par ? 1 : 0) + (taken.size === coinsTotal ? 1 : 0)) as 1 | 2 | 3) : 0;

  return {
    snapshots,
    status: won ? "win" : "fail",
    reason: won ? undefined : (failure ?? "not-at-goal"),
    coinsCollected: taken.size,
    coinsTotal,
    blocks,
    stars,
  };
}
