"use client";

import type { Atom, AtomKind, Block, CondExpr, Turn } from "@/engine/types";

const KINDS: [AtomKind, string][] = [
  ["wall", "hay pared adelante"],
  ["free", "hay camino libre"],
  ["coin", "hay moneda adelante"],
  ["goal", "la meta está adelante"],
];
const TURN_LABEL: Record<Turn, string> = {
  L: "↰ izquierda",
  R: "↱ derecha",
  S: "↑ recto",
};

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
  return (
    <span className="flex items-center gap-1">
      <select
        aria-label={`${label}: negación`}
        value={atom.not ? "no" : "si"}
        disabled={disabled}
        onChange={(e) => onChange({ ...atom, not: e.target.value === "no" })}
        className={sel}
      >
        <option value="si">—</option>
        <option value="no">no</option>
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
        {KINDS.map(([k, t]) => (
          <option key={k} value={k}>
            {t}
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
  switch (block.type) {
    case "if":
    case "while": {
      const c = toExpr(block.cond);
      return (
        <span className="flex flex-wrap items-center gap-1">
          <AtomEditor
            atom={c.a}
            disabled={disabled}
            label="Condición"
            onChange={(a) => onParam({ cond: { ...c, a } })}
          />
          <select
            aria-label="Unir con"
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
            <option value="">solo</option>
            <option value="and">y</option>
            <option value="or">o</option>
          </select>
          {c.op && c.b && (
            <AtomEditor
              atom={c.b}
              disabled={disabled}
              label="Segunda condición"
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
          aria-label="Nombre del bloque"
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
          aria-label="Valor"
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
            aria-label="Operación"
            value={block.op}
            disabled={disabled}
            onChange={(e) => onParam({ op: e.target.value })}
            className={sel}
          >
            <option value="+">+ suma</option>
            <option value="-">− resta</option>
            <option value="*">× multiplica</option>
          </select>
          <select
            aria-label="Cantidad"
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
          {block.items.map((t, i) => (
            <select
              key={i}
              aria-label={`Giro ${i + 1}`}
              value={t}
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
              {(Object.keys(TURN_LABEL) as Turn[]).map((k) => (
                <option key={k} value={k}>
                  {TURN_LABEL[k]}
                </option>
              ))}
            </select>
          ))}
          <button
            type="button"
            aria-label="Añadir giro"
            disabled={disabled || block.items.length >= 12}
            onClick={() => onParam({ items: [...block.items, "R"] })}
            className="grid h-6 w-6 place-items-center rounded-lg bg-black/15 hover:bg-black/30 disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Quitar giro"
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
