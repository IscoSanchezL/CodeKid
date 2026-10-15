// Administración de CodeKid: solo el super administrador. Usa la clave de servicio, por eso cada acción
// comprueba primero que quien llama sea admin y deja constancia en admin_audit.
import { createClient } from "npm:@supabase/supabase-js@2";

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

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const ROLES = ["student", "teacher", "guardian", "admin"] as const;
type Role = (typeof ROLES)[number];
type Caller = { id: string; name: string };

const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

function tempPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return "Kid-" + [...bytes].map((b) => abc[b % abc.length]).join("");
}

async function requireAdmin(req: Request): Promise<Caller> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = token ? await anon.auth.getUser(token) : { data: { user: null } };
  if (!data.user) throw new HttpError(401, "Inicia sesión");
  const { data: profile } = await admin.from("profiles").select("role, display_name").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "admin") throw new HttpError(403, "Solo el super administrador puede hacer esto");
  return { id: data.user.id, name: String(profile.display_name ?? "") };
}

async function log(c: Caller, action: string, target: string, detail = "") {
  await admin.from("admin_audit").insert({ actor_id: c.id, actor_name: c.name, action, target, detail });
}

async function adminCount() {
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return count ?? 0;
}

async function countOf(table: string, filter?: (q: any) => any) {
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

async function allUsers() {
  const users: any[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new HttpError(500, "No se pudo leer la lista de usuarios");
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  return users;
}

async function handle(c: Caller, body: Record<string, unknown>) {
  const action = String(body.action ?? "");

  if (action === "overview") {
    const week = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const [students, teachers, guardians, admins, classes, stars, activeWeek, attempts] = await Promise.all([
      countOf("profiles", (q) => q.eq("role", "student")),
      countOf("profiles", (q) => q.eq("role", "teacher")),
      countOf("profiles", (q) => q.eq("role", "guardian")),
      countOf("profiles", (q) => q.eq("role", "admin")),
      countOf("classrooms"),
      admin.from("progress").select("stars"),
      countOf("profiles", (q) => q.eq("role", "student").gte("last_play_date", week)),
      admin.from("challenge_attempts").select("failures"),
    ]);
    const totalStars = (stars.data ?? []).reduce((n: number, r: any) => n + (r.stars ?? 0), 0);
    const totalFails = (attempts.data ?? []).reduce((n: number, r: any) => n + (r.failures ?? 0), 0);
    const completed = (stars.data ?? []).filter((r: any) => (r.stars ?? 0) > 0).length;
    return { students, teachers, guardians, admins, classes, totalStars, completed, activeWeek, totalFails };
  }

  if (action === "users") {
    const [users, { data: profiles }, { data: classes }, { data: members }] = await Promise.all([
      allUsers(),
      admin.from("profiles").select("id, role, display_name, created_at"),
      admin.from("classrooms").select("id, teacher_id"),
      admin.from("classroom_members").select("classroom_id"),
    ]);
    const profileOf = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const classOf = new Map<string, string[]>();
    for (const cl of classes ?? []) classOf.set(cl.teacher_id, [...(classOf.get(cl.teacher_id) ?? []), cl.id]);
    const membersIn = new Map<string, number>();
    for (const m of members ?? []) membersIn.set(m.classroom_id, (membersIn.get(m.classroom_id) ?? 0) + 1);
    const now = Date.now();
    return {
      users: users
        .map((u) => ({ u, p: profileOf.get(u.id) as any }))
        .filter(({ p }) => p && p.role !== "student")
        .map(({ u, p }) => {
          const owned = classOf.get(u.id) ?? [];
          return {
            id: u.id,
            email: u.email ?? "",
            name: p.display_name,
            role: p.role as Role,
            createdAt: u.created_at,
            lastSignIn: u.last_sign_in_at ?? null,
            banned: !!u.banned_until && new Date(u.banned_until).getTime() > now,
            classes: owned.length,
            students: owned.reduce((n, id) => n + (membersIn.get(id) ?? 0), 0),
          };
        })
        .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role.localeCompare(b.role))),
    };
  }

  if (action === "create-user") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const role = String(body.role ?? "teacher");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Correo no válido");
    if (name.length < 2 || name.length > 40) throw new HttpError(400, "Escribe un nombre (2 a 40 letras)");
    if (role !== "teacher" && role !== "guardian" && role !== "admin") throw new HttpError(400, "Rol no válido");
    const password = tempPassword();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name, role: role === "admin" ? "teacher" : role },
    });
    if (error || !data.user) throw new HttpError(400, error?.message.includes("already") ? "Ese correo ya tiene cuenta" : "No se pudo crear la cuenta");
    if (role === "admin") await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
    await log(c, "crear cuenta", email, `rol ${role}`);
    return { id: data.user.id, email, password };
  }

  if (action === "set-role") {
    const id = body.userId;
    const role = body.role as Role;
    if (!isUuid(id) || !ROLES.includes(role)) throw new HttpError(400, "Datos no válidos");
    if (id === c.id) throw new HttpError(400, "No puedes cambiar tu propio rol");
    const { data: target } = await admin.from("profiles").select("role, display_name").eq("id", id).maybeSingle();
    if (!target) throw new HttpError(404, "Usuario no encontrado");
    if (target.role === "admin" && role !== "admin" && (await adminCount()) <= 1) throw new HttpError(400, "Debe quedar al menos un super administrador");
    const { error } = await admin.from("profiles").update({ role }).eq("id", id);
    if (error) throw new HttpError(500, "No se pudo cambiar el rol");
    await log(c, "cambiar rol", target.display_name, `${target.role} → ${role}`);
    return { ok: true };
  }

  if (action === "set-banned") {
    const id = body.userId;
    if (!isUuid(id)) throw new HttpError(400, "Datos no válidos");
    if (id === c.id) throw new HttpError(400, "No puedes suspender tu propia cuenta");
    const banned = body.banned === true;
    const { data: target } = await admin.from("profiles").select("role, display_name").eq("id", id).maybeSingle();
    if (!target) throw new HttpError(404, "Usuario no encontrado");
    if (banned && target.role === "admin" && (await adminCount()) <= 1) throw new HttpError(400, "Debe quedar al menos un super administrador");
    const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: banned ? "876000h" : "none" });
    if (error) throw new HttpError(500, "No se pudo cambiar el estado");
    await log(c, banned ? "suspender cuenta" : "reactivar cuenta", target.display_name);
    return { ok: true };
  }

  if (action === "reset-password") {
    const id = body.userId;
    if (!isUuid(id)) throw new HttpError(400, "Datos no válidos");
    const { data: target } = await admin.from("profiles").select("role, display_name").eq("id", id).maybeSingle();
    if (!target) throw new HttpError(404, "Usuario no encontrado");
    if (target.role === "student") throw new HttpError(400, "Los alumnos entran con el código de su clase");
    const password = tempPassword();
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) throw new HttpError(500, "No se pudo cambiar la contraseña");
    await log(c, "restablecer contraseña", target.display_name);
    return { password };
  }

  if (action === "delete-user") {
    const id = body.userId;
    if (!isUuid(id)) throw new HttpError(400, "Datos no válidos");
    if (id === c.id) throw new HttpError(400, "No puedes eliminar tu propia cuenta");
    const { data: target } = await admin.from("profiles").select("role, display_name").eq("id", id).maybeSingle();
    if (!target) throw new HttpError(404, "Usuario no encontrado");
    if (target.role === "admin" && (await adminCount()) <= 1) throw new HttpError(400, "Debe quedar al menos un super administrador");
    const owned = await countOf("classrooms", (q) => q.eq("teacher_id", id));
    if (owned > 0) throw new HttpError(400, `Tiene ${owned} clase(s): pásalas a otro docente antes de eliminarlo`);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new HttpError(500, "No se pudo eliminar la cuenta");
    await log(c, "eliminar cuenta", target.display_name, target.role);
    return { ok: true };
  }

  if (action === "classes") {
    const [{ data: classes }, { data: members }, { data: profiles }, users] = await Promise.all([
      admin.from("classrooms").select("id, name, join_code, class_password, teacher_id, created_at").order("created_at", { ascending: false }),
      admin.from("classroom_members").select("classroom_id"),
      admin.from("profiles").select("id, display_name, role").in("role", ["teacher", "admin"]),
      allUsers(),
    ]);
    const emailOf = new Map(users.map((u) => [u.id, u.email ?? ""]));
    const nameOf = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name]));
    const counts = new Map<string, number>();
    for (const m of members ?? []) counts.set(m.classroom_id, (counts.get(m.classroom_id) ?? 0) + 1);
    return {
      classes: (classes ?? []).map((cl: any) => ({
        id: cl.id,
        name: cl.name,
        code: cl.join_code,
        password: cl.class_password,
        createdAt: cl.created_at,
        teacherId: cl.teacher_id,
        teacher: nameOf.get(cl.teacher_id) ?? "—",
        teacherEmail: emailOf.get(cl.teacher_id) ?? "",
        students: counts.get(cl.id) ?? 0,
      })),
      teachers: (profiles ?? []).map((p: any) => ({ id: p.id, name: p.display_name, email: emailOf.get(p.id) ?? "" })),
    };
  }

  if (action === "reassign-class") {
    const { classroomId, teacherId } = body;
    if (!isUuid(classroomId) || !isUuid(teacherId)) throw new HttpError(400, "Datos no válidos");
    const { data: teacher } = await admin.from("profiles").select("role, display_name").eq("id", teacherId).maybeSingle();
    if (!teacher || (teacher.role !== "teacher" && teacher.role !== "admin")) throw new HttpError(400, "Elige un docente");
    const { data: cl } = await admin.from("classrooms").select("name").eq("id", classroomId).maybeSingle();
    if (!cl) throw new HttpError(404, "Clase no encontrada");
    const { error } = await admin.from("classrooms").update({ teacher_id: teacherId }).eq("id", classroomId);
    if (error) throw new HttpError(500, "No se pudo pasar la clase");
    await log(c, "pasar clase", cl.name, `a ${teacher.display_name}`);
    return { ok: true };
  }

  if (action === "delete-class") {
    const { classroomId } = body;
    if (!isUuid(classroomId)) throw new HttpError(400, "Datos no válidos");
    const { data: cl } = await admin.from("classrooms").select("name").eq("id", classroomId).maybeSingle();
    if (!cl) throw new HttpError(404, "Clase no encontrada");
    const { data: members } = await admin.from("classroom_members").select("student_id").eq("classroom_id", classroomId);
    let removed = 0;
    if (body.deleteStudents === true) {
      for (const m of members ?? []) {
        const { data: p } = await admin.from("profiles").select("role").eq("id", m.student_id).maybeSingle();
        if (p?.role === "student") {
          await admin.auth.admin.deleteUser(m.student_id);
          removed += 1;
        }
      }
    }
    const { error } = await admin.from("classrooms").delete().eq("id", classroomId);
    if (error) throw new HttpError(500, "No se pudo eliminar la clase");
    await log(c, "eliminar clase", cl.name, `${removed} alumno(s) eliminados`);
    return { ok: true, removed };
  }

  if (action === "audit") {
    const { data } = await admin.from("admin_audit").select("id, actor_name, action, target, detail, created_at").order("created_at", { ascending: false }).limit(50);
    return { entries: data ?? [] };
  }

  throw new HttpError(400, "Acción no válida");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  try {
    const caller = await requireAdmin(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return json(await handle(caller, body));
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Error interno" }, 500);
  }
});
