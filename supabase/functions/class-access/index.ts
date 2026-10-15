// Acceso por clase (estilo Kodable). Se despliega como Edge Function de Supabase.
//
// Acciones públicas (el código de clase es el secreto):
//   lookup  { code }                                  -> nombre de la clase, si pide clave, y lista de alumnos
//   login   { code, studentId, password?, pin? }      -> sesión del alumno
//           password = clave de la clase (p. ej. «1A»); pin = PIN individual opcional
// Acciones de docente (requieren su sesión; el docente debe ser dueño de la clase):
//   teacher-list    { classroomId }
//   create-students { classroomId, students: [{ name }], requirePin }
//   set-pin         { classroomId, studentId, mode: "random" | "none" }
//   remove-student  { classroomId, studentId }
//
// Los alumnos son usuarios de Supabase Auth con un correo sintético; su contraseña se
// deriva con HMAC de la clave de servicio y nunca sale de aquí. Los PIN se guardan con
// PBKDF2 y hay bloqueo temporal tras varios fallos.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_FAILED = 5;
const LOCK_MINUTES = 2;
const MAX_STUDENTS_PER_CALL = 40;

class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const enc = new TextEncoder();
const toHex = (b: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(b instanceof Uint8Array ? b.buffer : b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h: string) => new Uint8Array(h.match(/../g)?.map((x) => parseInt(x, 16)) ?? []);

const normPassword = (v: unknown) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
const normCode = (v: unknown) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

async function derivePassword(userId: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(SERVICE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(`codekid-student:${userId}`)));
}

async function pbkdf2(pin: string, salt: Uint8Array): Promise<string> {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 }, base, 256);
  return toHex(bits);
}

async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `v1$${toHex(salt)}$${await pbkdf2(pin, salt)}`;
}

async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [, saltHex, hash] = stored.split("$");
  if (!saltHex || !hash) return false;
  const candidate = await pbkdf2(pin, fromHex(saltHex));
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

function randomPin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return String(n).padStart(4, "0");
}

async function findClassroom(code: string) {
  if (code.length < 4) throw new HttpError(404, "Código de clase no encontrado");
  const { data } = await admin.from("classrooms").select("id, name, teacher_id, class_password").eq("join_code", code).maybeSingle();
  if (!data) throw new HttpError(404, "Código de clase no encontrado");
  return data;
}

async function listStudents(classroomId: string) {
  const { data: members } = await admin.from("classroom_members").select("student_id").eq("classroom_id", classroomId);
  const ids = (members ?? []).map((m) => m.student_id as string);
  if (ids.length === 0) return [];
  const [{ data: profiles }, { data: creds }] = await Promise.all([
    admin.from("profiles").select("id, display_name, avatar, coins").in("id", ids),
    admin.from("student_credentials").select("student_id, pin_hash").in("student_id", ids),
  ]);
  const managed = new Map((creds ?? []).map((c) => [c.student_id as string, Boolean(c.pin_hash)]));
  return (profiles ?? [])
    .filter((p) => managed.has(p.id as string)) // solo cuentas creadas por el docente
    .map((p) => ({
      id: p.id as string,
      name: p.display_name as string,
      avatar: (p.avatar as Record<string, string> | null) ?? {},
      coins: (p.coins as number) ?? 0,
      hasPin: managed.get(p.id as string) ?? false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

async function requireTeacher(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Inicia sesión como docente");
  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Inicia sesión como docente");
  const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = profile?.role as string | undefined;
  if (role !== "teacher" && role !== "admin") throw new HttpError(403, "Solo docentes pueden hacer esto");
  return { id: data.user.id, role };
}

async function requireOwnClassroom(caller: { id: string; role: string }, classroomId: unknown) {
  if (typeof classroomId !== "string") throw new HttpError(400, "Falta la clase");
  const { data } = await admin.from("classrooms").select("id, name, teacher_id").eq("id", classroomId).maybeSingle();
  if (!data || (caller.role !== "admin" && data.teacher_id !== caller.id)) throw new HttpError(404, "Clase no encontrada");
  return data;
}

async function requireStudentOf(classroomId: string, studentId: unknown) {
  if (typeof studentId !== "string") throw new HttpError(400, "Falta el alumno");
  const [{ data: member }, { data: cred }] = await Promise.all([
    admin.from("classroom_members").select("student_id").eq("classroom_id", classroomId).eq("student_id", studentId).maybeSingle(),
    admin.from("student_credentials").select("student_id, login_email, pin_hash, failed_count, locked_until").eq("student_id", studentId).maybeSingle(),
  ]);
  if (!member || !cred) throw new HttpError(404, "Alumno no encontrado");
  return cred;
}

// ── Acciones ────────────────────────────────────────────────────────────────

async function lookup(body: Record<string, unknown>) {
  const classroom = await findClassroom(normCode(body.code));
  const students = (await listStudents(classroom.id)).map(({ coins: _coins, ...rest }) => rest); // las monedas no se publican
  return { classroom: { name: classroom.name, needsPassword: Boolean(classroom.class_password) }, students };
}

async function registerFailure(studentId: string, failedCount: number) {
  const failed = failedCount + 1;
  const lock = failed >= MAX_FAILED;
  await admin
    .from("student_credentials")
    .update({
      failed_count: lock ? 0 : failed,
      locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
    })
    .eq("student_id", studentId);
  return lock;
}

async function login(body: Record<string, unknown>) {
  const classroom = await findClassroom(normCode(body.code));
  const cred = await requireStudentOf(classroom.id, body.studentId);
  const studentId = cred.student_id as string;
  const failedCount = cred.failed_count as number;

  if (cred.locked_until && new Date(cred.locked_until as string) > new Date()) {
    throw new HttpError(429, "Demasiados intentos. Espera un par de minutos y vuelve a probar.");
  }

  // 1) Clave de la clase (la misma para todos, p. ej. el grado «1A»)
  if (classroom.class_password) {
    const given = normPassword(body.password);
    if (!given) throw new HttpError(401, "Escribe la clave de tu clase", { needs: "password" });
    if (given !== classroom.class_password) {
      const lock = await registerFailure(studentId, failedCount);
      throw new HttpError(401, lock ? "Clave incorrecta. Espera un par de minutos." : "Clave incorrecta", { needs: "password" });
    }
  }

  // 2) PIN individual (opcional, lo pone el docente)
  if (cred.pin_hash) {
    const pin = String(body.pin ?? "");
    if (!pin) throw new HttpError(401, "Escribe tu PIN", { needs: "pin" });
    if (!/^\d{4}$/.test(pin) || !(await verifyPin(pin, cred.pin_hash as string))) {
      const lock = await registerFailure(studentId, failedCount);
      throw new HttpError(401, lock ? "PIN incorrecto. Espera un par de minutos." : "PIN incorrecto", { needs: "pin" });
    }
  }

  if (failedCount > 0 || cred.locked_until) {
    await admin.from("student_credentials").update({ failed_count: 0, locked_until: null }).eq("student_id", studentId);
  }

  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const password = await derivePassword(studentId);
  let { data, error } = await anon.auth.signInWithPassword({ email: cred.login_email as string, password });
  if (error || !data.session) {
    // Autorreparación (p. ej. si cambió la clave del servidor): la identidad ya está verificada.
    await admin.auth.admin.updateUserById(studentId, { password });
    ({ data, error } = await anon.auth.signInWithPassword({ email: cred.login_email as string, password }));
  }
  if (error || !data.session) throw new HttpError(500, "No se pudo iniciar la sesión");
  return { session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } };
}

async function createStudents(req: Request, body: Record<string, unknown>) {
  const caller = await requireTeacher(req);
  const classroom = await requireOwnClassroom(caller, body.classroomId);

  const input = Array.isArray(body.students) ? body.students : [];
  if (input.length === 0 || input.length > MAX_STUDENTS_PER_CALL) {
    throw new HttpError(400, `Añade entre 1 y ${MAX_STUDENTS_PER_CALL} alumnos`);
  }
  const requirePin = body.requirePin === true;

  const created: { id: string; name: string; pin?: string }[] = [];
  const failed: { name: string; error: string }[] = [];

  for (let i = 0; i < input.length; i++) {
    const name = String((input[i] as { name?: unknown })?.name ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 1 || name.length > 30) {
      failed.push({ name, error: "El nombre debe tener entre 1 y 30 caracteres" });
      continue;
    }
    const email = `${crypto.randomUUID()}@students.codekid.invalid`;

    const { data: made, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: crypto.randomUUID() + crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { display_name: name.length < 2 ? `${name}.` : name, role: "student" },
    });
    if (createErr || !made.user) {
      failed.push({ name, error: "No se pudo crear la cuenta" });
      continue;
    }
    const id = made.user.id;

    try {
      await admin.auth.admin.updateUserById(id, { password: await derivePassword(id) });
      const pin = requirePin ? randomPin() : undefined;
      const { error: e1 } = await admin.from("classroom_members").insert({ classroom_id: classroom.id, student_id: id });
      const { error: e2 } = await admin.from("student_credentials").insert({
        student_id: id,
        login_email: email,
        pin_hash: pin ? await hashPin(pin) : null,
        created_by: caller.id,
      });
      const { error: e3 } = await admin.from("profiles").update({ avatar: {} }).eq("id", id);
      if (e1 || e2 || e3) throw new Error("db");
      created.push({ id, name, ...(pin ? { pin } : {}) });
    } catch {
      await admin.auth.admin.deleteUser(id); // no dejar cuentas a medias
      failed.push({ name, error: "No se pudo completar el alta" });
    }
  }
  return { created, failed };
}

async function setPin(req: Request, body: Record<string, unknown>) {
  const caller = await requireTeacher(req);
  const classroom = await requireOwnClassroom(caller, body.classroomId);
  const cred = await requireStudentOf(classroom.id, body.studentId);
  const pin = body.mode === "random" ? randomPin() : undefined;
  await admin
    .from("student_credentials")
    .update({ pin_hash: pin ? await hashPin(pin) : null, failed_count: 0, locked_until: null })
    .eq("student_id", cred.student_id as string);
  return pin ? { pin } : { pin: null };
}

async function removeStudent(req: Request, body: Record<string, unknown>) {
  const caller = await requireTeacher(req);
  const classroom = await requireOwnClassroom(caller, body.classroomId);
  const cred = await requireStudentOf(classroom.id, body.studentId);
  const { error } = await admin.auth.admin.deleteUser(cred.student_id as string);
  if (error) throw new HttpError(500, "No se pudo eliminar al alumno");
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    switch (body.action) {
      case "lookup":
        return json(await lookup(body));
      case "login":
        return json(await login(body));
      case "teacher-list": {
        const caller = await requireTeacher(req);
        const classroom = await requireOwnClassroom(caller, body.classroomId);
        return json({ students: await listStudents(classroom.id) });
      }
      case "create-students":
        return json(await createStudents(req, body));
      case "set-pin":
        return json(await setPin(req, body));
      case "remove-student":
        return json(await removeStudent(req, body));
      default:
        return json({ error: "Acción desconocida" }, 400);
    }
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message, ...err.extra }, err.status);
    console.error(err);
    return json({ error: "Error interno" }, 500);
  }
});
