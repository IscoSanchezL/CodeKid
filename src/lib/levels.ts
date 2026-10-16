export type Level = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  free: boolean;
};

/** Ruta de aprendizaje: 10 niveles. Los niveles 1-3 son gratuitos. */
export const LEVELS: Level[] = [
  { id: 1, slug: "secuencias", title: "Secuencias", summary: "Da órdenes en el orden correcto.", free: true },
  { id: 2, slug: "bucles", title: "Bucles", summary: "Repite sin copiar y pegar.", free: true },
  { id: 3, slug: "condicionales", title: "Condicionales", summary: "Toma decisiones con si / si no.", free: true },
  { id: 4, slug: "funciones", title: "Funciones", summary: "Crea tus propios bloques.", free: false },
  { id: 5, slug: "variables", title: "Variables y operadores", summary: "Guarda datos y haz cuentas.", free: false },
  { id: 6, slug: "listas", title: "Listas y datos", summary: "Recorre, busca y ordena.", free: false },
  { id: 7, slug: "logica", title: "Lógica avanzada", summary: "and, or, not y while.", free: false },
  { id: 8, slug: "bloques-a-texto", title: "De bloques a texto", summary: "Tu programa, en código.", free: false },
  { id: 9, slug: "codigo-real", title: "JavaScript y Python", summary: "Retos con tests automáticos.", free: false },
  { id: 10, slug: "proyectos", title: "Proyectos finales", summary: "Crea y publica tu juego.", free: false },
];

/** Fase 2: el nivel avanzado del planeta N es el nivel N + 10. */
export const ADV_OFFSET = 10;
export const isAdvanced = (id: number) => id > ADV_OFFSET;
/** Planeta de origen de un nivel (el planeta mismo, o el planeta al que pertenece el modo avanzado). */
export const planetOf = (id: number) => (isAdvanced(id) ? id - ADV_OFFSET : id);

/** Modo avanzado de cada planeta (niveles 11–20): mismos temas, retos más difíciles. */
export const ADV_LEVELS: Level[] = LEVELS.map((l) => ({
  id: l.id + ADV_OFFSET,
  slug: `${l.slug}-avanzado`,
  title: `${l.title} · Avanzado`,
  summary: `Retos más difíciles de «${l.title}».`,
  free: false,
}));

/** Datos de un nivel, básico o avanzado. */
export const levelMeta = (id: number): Level | undefined =>
  LEVELS.find((l) => l.id === id) ?? ADV_LEVELS.find((l) => l.id === id);
