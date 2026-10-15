import type { AtomKind, Block, Level, Turn } from "./types";

// Atajos para escribir las soluciones de referencia
let n = 0;
const id = () => `s${(n += 1)}`;
const move = (): Block => ({ id: id(), type: "move" });
const left = (): Block => ({ id: id(), type: "left" });
const right = (): Block => ({ id: id(), type: "right" });
const repeat = (times: number, ...body: Block[]): Block => ({ id: id(), type: "repeat", times, body });
const ifWall = (...body: Block[]): Block => ({ id: id(), type: "if", cond: "wall", body });
const ifFree = (...body: Block[]): Block => ({ id: id(), type: "if", cond: "free", body });
const def = (name: "A" | "B", ...body: Block[]): Block => ({ id: id(), type: "def", name, body });
const call = (name: "A" | "B"): Block => ({ id: id(), type: "call", name });
const setv = (value: number): Block => ({ id: id(), type: "setvar", value });
const addv = (op: "+" | "-" | "*", value: number): Block => ({ id: id(), type: "addvar", op, value });
const movev = (): Block => ({ id: id(), type: "movevar" });
const list = (...items: Turn[]): Block => ({ id: id(), type: "list", items });
const each = (...body: Block[]): Block => ({ id: id(), type: "foreach", body });
const turn = (): Block => ({ id: id(), type: "turnitem" });
const whileC = (kind: AtomKind, not: boolean, ...body: Block[]): Block => ({ id: id(), type: "while", cond: { a: { kind, not } }, body });
const ifC = (kind: AtomKind, not: boolean, ...body: Block[]): Block => ({ id: id(), type: "if", cond: { a: { kind, not } }, body });
/** Patrón de «camina y gira al chocar»: si hay camino, avanza; si hay pared, gira. */
const walk = (turn: () => Block): Block[] => [ifFree(move()), ifWall(turn())];

const SEQ: Level["allowed"] = ["move", "left", "right"];
const LOOP: Level["allowed"] = ["move", "left", "right", "repeat"];
const LOGIC: Level["allowed"] = ["move", "left", "right", "repeat", "if"];
const FUNCS: Level["allowed"] = ["move", "left", "right", "def", "call"];
const VARS: Level["allowed"] = ["move", "left", "right", "repeat", "setvar", "addvar", "movevar"];
const LISTS: Level["allowed"] = ["move", "left", "right", "repeat", "list", "foreach", "turnitem"];
const WHILES: Level["allowed"] = ["move", "left", "right", "if", "while"];
/** Retos de código: el programa se escribe en texto y puede usar cualquier bloque. */
const ALL: Level["allowed"] = ["move", "left", "right", "repeat", "if", "while", "def", "call", "setvar", "addvar", "movevar", "list", "foreach", "turnitem"];
/** Recorre un camino de un solo carril: avanza mientras haya camino y gira; para cuando la meta está delante. */
const follow = (...turns: Block[]): Block => whileC("goal", true, whileC("free", false, move()), ...turns);

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

  // ── Nivel 3 · Condicionales ────────────────────────────────────────────
  {
    level: 3, challenge: 1, title: "Si hay pared", par: 5, startDir: 1, allowed: LOGIC,
    hint: "Repite: «si hay camino libre» avanza y «si hay pared» gira a la derecha.",
    rows: ["S...", "###.", "###G"],
    solution: [repeat(5, ...walk(right))],
  },
  {
    level: 3, challenge: 2, title: "Dos esquinas", par: 5, startDir: 1, allowed: LOGIC,
    hint: "El mismo patrón sirve para todas las esquinas. Repite 9 veces.",
    rows: ["S....", "##G#.", "##..."],
    solution: [repeat(9, ...walk(right))],
  },
  {
    level: 3, challenge: 3, title: "Hacia la izquierda", par: 5, startDir: 1, allowed: LOGIC,
    hint: "Ahora las esquinas giran a la izquierda: cambia el bloque de giro.",
    rows: ["##...", "##G#*", "S.*.."],
    solution: [repeat(9, ...walk(left))],
  },
  {
    level: 3, challenge: 4, title: "La gran vuelta", par: 6, startDir: 1, allowed: LOGIC,
    hint: "Necesitas 13 vueltas: pon un «Repetir» dentro de otro (2 × 7).",
    rows: ["S....", "G###.", ".###.", "....."],
    solution: [repeat(2, repeat(7, ...walk(right)))],
  },
  {
    level: 3, challenge: 5, title: "Vuelta con monedas", par: 6, startDir: 1, allowed: LOGIC,
    hint: "Gira a la izquierda y recoge las dos monedas por el camino.",
    rows: ["..*..", ".###.", "G###*", "S...."],
    solution: [repeat(2, repeat(7, ...walk(left)))],
  },

  // ── Nivel 4 · Funciones ────────────────────────────────────────────────
  {
    level: 4, challenge: 1, title: "Mi primer bloque", par: 10, startDir: 1, allowed: FUNCS,
    hint: "Crea el bloque A con dos pasos y úsalo cada vez que lo necesites.",
    rows: ["S..##", "##.##", "##...", "####.", "####G"],
    solution: [def("A", move(), move()), call("A"), right(), call("A"), left(), call("A"), right(), call("A")],
  },
  {
    level: 4, challenge: 2, title: "Escalón", par: 9, startDir: 1, allowed: FUNCS,
    hint: "Un escalón es avanzar, derecha, avanzar, izquierda. Hazlo un bloque y úsalo 4 veces.",
    rows: ["S.###", "#..##", "##..#", "###..", "####G"],
    solution: [def("A", move(), right(), move(), left()), call("A"), call("A"), call("A"), call("A")],
  },
  {
    level: 4, challenge: 3, title: "Bloques con bloques", par: 11, startDir: 1, allowed: FUNCS,
    hint: "Un bloque puede usar a otro: A es dos pasos y un giro; B es A dos veces.",
    rows: ["#S..", "###.", "##..", "##.#", "G..#"],
    solution: [def("A", move(), move(), right()), def("B", call("A"), call("A")), call("B"), move(), left(), call("B")],
  },
  {
    level: 4, challenge: 4, title: "Escalones con monedas", par: 11, startDir: 1, allowed: FUNCS,
    hint: "Tres escalones con el bloque A y después un tramo recto.",
    rows: ["S.##", "#.*#", "##..", "###*", "###.", "###G"],
    solution: [def("A", move(), right(), move(), left()), call("A"), call("A"), call("A"), right(), move(), move()],
  },
  {
    level: 4, challenge: 5, title: "Gran recorrido", par: 12, startDir: 1, allowed: FUNCS,
    hint: "A son tres pasos; B es A, giro derecha, A y giro izquierda. Usa B tres veces.",
    rows: ["S...######", "###.######", "###.######", "###....###", "######.###", "######.###", "######....", "#########.", "#########.", "#########G"],
    solution: [def("A", move(), move(), move()), def("B", call("A"), right(), call("A"), left()), call("B"), call("B"), call("B")],
  },

  // ── Nivel 5 · Variables y operadores ───────────────────────────────────
  {
    level: 5, challenge: 1, title: "Mi primera variable", par: 6, startDir: 1, allowed: VARS,
    hint: "Pon «pasos = 3» y usa «Avanzar pasos» tres veces, girando entre tramos.",
    rows: ["S...###", "###.###", "###.###", "###...G"],
    solution: [setv(3), movev(), right(), movev(), left(), movev()],
  },
  {
    level: 5, challenge: 2, title: "Una espiral", par: 5, startDir: 1, allowed: VARS,
    hint: "Empieza con pasos = 1 y súmale 1 después de cada giro. Repite 4 veces.",
    rows: ["G###", ".###", ".#S.", ".##.", "...."],
    solution: [setv(1), repeat(4, movev(), right(), addv("+", 1))],
  },
  {
    level: 5, challenge: 3, title: "Doblar", par: 5, startDir: 1, allowed: VARS,
    hint: "Aquí los pasos se multiplican: 1, 2, 4. Usa × 2 después de cada giro.",
    rows: ["###S.", "####.", "G...."],
    solution: [setv(1), repeat(3, movev(), right(), addv("*", 2))],
  },
  {
    level: 5, challenge: 4, title: "Restar", par: 5, startDir: 1, allowed: VARS,
    hint: "Empieza con pasos = 6 y réstale 2 después de cada giro a la izquierda.",
    rows: ["####G..", "######.", "######.", "######.", "S......"],
    solution: [setv(6), repeat(3, movev(), left(), addv("-", 2))],
  },
  {
    level: 5, challenge: 5, title: "Espiral grande", par: 5, startDir: 1, allowed: VARS,
    hint: "La misma espiral del reto 2, pero seis vueltas y con monedas.",
    rows: ["..*...", ".####.", "*#S*#*", ".##.#.", "..*.#.", "#####.", "#####G"],
    solution: [setv(1), repeat(6, movev(), right(), addv("+", 1))],
  },

  // ── Nivel 6 · Listas y datos ───────────────────────────────────────────
  {
    level: 6, challenge: 1, title: "Mi primera lista", par: 4, startDir: 1, allowed: LISTS,
    hint: "Haz una lista de giros: derecha, izquierda, derecha… y recórrela con «Por cada giro».",
    rows: ["S.##", "#..#", "##..", "###G"],
    solution: [list("R", "L", "R", "L", "R", "L"), each(move(), turn())],
  },
  {
    level: 6, challenge: 2, title: "Lista larga", par: 4, startDir: 1, allowed: LISTS,
    hint: "Ocho giros: dos a la derecha, dos a la izquierda, y otra vez.",
    rows: ["S.", "..", "..", "..", "G#"],
    solution: [list("R", "R", "L", "L", "R", "R", "L", "L"), each(move(), turn())],
  },
  {
    level: 6, challenge: 3, title: "Dos pasos por giro", par: 5, startDir: 1, allowed: LISTS,
    hint: "Dentro de «Por cada giro» pon dos «Avanzar» y luego «Girar según el giro». El giro «recto» no gira.",
    rows: ["S....", "####.", "####.", "####.", "G...."],
    solution: [list("S", "R", "S", "R", "S", "R"), each(move(), move(), turn())],
  },
  {
    level: 6, challenge: 4, title: "Zigzag doble", par: 5, startDir: 1, allowed: LISTS,
    hint: "Cuatro giros: derecha, derecha, izquierda, izquierda.",
    rows: ["S..", "##.", "...", ".##", "G##"],
    solution: [list("R", "R", "L", "L"), each(move(), move(), turn())],
  },
  {
    level: 6, challenge: 5, title: "Camino secreto", par: 5, startDir: 1, allowed: LISTS,
    hint: "Ocho giros: R, L, L, R, R, L, R, R. Recoge las dos monedas.",
    rows: ["S..#...##", "##*#.#.##", "##..*#...", "########.", "########G"],
    solution: [list("R", "L", "L", "R", "R", "L", "R", "R"), each(move(), move(), turn())],
  },

  // ── Nivel 7 · Lógica avanzada ──────────────────────────────────────────
  {
    level: 7, challenge: 1, title: "Mientras…", par: 2, startDir: 1, allowed: WHILES,
    hint: "«Mientras hay camino libre» avanza. No hace falta contar los pasos.",
    rows: ["S........G"],
    solution: [whileC("free", false, move())],
  },
  {
    level: 7, challenge: 2, title: "Hasta la pared", par: 4, startDir: 1, allowed: WHILES,
    hint: "Mientras la meta no esté delante: avanza mientras haya camino y gira a la derecha.",
    rows: ["S.....", "#G###.", "#.###.", "#....."],
    solution: [whileC("goal", true, whileC("free", false, move()), right())],
  },
  {
    level: 7, challenge: 3, title: "Hacia el otro lado", par: 4, startDir: 1, allowed: WHILES,
    hint: "El mismo plan, pero las esquinas giran a la izquierda. Recoge las monedas.",
    rows: ["...*..", ".####.", "G####.", "#S...*"],
    solution: [whileC("goal", true, whileC("free", false, move()), left())],
  },
  {
    level: 7, challenge: 4, title: "Camino mixto", par: 7, startDir: 1, allowed: WHILES,
    hint: "Gira a la derecha; si hay pared delante, gira dos veces a la izquierda (así sales por el otro lado).",
    rows: ["S....##....", "####.##.##.", "####....##G"],
    solution: [whileC("goal", true, whileC("free", false, move()), right(), ifC("wall", false, left(), left()))],
  },
  {
    level: 7, challenge: 5, title: "El laberinto", par: 7, startDir: 1, allowed: WHILES,
    hint: "Usa el mismo método del reto anterior. Con él se resuelve cualquier camino de un solo carril.",
    rows: ["###..*######", "###.#.######", "###.#.##...G", "S..*#.##.###", "#####..*.###"],
    solution: [whileC("goal", true, whileC("free", false, move()), right(), ifC("wall", false, left(), left()))],
  },

  // ── Nivel 8 · De bloques a texto (arregla el código)
  {
    level: 8, challenge: 1, title: "Completa el código", par: 5, startDir: 1, allowed: ALL, mode: "code",
    hint: "Falta recorrer dos casillas más al final: añade dos avanzar().",
    rows: ["S..", "##.", "##G"],
    solution: [move(), move(), right(), move(), move()],
    starter: { js: "// El robot debe llegar a la bandera\navanzar();\navanzar();\ngirarDerecha();\n// ¿Qué falta aquí?\n", python: "# El robot debe llegar a la bandera\navanzar()\navanzar()\ngirar_derecha()\n# ¿Qué falta aquí?\n" },
  },
  {
    level: 8, challenge: 2, title: "Cuenta las vueltas", par: 2, startDir: 1, allowed: ALL, mode: "code",
    hint: "El bucle repite pocas veces. Cuenta las casillas hasta la bandera y cambia el número.",
    rows: ["S....G"],
    solution: [repeat(5, move())],
    starter: { js: "for (let i = 0; i < 2; i++) {\n  avanzar();\n}\n", python: "for _ in range(2):\n    avanzar()\n" },
  },
  {
    level: 8, challenge: 3, title: "Una letra mal escrita", par: 5, startDir: 1, allowed: ALL, mode: "code",
    hint: "Hay dos nombres mal escritos. El mensaje de error te dice cuál es la línea.",
    rows: ["S.##", "#..#", "##..", "###G"],
    solution: [repeat(3, move(), right(), move(), left())],
    starter: { js: "for (let i = 0; i < 3; i++) {\n  avansar();\n  girarDerecha();\n  avanzar();\n  girarIzquerda();\n}\n", python: "for _ in range(3):\n    avansar()\n    girar_derecha()\n    avanzar()\n    girar_izquerda()\n" },
  },
  {
    level: 8, challenge: 4, title: "Tu propio bloque", par: 9, startDir: 1, allowed: ALL, mode: "code",
    hint: "El bloque A ya está creado; falta usarlo cuatro veces: bloqueA();",
    rows: ["S.###", "#..##", "##..#", "###..", "####G"],
    solution: [def("A", move(), right(), move(), left()), call("A"), call("A"), call("A"), call("A")],
    starter: { js: "function bloqueA() {\n  avanzar();\n  girarDerecha();\n  avanzar();\n  girarIzquierda();\n}\n// Falta usar el bloque\n", python: "def bloque_a():\n    avanzar()\n    girar_derecha()\n    avanzar()\n    girar_izquierda()\n# Falta usar el bloque\n" },
  },
  {
    level: 8, challenge: 5, title: "¿Pared o camino?", par: 4, startDir: 1, allowed: ALL, mode: "code",
    hint: "El bucle de dentro debe avanzar mientras haya camino libre, no mientras haya pared.",
    rows: ["S.....", "#G###.", "#.###.", "#....."],
    solution: [whileC("goal", true, whileC("free", false, move()), right())],
    starter: { js: "while (!esLaMeta()) {\n  while (hayPared()) {\n    avanzar();\n  }\n  girarDerecha();\n}\n", python: "while not es_la_meta():\n    while hay_pared():\n        avanzar()\n    girar_derecha()\n" },
  },

  // ── Nivel 9 · JavaScript y Python (escribe tu código; pruebas automáticas)
  {
    level: 9, challenge: 1, title: "Hasta el final", par: 2, startDir: 1, allowed: ALL, mode: "code",
    hint: "Tu programa se prueba también en pasillos más cortos y más largos. No cuentes casillas: usa while.",
    rows: ["S........G"],
    solution: [whileC("free", false, move())],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["S...G"] }, { rows: ["S............G"] }],
  },
  {
    level: 9, challenge: 2, title: "La esquina", par: 4, startDir: 1, allowed: ALL, mode: "code",
    hint: "Avanza mientras haya camino y gira a la derecha, hasta que la meta esté delante.",
    rows: ["S....", "####.", "####.", "####G"],
    solution: [follow(right())],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["S..", "##.", "##.", "##.", "##.", "##G"] }, { rows: ["S......", "######.", "######G"] }],
  },
  {
    level: 9, challenge: 3, title: "Monedas por el camino", par: 4, startDir: 1, allowed: ALL, mode: "code",
    hint: "Ahora los giros son a la izquierda. Las monedas se recogen al pasar.",
    rows: ["#G..", "###.", "###*", "###.", "S.*."],
    solution: [follow(left())],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["##G...", "#####.", "S....."] }, { rows: ["G..", "##.", "##.", "##.", "##.", "##.", "S.."] }],
  },
  {
    level: 9, challenge: 4, title: "Sin saber hacia dónde", par: 7, startDir: 1, allowed: ALL, mode: "code",
    hint: "Gira a la derecha; si hay pared delante, gira dos veces a la izquierda.",
    rows: ["S....##....", "####.##.##.", "####....##G"],
    solution: [follow(right(), ifC("wall", false, left(), left()))],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["###.....", "###.###.", "###.###G", "S...####"] }, { rows: ["S.....", "#####.", "##....", "##.###", "##G###"] }],
  },
  {
    level: 9, challenge: 5, title: "Espiral", par: 5, startDir: 1, allowed: ALL, mode: "code",
    hint: "Empieza con pasos = 1 y súmale 1 después de cada giro. Repite hasta 9 veces: al llegar a la meta el robot se detiene.",
    rows: ["G###", ".###", ".#S.", ".##.", "...."],
    solution: [setv(1), repeat(9, movev(), right(), addv("+", 1))],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["##S.", "###.", "G..."] }, { rows: [".....G", ".#####", ".#S.##", ".##.##", "....##"] }],
  },

  // ── Nivel 10 · Proyectos finales (retos grandes con pruebas)
  {
    level: 10, challenge: 1, title: "Laberinto largo", par: 7, startDir: 1, allowed: ALL, mode: "code",
    hint: "Un solo carril con muchas esquinas hacia los dos lados. Recoge las 4 monedas.",
    rows: ["###..*##########", "###.#.##########", "###.#.##...*####", "S..*#.##.##.####", "#####..*.##....G"],
    solution: [follow(right(), ifC("wall", false, left(), left()))],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["S....#...", "####.#.#.", "####.#.#.", "####...#G"] }, { rows: ["##G", "##.", "##.", "...", ".##", ".##", ".##", ".##", "...", "##.", "##.", "##.", "S.."] }],
  },
  {
    level: 10, challenge: 2, title: "Escalera interminable", par: 5, startDir: 1, allowed: ALL, mode: "code",
    hint: "Es la misma escalera de siempre, pero no sabes cuántos escalones tiene. Repite 9 veces.",
    rows: ["S.####", "#.*###", "##..##", "###*.#", "####..", "#####G"],
    solution: [repeat(9, move(), right(), move(), left())],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["S.##", "#..#", "##..", "###G"] }, { rows: ["S.######", "#..#####", "##..####", "###..###", "####..##", "#####..#", "######..", "#######G"] }],
  },
  {
    level: 10, challenge: 3, title: "Espiral hacia dentro", par: 4, startDir: 1, allowed: ALL, mode: "code",
    hint: "Gira siempre a la derecha. Tu método funciona para cualquier espiral.",
    rows: ["S......", "######.", "##G###.", "##.###.", "##.###.", "##....."],
    solution: [follow(right())],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["S.....", "#####.", "#####.", "#####.", "##G..."] }, { rows: ["S.......", "#######.", "##...G#.", "##.####.", "##.####.", "##.####.", "##......"] }],
  },
  {
    level: 10, challenge: 4, title: "Espiral hacia fuera", par: 5, startDir: 1, allowed: ALL, mode: "code",
    hint: "Empieza con pasos = 1 y aumenta pasos después de cada giro. Recoge las 5 monedas.",
    rows: ["..*...", ".####.", "*#S*#*", ".##.#.", "..*.#.", "#####.", "#####G"],
    solution: [setv(1), repeat(9, movev(), right(), addv("+", 1))],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: [".....G", ".#####", ".#S.##", ".##.##", "....##"] }, { rows: ["G###", ".###", ".#S.", ".##.", "...."] }],
  },
  {
    level: 10, challenge: 5, title: "El gran desafío", par: 7, startDir: 1, allowed: ALL, mode: "code",
    hint: "El camino más largo, con 5 monedas y tres pruebas. Usa lo que sabes de caminos de un solo carril.",
    rows: ["S...*..######", "######.######", "######.######", "####..*######", "####.########", "####.########", "####.########", "####*.....###", "#########.###", "######...*###", "######.######", "######...*...", "############.", "############.", "############G"],
    solution: [follow(right(), ifC("wall", false, left(), left()))],
    starter: { js: "// Escribe tu programa aquí\n", python: "# Escribe tu programa aquí\n" },
    tests: [{ rows: ["############G", "############.", "############.", "#####.....##.", "#####.###.##.", "#####.###....", "S.....#######"] }, { rows: ["S...#", "###.#", "###.#", "###.#", "....#", ".####", ".....", "####.", "#G..."] }, { rows: ["######G#", "######.#", "######.#", "##.....#", "##.#####", "##......", "#######.", "S......."] }],
  },
];

export function getChallenge(level: number, challenge: number): Level | undefined {
  return CHALLENGES.find((c) => c.level === level && c.challenge === challenge);
}

export function challengesOf(level: number): Level[] {
  return CHALLENGES.filter((c) => c.level === level);
}

export const PLAYABLE_LEVELS = [...new Set(CHALLENGES.map((c) => c.level))];
