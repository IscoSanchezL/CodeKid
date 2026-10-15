// Recibe el programa de un alumno, lo ejecuta en el servidor con el mismo motor del juego y,
// solo si de verdad resuelve el reto, guarda el progreso y reparte las monedas.
//   POST { level, challenge, program }  con la sesión del alumno
import { createClient } from "npm:@supabase/supabase-js@2";
import { run } from "./engine/interpreter.ts";
import { getChallenge } from "./engine/levels.ts";
import type { Block, BlockType } from "./engine/types.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const MAX_BLOCKS = 60;
const MAX_DEPTH = 4;

/** Reconstruye el programa solo con campos y valores permitidos (nunca se confía en lo que llega). */
function sanitize(input: unknown, allowed: BlockType[], depth = 0, counter = { n: 0 }): Block[] {
  if (!Array.isArray(input) || depth > MAX_DEPTH) throw new Error("Programa no válido");
  return input.map((raw, i) => {
    counter.n += 1;
    if (counter.n > MAX_BLOCKS) throw new Error("Programa demasiado grande");
    const b = raw as { type?: string; times?: unknown; body?: unknown };
    const type = b?.type as BlockType;
    if (!allowed.includes(type)) throw new Error("Bloque no permitido en este reto");
    const id = `b${depth}-${i}-${counter.n}`;
    if (type === "repeat") {
      const times = Math.min(9, Math.max(2, Math.round(Number(b.times) || 2)));
      return { id, type, times, body: sanitize(b.body ?? [], allowed, depth + 1, counter) };
    }
    return { id, type };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth } = token ? await anon.auth.getUser(token) : { data: { user: null } };
    if (!auth.user) return json({ error: "Inicia sesión para guardar tu progreso" }, 401);

    const body = (await req.json().catch(() => ({}))) as { level?: unknown; challenge?: unknown; program?: unknown };
    const level = getChallenge(Number(body.level), Number(body.challenge));
    if (!level) return json({ error: "Reto no encontrado" }, 404);

    let program: Block[];
    try {
      program = sanitize(body.program, level.allowed);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "Programa no válido" }, 400);
    }

    const result = run(level, program);
    const summary = { status: result.status, stars: result.stars, blocks: result.blocks };
    if (result.status !== "win") return json({ ...summary, reward: null });

    // Solo los alumnos ganan monedas y guardan progreso (un docente que prueba el reto, no).
    const { data: profile } = await admin.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
    if (profile?.role !== "student") return json({ ...summary, reward: null });

    const { data: reward, error } = await admin.rpc("award_progress", {
      p_student: auth.user.id,
      p_level: level.level,
      p_challenge: level.challenge,
      p_stars: result.stars,
      p_blocks: result.blocks,
    });
    if (error) {
      console.error(error);
      return json({ error: "No se pudo guardar el progreso" }, 500);
    }
    return json({ ...summary, reward });
  } catch (err) {
    console.error(err);
    return json({ error: "Error interno" }, 500);
  }
});
