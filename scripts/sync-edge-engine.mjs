// Copia el motor del juego (src/engine) a la función submit-result para que el servidor
// valide con exactamente las mismas reglas. Deno exige la extensión .ts en los imports.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const FILES = ["types", "program", "interpreter", "dsl", "advanced", "levels"];
const OUT = "supabase/functions/submit-result/engine";
mkdirSync(OUT, { recursive: true });
for (const f of FILES) {
  const code = readFileSync(`src/engine/${f}.ts`, "utf8").replace(/from "\.\/([a-z]+)"/g, 'from "./$1.ts"');
  writeFileSync(`${OUT}/${f}.ts`, `// GENERADO por scripts/sync-edge-engine.mjs a partir de src/engine/${f}.ts. No editar a mano.\n${code}`);
}
console.log("motor sincronizado:", FILES.join(", "));
