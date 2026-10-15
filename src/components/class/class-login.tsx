"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FuzzyAvatar } from "@/components/game/fuzzy-avatar";
import { ApiError, callClassAccess, type Student } from "@/lib/class-api";
import { createClient } from "@/lib/supabase/client";

type Base = { className: string; needsPassword: boolean; students: Student[] };
type Step =
  | { name: "code" }
  | ({ name: "pick" } & Base)
  | ({ name: "password"; student: Student } & Base)
  | ({ name: "pin"; student: Student; password?: string } & Base);

const clean = (v: string, max: number) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, max);

export function ClassLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "code" });
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function findClass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await callClassAccess<{ classroom: { name: string; needsPassword: boolean }; students: Student[] }>({
        action: "lookup",
        code,
      });
      setStep({ name: "pick", className: r.classroom.name, needsPassword: r.classroom.needsPassword, students: r.students });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  }

  async function enter(student: Student, creds: { password?: string; pin?: string }) {
    setError(null);
    setBusy(true);
    try {
      const r = await callClassAccess<{ session: { access_token: string; refresh_token: string } }>({
        action: "login",
        code,
        studentId: student.id,
        ...creds,
      });
      const { error: sessionError } = await createClient().auth.setSession(r.session);
      if (sessionError) throw sessionError;
      router.push("/mapa");
      router.refresh();
    } catch (err) {
      setPin("");
      const base = step.name === "code" ? null : { className: step.className, needsPassword: step.needsPassword, students: step.students };
      if (err instanceof ApiError && err.needs && base) {
        // Falta o falló un dato: se vuelve al paso que corresponde, con el mensaje
        setStep(
          err.needs === "password"
            ? { name: "password", student, ...base }
            : { name: "pin", student, password: creds.password, ...base },
        );
      }
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  }

  function choose(student: Student) {
    if (step.name !== "pick") return;
    setError(null);
    setPassword("");
    setPin("");
    const base = { className: step.className, needsPassword: step.needsPassword, students: step.students };
    if (step.needsPassword) setStep({ name: "password", student, ...base });
    else if (student.hasPin) setStep({ name: "pin", student, ...base });
    else void enter(student, {});
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (step.name !== "password" || !password) return;
    if (step.student.hasPin) {
      setError(null);
      setStep({ name: "pin", student: step.student, password, className: step.className, needsPassword: step.needsPassword, students: step.students });
    } else {
      void enter(step.student, { password });
    }
  }

  function press(d: string) {
    if (step.name !== "pin" || busy) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) void enter(step.student, { password: step.password, pin: next });
  }

  function backToList() {
    if (step.name === "code") return;
    setStep({ name: "pick", className: step.className, needsPassword: step.needsPassword, students: step.students });
    setPassword("");
    setPin("");
    setError(null);
  }

  if (step.name === "code") {
    return (
      <Card>
        <h1 className="text-2xl font-extrabold">Entra a tu clase</h1>
        <p className="mt-1 text-muted">Escribe el código que te dio tu docente.</p>
        <form onSubmit={findClass} className="mt-6 flex flex-col gap-4">
          <label className="sr-only" htmlFor="code">
            Código de clase
          </label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(clean(e.target.value, 12))}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            placeholder="KID1A"
            className="h-16 rounded-xl border-2 border-border bg-surface text-center font-mono text-3xl font-bold uppercase tracking-[0.25em] text-fg placeholder:text-muted/50"
          />
          {error && (
            <p role="alert" className="text-center text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy || code.length < 4}>
            {busy ? "Buscando…" : "Buscar mi clase"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          ¿Eres docente o tutor?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Entra aquí
          </Link>
        </p>
      </Card>
    );
  }

  if (step.name === "pick") {
    return (
      <Card>
        <h1 className="text-2xl font-extrabold">{step.className}</h1>
        <p className="mt-1 text-muted">¿Quién eres? Toca tu nombre.</p>
        {step.students.length === 0 ? (
          <p className="mt-6 rounded-xl bg-surface-2 p-4 text-center text-muted">
            Esta clase todavía no tiene alumnos. Pídele a tu docente que te añada.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {step.students.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => choose(s)}
                  className="flex w-full flex-col items-center gap-1 rounded-2xl border border-border bg-surface-2 p-3 transition-transform hover:-translate-y-0.5 hover:border-brand disabled:opacity-50"
                >
                  <FuzzyAvatar id={s.id} avatar={s.avatar} size={56} />
                  <span className="break-words text-center text-sm font-bold">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="mt-4 text-center text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setStep({ name: "code" });
            setError(null);
          }}
          className="mt-6 w-full text-center text-sm font-medium text-muted hover:text-fg"
        >
          ← Cambiar de clase
        </button>
      </Card>
    );
  }

  if (step.name === "password") {
    return (
      <Card className="text-center">
        <div className="fz-idle mx-auto w-fit">
          <FuzzyAvatar id={step.student.id} avatar={step.student.avatar} size={110} />
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">Hola, {step.student.name}</h1>
        <p className="mt-1 text-muted">Escribe la clave de tu clase.</p>
        <form onSubmit={submitPassword} className="mt-5 flex flex-col gap-3">
          <label className="sr-only" htmlFor="class-password">
            Clave de la clase
          </label>
          <input
            id="class-password"
            value={password}
            onChange={(e) => setPassword(clean(e.target.value, 16))}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            placeholder="1A"
            className="h-14 rounded-xl border-2 border-border bg-surface text-center font-mono text-2xl font-bold uppercase tracking-[0.2em] text-fg placeholder:text-muted/50"
          />
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy || !password}>
            {busy ? "Entrando…" : step.student.hasPin ? "Siguiente" : "Entrar"}
          </Button>
        </form>
        <button type="button" onClick={backToList} className="mt-5 text-sm font-medium text-muted hover:text-fg">
          ← No soy yo
        </button>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <div className="fz-idle mx-auto w-fit">
        <FuzzyAvatar id={step.student.id} avatar={step.student.avatar} size={110} />
      </div>
      <h1 className="mt-2 text-2xl font-extrabold">Hola, {step.student.name}</h1>
      <p className="mt-1 text-muted">Escribe tu PIN de 4 números.</p>
      <div className="my-5 flex justify-center gap-3" role="status" aria-label={`${pin.length} de 4 números escritos`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full border-2 border-brand ${i < pin.length ? "bg-brand" : ""}`} />
        ))}
      </div>
      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="mx-auto grid max-w-[240px] grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Button key={d} type="button" variant="secondary" size="lg" disabled={busy} onClick={() => press(d)}>
            {d}
          </Button>
        ))}
        <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Borrar">
          ⌫
        </Button>
        <Button type="button" variant="secondary" size="lg" disabled={busy} onClick={() => press("0")}>
          0
        </Button>
      </div>
      <button type="button" onClick={backToList} className="mt-6 text-sm font-medium text-muted hover:text-fg">
        ← No soy yo
      </button>
    </Card>
  );
}
