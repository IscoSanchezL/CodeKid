"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FuzzyAvatar } from "@/components/game/fuzzy-avatar";
import {
  callClassAccess,
  type CreatedStudent,
  type Student,
} from "@/lib/class-api";
import {
  CODE_RULE,
  cleanCode,
  suggestCode,
  suggestPassword,
} from "@/lib/class-codes";
import { createClient } from "@/lib/supabase/client";
import { AdminPanel } from "@/components/admin/admin-panel";
import { ProgressPanel } from "./progress-panel";
import { translateText, TX, useLang, useT } from "@/i18n";

type Classroom = {
  id: string;
  name: string;
  join_code: string;
  class_password: string | null;
};
type Me = { id: string; role: string; name: string };

/** Traduce los errores de la base de datos a mensajes que entienda un docente. */
function classError(err: { code?: string; message?: string } | null): string {
  if (!err) return "No se pudo guardar.";
  if (err.code === "23505")
    return "Ese código ya lo usa otra clase. Prueba con otro.";
  if (err.code === "23514")
    return `${CODE_RULE} La clave admite hasta 16 letras o números.`;
  return "No se pudo guardar. Inténtalo de nuevo.";
}

export function TeacherDashboard() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const [me, setMe] = useState<Me | null>(null);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // nueva clase
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [passTouched, setPassTouched] = useState(false);
  const [newUsePassword, setNewUsePassword] = useState(true);

  // ajustes de la clase elegida
  const [editCode, setEditCode] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editUsePassword, setEditUsePassword] = useState(true);

  const [names, setNames] = useState("");
  const [requirePin, setRequirePin] = useState(false);
  const [lastCreated, setLastCreated] = useState<CreatedStudent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"progress" | "students">("progress");
  const [view, setView] = useState<"classes" | "admin">("classes");

  const current = classes.find((c) => c.id === selected) ?? null;

  const loadClasses = useCallback(async () => {
    const { data } = await createClient()
      .from("classrooms")
      .select("id, name, join_code, class_password")
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
      if (!profile || (profile.role !== "teacher" && profile.role !== "admin"))
        return router.replace("/mapa");
      setMe({
        id: auth.user.id,
        role: profile.role,
        name: profile.display_name,
      });
      if (profile.role === "admin") setView("admin");
      await loadClasses();
    })();
  }, [router, loadClasses]);

  const loadStudents = useCallback(async (classroomId: string) => {
    try {
      const r = await callClassAccess<{ students: Student[] }>({
        action: "teacher-list",
        classroomId,
      });
      setStudents(r.students);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la lista",
      );
    }
  }, []);

  useEffect(() => {
    setStudents([]);
    setLastCreated([]);
    setNotice(null);
    if (selected) void loadStudents(selected);
  }, [selected, loadStudents]);

  useEffect(() => {
    if (!current) return;
    setEditCode(current.join_code);
    setEditPassword(current.class_password ?? "");
    setEditUsePassword(current.class_password !== null);
  }, [current]);

  // La sugerencia sigue al nombre mientras el docente no la haya tocado
  function onNewName(v: string) {
    setNewName(v);
    if (!codeTouched) setNewCode(suggestCode(v));
    if (!passTouched) setNewPassword(suggestPassword(v));
  }

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    const { data, error: err } = await createClient()
      .from("classrooms")
      .insert({
        teacher_id: me.id,
        name: newName.trim(),
        ...(newCode ? { join_code: newCode } : {}),
        class_password: newUsePassword && newPassword ? newPassword : null,
      })
      .select("id, name, join_code, class_password")
      .single();
    setBusy(false);
    if (err || !data)
      return setError(
        err?.code
          ? classError(err)
          : "No se pudo crear la clase. Revisa el nombre (2 a 60 letras).",
      );
    setNewName("");
    setNewCode("");
    setNewPassword("");
    setCodeTouched(false);
    setPassTouched(false);
    await loadClasses();
    setSelected((data as Classroom).id);
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    const { error: err } = await createClient()
      .from("classrooms")
      .update({
        join_code: editCode,
        class_password: editUsePassword && editPassword ? editPassword : null,
      })
      .eq("id", current.id);
    setBusy(false);
    if (err) return setError(classError(err));
    setNotice("Guardado. Tus alumnos ya deben usar los datos nuevos.");
    await loadClasses();
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
      const r = await callClassAccess<{
        created: CreatedStudent[];
        failed: { name: string; error: string }[];
      }>({
        action: "create-students",
        classroomId: current.id,
        students: list,
        requirePin,
      });
      setLastCreated(r.created);
      setNames("");
      if (r.failed.length)
        setError(
          t("t.err.addFailed", {
            list: r.failed.map((f) => `${f.name || t("t.empty")} (${translateText(lang, f.error)})`).join(", "),
          }),
        );
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
      setNotice(
        r.pin
          ? t("t.notice.newPin", { name: s.name, pin: r.pin })
          : t("t.notice.noPin", { name: s.name }),
      );
      await loadStudents(current.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar el PIN",
      );
    }
  }

  async function remove(s: Student) {
    if (
      !current ||
      !window.confirm(t("t.confirmRemove", { name: s.name }))
    )
      return;
    setError(null);
    try {
      await callClassAccess({
        action: "remove-student",
        classroomId: current.id,
        studentId: s.id,
      });
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

  if (!me) return <p className="py-20 text-center text-muted">{t("t.loading")}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="flex flex-col gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted">
            {t("t.session", { role: me.role === "admin" ? t("t.roleAdmin") : t("t.roleTeacher") })}
          </p>
          <p className="font-bold">{me.name}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 text-sm font-medium text-danger"
          >
            {t("t.logout")}
          </button>
          <Link
            href="/actualizar-clave"
            className="mt-2 block text-sm font-medium text-brand"
          >
            {t("t.changePass")}
          </Link>

          {me.role === "admin" && (
            <div className="mt-3 grid gap-1 border-t border-border pt-3">
              {(
                [
                  ["admin", t("t.viewAdmin")],
                  ["classes", t("t.viewClasses")],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  aria-pressed={view === id}
                  className={`rounded-xl px-3 py-2 text-left font-bold ${view === id ? "bg-brand text-brand-fg" : "hover:bg-surface-2"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className={`p-4 ${view === "admin" ? "hidden" : ""}`}>
          <h2 className="mb-3 font-bold">{t("t.myClasses")}</h2>
          <ul className="flex flex-col gap-1">
            {classes.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelected(c.id)}
                  aria-current={c.id === selected}
                  className={`w-full rounded-xl px-3 py-2 text-left font-semibold ${c.id === selected ? "bg-brand text-brand-fg" : "hover:bg-surface-2"}`}
                >
                  {c.name}
                  <span className="ml-2 font-mono text-xs opacity-70">
                    {c.join_code}
                  </span>
                </button>
              </li>
            ))}
            {classes.length === 0 && (
              <li className="text-sm text-muted">{t("t.noClasses")}</li>
            )}
          </ul>

          <form
            onSubmit={createClass}
            className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
          >
            <h3 className="text-sm font-bold">{t("t.newClass")}</h3>
            <Input
              label={t("t.className")}
              name="className"
              value={newName}
              onChange={(e) => onNewName(e.target.value)}
              placeholder="1A"
            />
            <Input
              label={t("t.classCode")}
              name="classCode"
              value={newCode}
              onChange={(e) => {
                setCodeTouched(true);
                setNewCode(cleanCode(e.target.value));
              }}
              placeholder="KID1A"
              className="font-mono uppercase tracking-widest"
              autoComplete="off"
            />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={newUsePassword}
                onChange={(e) => setNewUsePassword(e.target.checked)}
                className="h-4 w-4"
              />
              {t("t.askPassword")}
            </label>
            {newUsePassword && (
              <Input
                label={t("t.classPassword")}
                name="classPassword"
                value={newPassword}
                onChange={(e) => {
                  setPassTouched(true);
                  setNewPassword(cleanCode(e.target.value, 16));
                }}
                placeholder="1A"
                className="font-mono uppercase tracking-widest"
                autoComplete="off"
              />
            )}
            <Button
              type="submit"
              size="sm"
              disabled={busy || newName.trim().length < 2}
            >
              {t("t.createClass")}
            </Button>
          </form>
        </Card>
      </aside>

      <section className="flex flex-col gap-4">
        {view === "admin" && me.role === "admin" ? (
          <AdminPanel
            myId={me.id}
            onOpenClass={(id) => {
              setSelected(id);
              setView("classes");
            }}
          />
        ) : (
          <>
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

            {!current ? (
              <Card className="text-center text-muted">
                {t("t.firstClass")}
              </Card>
            ) : (
              <>
                <Card>
                  <p className="text-sm text-muted">
                    {t("t.howEnter", { name: current.name })}
                  </p>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        {t("t.step1")}
                      </p>
                      <p className="font-mono text-4xl font-extrabold tracking-[0.15em] text-brand">
                        {current.join_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        {t("t.step2")}
                      </p>
                      <p className="font-mono text-4xl font-extrabold tracking-[0.15em]">
                        {current.class_password ?? "—"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {t("t.at")}
                    <Link href="/clase" className="font-semibold text-brand">
                      /clase
                    </Link>
                    {t("t.atEnd")}
                    {current.class_password ? t("t.andPassword") : ""}.
                  </p>

                  <form
                    onSubmit={saveSettings}
                    className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                  >
                    <Input
                      label={t("t.changeCode")}
                      name="editCode"
                      value={editCode}
                      onChange={(e) => setEditCode(cleanCode(e.target.value))}
                      className="font-mono uppercase tracking-widest"
                      autoComplete="off"
                    />
                    <div className="flex flex-col gap-1.5">
                      <Input
                        label={t("t.changePassword")}
                        name="editPassword"
                        value={editPassword}
                        disabled={!editUsePassword}
                        onChange={(e) =>
                          setEditPassword(cleanCode(e.target.value, 16))
                        }
                        className="font-mono uppercase tracking-widest"
                        autoComplete="off"
                      />
                      <label className="flex items-center gap-2 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={editUsePassword}
                          onChange={(e) => setEditUsePassword(e.target.checked)}
                          className="h-4 w-4"
                        />
                        {t("t.askPasswordShort")}
                      </label>
                    </div>
                    <Button
                      type="submit"
                      disabled={busy || editCode.length < 4}
                    >
                      {t("t.save")}
                    </Button>
                  </form>
                </Card>

                <div
                  role="tablist"
                  aria-label={t("t.sections")}
                  className="flex gap-2"
                >
                  {(
                    [
                      ["progress", t("t.tabProgress")],
                      ["students", t("t.tabStudents")],
                    ] as const
                  ).map(([id, label]) => (
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

                {tab === "progress" && (
                  <ProgressPanel
                    classroomId={current.id}
                    students={students}
                    className={current.name}
                  />
                )}

                {tab === "students" && (
                  <>
                    <Card>
                      <h2 className="font-bold">{t("t.addStudents")}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {t("t.addHelp")}
                      </p>
                      <form
                        onSubmit={addStudents}
                        className="mt-3 flex flex-col gap-3"
                      >
                        <textarea
                          value={names}
                          onChange={(e) => setNames(e.target.value)}
                          rows={5}
                          aria-label={t("t.namesAria")}
                          placeholder={t("t.namesPlaceholder")}
                          className="rounded-xl border border-border bg-surface p-3 text-base"
                        />
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={requirePin}
                            onChange={(e) => setRequirePin(e.target.checked)}
                            className="h-4 w-4"
                          />
                          {t("t.requirePin")}
                        </label>
                        <Button type="submit" disabled={busy}>
                          {busy ? t("t.adding") : t("t.addToClass")}
                        </Button>
                      </form>

                      {lastCreated.some((s) => s.pin) && (
                        <div className="mt-4 rounded-xl border-2 border-dashed border-warn p-3">
                          <p className="text-sm font-bold">
                            {t("t.pinsGenerated")}
                          </p>
                          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                            {lastCreated.map((s) => (
                              <li
                                key={s.id}
                                className="flex justify-between rounded-lg bg-surface-2 px-3 py-1"
                              >
                                <span className="flex items-center gap-2">
                                  <FuzzyAvatar id={s.id} size={28} /> {s.name}
                                </span>
                                <span className="font-mono font-bold">
                                  {s.pin}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 print:hidden"
                            onClick={() => window.print()}
                          >
                            {t("t.print")}
                          </Button>
                        </div>
                      )}
                    </Card>

                    <Card>
                      <h2 className="mb-3 font-bold">
                        {t("t.studentsN", { n: students.length })}
                      </h2>
                      {students.length === 0 ? (
                        <p className="text-sm text-muted">
                          {t("t.noStudents")}
                        </p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {students.map((s) => (
                            <li
                              key={s.id}
                              className="flex flex-wrap items-center gap-3 py-2"
                            >
                              <FuzzyAvatar
                                id={s.id}
                                avatar={s.avatar}
                                size={40}
                              />
                              <span className="flex-1 font-semibold">
                                {s.name}
                              </span>
                              <span
                                className="text-sm font-bold text-warn"
                                title={t("t.coins")}
                              >
                                🪙 {s.coins ?? 0}
                              </span>
                              <span className="text-xs text-muted">
                                {s.hasPin ? t("t.withPin") : t("t.noPin")}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resetPin(s, "random")}
                              >
                                {s.hasPin ? t("t.newPin") : t("t.setPin")}
                              </Button>
                              {s.hasPin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resetPin(s, "none")}
                                >
                                  {t("t.removePin")}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-danger"
                                onClick={() => remove(s)}
                              >
                                {t("t.delete")}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
