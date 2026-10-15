/** Informe de avance de una clase: se calcula a partir de las filas de progreso, intentos y perfiles. */

export type Challenge = { level: number; challenge: number; title: string; par: number };
export type StudentLite = { id: string; name: string };
export type ProgressRow = {
  student_id: string;
  level: number;
  challenge: number;
  stars: number;
  attempts: number;
  best_blocks: number | null;
  completed_at: string | null;
};
export type AttemptRow = { student_id: string; level: number; challenge: number; failures: number; last_attempt_at: string };
export type ProfileRow = { id: string; coins: number; streak_days: number; last_play_date: string | null };

export type Cell = { done: boolean; stars: number; plays: number; blocks: number | null; failures: number };
export type StudentReport = {
  id: string;
  name: string;
  coins: number;
  streak: number;
  stars: number;
  maxStars: number;
  completed: number;
  total: number;
  pct: number;
  failures: number;
  started: boolean;
  lastActivity: Date | null;
  cells: Record<string, Cell>;
  /** Motivo por el que conviene que el docente se acerque, o null si va bien. */
  help: string | null;
};
export type ClassSummary = {
  students: number;
  totalStars: number;
  maxStars: number;
  avgPct: number;
  activeWeek: number;
  completedChallenges: number;
  needHelp: number;
  notStarted: number;
};

export const cellKey = (level: number, challenge: number) => `${level}-${challenge}`;

const DAY = 86_400_000;
export const STUCK_FAILURES = 4;
export const INACTIVE_DAYS = 7;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export const daysBetween = (from: Date, to: Date) => Math.round((startOfDay(to) - startOfDay(from)) / DAY);

export function buildReport(
  students: StudentLite[],
  progress: ProgressRow[],
  attempts: AttemptRow[],
  profiles: ProfileRow[],
  catalog: Challenge[],
  now: Date = new Date(),
): { rows: StudentReport[]; summary: ClassSummary } {
  const total = catalog.length;
  const maxStars = total * 3;

  const rows = students.map<StudentReport>((s) => {
    const cells: Record<string, Cell> = {};
    for (const c of catalog) cells[cellKey(c.level, c.challenge)] = { done: false, stars: 0, plays: 0, blocks: null, failures: 0 };

    let last: Date | null = null;
    const touch = (iso: string | null | undefined) => {
      if (!iso) return;
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime()) && (!last || d > last)) last = d;
    };

    for (const p of progress) {
      const cell = p.student_id === s.id ? cells[cellKey(p.level, p.challenge)] : undefined;
      if (!cell) continue;
      cell.done = p.stars > 0;
      cell.stars = p.stars;
      cell.plays = p.attempts;
      cell.blocks = p.best_blocks;
      touch(p.completed_at);
    }
    for (const a of attempts) {
      const cell = a.student_id === s.id ? cells[cellKey(a.level, a.challenge)] : undefined;
      if (!cell) continue;
      cell.failures = a.failures;
      touch(a.last_attempt_at);
    }
    const profile = profiles.find((p) => p.id === s.id);
    touch(profile?.last_play_date ? `${profile.last_play_date}T12:00:00` : null);

    const done = Object.values(cells).filter((c) => c.done);
    const stars = done.reduce((n, c) => n + c.stars, 0);
    const failures = Object.values(cells).reduce((n, c) => n + c.failures, 0);
    const started = done.length > 0 || failures > 0;

    // ¿Se ha atascado en algún reto o lleva tiempo sin jugar?
    let help: string | null = null;
    const stuck = catalog
      .map((c) => ({ c, cell: cells[cellKey(c.level, c.challenge)] }))
      .filter(({ cell }) => !cell.done && cell.failures >= STUCK_FAILURES)
      .sort((a, b) => b.cell.failures - a.cell.failures)[0];
    if (stuck) help = `Atascado en el reto ${stuck.c.level}-${stuck.c.challenge} (${stuck.cell.failures} intentos fallidos)`;
    else if (started && done.length < total && last) {
      const idle = daysBetween(last, now);
      if (idle >= INACTIVE_DAYS) help = `Sin actividad desde hace ${idle} días`;
    }

    return {
      id: s.id,
      name: s.name,
      coins: profile?.coins ?? 0,
      streak: profile?.streak_days ?? 0,
      stars,
      maxStars,
      completed: done.length,
      total,
      pct: total ? Math.round((done.length / total) * 100) : 0,
      failures,
      started,
      lastActivity: last,
      cells,
      help,
    };
  });

  const week = now.getTime() - 7 * DAY;
  const summary: ClassSummary = {
    students: rows.length,
    totalStars: rows.reduce((n, r) => n + r.stars, 0),
    maxStars: maxStars * rows.length,
    avgPct: rows.length ? Math.round(rows.reduce((n, r) => n + r.pct, 0) / rows.length) : 0,
    activeWeek: rows.filter((r) => r.lastActivity && r.lastActivity.getTime() >= week).length,
    completedChallenges: rows.reduce((n, r) => n + r.completed, 0),
    needHelp: rows.filter((r) => r.help).length,
    notStarted: rows.filter((r) => !r.started).length,
  };
  return { rows, summary };
}

/** «Hoy», «Ayer», «Hace 3 días»… */
export function activityLabel(date: Date | null, now: Date = new Date()): string {
  if (!date) return "Sin actividad";
  const d = daysBetween(date, now);
  if (d <= 0) return "Hoy";
  if (d === 1) return "Ayer";
  if (d < 7) return `Hace ${d} días`;
  return date.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Informe en CSV (separado por comas, con una columna por reto) para abrir en Excel o Sheets. */
export function toCsv(rows: StudentReport[], catalog: Challenge[], now: Date = new Date()): string {
  const head = [
    "Alumno",
    "Estrellas",
    "Retos completados",
    "Avance %",
    "Monedas",
    "Racha (días)",
    "Intentos fallidos",
    "Última actividad",
    "Necesita ayuda",
    ...catalog.map((c) => `Reto ${c.level}-${c.challenge} (estrellas)`),
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.stars,
      `${r.completed}/${r.total}`,
      r.pct,
      r.coins,
      r.streak,
      r.failures,
      activityLabel(r.lastActivity, now),
      r.help ?? "",
      ...catalog.map((c) => {
        const cell = r.cells[cellKey(c.level, c.challenge)];
        return cell.done ? cell.stars : "";
      }),
    ]
      .map(csvCell)
      .join(","),
  );
  return [head.map(csvCell).join(","), ...lines].join("\n");
}
