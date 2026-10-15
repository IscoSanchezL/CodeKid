import { countBlocks } from "./program";
import type { Block, Dir, FailReason, Level, RunResult, Snapshot } from "./types";

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

/**
 * Ejecuta el programa y devuelve la traza completa (un Snapshot por acción).
 * Es determinista y no toca el DOM: la interfaz solo reproduce la traza.
 */
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

  const snapshots: Snapshot[] = [{ x, y, dir, coins: 0, blockId: null, bump: false }];

  const push = (blockId: string, bump = false) => {
    snapshots.push({ x, y, dir, coins: taken.size, blockId, bump });
  };

  const exec = (list: Block[]) => {
    for (const block of list) {
      if (done || failure) return;
      if (block.type === "repeat") {
        for (let i = 0; i < block.times; i++) {
          exec(block.body);
          if (done || failure) return;
        }
        continue;
      }

      steps += 1;
      if (steps > MAX_STEPS) {
        failure = "step-limit";
        return;
      }

      if (block.type === "left") dir = ((dir + 3) % 4) as Dir;
      else if (block.type === "right") dir = ((dir + 1) % 4) as Dir;
      else {
        const nx = x + DELTAS[dir].dx;
        const ny = y + DELTAS[dir].dy;
        const outside = nx < 0 || ny < 0 || nx >= map.width || ny >= map.height;
        if (outside || map.walls.has(`${nx},${ny}`)) {
          push(block.id, true);
          failure = "wall";
          return;
        }
        x = nx;
        y = ny;
        if (map.coins.has(`${x},${y}`)) taken.add(`${x},${y}`);
        if (x === map.goal.x && y === map.goal.y) done = true;
      }
      push(block.id);
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
