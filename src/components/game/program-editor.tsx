"use client";

import type { Block } from "@/engine/types";
import { cn } from "@/lib/utils";

const LABELS = {
  move: { icon: "⬆️", text: "Avanzar", color: "bg-brand text-brand-fg" },
  left: { icon: "↰", text: "Girar izquierda", color: "bg-accent text-white" },
  right: { icon: "↱", text: "Girar derecha", color: "bg-success text-white" },
  repeat: { icon: "🔁", text: "Repetir", color: "bg-warn text-black" },
} as const;

export function blockLabel(type: keyof typeof LABELS) {
  return LABELS[type];
}

type Props = {
  blocks: Block[];
  runningId: string | null;
  containerId: string | null;
  onSelectContainer: (id: string | null) => void;
  onRemove: (id: string) => void;
  onTimes: (id: string, times: number) => void;
  disabled: boolean;
};

export function ProgramEditor(props: Props) {
  const { blocks, runningId, containerId, onSelectContainer, onRemove, onTimes, disabled } = props;

  return (
    <ol className="flex flex-col gap-2">
      {blocks.map((b) => {
        const label = LABELS[b.type];
        const running = runningId === b.id;
        return (
          <li key={b.id}>
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 font-semibold shadow-card transition-all",
                label.color,
                running && "scale-[1.03] ring-4 ring-fg/30",
              )}
            >
              <span aria-hidden>{label.icon}</span>
              <span className="flex-1">{label.text}</span>
              {b.type === "repeat" && (
                <label className="flex items-center gap-1 text-sm">
                  <select
                    aria-label="Veces a repetir"
                    value={b.times}
                    disabled={disabled}
                    onChange={(e) => onTimes(b.id, Number(e.target.value))}
                    className="rounded-lg bg-black/15 px-1 py-0.5"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  veces
                </label>
              )}
              <button
                type="button"
                aria-label={`Quitar ${label.text}`}
                disabled={disabled}
                onClick={() => onRemove(b.id)}
                className="grid h-7 w-7 place-items-center rounded-lg bg-black/15 hover:bg-black/30 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {b.type === "repeat" && (
              <div
                className={cn(
                  "ml-4 mt-1 rounded-xl border-2 border-dashed p-2",
                  containerId === b.id ? "border-warn bg-warn/10" : "border-border",
                )}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectContainer(containerId === b.id ? null : b.id)}
                  className="mb-2 text-xs font-semibold text-muted underline-offset-2 hover:underline"
                >
                  {containerId === b.id ? "✔ Añadiendo aquí dentro" : "Añadir bloques aquí dentro"}
                </button>
                <ProgramEditor {...props} blocks={b.body} />
                {b.body.length === 0 && <p className="text-xs text-muted">Vacío</p>}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
