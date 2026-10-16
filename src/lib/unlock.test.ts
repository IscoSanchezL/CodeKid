import { describe, expect, it } from "vitest";
import { CHALLENGES } from "@/engine/levels";
import {
  currentLevel,
  passedLevels,
  PASS_STARS,
  starsOfLevel,
  unlockedLevels,
} from "./unlock";

const give = (level: number, each: number) =>
  Object.fromEntries(
    CHALLENGES.filter((c) => c.level === level).map((c) => [
      `${c.level}-${c.challenge}`,
      each,
    ]),
  );

describe("desbloqueo de planetas", () => {
  it("el primero siempre está abierto y el siguiente pide 11 estrellas", () => {
    expect([...unlockedLevels({}, false)]).toEqual([1]);
    const p10 = { ...give(1, 2) }; // 10 estrellas
    expect(starsOfLevel(1, p10)).toBe(10);
    expect([...unlockedLevels(p10, false)]).toEqual([1]);
    const p11 = { ...p10, "1-1": 3 }; // 11 estrellas
    expect(starsOfLevel(1, p11)).toBe(PASS_STARS);
    expect([...unlockedLevels(p11, false)]).toEqual([1, 2, 11]); // 11 = modo avanzado del planeta 1
  });

  it("no se salta un planeta aunque el siguiente tenga estrellas", () => {
    const p = { ...give(1, 1), ...give(3, 3) };
    expect([...unlockedLevels(p, false)]).toEqual([1]);
  });

  it("el modo avanzado se abre al superar su planeta y no bloquea el siguiente", () => {
    expect(unlockedLevels(give(1, 2), false).has(11)).toBe(false);
    expect(unlockedLevels(give(1, 3), false).has(11)).toBe(true);
    // el avanzado no es requisito del siguiente planeta, ni al revés
    expect(unlockedLevels(give(1, 3), false).has(2)).toBe(true);
    expect(unlockedLevels(give(11, 3), false).has(2)).toBe(false);
    // el planeta actual solo cuenta los planetas básicos
    expect(currentLevel({ ...give(1, 3), ...give(11, 3) })).toBe(2);
  });

  it("docentes ven todos los planetas abiertos", () => {
    expect(unlockedLevels({}, true).size).toBeGreaterThanOrEqual(7);
  });

  it("el planeta actual es el primero sin superar", () => {
    expect(currentLevel({})).toBe(1);
    expect(currentLevel({ ...give(1, 3), ...give(2, 2) })).toBe(2);
    expect(passedLevels({ ...give(1, 3), ...give(2, 3) }).has(2)).toBe(true);
  });
});
