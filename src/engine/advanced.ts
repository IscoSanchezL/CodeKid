import { run } from "./interpreter";
import { countBlocks } from "./program";
import {
  ALL, FUNCS, LISTS, LOGIC, LOOP, SEQ, VARS, WHILES,
  addv, call, def, each, follow, ifC, ifFree, ifWall, left, list, move, movev, repeat, right, setv, turn, walk,
} from "./dsl";
import type { Block, Dir, Level } from "./types";

/** Fase 2 · Modo avanzado. Los niveles 11–20 son la versión avanzada de los planetas 1–10 (avanzado = planeta + 10). */
export const ADVANCED_OFFSET = 10;

/** «m3 R m2 L» → bloques: m = avanzar (m3 = tres veces), R/L = girar. Sirve para dibujar caminos. */
function seq(text: string): Block[] {
  const out: Block[] = [];
  for (const tok of text.trim().split(/\s+/)) {
    if (tok === "R") out.push(right());
    else if (tok === "L") out.push(left());
    else if (tok[0] === "m") for (let i = 0; i < Number(tok.slice(1) || 1); i++) out.push(move());
    else throw new Error(`Token de camino desconocido: ${tok}`);
  }
  return out;
}

const SIZE = 81;

/** Dibuja un mapa de un solo carril siguiendo el camino: el robot recorre «path» desde S hasta G. */
function lane(path: Block[], startDir: Dir, coins = 0): string[] {
  const grid = Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => (x === 0 && y === 0 ? "G" : x === 40 && y === 40 ? "S" : ".")));
  const probe = {
    level: 0, challenge: 0, title: "", hint: "", rows: grid.map((r) => r.join("")), startDir, allowed: ALL, par: 0, solution: [],
  } as Level;
  const trace = run(probe, path).snapshots;
  const cells: [number, number][] = [];
  for (const s of trace) {
    const last = cells[cells.length - 1];
    if (!last || last[0] !== s.x || last[1] !== s.y) cells.push([s.x, s.y]);
  }
  const keys = new Set(cells.map(([x, y]) => `${x},${y}`));
  if (keys.size !== cells.length) throw new Error("El camino se cruza consigo mismo");
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const w = Math.max(...xs) - x0 + 1;
  const h = Math.max(...ys) - y0 + 1;
  const rows = Array.from({ length: h }, () => Array.from({ length: w }, () => "#"));
  cells.forEach(([x, y]) => (rows[y - y0][x - x0] = "."));
  for (let i = 1; i <= coins; i++) {
    const [x, y] = cells[Math.floor((i * (cells.length - 1)) / (coins + 1))];
    rows[y - y0][x - x0] = "*";
  }
  rows[cells[0][1] - y0][cells[0][0] - x0] = "S";
  const end = cells[cells.length - 1];
  rows[end[1] - y0][end[0] - x0] = "G";
  return rows.map((r) => r.join(""));
}

/** Prueba una solución con «K» repeticiones y devuelve la menor K con la que gana (para bucles «repetir K»). */
function minK(rows: string[], startDir: Dir, make: (k: number) => Block[]): Block[] {
  const probe = { level: 0, challenge: 0, title: "", hint: "", rows, startDir, allowed: ALL, par: 0, solution: [] } as Level;
  for (let k = 1; k <= 120; k++) {
    const prog = make(k);
    if (run(probe, prog).status === "win") return prog;
  }
  throw new Error("Ninguna K resuelve el mapa");
}

type Spec = {
  l: number;
  c: number;
  title: string;
  hint: string;
  allowed: Level["allowed"];
  /** Camino que dibuja el mapa. Si no hay «sol», el camino es también la solución. */
  path: string | Block[];
  coins?: number;
  sol?: Block[] | ((k: number) => Block[]);
  /** Caminos de otros mapas donde el mismo programa también debe ganar. */
  tests?: string[];
  /** Retos de código. */
  starter?: { js: string; python: string };
  code?: boolean;
};

const CODE_START = { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" };

function build(s: Spec): Level {
  const path = typeof s.path === "string" ? seq(s.path) : s.path;
  const rows = lane(path, 1, s.coins ?? 0);
  const solution = s.sol === undefined ? path : typeof s.sol === "function" ? minK(rows, 1, s.sol) : s.sol;
  const level: Level = {
    level: s.l + ADVANCED_OFFSET, challenge: s.c, title: s.title, hint: s.hint, rows, startDir: 1, allowed: s.allowed,
    par: 0, solution,
  };
  level.par = countBlocks(solution);
  if (s.code) {
    level.mode = "code";
    level.starter = s.starter ?? CODE_START;
  }
  if (s.tests?.length) level.tests = s.tests.map((t) => ({ rows: lane(seq(t), 1, 0) }));
  return level;
}

// Un solo carril con «K» vueltas: avanza si hay camino, gira si hay pared (o gira a un lado u otro)
// «Repetir» llega hasta 9: si hacen falta más vueltas, un «Repetir» dentro de otro (9 × 9).
const loops = (k: number, ...body: Block[]): Block => (k <= 9 ? repeat(k, ...body) : repeat(9, repeat(9, ...body)));
const walkR = (k: number): Block[] => [loops(k, ...walk(right))];
const walkL = (k: number): Block[] => [loops(k, ...walk(left))];
const walkBoth = (k: number): Block[] => [loops(k, ifFree(move()), ifWall(right(), ifWall(left(), left())))];
// Método general de los planetas 7–10
const followR = (): Block[] => [follow(right())];
const followL = (): Block[] => [follow(left())];
const followBoth = (): Block[] => [follow(right(), ifC("wall", false, left(), left()))];

const SPECS: Spec[] = [
  // ── 11 · Secuencias avanzadas: caminos largos con puro «avanzar» y «girar» ─────────────
  { l: 1, c: 1, title: "Tres tramos", hint: "Cuenta los tramos rectos: avanza 4, gira, avanza 3…", allowed: SEQ, path: "m4 R m3 L m2 R m3", coins: 2 },
  { l: 1, c: 2, title: "Serpiente", hint: "Gira dos veces seguidas para dar la vuelta.", allowed: SEQ, path: "m3 R m2 R m4 L m2 L m3 R m2", coins: 3 },
  { l: 1, c: 3, title: "Escalones de ida", hint: "El patrón avanzar-avanzar, derecha, avanzar-avanzar, izquierda se repite, pero aquí no hay «Repetir».", allowed: SEQ, path: "m2 R m2 L m2 R m2 L m2 R m2 L m2", coins: 3 },
  { l: 1, c: 4, title: "Herradura", hint: "Gira a la derecha dos veces y luego a la izquierda dos veces.", allowed: SEQ, path: "m5 R m4 R m5 L m2 L m3", coins: 4 },
  { l: 1, c: 5, title: "El gran camino", hint: "Un camino larguísimo. Ve tramo por tramo y no pierdas la cuenta.", allowed: SEQ, path: "m4 R m2 R m4 L m2 L m4 R m2 R m4", coins: 5 },

  // ── 12 · Bucles avanzados: bucles dentro de bucles ───────────────────────────────────
  { l: 2, c: 1, title: "Bucle doble", hint: "Dentro del «Repetir» grande hay dos tramos de 3 pasos.", allowed: LOOP, path: [repeat(3, repeat(3, move()), right(), move(), right(), repeat(3, move()), left(), move(), left())], coins: 3 },
  { l: 2, c: 2, title: "Escalera doble", hint: "Repite cuatro veces: dos pasos, giro, un paso, giro.", allowed: LOOP, path: [repeat(4, repeat(2, move()), right(), move(), left())], coins: 3 },
  { l: 2, c: 3, title: "Ondas", hint: "Un «Repetir» pequeño dentro de otro más grande.", allowed: LOOP, path: [repeat(3, repeat(2, move(), right(), move(), left()), move())], coins: 4 },
  { l: 2, c: 4, title: "Tres pisos", hint: "Cada piso son dos tramos largos y dos cortos.", allowed: LOOP, path: [repeat(3, repeat(5, move()), right(), repeat(2, move()), right(), repeat(5, move()), left(), repeat(2, move()), left())], coins: 4 },
  { l: 2, c: 5, title: "Bucles de bucles", hint: "Tres niveles de «Repetir»: la escalera se repite dos veces.", allowed: LOOP, path: [repeat(2, repeat(3, repeat(2, move()), right(), repeat(2, move()), left()), right(), move(), left())], coins: 5 },

  // ── 13 · Condicionales avanzados: un solo programa, cualquier camino ────────────────
  { l: 3, c: 1, title: "Espiral hacia dentro", hint: "Repite: si hay camino libre avanza, si hay pared gira a la derecha. ¿Cuántas veces hace falta?", allowed: LOGIC, path: "m6 R m6 R m6 R m4 R m4 R m2 R m2", sol: walkR, coins: 2 },
  { l: 3, c: 2, title: "Hacia el otro lado", hint: "Mismo plan, pero ahora las esquinas son a la izquierda.", allowed: LOGIC, path: "m4 L m3 L m4 L m1 L m2", sol: walkL, coins: 3 },
  { l: 3, c: 3, title: "Zigzag", hint: "Las esquinas cambian de lado. Gira a la derecha; si sigue la pared, gira dos veces a la izquierda.", allowed: LOGIC, path: "m3 R m2 L m3 R m2 L m3 R m2 L m3", sol: walkBoth, coins: 3 },
  { l: 3, c: 4, title: "Esquinas mezcladas", hint: "El mismo programa del zigzag funciona aquí. Recoge las monedas.", allowed: LOGIC, path: "m4 L m2 R m3 R m2 L m4 L m2 R m3", sol: walkBoth, coins: 4 },
  { l: 3, c: 5, title: "El gran laberinto", hint: "Un solo programa para un camino enorme. Piensa cuántas repeticiones necesitas.", allowed: LOGIC, path: "m4 R m3 L m5 L m2 R m4 R m3 L m4 R m2 L m3", sol: walkBoth, coins: 5 },

  // ── 14 · Funciones avanzadas: bloques que llaman a otros bloques ────────────────────
  { l: 4, c: 1, title: "Escalera con A", hint: "Crea A: avanzar, derecha, avanzar, izquierda. Úsalo cinco veces.", allowed: FUNCS, path: [def("A", move(), right(), move(), left()), call("A"), call("A"), call("A"), call("A"), call("A")], coins: 3 },
  { l: 4, c: 2, title: "A dentro de B", hint: "B llama a A dos veces; así puedes subir muy rápido.", allowed: FUNCS, path: [def("A", move(), move(), move()), def("B", call("A"), right(), call("A"), left()), call("B"), call("B"), call("B")], coins: 4 },
  { l: 4, c: 3, title: "Cuatro esquinas", hint: "B es A, A, giro: úsalo y termina con un tramo recto.", allowed: FUNCS, path: [def("A", move(), move()), def("B", call("A"), call("A"), right(), call("A"), left()), call("B"), call("B"), call("A")], coins: 4 },
  { l: 4, c: 4, title: "Mini y gran bloque", hint: "A hace una «S»; B la hace tres veces seguidas.", allowed: FUNCS, path: [def("A", move(), right(), move(), left()), def("B", call("A"), call("A"), call("A")), call("B"), right(), call("B")], coins: 4 },
  { l: 4, c: 5, title: "La gran obra", hint: "Combina A y B para recorrer todo el mapa con pocos bloques.", allowed: FUNCS, path: [def("A", move(), move(), right()), def("B", call("A"), move(), left(), call("A")), call("B"), call("B"), call("B"), call("A")], coins: 5 },

  // ── 15 · Variables avanzadas: la variable cambia sola ───────────────────────────────
  { l: 5, c: 1, title: "Espiral que crece", hint: "Empieza en 2 pasos y sube 1 después de cada giro.", allowed: VARS, path: [setv(2), repeat(6, movev(), right(), addv("+", 1))], coins: 4 },
  { l: 5, c: 2, title: "Duplicar", hint: "1, 2, 4, 8: multiplica por 2 después de cada giro.", allowed: VARS, path: [setv(1), repeat(4, movev(), right(), addv("*", 2))], coins: 3 },
  { l: 5, c: 3, title: "Espiral que se encoge", hint: "Empieza en 8 y réstale 2 después de cada giro.", allowed: VARS, path: [setv(8), repeat(4, movev(), right(), addv("-", 2))], coins: 3 },
  { l: 5, c: 4, title: "Dos giros por vuelta", hint: "Avanza «pasos», gira, avanza «pasos» otra vez, gira, y sube la variable.", allowed: VARS, path: [setv(1), repeat(4, movev(), right(), movev(), left(), addv("+", 1))], coins: 4 },
  { l: 5, c: 5, title: "Mezcla de operadores", hint: "Primero suma, luego multiplica: la variable crece cada vez más rápido.", allowed: VARS, path: [setv(1), repeat(3, movev(), right(), addv("+", 1), movev(), right(), addv("*", 2))], coins: 5 },

  // ── 16 · Listas avanzadas ──────────────────────────────────────────────────────────
  { l: 6, c: 1, title: "Lista de giros larga", hint: "Ocho giros alternados con «avanzar, avanzar, girar».", allowed: LISTS, path: [list("R", "L", "R", "L", "R", "L", "R", "L"), each(move(), move(), turn())], coins: 3 },
  { l: 6, c: 2, title: "Giros que se saltan", hint: "El giro «recto» no gira: úsalo para hacer tramos más largos.", allowed: LISTS, path: [list("S", "S", "R", "S", "S", "L", "S", "S", "R"), each(move(), turn())], coins: 3 },
  { l: 6, c: 3, title: "Tres pasos por giro", hint: "Dentro de «Por cada giro» van tres «Avanzar» y el giro.", allowed: LISTS, path: [list("R", "R", "L", "L", "R", "R", "L", "L"), each(move(), move(), move(), turn())], coins: 4 },
  { l: 6, c: 4, title: "Lista y bucle", hint: "Recorre la lista de giros tres veces con un «Repetir».", allowed: LISTS, path: [list("R", "L"), repeat(4, each(move(), move(), turn()))], coins: 4 },
  { l: 6, c: 5, title: "Camino cifrado", hint: "Doce giros: R, L, L, R, R, L, R, R, L, L, R, L. Cada uno con dos pasos.", allowed: LISTS, path: [list("R", "L", "L", "R", "R", "L", "R", "R", "L", "L", "R", "L"), each(move(), move(), turn())], coins: 5 },

  // ── 17 · Lógica avanzada: «mientras» y caminos largos ───────────────────────────────
  { l: 7, c: 1, title: "Espiral gigante", hint: "Un solo carril con muchas esquinas a la derecha.", allowed: WHILES, path: "m6 R m6 R m6 R m4 R m4 R m2 R m2", sol: followR, coins: 3 },
  { l: 7, c: 2, title: "Esquinas a la izquierda", hint: "El método de siempre, pero girando a la izquierda. Recoge las monedas.", allowed: WHILES, path: "m4 L m3 L m5 L m2 L m3", sol: followL, coins: 4 },
  { l: 7, c: 3, title: "Zigzag largo", hint: "Gira a la derecha; si hay pared delante, gira dos veces a la izquierda.", allowed: WHILES, path: "m3 R m2 L m3 R m2 L m3 R m2 L m3 R m2 L m3", sol: followBoth, coins: 4 },
  { l: 7, c: 4, title: "La serpiente", hint: "Vueltas en U hacia los dos lados.", allowed: WHILES, path: "m4 R m2 R m4 L m2 L m4 R m2 R m4 L m2 L m4", sol: followBoth, coins: 5 },
  { l: 7, c: 5, title: "Camino imposible", hint: "El camino más largo de todos. Un solo programa de 7 bloques lo resuelve.", allowed: WHILES, path: "m5 R m3 L m4 L m2 R m6 R m3 L m3 R m2 L m5", sol: followBoth, coins: 6 },

  // ── 18 · Bloques a texto, avanzado: arregla el código (con pruebas) ────────────────
  {
    l: 8, c: 1, title: "El while al revés", hint: "El bucle de fuera debe seguir mientras la meta NO esté delante. Falta un «no».", allowed: ALL, code: true,
    path: "m6 R m6 R m6 R m4 R m4 R m2 R m2", sol: followR, coins: 3, tests: ["m4 R m4 R m4 R m2 R m2", "m8 R m4"],
    starter: {
      js: "while (esLaMeta()) {\n  while (hayCaminoLibre()) {\n    avanzar();\n  }\n  girarDerecha();\n}\n",
      python: "while es_la_meta():\n    while hay_camino_libre():\n        avanzar()\n    girar_derecha()\n",
    },
  },
  {
    l: 8, c: 2, title: "Gira para el otro lado", hint: "Este camino gira a la izquierda. Revisa también el nombre de las funciones.", allowed: ALL, code: true,
    path: "m4 L m3 L m5 L m2 L m3", sol: followL, coins: 4, tests: ["m4 L m4 L m4 L m2 L m2", "m6 L m2"],
    starter: {
      js: "while (!esLaMeta()) {\n  while (hayCaminoLibre()) {\n    avanzar();\n  }\n  girarDerecha();\n}\n",
      python: "while not es_la_meta():\n    while hay_camino_libre():\n        avanzar()\n    girar_derecha()\n",
    },
  },
  {
    l: 8, c: 3, title: "Falta la vuelta", hint: "Cuando choca con otra pared, el robot debe girar dos veces a la izquierda. Completa el «if».", allowed: ALL, code: true,
    path: "m3 R m2 L m3 R m2 L m3 R m2 L m3 R m2 L m3", sol: followBoth, coins: 4, tests: ["m4 R m1 L m2 R m1 L m3", "m2 R m3 L m2 R m3 L m2"],
    starter: {
      js: "while (!esLaMeta()) {\n  while (hayCaminoLibre()) {\n    avanzar();\n  }\n  girarDerecha();\n  if (hayPared()) {\n    girarIzquierda();\n  }\n}\n",
      python: "while not es_la_meta():\n    while hay_camino_libre():\n        avanzar()\n    girar_derecha()\n    if hay_pared():\n        girar_izquierda()\n",
    },
  },
  {
    l: 8, c: 4, title: "Una condición equivocada", hint: "El robot debe avanzar mientras HAYA camino libre, no mientras haya pared. Hay dos errores.", allowed: ALL, code: true,
    path: "m4 R m2 R m4 L m2 L m4 R m2 R m4 L m2 L m4", sol: followBoth, coins: 5, tests: ["m3 R m2 R m3 L m2 L m3", "m5 R m2 R m5"],
    starter: {
      js: "while (!esLaMeta()) {\n  while (hayPared()) {\n    avanzar();\n  }\n  girarDerecha();\n  if (hayPared()) {\n    girarDerecha();\n    girarDerecha();\n  }\n}\n",
      python: "while not es_la_meta():\n    while hay_pared():\n        avanzar()\n    girar_derecha()\n    if hay_pared():\n        girar_derecha()\n        girar_derecha()\n",
    },
  },
  {
    l: 8, c: 5, title: "La espiral rota", hint: "La variable debe crecer, no encogerse. Y el bucle debe repetirse las veces suficientes.", allowed: ALL, code: true,
    path: [setv(1), repeat(6, movev(), right(), addv("+", 1))], coins: 4,
    starter: {
      js: "let pasos = 1;\nfor (let i = 0; i < 2; i++) {\n  avanzar(pasos);\n  girarDerecha();\n  pasos = pasos - 1;\n}\n",
      python: "pasos = 1\nfor _ in range(2):\n    avanzar(pasos)\n    girar_derecha()\n    pasos = pasos - 1\n",
    },
  },

  // ── 19 · JavaScript y Python, avanzado: escríbelo tú, con pruebas ───────────────────
  { l: 9, c: 1, title: "Cualquier espiral", hint: "Tu programa se prueba en otras espirales. Gira siempre a la derecha.", allowed: ALL, code: true, path: "m6 R m6 R m6 R m4 R m4 R m2 R m2", sol: followR, coins: 3, tests: ["m4 R m4 R m4 R m2 R m2", "m8 R m8 R m8 R m6 R m6 R m4 R m4"] },
  { l: 9, c: 2, title: "Siempre a la izquierda", hint: "El mismo método, hacia el otro lado.", allowed: ALL, code: true, path: "m4 L m3 L m5 L m2 L m3", sol: followL, coins: 4, tests: ["m6 L m4 L m6 L m2 L m3", "m7 L m3"] },
  { l: 9, c: 3, title: "Un código, todos los caminos", hint: "Gira a la derecha; si hay pared delante, gira dos veces a la izquierda.", allowed: ALL, code: true, path: "m3 R m2 L m3 R m2 L m3 R m2 L m3 R m2 L m3", sol: followBoth, coins: 4, tests: ["m5 R m3 L m4 R m1 L m2", "m2 L m4 R m3 L m1 R m3"] },
  { l: 9, c: 4, title: "Doble o nada", hint: "Variables: empieza en 1 y duplica después de cada giro. Para en la meta.", allowed: ALL, code: true, path: [setv(1), repeat(5, movev(), right(), addv("*", 2))], coins: 3, tests: ["m1 R m2", "m1 R m2 R m4 R m8"] },
  { l: 9, c: 5, title: "Espiral que crece", hint: "Variable: empieza en 1 y suma 1 después de cada giro. Se detiene sola al llegar a la meta.", allowed: ALL, code: true, path: [setv(1), repeat(8, movev(), right(), addv("+", 1))], coins: 5, tests: ["m1 R m2 R m3 R m4", "m1 R m2 R m3 R m4 R m5 R m6"] },

  // ── 20 · Proyectos avanzados: los retos más grandes ────────────────────────────────
  { l: 10, c: 1, title: "Mensajero espacial", hint: "Un recorrido largo con 6 monedas. Tu método sirve para cualquiera de las tres pruebas.", allowed: ALL, code: true, path: "m5 R m3 L m4 L m2 R m6 R m3 L m3 R m2 L m5", sol: followBoth, coins: 6, tests: ["m3 R m2 L m2 R m3 L m4", "m6 R m3 R m5 L m2 L m2"] },
  { l: 10, c: 2, title: "Escalera sin fin", hint: "No sabes cuántos escalones tiene: usa un bucle largo.", allowed: ALL, code: true, path: [repeat(9, move(), right(), move(), left())], coins: 6, tests: ["m1 R m1 L m1 R m1 L m1 R m1 L m1 R m1", "m1 R m1 L m1 R m1"] },
  { l: 10, c: 3, title: "Zigzag con monedas", hint: "Vueltas a los dos lados con muchas monedas.", allowed: ALL, code: true, path: "m4 R m2 L m4 L m2 R m4 R m2 L m4 L m2 R m4", sol: followBoth, coins: 7, tests: ["m5 L m3 R m5", "m2 R m2 R m6 L m2 L m3 R m2"] },
  { l: 10, c: 4, title: "El mapa del tesoro", hint: "Un camino larguísimo con muchas esquinas. Tres pruebas distintas.", allowed: ALL, code: true, path: "m6 R m4 L m5 R m3 R m4 L m3 L m7 R m2 R m5 L m3", sol: followBoth, coins: 8, tests: ["m5 R m3 L m4 L m2", "m8 L m4 L m1 R m3 R m1 L m2", "m6 L m2 L m6"] },
  { l: 10, c: 5, title: "El gran final", hint: "El desafío definitivo de CodeKid: un solo programa para tres caminos enormes.", allowed: ALL, code: true, path: "m7 R m4 L m5 L m3 R m6 R m4 R m5 L m3 L m6 R m2 R m4 L m5", sol: followBoth, coins: 9, tests: ["m4 R m3 R m5 L m2 L m6 R m3", "m9 L m2 R m4 R m3 L m2 R m5 L m2", "m3 R m1 R m3 L m1 L m3 R m1 R m3"] },
];

export const ADVANCED: Level[] = SPECS.map((s) => {
  try {
    return build(s);
  } catch (e) {
    throw new Error(`Reto avanzado ${s.l + ADVANCED_OFFSET}-${s.c}: ${(e as Error).message}`);
  }
});
