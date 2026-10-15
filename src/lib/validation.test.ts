import { describe, expect, it } from "vitest";
import { credentialsSchema, registerSchema } from "./validation";
import { LEVELS } from "./levels";

describe("validación de acceso", () => {
  it("rechaza correos inválidos y contraseñas cortas", () => {
    expect(credentialsSchema.safeParse({ email: "x", password: "12345678" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "123" }).success).toBe(false);
  });

  it("acepta un registro válido", () => {
    const r = registerSchema.safeParse({ name: "Ana", email: "ana@mail.com", password: "12345678", role: "student" });
    expect(r.success).toBe(true);
  });

  it("no permite registrarse como admin", () => {
    const r = registerSchema.safeParse({ name: "Ana", email: "ana@mail.com", password: "12345678", role: "admin" });
    expect(r.success).toBe(false);
  });
});

describe("ruta de aprendizaje", () => {
  it("tiene 10 niveles consecutivos y 3 gratuitos", () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(LEVELS.filter((l) => l.free)).toHaveLength(3);
  });
});
