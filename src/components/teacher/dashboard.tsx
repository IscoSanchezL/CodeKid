"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { callClassAccess, type CreatedStudent, type Student } from "@/lib/class-api";
import { createClient } from "@/lib/supabase/client";

type Classroom = { id: string; name: string; join_code: string };
type Me = { id: string; role: string; name: string };

export function TeacherDashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [newClass, setNewClass] = useState("");
  const [names, setNames] = useState("");
  const [requirePin, setRequirePin] = useState(false);
  const [lastCreated, setLastCreated] = useState<CreatedStudent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = classes.find((c) => c.id === selected) ?? null;

  const loadClasses = useCallback(async () => {
    const { data } = await createClient()
      .from("classrooms")
      .select("id, name, join_code")
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Classroom[];
    setClasses(list);
    setSelected((s) => s ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.replace("/login");
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) return router.replace("/mapa");
      setMe({ id: auth.user.id, role: profile.role, name: profile.display_name });
      await loadClasses();
    })();
  }, [router, loadClasses]);

  const loadStudents = useCallback(async (classroomId: string) => {
    try {
      const r = await callClassAccess<{ students: Student[] }>({ action: "teacher-list", classroomId });
      setStudents(r.students);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la lista");
    }
  }, []);

  useEffect(() => {
    setStudents([]);
    setLastCreated([]);
    setNotice(null);
    if (selected) void loadStudents(selected);
  }, [selected, loadStudents]);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setError(null);
    setBusy(true);
    const { data, error: err } = await createClient()
      .from("classrooms")
      .insert({ teacher_id: me.id, name: newClass.trim() })
      .select("id, name, join_code")
      .single();
    setBusy(false);
    if (err || !data) return setError("No se pudo crear la clase. El nombre debe tener entre 2 y 60 letras.");
    setNewClass("");
    await loadClasses();
    setSelected((data as Classroom).id);
  }

  async function addStudents(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    const list = names
      .split(/\n|,/)
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    if (list.length === 0) return setError("Escribe al menos un nombre.");
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const r = await callClassAccess<{ created: CreatedStudent[]; failed: { name: string; error: string }[] }>({
        action: "create-students",
        classroomId: current.id,
        students: list,
        requirePin,
      });
      setLastCreated(r.created);
      setNames("");
      if (r.failed.length) setError(`No se pudo añadir: ${r.failed.map((f) => `${f.name || "(vacío)"} (${f.error})`).join(", ")}`);
      await loadStudents(current.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo añadir");
    } finally {
      setBusy(false);
    }
  }

  async function resetPin(s: Student, mode: "random" | "none") {
    if (!current) return;
    setError(null);
    try {
      const r = await callClassAccess<{ pin: string | null }>({
        action: "set-pin",
        classroomId: current.id,
        studentId: s.id,
        mode,
      });
      setNotice(r.pin ? `Nuevo PIN de ${s.name}: ${r.pin}. Anótalo, no se vuelve a mostrar.` : `${s.name} ya no necesita PIN.`);
      await loadStudents(current.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el PIN");
    }
  }

  async function remove(s: Student) {
    if (!current || !window.confirm(`¿Eliminar a ${s.name}? Se borrará también su progreso.`)) return;
    setError(null);
    try {
      await callClassAccess({ action: "remove-student", classroomId: current.id, studentId: s.id });
      await loadStudents(current.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!me) return <p className="py-20 text-center text-muted">Cargando…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted">Sesión de {me.role === "admin" ? "super administrador" : "docente"}</p>
          <p className="font-bold">{me.name}</p>
          <button type="button" onClick={signOut} className="mt-2 text-sm font-medium text-danger">
            Cerrar sesión
          </button>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 font-bold">Mis clases</h2>
          <ul className="flex flex-col gap-1">
            {classes.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelected(c.id)}
                  aria-current={c.id === selected}
                  className={`w-full rounded-xl px-3 py-2 text-left font-semibold ${
                    c.id === selected ? "bg-brand text-brand-fg" : "hover:bg-surface-2"
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
            {classes.length === 0 && <li className="text-sm text-muted">Aún no tienes clases.</li>}
          </ul>
          <form onSubmit={createClass} className="mt-4 flex flex-col gap-2">
            <Input label="Nueva clase" name="className" value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="4.º B · Tecnología" />
            <Button type="submit" size="sm" disabled={busy || newClass.trim().length < 2}>
              Crear clase
            </Button>
          </form>
        </Card>
      </aside>

      <section className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl bg-success/10 p-3 text-sm font-medium text-success">
            {notice}
          </p>
        )}

        {!current ? (
          <Card className="text-center text-muted">Crea tu primera clase para obtener un código para tus alumnos.</Card>
        ) : (
          <>
            <Card>
              <p className="text-sm text-muted">Código de clase de «{current.name}»</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="font-mono text-5xl font-extrabold tracking-[0.2em] text-brand">{current.join_code}</span>
                <Button variant="outline" size="sm" onClick={() => void navigator.clipboard?.writeText(current.join_code)}>
                  Copiar
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted">
                Tus alumnos entran en{" "}
                <Link href="/clase" className="font-semibold text-brand">
                  /clase
                </Link>
                , escriben este código y eligen su nombre.
              </p>
            </Card>

            <Card>
              <h2 className="font-bold">Añadir alumnos</h2>
              <p className="mt-1 text-sm text-muted">
                Un nombre por línea. Usa solo el nombre de pila o un apodo: no pedimos correo ni datos personales.
              </p>
              <form onSubmit={addStudents} className="mt-3 flex flex-col gap-3">
                <textarea
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  rows={5}
                  aria-label="Nombres de los alumnos"
                  placeholder={"Ana\nLuis\nSofía"}
                  className="rounded-xl border border-border bg-surface p-3 text-base"
                />
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={requirePin} onChange={(e) => setRequirePin(e.target.checked)} className="h-4 w-4" />
                  Pedir un PIN de 4 números a cada alumno (se genera automáticamente)
                </label>
                <Button type="submit" disabled={busy}>
                  {busy ? "Añadiendo…" : "Añadir a la clase"}
                </Button>
              </form>

              {lastCreated.some((s) => s.pin) && (
                <div className="mt-4 rounded-xl border-2 border-dashed border-warn p-3">
                  <p className="text-sm font-bold">PINs generados: anótalos o imprímelos, no se vuelven a mostrar.</p>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {lastCreated.map((s) => (
                      <li key={s.id} className="flex justify-between rounded-lg bg-surface-2 px-3 py-1">
                        <span>
                          {s.avatar} {s.name}
                        </span>
                        <span className="font-mono font-bold">{s.pin}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="mt-3 print:hidden" onClick={() => window.print()}>
                    Imprimir
                  </Button>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 font-bold">Alumnos ({students.length})</h2>
              {students.length === 0 ? (
                <p className="text-sm text-muted">Todavía no hay alumnos en esta clase.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {students.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
                      <span className="text-2xl" aria-hidden>
                        {s.avatar}
                      </span>
                      <span className="flex-1 font-semibold">{s.name}</span>
                      <span className="text-xs text-muted">{s.hasPin ? "🔒 con PIN" : "sin PIN"}</span>
                      <Button variant="outline" size="sm" onClick={() => resetPin(s, "random")}>
                        {s.hasPin ? "Nuevo PIN" : "Poner PIN"}
                      </Button>
                      {s.hasPin && (
                        <Button variant="ghost" size="sm" onClick={() => resetPin(s, "none")}>
                          Quitar PIN
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => remove(s)}>
                        Eliminar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
