"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseLevel, run } from "@/engine/interpreter";
import { addBlock, countBlocks, makeBlock, removeBlock, setTimes } from "@/engine/program";
import type { Block, BlockType, FailReason, Level, RunResult } from "@/engine/types";
import { saveResult } from "@/lib/progress";
import { queuePending, removePending } from "@/lib/pending-results";
import { submitResult, SubmitError, type Reward } from "@/lib/wallet";
import { useWallet } from "@/components/shop/use-wallet";
import { Board } from "./board";
import type { FuzzyVariant } from "./fuzzy";
import { blockLabel, ProgramEditor } from "./program-editor";

const FAIL_TEXT: Record<FailReason, string> = {
  wall: "¡Ups! Chocaste con una pared. Revisa tus giros.",
  "step-limit": "Tu programa da demasiadas vueltas. Prueba con menos repeticiones.",
  "not-at-goal": "El robot se detuvo antes de llegar a la bandera.",
  empty: "Primero arma un programa con los bloques.",
};

type Props = { level: Level; total: number };

export function Player({ level, total }: Props) {
  const [program, setProgram] = useState<Block[]>([]);
  const [container, setContainer] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const saved = useRef(false);
  const { wallet, ready } = useWallet();
  const [reward, setReward] = useState<Reward | null>(null);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "queued" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const isStudent = wallet?.role === "student";
  const variant = (wallet?.avatar.variant as FuzzyVariant | undefined) ?? "cyan";
  const outfit = { hat: wallet?.avatar.hat, glasses: wallet?.avatar.glasses, neck: wallet?.avatar.neck };

  const initial = useMemo(() => {
    const { start } = parseLevel(level);
    return [{ x: start.x, y: start.y, dir: level.startDir, coins: 0, blockId: null, bump: false }];
  }, [level]);
  const snapshots = result?.snapshots ?? initial;
  const finished = result !== null && !playing && index >= snapshots.length - 1;

  useEffect(() => {
    if (!playing || !result) return;
    if (index >= result.snapshots.length - 1) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), 380);
    return () => window.clearTimeout(t);
  }, [playing, index, result]);

  /** Guarda el resultado en el servidor. Si falla de forma temporal, lo deja en cola para reintentar solo. */
  const persist = useCallback(async () => {
    if (!wallet) return;
    setSave("saving");
    setSaveMessage(null);
    try {
      const r = await submitResult(level.level, level.challenge, program);
      removePending({ userId: wallet.id, level: level.level, challenge: level.challenge });
      setReward(r.reward);
      setSave("saved");
    } catch (e) {
      const err = e instanceof SubmitError ? e : new SubmitError("No se pudo guardar el progreso", 0);
      if (err.retryable) {
        queuePending({ userId: wallet.id, level: level.level, challenge: level.challenge, program });
        setSave("queued");
      } else {
        setSave("error");
      }
      setSaveMessage(err.message);
    }
  }, [wallet, level, program]);

  useEffect(() => {
    if (!(finished && result?.status === "win") || saved.current || !ready) return;
    saved.current = true;
    if (!wallet) {
      // Sin sesión: se guarda solo en este navegador y no hay monedas
      void saveResult(level.level, level.challenge, result.stars, result.blocks);
      return;
    }
    // Solo los alumnos guardan progreso; un docente que prueba el reto no
    if (wallet.role === "student") void persist();
  }, [finished, result, level, wallet, ready, persist]);

  const editing = !playing && result === null;

  function edit(next: Block[]) {
    setProgram(next);
  }

  function reset() {
    setPlaying(false);
    setResult(null);
    setIndex(0);
    saved.current = false;
    setReward(null);
    setSave("idle");
    setSaveMessage(null);
  }

  function execute() {
    saved.current = false;
    setReward(null);
    setSave("idle");
    setSaveMessage(null);
    const r = run(level, program);
    setResult(r);
    setIndex(0);
    setPlaying(r.snapshots.length > 1);
  }

  const runningId = result && playing ? (snapshots[index]?.blockId ?? null) : null;
  const next = level.challenge < total ? level.challenge + 1 : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(300px,380px)]">
      <section aria-label="Escenario" className="flex flex-col gap-4">
        <Board
          level={level}
          snapshots={snapshots}
          index={result ? index : 0}
          celebrate={finished && result?.status === "win"}
          variant={variant}
          outfit={outfit}
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          {editing ? (
            <Button size="lg" variant="go" onClick={execute}>
              ▶ Ejecutar
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={reset}>
              ↺ Editar de nuevo
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowHint((v) => !v)} aria-expanded={showHint}>
            💡 Pista
          </Button>
        </div>

        {showHint && (
          <p role="note" className="rounded-xl bg-warn/15 p-3 text-center text-sm font-medium">
            {level.hint}
          </p>
        )}

        {finished && result && (
          <Card className="text-center" role="status">
            {result.status === "win" ? (
              <>
                <p className="text-2xl font-extrabold">¡Lo lograste!</p>
                <p aria-label={`${result.stars} de 3 estrellas`} className="mt-2 text-4xl">
                  {"★".repeat(result.stars)}
                  <span className="opacity-25">{"★".repeat(3 - result.stars)}</span>
                </p>
                <ul className="mt-2 text-sm text-muted">
                  <li>Usaste {result.blocks} bloques (lo mejor: {level.par})</li>
                  {result.coinsTotal > 0 && (
                    <li>
                      Monedas: {result.coinsCollected} de {result.coinsTotal}
                    </li>
                  )}
                </ul>
                {isStudent && <SaveStatus state={save} message={saveMessage} onRetry={() => void persist()} />}
                {isStudent && reward && <RewardPanel reward={reward} />}
                {ready && wallet && !isStudent && (
                  <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">
                    Estás probando como docente: aquí no se guardan estrellas ni monedas.
                  </p>
                )}
                {ready && !wallet && (
                  <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">
                    Entra con el código de tu clase para guardar tu progreso y ganar monedas 🪙
                  </p>
                )}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={reset}>
                    Mejorar
                  </Button>
                  {next ? (
                    <ButtonLink href={`/nivel/${level.level}/${next}`}>Siguiente reto →</ButtonLink>
                  ) : (
                    <ButtonLink href="/mapa">Volver al mapa</ButtonLink>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-bold">{FAIL_TEXT[result.reason ?? "not-at-goal"]}</p>
                <Button className="mt-3" onClick={reset}>
                  Intentar otra vez
                </Button>
              </>
            )}
          </Card>
        )}
      </section>

      <aside className="flex flex-col gap-4" aria-label="Programa">
        <Card className="p-4">
          <h2 className="mb-3 flex items-center justify-between font-bold">
            Bloques
            <span className="text-sm font-medium text-muted">{countBlocks(program)} usados</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {level.allowed.map((t: BlockType) => {
              const l = blockLabel(t);
              return (
                <button
                  key={t}
                  type="button"
                  disabled={!editing}
                  onClick={() => edit(addBlock(program, container, makeBlock(t)))}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 font-semibold shadow-[0_3px_0_0_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:translate-y-0.5 disabled:opacity-40 ${l.color}`}
                >
                  <span aria-hidden>{l.icon}</span>
                  {l.text}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="plank min-h-48 p-4">
          <h2 className="mb-3 flex items-center justify-between font-bold">
            Mi programa
            {program.length > 0 && editing && (
              <button
                type="button"
                className="text-sm font-medium text-danger"
                onClick={() => {
                  setProgram([]);
                  setContainer(null);
                }}
              >
                Borrar todo
              </button>
            )}
          </h2>
          {program.length === 0 && (
            <p className="rounded-xl border-2 border-dashed border-border p-6 text-center text-muted">
              Pulsa los bloques de arriba para armar tu programa.
            </p>
          )}
          <ProgramEditor
            blocks={program}
            runningId={runningId}
            containerId={container}
            disabled={!editing}
            onSelectContainer={setContainer}
            onRemove={(id) => {
              if (id === container) setContainer(null);
              edit(removeBlock(program, id));
            }}
            onTimes={(id, n) => edit(setTimes(program, id, n))}
          />
        </Card>

        <Link href={`/nivel/${level.level}`} className="text-center text-sm font-medium text-muted hover:text-fg">
          ← Todos los retos del nivel {level.level}
        </Link>
      </aside>
    </div>
  );
}

function RewardPanel({ reward }: { reward: Reward }) {
  const total = reward.coins + reward.bonus;
  return (
    <div className="mt-4 rounded-2xl bg-warn/15 p-4" role="status" aria-label={`Ganaste ${total} monedas`}>
      <p className="text-3xl font-extrabold text-warn">
        <span aria-hidden>🪙</span> +{total}
      </p>
      <ul className="mt-1 text-sm text-fg/80">
        {reward.first && <li>Reto superado: +10</li>}
        {reward.starsAfter > reward.starsBefore && <li>Estrellas nuevas: +{(reward.starsAfter - reward.starsBefore) * 5}</li>}
        {reward.bonus > 0 && <li>Bono del día (racha de {reward.streak}): +{reward.bonus}</li>}
        {total === 0 && <li>Ya tenías este reto. Consigue más estrellas para ganar más monedas.</li>}
      </ul>
      <p className="mt-2 text-sm font-semibold">
        Tienes {reward.balance} monedas ·{" "}
        <Link href="/tienda" className="text-brand underline-offset-2 hover:underline">
          Ir a la tienda
        </Link>
      </p>
    </div>
  );
}

function SaveStatus({ state, message, onRetry }: { state: "idle" | "saving" | "saved" | "queued" | "error"; message: string | null; onRetry: () => void }) {
  if (state === "idle") return null;
  if (state === "saving") return <p role="status" className="mt-3 text-sm font-medium text-muted">Guardando tus estrellas…</p>;
  if (state === "saved") return <p role="status" className="mt-3 text-sm font-bold text-success">✔ Estrellas guardadas</p>;
  return (
    <div role="alert" className="mt-3 rounded-xl bg-warn/20 p-3 text-sm">
      <p className="font-bold">
        {state === "queued" ? "No pudimos guardar tus estrellas ahora." : "No se pudo guardar tu resultado."}
      </p>
      <p className="mt-1 text-fg/80">
        {state === "queued"
          ? "No te preocupes: las intentaremos guardar solas en cuanto haya conexión. También puedes probar ahora."
          : message}
      </p>
      {state === "queued" && message && <p className="mt-1 text-xs text-muted">({message})</p>}
      <Button size="sm" className="mt-2" onClick={onRetry}>
        Reintentar ahora
      </Button>
    </div>
  );
}
