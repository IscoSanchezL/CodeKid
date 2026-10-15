import type { Block, Level } from "./types";

// Atajos para escribir las soluciones de referencia
let n = 0;
const id = () => `s${(n += 1)}`;
const move = (): Block => ({ id: id(), type: "move" });
const left = (): Block => ({ id: id(), type: "left" });
const right = (): Block => ({ id: id(), type: "right" });
const repeat = (times: number, ...body: Block[]): Block => ({ id: id(), type: "repeat", times, body });

const SEQ: Level["allowed"] = ["move", "left", "right"];
const LOOP: Level["allowed"] = ["move", "left", "right", "repeat"];

export const CHALLENGES: Level[] = [
  // ── Nivel 1 · Secuencias ───────────────────────────────────────────────
  {
    level: 1, challenge: 1, title: "Primer paso", par: 2, startDir: 1, allowed: SEQ,
    hint: "Usa «Avanzar» para llegar a la bandera.",
    rows: ["S.G"],
    solution: [move(), move()],
  },
  {
    level: 1, challenge: 2, title: "Una esquina", par: 5, startDir: 1, allowed: SEQ,
    hint: "El robot mira a la derecha. Gira antes de bajar.",
    rows: ["S..", "##.", "##G"],
    solution: [move(), move(), right(), move(), move()],
  },
  {
    level: 1, challenge: 3, title: "Recoge monedas", par: 5, startDir: 1, allowed: SEQ,
    hint: "Pasa por las dos monedas para ganar la tercera estrella.",
    rows: ["S*.", "##*", "##G"],
    solution: [move(), move(), right(), move(), move()],
  },
  {
    level: 1, challenge: 4, title: "Giro doble", par: 8, startDir: 1, allowed: SEQ,
    hint: "Un giro a la derecha y luego otro a la izquierda.",
    rows: ["S.#..", "#.#.#", "#...G"],
    solution: [move(), right(), move(), move(), left(), move(), move(), move()],
  },
  {
    level: 1, challenge: 5, title: "Escalera", par: 10, startDir: 1, allowed: SEQ,
    hint: "Divide el camino en tramos rectos.",
    rows: ["S..#.", "##.#.", "##...", "###.#", "###G#"],
    solution: [move(), move(), right(), move(), move(), left(), move(), right(), move(), move()],
  },

  // ── Nivel 2 · Bucles ───────────────────────────────────────────────────
  {
    level: 2, challenge: 1, title: "Repite y avanza", par: 2, startDir: 1, allowed: LOOP,
    hint: "En vez de 5 «Avanzar», usa un «Repetir».",
    rows: ["S....G"],
    solution: [repeat(5, move())],
  },
  {
    level: 2, challenge: 2, title: "Pasillos largos", par: 8, startDir: 1, allowed: LOOP,
    hint: "Hay dos tramos largos: uno por cada «Repetir».",
    rows: ["S....", "####.", "G...."],
    solution: [repeat(4, move()), right(), move(), move(), right(), repeat(4, move())],
  },
  {
    level: 2, challenge: 3, title: "Zigzag", par: 5, startDir: 1, allowed: LOOP,
    hint: "El patrón avanzar, derecha, avanzar, izquierda se repite.",
    rows: ["S.##", "#..#", "##..", "###G"],
    solution: [repeat(3, move(), right(), move(), left())],
  },
  {
    level: 2, challenge: 4, title: "Monedas en fila", par: 5, startDir: 1, allowed: LOOP,
    hint: "Recoge todas las monedas con solo dos bucles.",
    rows: ["S****", "####*", "####G"],
    solution: [repeat(4, move()), right(), repeat(2, move())],
  },
  {
    level: 2, challenge: 5, title: "Olas", par: 6, startDir: 1, allowed: LOOP,
    hint: "Un solo «Repetir» con 5 bloques dentro basta.",
    rows: ["S..####", "##...##", "####...", "######G"],
    solution: [repeat(3, move(), move(), right(), move(), left())],
  },
];

export function getChallenge(level: number, challenge: number): Level | undefined {
  return CHALLENGES.find((c) => c.level === level && c.challenge === challenge);
}

export function challengesOf(level: number): Level[] {
  return CHALLENGES.filter((c) => c.level === level);
}

export const PLAYABLE_LEVELS = [...new Set(CHALLENGES.map((c) => c.level))];
