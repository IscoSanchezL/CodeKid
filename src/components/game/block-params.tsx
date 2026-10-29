"use client";

import type { Atom, AtomKind, Block, CondExpr, Turn } from "@/engine/types";
import { useT } from "@/i18n";

const KINDS: AtomKind[] = ["wall", "free", "coin", "goal"];
const TURNS: Turn[] = ["L", "R", "S"];

const sel = "rounded-lg bg-black/15 px-1 py-0.5 text-sm";

function AtomEditor({
  atom,
  disabled,
  onChange,
  label,
}: {
  atom: Atom;
  disabled: boolean;
  onChange: (a: Atom) => void;
  label: string;
}) {
  const t = useT();
  return (
    <span className="flex items-center gap-1">
      <select
        aria-label={t("param.negation", { label })}
        value={atom.not ? "no" : "si"}
        disabled={disabled}
        onChange={(e) => onChange({ ...atom, not: e.target.value === "no" })}
        className={sel}
      >
        <option value="si">—</option>
        <option value="no">{t("param.not")}</option>
      </select>
      <select
        aria-label={label}
        value={atom.kind}
        disabled={disabled}
        onChange={(e) =>
          onChange({ ...atom, kind: e.target.value as AtomKind })
        }
        className={sel}
      >
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {t(`atom.${k}`)}
          </option>
        ))}
      </select>
    </span>
  );
}

function toExpr(cond: unknown): CondExpr {
  if (typeof cond === "string")
    return { a: { kind: cond as AtomKind, not: false } };
  return cond as CondExpr;
}

/** Ajustes propios de cada bloque (condición, nombre, valor, lista…). */
export function BlockParams({
  block,
  disabled,
  onParam,
}: {
  block: Block;
  disabled: boolean;
  onParam: (patch: Record<string, unknown>) => void;
}) {
  const t = useT();
  switch (block.type) {
    case "if":
    case "while": {
      const c = toExpr(block.cond);
      return (
        <span className="flex flex-wrap items-center gap-1">
          <AtomEditor
            atom={c.a}
            disabled={disabled}
            label={t("param.condition")}
            onChange={(a) => onParam({ cond: { ...c, a } })}
          />
          <select
            aria-label={t("param.join")}
            value={c.op ?? ""}
            disabled={disabled}
            onChange={(e) => {
              const op = e.target.value as "" | "and" | "or";
              onParam({
                cond: op
                  ? { a: c.a, op, b: c.b ?? { kind: "free", not: false } }
                  : { a: c.a },
              });
            }}
            className={sel}
          >
            <option value="">{t("param.alone")}</option>
            <option value="and">{t("param.and")}</option>
            <option value="or">{t("param.or")}</option>
          </select>
          {c.op && c.b && (
            <AtomEditor
              atom={c.b}
              disabled={disabled}
              label={t("param.second")}
              onChange={(b) => onParam({ cond: { ...c, b } })}
            />
          )}
        </span>
      );
    }
    case "def":
    case "call":
      return (
        <select
          aria-label={t("param.blockName")}
          value={block.name}
          disabled={disabled}
          onChange={(e) => onParam({ name: e.target.value })}
          className={sel}
        >
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      );
    case "setvar":
      return (
        <select
          aria-label={t("param.value")}
          value={block.value}
          disabled={disabled}
          onChange={(e) => onParam({ value: Number(e.target.value) })}
          className={sel}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      );
    case "addvar":
      return (
        <span className="flex items-center gap-1">
          <select
            aria-label={t("param.operation")}
            value={block.op}
            disabled={disabled}
            onChange={(e) => onParam({ op: e.target.value })}
            className={sel}
          >
            <option value="+">{t("param.plus")}</option>
            <option value="-">{t("param.minus")}</option>
            <option value="*">{t("param.times")}</option>
          </select>
          <select
            aria-label={t("param.amount")}
            value={block.value}
            disabled={disabled}
            onChange={(e) => onParam({ value: Number(e.target.value) })}
            className={sel}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </span>
      );
    case "list":
      return (
        <span className="flex flex-wrap items-center gap-1">
          {block.items.map((item, i) => (
            <select
              key={i}
              aria-label={t("param.turnN", { n: i + 1 })}
              value={item}
              disabled={disabled}
              onChange={(e) =>
                onParam({
                  items: block.items.map((x, j) =>
                    j === i ? (e.target.value as Turn) : x,
                  ),
                })
              }
              className={sel}
            >
              {TURNS.map((k) => (
                <option key={k} value={k}>
                  {t(`turn.${k}`)}
                </option>
              ))}
            </select>
          ))}
          <button
            type="button"
            aria-label={t("param.addTurn")}
            disabled={disabled || block.items.length >= 12}
            onClick={() => onParam({ items: [...block.items, "R"] })}
            className="grid h-6 w-6 place-items-center rounded-lg bg-black/15 hover:bg-black/30 disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            aria-label={t("param.removeTurn")}
            disabled={disabled || block.items.length <= 1}
            onClick={() => onParam({ items: block.items.slice(0, -1) })}
            className="grid h-6 w-6 place-items-center rounded-lg bg-black/15 hover:bg-black/30 disabled:opacity-40"
          >
            −
          </button>
        </span>
      );
    default:
      return null;
  }
}
