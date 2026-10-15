"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  callAdmin,
  ROLE_LABEL,
  type AdminClass,
  type AdminUser,
  type AuditEntry,
  type Overview,
} from "@/lib/admin-api";

type Tab = "overview" | "users" | "classes" | "audit";
const TABS: [Tab, string][] = [
  ["overview", "📈 Resumen"],
  ["users", "👥 Cuentas"],
  ["classes", "🏫 Clases"],
  ["audit", "🧾 Registro"],
];

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Nunca";

/** Panel del super administrador: ve y controla todas las cuentas, clases y la actividad de la plataforma. */
export function AdminPanel({
  myId,
  onOpenClass,
}: {
  myId: string;
  onOpenClass: (classroomId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setError(null);
      try {
        return await fn();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo completar la acción",
        );
        return null;
      }
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Administración"
        className="flex flex-wrap gap-2"
      >
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2 font-bold ${tab === id ? "bg-brand text-brand-fg" : "bg-surface-2 hover:bg-border"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-success/10 p-3 text-sm font-medium text-success"
        >
          {notice}
        </p>
      )}
      {tab === "overview" && <OverviewTab run={run} />}
      {tab === "users" && (
        <UsersTab myId={myId} run={run} setNotice={setNotice} />
      )}
      {tab === "classes" && (
        <ClassesTab run={run} setNotice={setNotice} onOpenClass={onOpenClass} />
      )}
      {tab === "audit" && <AuditTab run={run} />}
    </div>
  );
}

type Run = <T>(fn: () => Promise<T>) => Promise<T | null>;

function OverviewTab({ run }: { run: Run }) {
  const [o, setO] = useState<Overview | null>(null);
  useEffect(() => {
    void run(() => callAdmin<Overview>({ action: "overview" })).then(
      (r) => r && setO(r),
    );
  }, [run]);
  if (!o) return <Card className="text-muted">Cargando…</Card>;
  const stat = (label: string, value: number | string, tone = "") => (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`text-3xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
  return (
    <Card>
      <h2 className="font-bold">Toda la plataforma</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat("Estudiantes", o.students, "text-brand")}
        {stat("Docentes", o.teachers)}
        {stat("Clases", o.classes)}
        {stat("Activos esta semana", o.activeWeek)}
        {stat("Retos superados", o.completed)}
        {stat("Estrellas ganadas", o.totalStars, "text-warn")}
        {stat("Intentos fallidos", o.totalFails)}
        {stat("Tutores / admins", `${o.guardians} / ${o.admins}`)}
      </div>
    </Card>
  );
}

function UsersTab({
  myId,
  run,
  setNotice,
}: {
  myId: string;
  run: Run;
  setNotice: (s: string | null) => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [secret, setSecret] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await run(() =>
      callAdmin<{ users: AdminUser[] }>({ action: "users" }),
    );
    if (r) setUsers(r.users);
  }, [run]);
  useEffect(() => {
    void load();
  }, [load]);

  async function act(
    body: Record<string, unknown>,
    ok: string,
    then?: (r: { email: string; password: string }) => void,
  ) {
    setBusy(true);
    setNotice(null);
    const r = await run(() => callAdmin<{ email: string; password: string }>(body));
    setBusy(false);
    if (r) {
      setNotice(ok);
      then?.(r);
      await load();
    }
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    await act(
      {
        action: "create-user",
        email: d.get("email"),
        name: d.get("name"),
        role: d.get("role"),
      },
      "Cuenta creada. Anota la contraseña temporal: no se vuelve a mostrar.",
      (r) => {
        setSecret({ email: r.email, password: r.password });
        form.reset();
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {secret && (
        <Card className="border-2 border-dashed border-warn">
          <p className="font-bold">Contraseña temporal de {secret.email}</p>
          <p className="mt-1 font-mono text-2xl font-extrabold tracking-wider">
            {secret.password}
          </p>
          <p className="mt-1 text-sm text-muted">
            Entrégala en persona. Esa persona puede cambiarla desde su panel
            («Cambiar mi contraseña»).
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setSecret(null)}
          >
            Ya la anoté
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="font-bold">Crear una cuenta</h2>
        <form
          onSubmit={create}
          className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
        >
          <Input label="Correo" name="email" type="email" required />
          <Input
            label="Nombre"
            name="name"
            required
            minLength={2}
            maxLength={40}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Rol
            <select
              name="role"
              defaultValue="teacher"
              className="field h-11 rounded-xl border border-border bg-surface px-3 text-base"
            >
              <option value="teacher">Docente</option>
              <option value="guardian">Tutor</option>
              <option value="admin">Super admin</option>
            </select>
          </label>
          <Button type="submit" disabled={busy}>
            Crear
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-3 font-bold">Cuentas ({users.length})</h2>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-2">Persona</th>
              <th className="p-2">Rol</th>
              <th className="p-2">Clases / alumnos</th>
              <th className="p-2">Último acceso</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const me = u.id === myId;
              return (
                <tr key={u.id} className={u.banned ? "opacity-60" : ""}>
                  <td className="p-2">
                    <p className="font-semibold">
                      {u.name}{" "}
                      {me && <span className="text-xs text-muted">(tú)</span>}
                      {u.banned && (
                        <span className="ml-1 rounded bg-danger/15 px-1.5 text-xs font-bold text-danger">
                          suspendida
                        </span>
                      )}
                    </p>
                    <p className="break-all text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="p-2">
                    <select
                      aria-label={`Rol de ${u.name}`}
                      value={u.role}
                      disabled={me || busy}
                      onChange={(e) => {
                        if (
                          window.confirm(
                            `¿Cambiar a ${u.name} a «${ROLE_LABEL[e.target.value as AdminUser["role"]]}»?`,
                          )
                        )
                          void act(
                            {
                              action: "set-role",
                              userId: u.id,
                              role: e.target.value,
                            },
                            "Rol actualizado.",
                          );
                      }}
                      className="field rounded-lg border border-border bg-surface px-2 py-1"
                    >
                      <option value="teacher">Docente</option>
                      <option value="guardian">Tutor</option>
                      <option value="admin">Super admin</option>
                      <option value="student">Estudiante</option>
                    </select>
                  </td>
                  <td className="p-2">
                    {u.classes} / {u.students}
                  </td>
                  <td className="p-2 text-muted">{fmt(u.lastSignIn)}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Crear una contraseña temporal nueva para ${u.name}? La actual dejará de servir.`,
                            )
                          )
                            void act(
                              { action: "reset-password", userId: u.id },
                              "Contraseña restablecida. Anótala.",
                              (r) =>
                                setSecret({
                                  email: u.email,
                                  password: r.password,
                                }),
                            );
                        }}
                      >
                        Clave nueva
                      </Button>
                      {!me && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              void act(
                                {
                                  action: "set-banned",
                                  userId: u.id,
                                  banned: !u.banned,
                                },
                                u.banned
                                  ? "Cuenta reactivada."
                                  : "Cuenta suspendida.",
                              )
                            }
                          >
                            {u.banned ? "Reactivar" : "Suspender"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger"
                            disabled={busy}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar la cuenta de ${u.name}? No se puede deshacer.`,
                                )
                              )
                                void act(
                                  { action: "delete-user", userId: u.id },
                                  "Cuenta eliminada.",
                                );
                            }}
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ClassesTab({
  run,
  setNotice,
  onOpenClass,
}: {
  run: Run;
  setNotice: (s: string | null) => void;
  onOpenClass: (id: string) => void;
}) {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [teachers, setTeachers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await run(() =>
      callAdmin<{
        classes: AdminClass[];
        teachers: { id: string; name: string; email: string }[];
      }>({ action: "classes" }),
    );
    if (r) {
      setClasses(r.classes);
      setTeachers(r.teachers);
    }
  }, [run]);
  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>, ok: string) {
    setBusy(true);
    setNotice(null);
    const r = await run(() => callAdmin(body));
    setBusy(false);
    if (r) {
      setNotice(ok);
      await load();
    }
  }

  return (
    <Card className="overflow-x-auto">
      <h2 className="mb-3 font-bold">Todas las clases ({classes.length})</h2>
      {classes.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay clases.</p>
      ) : (
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-2">Clase</th>
              <th className="p-2">Código / clave</th>
              <th className="p-2">Docente</th>
              <th className="p-2">Alumnos</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {classes.map((c) => (
              <tr key={c.id}>
                <td className="p-2 font-semibold">{c.name}</td>
                <td className="p-2 font-mono">
                  {c.code} / {c.password ?? "—"}
                </td>
                <td className="p-2">
                  <select
                    aria-label={`Docente de ${c.name}`}
                    value={c.teacherId}
                    disabled={busy}
                    onChange={(e) => {
                      const t = teachers.find((x) => x.id === e.target.value);
                      if (
                        t &&
                        window.confirm(`¿Pasar «${c.name}» a ${t.name}?`)
                      )
                        void act(
                          {
                            action: "reassign-class",
                            classroomId: c.id,
                            teacherId: t.id,
                          },
                          "Clase pasada.",
                        );
                    }}
                    className="field max-w-[14rem] rounded-lg border border-border bg-surface px-2 py-1"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">{c.students}</td>
                <td className="p-2">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenClass(c.id)}
                    >
                      Abrir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Eliminar la clase «${c.name}» y sus ${c.students} alumno(s) con todo su progreso? No se puede deshacer.`,
                          )
                        )
                          void act(
                            {
                              action: "delete-class",
                              classroomId: c.id,
                              deleteStudents: true,
                            },
                            "Clase eliminada.",
                          );
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function AuditTab({ run }: { run: Run }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  useEffect(() => {
    void run(() =>
      callAdmin<{ entries: AuditEntry[] }>({ action: "audit" }),
    ).then((r) => r && setEntries(r.entries));
  }, [run]);
  return (
    <Card>
      <h2 className="mb-3 font-bold">Registro de acciones</h2>
      {entries === null ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay acciones registradas.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-3 py-2">
              <span className="w-32 shrink-0 text-muted">
                {fmt(e.created_at)}
              </span>
              <span className="font-semibold">{e.actor_name}</span>
              <span>
                {e.action}: <strong>{e.target}</strong>
                {e.detail && <span className="text-muted"> · {e.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
