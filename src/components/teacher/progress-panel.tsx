"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FuzzyAvatar } from "@/components/game/fuzzy-avatar";
import { CHALLENGES } from "@/engine/levels";
import type { Student } from "@/lib/class-api";
import {
  activityLabel,
  buildReport,
  cellKey,
  toCsv,
  type AttemptRow,
  type Challenge,
  type ProfileRow,
  type ProgressRow,
  type StudentReport,
} from "@/lib/report";
import { createClient } from "@/lib/supabase/client";

const CATALOG: Challenge[] = CHALLENGES.map((c) => ({
  level: c.level,
  challenge: c.challenge,
  title: c.title,
  par: c.par,
}));

type Ledger = { delta: number; reason: string; created_at: string };

function reasonLabel(r: string): string {
  if (r.startsWith("compra:")) return `Compró «${r.slice(7)}»`;
  if (r.startsWith("diario:")) return `Bonus diario (${r.slice(7)})`;
  if (r.startsWith("reto:")) return `Reto ${r.slice(5)} superado`;
  return r;
}

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} de 3 estrellas`} className="whitespace-nowrap">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? "text-warn" : "text-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ProgressPanel({
  classroomId,
  students,
  className,
}: {
  classroomId: string;
  students: Student[];
  className: string;
}) {
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<Ledger[] | null>(null);
  const [now, setNow] = useState(() => new Date());

  const ids = useMemo(() => students.map((s) => s.id), [students]);

  const load = useCallback(async () => {
    if (ids.length === 0) {
      setProgress([]);
      setAttempts([]);
      setProfiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const [p, a, pr] = await Promise.all([
      supabase
        .from("progress")
        .select(
          "student_id, level, challenge, stars, attempts, best_blocks, completed_at",
        )
        .in("student_id", ids),
      supabase
        .from("challenge_attempts")
        .select("student_id, level, challenge, failures, last_attempt_at")
        .in("student_id", ids),
      supabase
        .from("profiles")
        .select("id, coins, streak_days, last_play_date")
        .in("id", ids),
    ]);
    if (p.error || a.error || pr.error)
      setError("No se pudo cargar el progreso. Inténtalo de nuevo.");
    setProgress((p.data ?? []) as ProgressRow[]);
    setAttempts((a.data ?? []) as AttemptRow[]);
    setProfiles((pr.data ?? []) as ProfileRow[]);
    setNow(new Date());
    setLoading(false);
  }, [ids]);

  useEffect(() => {
    void load();
  }, [load, classroomId]);

  useEffect(() => {
    setOpenId(null);
  }, [classroomId]);

  useEffect(() => {
    setLedger(null);
    if (!openId) return;
    let alive = true;
    void (async () => {
      const { data } = await createClient()
        .from("coin_ledger")
        .select("delta, reason, created_at")
        .eq("student_id", openId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (alive) setLedger((data ?? []) as Ledger[]);
    })();
    return () => {
      alive = false;
    };
  }, [openId]);

  const { rows, summary } = useMemo(
    () =>
      buildReport(
        students.map((s) => ({ id: s.id, name: s.name })),
        progress,
        attempts,
        profiles,
        CATALOG,
        now,
      ),
    [students, progress, attempts, profiles, now],
  );

  const open = rows.find((r) => r.id === openId) ?? null;
  const needHelp = rows.filter((r) => r.help);

  function exportCsv() {
    const blob = new Blob(["﻿" + toCsv(rows, CATALOG, now)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avance-${className.replace(/\W+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (students.length === 0)
    return (
      <Card className="text-center text-muted">
        Añade alumnos para ver su avance aquí.
      </Card>
    );

  const stat = (label: string, value: string, tone = "") => (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Avance de «{className}»</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? "Actualizando…" : "Actualizar"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              Descargar CSV
            </Button>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stat("Avance medio", `${summary.avgPct}%`, "text-brand")}
          {stat(
            "Estrellas",
            `${summary.totalStars}/${summary.maxStars}`,
            "text-warn",
          )}
          {stat(
            "Activos esta semana",
            `${summary.activeWeek}/${summary.students}`,
          )}
          {stat("Sin empezar", String(summary.notStarted))}
        </div>
      </Card>

      {needHelp.length > 0 && (
        <Card className="border-2 border-warn/60">
          <h3 className="font-bold">
            🙋 Conviene acercarse ({needHelp.length})
          </h3>
          <ul className="mt-2 divide-y divide-border">
            {needHelp.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(r.id)}
                  className="font-bold text-brand"
                >
                  {r.name}
                </button>
                <span className="text-muted">{r.help}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <h3 className="mb-2 font-bold">Estrellas por reto</h3>
        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface p-2 text-left">Alumno</th>
              {CATALOG.map((c) => (
                <th
                  key={cellKey(c.level, c.challenge)}
                  title={c.title}
                  className="p-1 text-center font-mono text-xs text-muted"
                >
                  {c.level}-{c.challenge}
                </th>
              ))}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.id === openId ? "bg-brand/10" : ""}>
                <td className="sticky left-0 bg-surface p-1">
                  <button
                    type="button"
                    onClick={() => setOpenId(r.id === openId ? null : r.id)}
                    className="flex items-center gap-2 text-left font-semibold"
                  >
                    <FuzzyAvatar
                      id={r.id}
                      avatar={students.find((s) => s.id === r.id)?.avatar}
                      size={28}
                    />
                    {r.name}
                  </button>
                </td>
                {CATALOG.map((c) => {
                  const cell = r.cells[cellKey(c.level, c.challenge)];
                  const label = cell.done
                    ? `${cell.stars} estrellas`
                    : cell.failures
                      ? `${cell.failures} fallos, sin superar`
                      : "sin jugar";
                  return (
                    <td
                      key={cellKey(c.level, c.challenge)}
                      title={`${c.title}: ${label}`}
                      className="p-1 text-center"
                    >
                      <span
                        aria-label={label}
                        className={`grid h-8 place-items-center rounded-lg text-xs font-bold ${
                          cell.done
                            ? cell.stars === 3
                              ? "bg-success/25 text-success"
                              : "bg-warn/20 text-warn"
                            : cell.failures
                              ? "bg-danger/15 text-danger"
                              : "bg-surface-2 text-muted"
                        }`}
                      >
                        {cell.done
                          ? `${cell.stars}★`
                          : cell.failures
                            ? `✕${cell.failures}`
                            : "·"}
                      </span>
                    </td>
                  );
                })}
                <td className="p-2 text-right font-bold">
                  {r.stars}/{r.maxStars}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">
          ★ estrellas logradas · ✕ intentos fallidos en un reto sin superar · ·
          sin jugar
        </p>
      </Card>

      {open && (
        <StudentDetail
          r={open}
          avatar={students.find((s) => s.id === open.id)?.avatar}
          ledger={ledger}
          now={now}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function StudentDetail({
  r,
  avatar,
  ledger,
  now,
  onClose,
}: {
  r: StudentReport;
  avatar?: Record<string, string>;
  ledger: Ledger[] | null;
  now: Date;
  onClose: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <FuzzyAvatar id={r.id} avatar={avatar} size={56} />
        <div className="flex-1">
          <h3 className="text-lg font-extrabold">{r.name}</h3>
          <p className="text-sm text-muted">
            Última actividad: {activityLabel(r.lastActivity, now)} · Racha:{" "}
            {r.streak} {r.streak === 1 ? "día" : "días"} · 🪙 {r.coins}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
      {r.help && (
        <p className="mt-3 rounded-xl bg-warn/15 p-2 text-sm font-medium">
          🙋 {r.help}
        </p>
      )}

      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={r.pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-brand" style={{ width: `${r.pct}%` }} />
      </div>
      <p className="mt-1 text-sm text-muted">
        {r.completed} de {r.total} retos · {r.stars}/{r.maxStars} estrellas ·{" "}
        {r.failures} intentos fallidos
      </p>

      <h4 className="mt-4 font-bold">Retos</h4>
      <ul className="divide-y divide-border text-sm">
        {CATALOG.map((c) => {
          const cell = r.cells[cellKey(c.level, c.challenge)];
          return (
            <li
              key={cellKey(c.level, c.challenge)}
              className="flex flex-wrap items-center gap-x-3 py-1.5"
            >
              <span className="w-10 font-mono text-xs text-muted">
                {c.level}-{c.challenge}
              </span>
              <span className="min-w-[8rem] flex-1">{c.title}</span>
              {cell.done ? (
                <Stars n={cell.stars} />
              ) : (
                <span className="text-muted">
                  {cell.failures ? "sin superar" : "sin jugar"}
                </span>
              )}
              <span className="w-28 text-right text-xs text-muted">
                {cell.done && cell.blocks != null
                  ? `${cell.blocks}/${c.par} bloques · `
                  : ""}
                {cell.failures ? `${cell.failures} fallos` : ""}
              </span>
            </li>
          );
        })}
      </ul>

      <h4 className="mt-4 font-bold">Monedas</h4>
      {ledger === null ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : ledger.length === 0 ? (
        <p className="text-sm text-muted">Sin movimientos todavía.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {ledger.map((l, i) => (
            <li key={i} className="flex justify-between gap-3 py-1">
              <span>{reasonLabel(l.reason)}</span>
              <span
                className={`font-bold ${l.delta >= 0 ? "text-success" : "text-danger"}`}
              >
                {l.delta > 0 ? "+" : ""}
                {l.delta}
              </span>
              <span className="w-20 text-right text-xs text-muted">
                {activityLabel(new Date(l.created_at), now)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
