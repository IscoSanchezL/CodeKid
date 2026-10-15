"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseLevel, run } from "@/engine/interpreter";
import { addBlock, countBlocks, makeBlock, removeBlock, setTimes } from "@/engine/program";
import type { Block, BlockType, FailReason, Level, RunResult } from "@/engine/types";
import { saveResult } from "@/lib/progress";
import { Board } from "./board";
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

  useEffect(() => {
    if (finished && result?.status === "win" && !saved.current) {
      saved.current = true;
      void saveResult(level.level, level.challenge, result.stars, result.blocks);
    }
  }, [finished, result, level]);

  const editing = !playing && result === null;

  function edit(next: Block[]) {
    setProgram(next);
  }

  function reset() {
    setPlaying(false);
    setResult(null);
    setIndex(0);
    saved.current = false;
  }

  function execute() {
    saved.current = false;
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
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          {editing ? (
            <Button size="lg" onClick={execute}>
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

        <Card className="min-h-48 p-4">
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
