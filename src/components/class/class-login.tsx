"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, callClassAccess, type Student } from "@/lib/class-api";
import { createClient } from "@/lib/supabase/client";

type Step =
  | { name: "code" }
  | { name: "pick"; className: string; students: Student[] }
  | { name: "pin"; className: string; students: Student[]; student: Student };

export function ClassLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "code" });
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function findClass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await callClassAccess<{ classroom: { name: string }; students: Student[] }>({ action: "lookup", code });
      setStep({ name: "pick", className: r.classroom.name, students: r.students });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  }

  async function enter(student: Student, pinValue?: string) {
    setError(null);
    setBusy(true);
    try {
      const r = await callClassAccess<{ session: { access_token: string; refresh_token: string } }>({
        action: "login",
        code,
        studentId: student.id,
        pin: pinValue,
      });
      const { error: sessionError } = await createClient().auth.setSession(r.session);
      if (sessionError) throw sessionError;
      router.push("/mapa");
      router.refresh();
    } catch (err) {
      setPin("");
      if (err instanceof ApiError && err.needsPin && !pinValue && step.name === "pick") {
        // La lista estaba desactualizada: este alumno ahora pide PIN
        setStep({ ...step, name: "pin", student });
      } else {
        setError(err instanceof Error ? err.message : "Algo salió mal");
      }
    } finally {
      setBusy(false);
    }
  }

  function choose(student: Student) {
    if (step.name !== "pick") return;
    if (student.hasPin) {
      setError(null);
      setPin("");
      setStep({ ...step, name: "pin", student });
    } else {
      void enter(student);
    }
  }

  function press(d: string) {
    if (step.name !== "pin" || busy) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) void enter(step.student, next);
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
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
            autoComplete="off"
            autoCapitalize="characters"
            autoFocus
            placeholder="ABC123"
            className="h-16 rounded-xl border-2 border-border bg-surface text-center font-mono text-3xl font-bold tracking-[0.3em] text-fg placeholder:text-muted/50"
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
                  <span className="text-4xl" aria-hidden>
                    {s.avatar}
                  </span>
                  <span className="break-words text-center text-sm font-bold">{s.name}</span>
                  {s.hasPin && (
                    <span className="text-xs text-muted">
                      <span aria-hidden>🔒</span> con PIN
                    </span>
                  )}
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

  return (
    <Card className="text-center">
      <p className="text-6xl" aria-hidden>
        {step.student.avatar}
      </p>
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
      <button
        type="button"
        onClick={() => {
          setStep({ name: "pick", className: step.className, students: step.students });
          setPin("");
          setError(null);
        }}
        className="mt-6 text-sm font-medium text-muted hover:text-fg"
      >
        ← No soy yo
      </button>
    </Card>
  );
}
