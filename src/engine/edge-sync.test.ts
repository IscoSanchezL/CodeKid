import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * El servidor valida los retos con una copia del motor (supabase/functions/submit-result/engine).
 * Si se cambia src/engine y no se ejecuta `node scripts/sync-edge-engine.mjs`, este test falla.
 */
describe("motor del servidor", () => {
  it.each(["types", "program", "interpreter", "dsl", "advanced", "levels"])("%s.ts está sincronizado con src/engine", (name) => {
    const src = readFileSync(`src/engine/${name}.ts`, "utf8").replace(/from "\.\/([a-z]+)"/g, 'from "./$1.ts"');
    const copy = readFileSync(`supabase/functions/submit-result/engine/${name}.ts`, "utf8");
    expect(copy).toBe(`// GENERADO por scripts/sync-edge-engine.mjs a partir de src/engine/${name}.ts. No editar a mano.\n${src}`);
  });
});
