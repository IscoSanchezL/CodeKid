"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  callAdmin,
  type AdminClass,
  type AdminUser,
  type AuditEntry,
  type Overview,
} from "@/lib/admin-api";
import { TX, translateText, useLang, useT, type Lang, type TFn } from "@/i18n";

type Tab = "overview" | "users" | "classes" | "audit";
const TABS: [Tab, string][] = [
  ["overview", "a.tabOverview"],
  ["users", "a.tabUsers"],
  ["classes", "a.tabClasses"],
  ["audit", "a.tabAudit"],
];

const fmt = (iso: string | null, lang: Lang, t: TFn) =>
  iso
    ? new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "es", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : t("a.never");

/** Detalle de una entrada del registro (se guarda en español en la base de datos; aquí solo se muestra). */
function auditDetail(detail: string, lang: Lang, t: TFn): string {
  let m: RegExpExecArray | null;
  if ((m = /^rol (\w+)$/.exec(detail))) return t("audit.dRole", { role: t(`role.${m[1]}`) });
  if ((m = /^(\w+) → (\w+)$/.exec(detail))) return `${t(`role.${m[1]}`)} → ${t(`role.${m[2]}`)}`;
  if ((m = /^a (.+)$/.exec(detail))) return t("audit.dTo", { name: m[1] });
  if ((m = /^(\d+) alumno\(s\) eliminados$/.exec(detail))) return t("audit.dRemoved", { n: m[1] });
  return translateText(lang, detail);
}

/** Panel del super administrador: ve y controla todas las cuentas, clases y la actividad de la plataforma. */
export function AdminPanel({
  myId,
  onOpenClass,
}: {
  myId: string;
  onOpenClass: (classroomId: string) => void;
}) {
  const t = useT();
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
        aria-label={t("a.aria")}
        className="flex flex-wrap gap-2"
      >
        {TABS.map(([id, labelKey]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2 font-bold ${tab === id ? "bg-brand text-brand-fg" : "bg-surface-2 hover:bg-border"}`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger"
        >
          <TX text={error} />
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-success/10 p-3 text-sm font-medium text-success"
        >
          <TX text={notice} />
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
  const t = useT();
  const [o, setO] = useState<Overview | null>(null);
  useEffect(() => {
    void run(() => callAdmin<Overview>({ action: "overview" })).then(
      (r) => r && setO(r),
    );
  }, [run]);
  if (!o) return <Card className="text-muted">{t("a.loading")}</Card>;
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
      <h2 className="font-bold">{t("a.platform")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat(t("a.students"), o.students, "text-brand")}
        {stat(t("a.teachers"), o.teachers)}
        {stat(t("a.classes"), o.classes)}
        {stat(t("a.activeWeek"), o.activeWeek)}
        {stat(t("a.completed"), o.completed)}
        {stat(t("a.starsWon"), o.totalStars, "text-warn")}
        {stat(t("a.fails"), o.totalFails)}
        {stat(t("a.guardiansAdmins"), `${o.guardians} / ${o.admins}`)}
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
  const t = useT();
  const lang = useLang();
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
          <p className="font-bold">{t("a.tempPass", { email: secret.email })}</p>
          <p className="mt-1 font-mono text-2xl font-extrabold tracking-wider">
            {secret.password}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t("a.tempHelp")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setSecret(null)}
          >
            {t("a.noted")}
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="font-bold">{t("a.createAccount")}</h2>
        <form
          onSubmit={create}
          className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
        >
          <Input label={t("a.email")} name="email" type="email" required />
          <Input
            label={t("a.name")}
            name="name"
            required
            minLength={2}
            maxLength={40}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("a.role")}
            <select
              name="role"
              defaultValue="teacher"
              className="field h-11 rounded-xl border border-border bg-surface px-3 text-base"
            >
              <option value="teacher">{t("role.teacher")}</option>
              <option value="guardian">{t("role.guardian")}</option>
              <option value="admin">{t("role.admin")}</option>
            </select>
          </label>
          <Button type="submit" disabled={busy}>
            {t("a.create")}
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-3 font-bold">{t("a.accountsN", { n: users.length })}</h2>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-2">{t("a.person")}</th>
              <th className="p-2">{t("a.role")}</th>
              <th className="p-2">{t("a.classesStudents")}</th>
              <th className="p-2">{t("a.lastAccess")}</th>
              <th className="p-2 text-right">{t("a.actions")}</th>
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
                      {me && <span className="text-xs text-muted">{t("a.you")}</span>}
                      {u.banned && (
                        <span className="ml-1 rounded bg-danger/15 px-1.5 text-xs font-bold text-danger">
                          {t("a.suspended")}
                        </span>
                      )}
                    </p>
                    <p className="break-all text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="p-2">
                    <select
                      aria-label={t("a.roleOf", { name: u.name })}
                      value={u.role}
                      disabled={me || busy}
                      onChange={(e) => {
                        if (
                          window.confirm(
                            t("a.confirmRole", { name: u.name, role: t(`role.${e.target.value}`) }),
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
                      <option value="teacher">{t("role.teacher")}</option>
                      <option value="guardian">{t("role.guardian")}</option>
                      <option value="admin">{t("role.admin")}</option>
                      <option value="student">{t("role.student")}</option>
                    </select>
                  </td>
                  <td className="p-2">
                    {u.classes} / {u.students}
                  </td>
                  <td className="p-2 text-muted">{fmt(u.lastSignIn, lang, t)}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              t("a.confirmReset", { name: u.name }),
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
                        {t("a.newPass")}
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
                            {u.banned ? t("a.reactivate") : t("a.suspend")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger"
                            disabled={busy}
                            onClick={() => {
                              if (
                                window.confirm(
                                  t("a.confirmDelete", { name: u.name }),
                                )
                              )
                                void act(
                                  { action: "delete-user", userId: u.id },
                                  "Cuenta eliminada.",
                                );
                            }}
                          >
                            {t("a.delete")}
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
  const t = useT();
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
      <h2 className="mb-3 font-bold">{t("a.allClasses", { n: classes.length })}</h2>
      {classes.length === 0 ? (
        <p className="text-sm text-muted">{t("a.noClasses")}</p>
      ) : (
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-2">{t("a.class")}</th>
              <th className="p-2">{t("a.codeKey")}</th>
              <th className="p-2">{t("a.teacher")}</th>
              <th className="p-2">{t("a.studentsCol")}</th>
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
                    aria-label={t("a.teacherOf", { name: c.name })}
                    value={c.teacherId}
                    disabled={busy}
                    onChange={(e) => {
                      const tch = teachers.find((x) => x.id === e.target.value);
                      if (
                        tch &&
                        window.confirm(t("a.confirmMove", { cls: c.name, name: tch.name }))
                      )
                        void act(
                          {
                            action: "reassign-class",
                            classroomId: c.id,
                            teacherId: tch.id,
                          },
                          "Clase pasada.",
                        );
                    }}
                    className="field max-w-[14rem] rounded-lg border border-border bg-surface px-2 py-1"
                  >
                    {teachers.map((tch) => (
                      <option key={tch.id} value={tch.id}>
                        {tch.name} ({tch.email})
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
                      {t("a.open")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            t("a.confirmDeleteClass", { name: c.name, n: c.students }),
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
                      {t("a.delete")}
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
  const t = useT();
  const lang = useLang();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  useEffect(() => {
    void run(() =>
      callAdmin<{ entries: AuditEntry[] }>({ action: "audit" }),
    ).then((r) => r && setEntries(r.entries));
  }, [run]);
  return (
    <Card>
      <h2 className="mb-3 font-bold">{t("a.auditTitle")}</h2>
      {entries === null ? (
        <p className="text-sm text-muted">{t("a.loading")}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">{t("a.noAudit")}</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-3 py-2">
              <span className="w-32 shrink-0 text-muted">
                {fmt(e.created_at, lang, t)}
              </span>
              <span className="font-semibold">{e.actor_name}</span>
              <span>
                {t(`audit.${e.action}`) === `audit.${e.action}` ? e.action : t(`audit.${e.action}`)}: <strong>{e.target}</strong>
                {e.detail && <span className="text-muted"> · {auditDetail(e.detail, lang, t)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
