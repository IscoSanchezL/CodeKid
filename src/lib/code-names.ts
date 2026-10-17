import type { AtomKind } from "@/engine/types";

/**
 * Nombres de las instrucciones del lenguaje de los retos de código.
 * El juego entiende SIEMPRE los dos idiomas (español e inglés); `api` solo decide cuál se muestra
 * (código generado, atajos del editor, mensajes de error y código inicial).
 */
export type Api = "es" | "en";
export type CodeLang = "js" | "python";

export type Names = {
  move: string;
  left: string;
  right: string;
  turn: string;
  atoms: Record<AtomKind, string>;
  /** Nombre de los bloques propios: «bloqueA» / «blockA» (JS) o «bloque_a» / «block_a» (Python). */
  block: (letter: "A" | "B") => string;
  steps: string;
  turns: string;
  item: string;
  words: { L: string; R: string; S: string };
};

export const NAMES: Record<CodeLang, Record<Api, Names>> = {
  js: {
    es: {
      move: "avanzar",
      left: "girarIzquierda",
      right: "girarDerecha",
      turn: "girar",
      atoms: { wall: "hayPared", free: "hayCaminoLibre", coin: "hayMoneda", goal: "esLaMeta" },
      block: (l) => `bloque${l}`,
      steps: "pasos",
      turns: "giros",
      item: "giro",
      words: { L: "izquierda", R: "derecha", S: "recto" },
    },
    en: {
      move: "move",
      left: "turnLeft",
      right: "turnRight",
      turn: "turn",
      atoms: { wall: "isWall", free: "isPathFree", coin: "hasCoin", goal: "isGoal" },
      block: (l) => `block${l}`,
      steps: "steps",
      turns: "turns",
      item: "dir",
      words: { L: "left", R: "right", S: "straight" },
    },
  },
  python: {
    es: {
      move: "avanzar",
      left: "girar_izquierda",
      right: "girar_derecha",
      turn: "girar",
      atoms: { wall: "hay_pared", free: "hay_camino_libre", coin: "hay_moneda", goal: "es_la_meta" },
      block: (l) => `bloque_${l.toLowerCase()}`,
      steps: "pasos",
      turns: "giros",
      item: "giro",
      words: { L: "izquierda", R: "derecha", S: "recto" },
    },
    en: {
      move: "move",
      left: "turn_left",
      right: "turn_right",
      turn: "turn",
      atoms: { wall: "is_wall", free: "is_path_free", coin: "has_coin", goal: "is_goal" },
      block: (l) => `block_${l.toLowerCase()}`,
      steps: "steps",
      turns: "turns",
      item: "dir",
      words: { L: "left", R: "right", S: "straight" },
    },
  },
};

/** Palabras del inglés → forma canónica (español) que usa el analizador internamente. */
export function canonicalMap(lang: CodeLang): Record<string, string> {
  const es = NAMES[lang].es;
  const en = NAMES[lang].en;
  const map: Record<string, string> = {
    [en.move]: es.move,
    [en.left]: es.left,
    [en.right]: es.right,
    [en.turn]: es.turn,
    [en.steps]: es.steps,
    [en.turns]: es.turns,
    [en.item]: es.item,
    [en.block("A")]: es.block("A"),
    [en.block("B")]: es.block("B"),
  };
  (Object.keys(en.atoms) as AtomKind[]).forEach((k) => {
    map[en.atoms[k]] = es.atoms[k];
  });
  return map;
}

/** Palabras de giro en inglés → español («left» → «izquierda»). */
export const WORD_MAP: Record<string, string> = {
  left: "izquierda",
  right: "derecha",
  straight: "recto",
};

/** Equivalencias del código inicial de los retos (nombres, faltas de ortografía a propósito y comentarios). */
const STARTER_IDENT: Record<CodeLang, Record<string, string>> = {
  js: {
    avanzar: "move",
    girarDerecha: "turnRight",
    girarIzquierda: "turnLeft",
    hayPared: "isWall",
    hayCaminoLibre: "isPathFree",
    esLaMeta: "isGoal",
    hayMoneda: "hasCoin",
    bloqueA: "blockA",
    bloqueB: "blockB",
    pasos: "steps",
    // errores de ortografía a propósito (reto «Una letra mal escrita»)
    avansar: "mvoe",
    girarIzquerda: "turnLefft",
  },
  python: {
    avanzar: "move",
    girar_derecha: "turn_right",
    girar_izquierda: "turn_left",
    hay_pared: "is_wall",
    hay_camino_libre: "is_path_free",
    es_la_meta: "is_goal",
    hay_moneda: "has_coin",
    bloque_a: "block_a",
    bloque_b: "block_b",
    pasos: "steps",
    avansar: "mvoe",
    girar_izquerda: "turn_lefft",
  },
};

const STARTER_COMMENT: Record<string, string> = {
  "El robot debe llegar a la bandera": "The robot must reach the flag",
  "Escribe tu programa aquí": "Write your program here",
  "Falta usar el bloque": "The block still needs to be used",
  "¿Qué falta aquí?": "What is missing here?",
};

/** Código inicial de un reto en el idioma pedido (el original está en español). */
export function starterIn(code: string, lang: CodeLang, api: Api): string {
  if (api === "es") return code;
  const idents = STARTER_IDENT[lang];
  return code
    .split("\n")
    .map((line) => {
      const m = /^(.*?)(\/\/|#)\s*(.*)$/.exec(line);
      const body = m ? m[1] : line;
      const swapped = body.replace(/[A-Za-z_]\w*/g, (w) => idents[w] ?? w);
      return m ? `${swapped}${m[2]} ${STARTER_COMMENT[m[3]] ?? m[3]}` : swapped;
    })
    .join("\n");
}
