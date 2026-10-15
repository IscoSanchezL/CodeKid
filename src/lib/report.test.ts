import { describe, expect, it } from "vitest";
import { activityLabel, buildReport, toCsv, type AttemptRow, type Challenge, type ProfileRow, type ProgressRow } from "./report";

const catalog: Challenge[] = [
  { level: 1, challenge: 1, title: "Primer paso", par: 2 },
  { level: 1, challenge: 2, title: "Una esquina", par: 5 },
  { level: 2, challenge: 1, title: "Repite", par: 2 },
  { level: 2, challenge: 2, title: "Pasillos", par: 8 },
];
const NOW = new Date("2026-10-20T12:00:00");
const students = [
  { id: "ana", name: "Ana" },
  { id: "luis", name: "Luis" },
  { id: "eva", name: "Eva" },
  { id: "tom", name: "Tomás" },
];
const progress: ProgressRow[] = [
  { student_id: "ana", level: 1, challenge: 1, stars: 3, attempts: 1, best_blocks: 2, completed_at: "2026-10-20T09:00:00" },
  { student_id: "ana", level: 1, challenge: 2, stars: 2, attempts: 3, best_blocks: 6, completed_at: "2026-10-19T09:00:00" },
  { student_id: "luis", level: 1, challenge: 1, stars: 1, attempts: 1, best_blocks: 4, completed_at: "2026-10-05T09:00:00" },
  { student_id: "ajeno", level: 1, challenge: 1, stars: 3, attempts: 1, best_blocks: 2, completed_at: "2026-10-20T09:00:00" },
];
const attempts: AttemptRow[] = [
  { student_id: "eva", level: 1, challenge: 2, failures: 5, last_attempt_at: "2026-10-20T10:00:00" },
  { student_id: "ana", level: 2, challenge: 1, failures: 2, last_attempt_at: "2026-10-20T11:00:00" },
];
const profiles: ProfileRow[] = [
  { id: "ana", coins: 95, streak_days: 3, last_play_date: "2026-10-20" },
  { id: "luis", coins: 20, streak_days: 1, last_play_date: "2026-10-05" },
];

describe("informe de la clase", () => {
  const { rows, summary } = buildReport(students, progress, attempts, profiles, catalog, NOW);
  const by = (id: string) => rows.find((r) => r.id === id)!;

  it("calcula estrellas, retos completados y porcentaje por alumno", () => {
    expect(by("ana")).toMatchObject({ stars: 5, completed: 2, total: 4, pct: 50, maxStars: 12, coins: 95, streak: 3, failures: 2 });
    expect(by("luis")).toMatchObject({ stars: 1, completed: 1, pct: 25 });
    expect(by("tom")).toMatchObject({ stars: 0, completed: 0, pct: 0, started: false });
  });

  it("ignora el progreso de alumnos que no son de la clase", () => {
    expect(rows.reduce((n, r) => n + r.stars, 0)).toBe(6); // 5 de Ana + 1 de Luis; el 3 de «ajeno» no cuenta
  });

  it("une progreso e intentos fallidos en cada casilla", () => {
    expect(by("ana").cells["1-2"]).toEqual({ done: true, stars: 2, plays: 3, blocks: 6, failures: 0 });
    expect(by("ana").cells["2-1"]).toMatchObject({ done: false, failures: 2 });
    expect(by("eva").cells["1-2"]).toMatchObject({ done: false, failures: 5 });
  });

  it("marca a quien se atasca (4+ fallos sin superar el reto)", () => {
    expect(by("eva").help).toBe("Atascado en el reto 1-2 (5 intentos fallidos)");
    expect(by("ana").help).toBeNull(); // solo 2 fallos
  });

  it("marca a quien lleva 7 o más días sin jugar, pero no a quien nunca empezó", () => {
    expect(by("luis").help).toBe("Sin actividad desde hace 15 días");
    expect(by("tom").help).toBeNull();
  });

  it("resume la clase", () => {
    expect(summary).toMatchObject({
      students: 4,
      totalStars: 6,
      maxStars: 48,
      avgPct: 19, // (50 + 25 + 0 + 0) / 4 = 18,75
      completedChallenges: 3,
      needHelp: 2,
      notStarted: 1,
      activeWeek: 2, // Ana y Eva
    });
  });

  it("la última actividad es la más reciente entre reto, intento y día de juego", () => {
    expect(by("ana").lastActivity?.toISOString().slice(0, 10)).toBe("2026-10-20");
    expect(by("tom").lastActivity).toBeNull();
  });
});

describe("texto de actividad", () => {
  it("usa hoy, ayer, hace N días y la fecha", () => {
    expect(activityLabel(null, NOW)).toBe("Sin actividad");
    expect(activityLabel(new Date("2026-10-20T01:00:00"), NOW)).toBe("Hoy");
    expect(activityLabel(new Date("2026-10-19T23:00:00"), NOW)).toBe("Ayer");
    expect(activityLabel(new Date("2026-10-17T10:00:00"), NOW)).toBe("Hace 3 días");
    expect(activityLabel(new Date("2026-10-05T10:00:00"), NOW)).toMatch(/^0?5\/10$|^10\/0?5$/);
  });
});

describe("exportar a CSV", () => {
  it("genera una fila por alumno y una columna por reto, escapando comas y comillas", () => {
    const { rows } = buildReport([{ id: "ana", name: 'Ana, "la rápida"' }], progress, attempts, profiles, catalog, NOW);
    const lines = toCsv(rows, catalog, NOW).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0].split(",").length).toBeGreaterThanOrEqual(9 + 4);
    expect(lines[1].startsWith('"Ana, ""la rápida"""')).toBe(true);
    expect(lines[1]).toContain(",3,2,,"); // estrellas de los retos 1-1 y 1-2, y vacíos en los que faltan
  });
});
