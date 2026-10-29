"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseLevel, run } from "@/engine/interpreter";
import type { Block, Level, RunResult } from "@/engine/types";
import { saveResult } from "@/lib/progress";
import { queuePending, removePending } from "@/lib/pending-results";
import { sfx } from "@/lib/audio";
import {
  logFailedAttempt,
  submitResult,
  SubmitError,
  type Reward,
} from "@/lib/wallet";
import { Burst, PopStars } from "@/components/fx/fx";
import { useWallet } from "@/components/shop/use-wallet";
import { Board } from "./board";
import { UnlockNote } from "./unlock-note";
import { CodeEditor } from "./code-editor";
import { parseCode, type Lang } from "@/lib/code-parser";
import { toCode } from "@/lib/codegen";
import type { FuzzyVariant } from "./fuzzy";
import { Workspace } from "./workspace";
import { challengeHint, TX, useLang, useT } from "@/i18n";
import { starterIn } from "@/lib/code-names";

type Props = { level: Level; total: number };

export function Player({ level, total }: Props) {
  const t = useT();
  const api = useLang();
  const [program, setProgram] = useState<Block[]>([]);
  // Retos de código: el alumno escribe en JavaScript o Python
  const codeMode = level.mode === "code";
  const [lang, setLang] = useState<Lang>("js");
  const [wide, setWide] = useState(false);
  const [code, setCode] = useState(() => starterIn(level.starter?.js ?? "", "js", api));
  const [codeError, setCodeError] = useState<{
    line: number;
    message: string;
  } | null>(null);
  const [lineOf, setLineOf] = useState<Record<string, number>>({});
  const [result, setResult] = useState<RunResult | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const saved = useRef(false);
  const { wallet, ready } = useWallet();
  const [reward, setReward] = useState<Reward | null>(null);
  const [save, setSave] = useState<
    "idle" | "saving" | "saved" | "queued" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const isStudent = wallet?.role === "student";
  const variant =
    (wallet?.avatar.variant as FuzzyVariant | undefined) ?? "cyan";
  const outfit = {
    hat: wallet?.avatar.hat,
    glasses: wallet?.avatar.glasses,
    neck: wallet?.avatar.neck,
  };

  const initial = useMemo(() => {
    const { start } = parseLevel(level);
    return [
      {
        x: start.x,
        y: start.y,
        dir: level.startDir,
        coins: 0,
        blockId: null,
        bump: false,
      },
    ];
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

  // Sonido de cada paso, giro o choque mientras corre el programa
  useEffect(() => {
    if (!result || !playing || index === 0) return;
    const cur = result.snapshots[index];
    const before = result.snapshots[index - 1];
    if (!cur || !before) return;
    if (cur.bump) sfx("bump");
    else if (cur.x !== before.x || cur.y !== before.y) sfx("step");
    else if (cur.dir !== before.dir) sfx("turn");
    if (cur.coins > before.coins) window.setTimeout(() => sfx("star"), 120);
  }, [index, result, playing]);

  // Fanfarria al terminar
  useEffect(() => {
    if (!finished || !result) return;
    sfx(result.status === "win" ? "win" : "fail");
  }, [finished, result]);

  /** Guarda el resultado en el servidor. Si falla de forma temporal, lo deja en cola para reintentar solo. */
  const persist = useCallback(async () => {
    if (!wallet) return;
    setSave("saving");
    setSaveMessage(null);
    try {
      const r = await submitResult(level.level, level.challenge, program);
      removePending({
        userId: wallet.id,
        level: level.level,
        challenge: level.challenge,
      });
      setReward(r.reward);
      setSave("saved");
    } catch (e) {
      const err =
        e instanceof SubmitError
          ? e
          : new SubmitError("No se pudo guardar el progreso", 0);
      if (err.retryable) {
        queuePending({
          userId: wallet.id,
          level: level.level,
          challenge: level.challenge,
          program,
        });
        setSave("queued");
      } else {
        setSave("error");
      }
      setSaveMessage(err.message);
    }
  }, [wallet, level, program]);

  useEffect(() => {
    if (!(finished && result?.status === "win") || saved.current || !ready)
      return;
    saved.current = true;
    if (!wallet) {
      // Sin sesión: se guarda solo en este navegador y no hay monedas
      void saveResult(
        level.level,
        level.challenge,
        result.stars,
        result.blocks,
      );
      return;
    }
    // Solo los alumnos guardan progreso; un docente que prueba el reto no
    if (wallet.role === "student") void persist();
  }, [finished, result, level, wallet, ready, persist]);

  const failLogged = useRef(false);
  useEffect(() => {
    if (!finished || result?.status !== "fail" || failLogged.current || !ready)
      return;
    failLogged.current = true;
    if (wallet?.role === "student")
      logFailedAttempt(level.level, level.challenge);
  }, [finished, result, wallet, ready, level]);

  const editing = !playing && result === null;

  function edit(next: Block[]) {
    setProgram(next);
  }

  function reset() {
    setPlaying(false);
    setResult(null);
    setIndex(0);
    saved.current = false;
    failLogged.current = false;
    setReward(null);
    setSave("idle");
    setSaveMessage(null);
  }

  // Al cambiar el idioma de la interfaz, el código del alumno se muestra con los nombres del otro idioma
  const prevApi = useRef(api);
  useEffect(() => {
    const before = prevApi.current;
    if (before === api) return;
    prevApi.current = api;
    if (!codeMode) return;
    setCodeError(null);
    setCode((cur) => {
      const original = level.starter?.[lang === "js" ? "js" : "python"] ?? "";
      if (cur === starterIn(original, lang, before)) return starterIn(original, lang, api);
      const parsed = parseCode(cur, lang, before);
      return parsed.ok && parsed.program.length ? toCode(parsed.program, lang, api) : cur;
    });
  }, [api, codeMode, lang, level]);

  function changeLang(next: Lang) {
    // Si el código actual se entiende, se traduce al otro lenguaje; si no, se vuelve al código inicial
    const parsed = parseCode(code, lang, api);
    setCode(
      parsed.ok && parsed.program.length
        ? toCode(parsed.program, next, api)
        : starterIn(level.starter?.[next === "js" ? "js" : "python"] ?? "", next, api),
    );
    setCodeError(null);
    setLang(next);
  }

  function execute() {
    let prog = program;
    if (codeMode) {
      const parsed = parseCode(code, lang, api);
      if (!parsed.ok) {
        setCodeError({ line: parsed.line, message: parsed.message });
        return;
      }
      setCodeError(null);
      setLineOf(parsed.lineOf);
      prog = parsed.program;
      setProgram(prog);
    }
    saved.current = false;
    failLogged.current = false;
    setReward(null);
    setSave("idle");
    setSaveMessage(null);
    const r = run(level, prog);
    setResult(r);
    setIndex(0);
    setPlaying(r.snapshots.length > 1);
  }

  const runningId =
    result && playing ? (snapshots[index]?.blockId ?? null) : null;
  const next = level.challenge < total ? level.challenge + 1 : null;

  return (
    <div
      className="grid min-h-0 flex-1 gap-3 lg:[grid-template-columns:minmax(0,1fr)_var(--prog-w)]"
      style={
        {
          "--prog-w": wide
            ? "clamp(480px, 46vw, 700px)"
            : "clamp(380px, 34vw, 470px)",
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-0 flex-col gap-3">
        <section
          aria-label={t("play.stage")}
          className="relative h-[62vw] min-h-[260px] lg:h-auto lg:min-h-0 lg:flex-1"
        >
          <Board
            level={level}
            snapshots={snapshots}
            index={result ? index : 0}
            celebrate={finished && result?.status === "win"}
            variant={variant}
            outfit={outfit}
          />

          {showHint && (
            <p
              role="note"
              className="absolute left-1/2 top-3 z-10 max-w-[90%] -translate-x-1/2 rounded-xl bg-white/95 px-4 py-2 text-center text-sm font-semibold text-[#0b1440] shadow-lg"
            >
              💡 {challengeHint(t, level.level, level.challenge, level.hint)}
            </p>
          )}

          {finished && result && (
            <div className="absolute inset-0 z-20 grid place-items-center overflow-auto bg-[#0b1440]/25 p-3">
              <Card
                className={`w-full max-w-md text-center ${result.status === "win" ? "win-card" : ""}`}
                role="status"
              >
                {result.status === "win" ? (
                  <>
                    <Burst />
                    <p className="text-grad text-3xl font-extrabold">
                      {t("play.win")}
                    </p>
                    <PopStars earned={result.stars} />
                    <ul className="mt-2 text-sm text-muted">
                      <li>
                        {t("play.blocksUsed", { n: result.blocks, par: level.par })}
                      </li>
                      {result.coinsTotal > 0 && (
                        <li>
                          {t("play.coins", { got: result.coinsCollected, total: result.coinsTotal })}
                        </li>
                      )}
                    </ul>
                    {isStudent && (
                      <SaveStatus
                        state={save}
                        message={saveMessage}
                        onRetry={() => void persist()}
                      />
                    )}
                    {isStudent && reward && <RewardPanel reward={reward} />}
                    <UnlockNote
                      key={`${save}-${reward ? 1 : 0}-${ready ? 1 : 0}`}
                      level={level.level}
                    />
                    {ready && wallet && !isStudent && (
                      <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">
                        {t("play.teacherNote")}
                      </p>
                    )}
                    {ready && !wallet && (
                      <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">
                        {t("play.guestNote")}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Button variant="outline" onClick={reset}>
                        {t("play.improve")}
                      </Button>
                      {next ? (
                        <ButtonLink href={`/nivel/${level.level}/${next}`}>
                          {t("play.next")}
                        </ButtonLink>
                      ) : (
                        <ButtonLink href="/mapa">{t("play.toMap")}</ButtonLink>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold">
                      {t(`play.fail.${result.reason ?? "not-at-goal"}`)}
                    </p>
                    {result.tests && <TestList tests={result.tests} />}
                    <Button className="mt-3" onClick={reset}>
                      {t("play.retry")}
                    </Button>
                  </>
                )}
              </Card>
            </div>
          )}
        </section>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          {editing ? (
            <Button size="lg" variant="go" onClick={execute}>
              {t("play.run")}
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={reset}>
              {t("play.edit")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHint((v) => !v)}
            aria-expanded={showHint}
          >
            {t("play.hint")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex"
            onClick={() => setWide((v) => !v)}
            aria-pressed={wide}
            title={t("play.widenTitle")}
          >
            {wide ? t("play.narrow") : t("play.widen")}
          </Button>
        </div>
      </div>

      <aside aria-label={t("play.program")} className="flex min-h-0 flex-col gap-3">
        {codeMode ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CodeEditor
              lang={lang}
              onLang={changeLang}
              value={code}
              onChange={setCode}
              error={codeError}
              runningLine={runningId ? (lineOf[runningId] ?? null) : null}
              disabled={!editing}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-hidden">
            <Workspace
              allowed={level.allowed}
              program={program}
              onChange={edit}
              editing={editing}
              runningId={runningId}
            />
          </div>
        )}
      </aside>
    </div>
  );
}

function TestList({ tests }: { tests: { passed: boolean }[] }) {
  const t = useT();
  return (
    <ul
      className="mt-2 flex flex-wrap justify-center gap-2 text-sm font-bold"
      aria-label={t("play.tests")}
    >
      {tests.map((test, i) => (
        <li
          key={i}
          className={`rounded-full px-3 py-1 ${test.passed ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}
        >
          {test.passed ? "✔" : "✘"} {t("play.test", { n: i + 1 })}
        </li>
      ))}
    </ul>
  );
}

function RewardPanel({ reward }: { reward: Reward }) {
  const t = useT();
  const total = reward.coins + reward.bonus;
  return (
    <div
      className="mt-4 rounded-2xl bg-warn/15 p-4"
      role="status"
      aria-label={t("play.reward.aria", { n: total })}
    >
      <p className="text-3xl font-extrabold text-warn">
        <span aria-hidden className="coin-drop">
          🪙
        </span>{" "}
        +{total}
      </p>
      <ul className="mt-1 text-sm text-fg/80">
        {reward.first && <li>{t("play.reward.first")}</li>}
        {reward.starsAfter > reward.starsBefore && (
          <li>
            {t("play.reward.stars", { n: (reward.starsAfter - reward.starsBefore) * 5 })}
          </li>
        )}
        {reward.bonus > 0 && (
          <li>
            {t("play.reward.bonus", { streak: reward.streak, n: reward.bonus })}
          </li>
        )}
        {total === 0 && (
          <li>
            {t("play.reward.already")}
          </li>
        )}
      </ul>
      <p className="mt-2 text-sm font-semibold">
        {t("play.reward.balance", { n: reward.balance })}{" "}
        <Link
          href="/tienda"
          className="text-brand underline-offset-2 hover:underline"
        >
          {t("play.reward.shop")}
        </Link>
      </p>
    </div>
  );
}

function SaveStatus({
  state,
  message,
  onRetry,
}: {
  state: "idle" | "saving" | "saved" | "queued" | "error";
  message: string | null;
  onRetry: () => void;
}) {
  const t = useT();
  if (state === "idle") return null;
  if (state === "saving")
    return (
      <p role="status" className="mt-3 text-sm font-medium text-muted">
        {t("save.saving")}
      </p>
    );
  if (state === "saved")
    return (
      <p role="status" className="mt-3 text-sm font-bold text-success">
        {t("save.saved")}
      </p>
    );
  return (
    <div role="alert" className="mt-3 rounded-xl bg-warn/20 p-3 text-sm">
      <p className="font-bold">
        {state === "queued" ? t("save.queuedTitle") : t("save.errorTitle")}
      </p>
      <p className="mt-1 text-fg/80">
        {state === "queued" ? t("save.queuedBody") : message && <TX text={message} />}
      </p>
      {state === "queued" && message && (
        <p className="mt-1 text-xs text-muted">(<TX text={message} />)</p>
      )}
      <Button size="sm" className="mt-2" onClick={onRetry}>
        {t("save.retryNow")}
      </Button>
    </div>
  );
}
