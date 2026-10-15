// Recibe el programa de un alumno, lo ejecuta en el servidor con el mismo motor del juego y,
// solo si de verdad resuelve el reto, guarda el progreso y reparte las monedas.
//   POST { level, challenge, program }  con la sesión del alumno
import { createClient } from "npm:@supabase/supabase-js@2";
import { run } from "./engine/interpreter.ts";
import { challengesOf, getChallenge } from "./engine/levels.ts";
import type { Atom, AtomKind, Block, BlockType, CondExpr, Turn } from "./engine/types.ts";

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

/** Estrellas que hay que reunir en un planeta para poder jugar el siguiente. */
const PASS_STARS = 11;
const MAX_BLOCKS = 60;
const MAX_DEPTH = 4;
const ATOMS: AtomKind[] = ["wall", "free", "coin", "goal"];
const TURNS: Turn[] = ["L", "R", "S"];

function cleanAtom(a: unknown): Atom {
  const o = (a ?? {}) as { kind?: unknown; not?: unknown };
  return { kind: ATOMS.includes(o.kind as AtomKind) ? (o.kind as AtomKind) : "wall", not: o.not === true };
}

/** Acepta la condición nueva (con «y», «o», «no») y la antigua (un texto). */
function cleanCond(c: unknown): CondExpr {
  if (typeof c === "string") return { a: { kind: c === "free" ? "free" : "wall", not: false } };
  const o = (c ?? {}) as { a?: unknown; op?: unknown; b?: unknown };
  const a = cleanAtom(o.a);
  if ((o.op === "and" || o.op === "or") && o.b) return { a, op: o.op, b: cleanAtom(o.b) };
  return { a };
}

const clamp = (v: unknown, lo: number, hi: number, fallback: number) => Math.min(hi, Math.max(lo, Math.round(Number(v)) || fallback));

/** Reconstruye el programa solo con campos y valores permitidos (nunca se confía en lo que llega). */
function sanitize(input: unknown, allowed: BlockType[], depth = 0, counter = { n: 0 }): Block[] {
  if (!Array.isArray(input) || depth > MAX_DEPTH) throw new Error("Programa no válido");
  return input.map((raw, i) => {
    counter.n += 1;
    if (counter.n > MAX_BLOCKS) throw new Error("Programa demasiado grande");
    const b = raw as Record<string, unknown>;
    const type = b?.type as BlockType;
    if (!allowed.includes(type)) throw new Error("Bloque no permitido en este reto");
    const id = `b${depth}-${i}-${counter.n}`;
    const body = () => sanitize(b.body ?? [], allowed, depth + 1, counter);
    switch (type) {
      case "if":
        return { id, type, cond: cleanCond(b.cond), body: body() };
      case "while":
        return { id, type, cond: cleanCond(b.cond), body: body() };
      case "repeat":
        return { id, type, times: clamp(b.times, 2, 9, 2), body: body() };
      case "def":
        return { id, type, name: b.name === "B" ? "B" : "A", body: body() } as Block;
      case "call":
        return { id, type, name: b.name === "B" ? "B" : "A" } as Block;
      case "foreach":
        return { id, type, body: body() };
      case "setvar":
        return { id, type, value: clamp(b.value, 0, 9, 1) };
      case "addvar":
        return { id, type, op: b.op === "-" || b.op === "*" ? b.op : "+", value: clamp(b.value, 1, 3, 1) } as Block;
      case "list": {
        const items = (Array.isArray(b.items) ? b.items : []).filter((t): t is Turn => TURNS.includes(t as Turn)).slice(0, 12);
        return { id, type, items: items.length ? items : (["S"] as Turn[]) };
      }
      case "movevar":
      case "turnitem":
        return { id, type };
      default:
        return { id, type } as Block;
    }
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

    const { data: profile } = await admin.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
    const isStudent = profile?.role === "student";

    // Un planeta solo se juega si el alumno reunió las estrellas del anterior (así no se salta por la dirección).
    if (isStudent && level.level > 1) {
      const need = Math.min(PASS_STARS, challengesOf(level.level - 1).length * 3);
      const { data: rows } = await admin.from("progress").select("stars").eq("student_id", auth.user.id).eq("level", level.level - 1);
      const have = (rows ?? []).reduce((n: number, r: { stars: number | null }) => n + (r.stars ?? 0), 0);
      if (have < need) return json({ error: `Este planeta todavía está cerrado: saca ${need} estrellas en el anterior.` }, 403);
    }

    const result = run(level, program);
    const summary = { status: result.status, stars: result.stars, blocks: result.blocks };
    if (result.status !== "win") return json({ ...summary, reward: null });

    // Solo los alumnos ganan monedas y guardan progreso (un docente que prueba el reto, no).
    if (!isStudent) return json({ ...summary, reward: null });

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
