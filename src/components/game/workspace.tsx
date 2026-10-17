"use client";

import { createContext, Fragment, useContext, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import {
  addBlock,
  countBlocks,
  findBlock,
  insertAt,
  makeBlock,
  moveBlock,
  removeBlock,
  selfAndInnerIds,
  setParams,
  setTimes,
  isContainer,
} from "@/engine/program";
import type { Block, BlockType } from "@/engine/types";
import { BlockParams } from "./block-params";
import { cn } from "@/lib/utils";
import { blockLabel } from "./program-editor";
import { useT, type TFn } from "@/i18n";

type Drag = {
  kind: "palette" | "block";
  type: BlockType;
  id?: string;
  forbidden: Set<string>;
};

type Ctx = {
  drag: Drag | null;
  editing: boolean;
  runningId: string | null;
  container: string | null;
  setContainer: (id: string | null) => void;
  onRemove: (id: string) => void;
  onTimes: (id: string, times: number) => void;
  onParam: (id: string, patch: Record<string, unknown>) => void;
  /** Con muchos bloques se achican para que el programa entero quepa en pantalla. */
  compact: boolean;
};
const WorkspaceCtx = createContext<Ctx | null>(null);
const useWs = () => {
  const c = useContext(WorkspaceCtx);
  if (!c) throw new Error("Falta el área de trabajo");
  return c;
};

/** Mientras se arrastra: lo que está bajo el puntero; si no hay nada, el hueco más cercano (con límite). */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length) return hits;
  const slots = args.droppableContainers.filter(
    (c) => c.data.current && "index" in c.data.current,
  );
  const near = closestCenter({ ...args, droppableContainers: slots });
  const limit = args.pointerCoordinates ? 90 : Infinity; // con el teclado no hay puntero
  return near.filter((c) => Number(c.data?.value ?? 0) < limit).slice(0, 1);
};

const a11y = (t: TFn) => ({
  screenReaderInstructions: { draggable: t("ws.drag.instructions") },
  announcements: {
    onDragStart: () => t("ws.drag.start"),
    onDragOver: () => t("ws.drag.over"),
    onDragEnd: () => t("ws.drag.end"),
    onDragCancel: () => t("ws.drag.cancel"),
  },
});

type Props = {
  allowed: BlockType[];
  program: Block[];
  onChange: (next: Block[]) => void;
  editing: boolean;
  runningId: string | null;
};

/** Paleta de bloques + programa del alumno, con arrastrar y soltar (ratón, dedo y teclado). */
export function Workspace({
  allowed,
  program,
  onChange,
  editing,
  runningId,
}: Props) {
  const t = useT();
  const [drag, setDrag] = useState<Drag | null>(null);
  const [container, setContainer] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(e: DragStartEvent) {
    const d = e.active.data.current as
      | { kind: "palette" | "block"; type: BlockType }
      | undefined;
    if (!d) return;
    const block =
      d.kind === "block" ? findBlock(program, String(e.active.id)) : null;
    setDrag({
      kind: d.kind,
      type: d.type,
      id: block?.id,
      forbidden: block ? selfAndInnerIds(block) : new Set(),
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const current = drag;
    setDrag(null);
    const over = e.over;
    if (!current || !over) return;

    if (over.id === "trash") {
      if (current.kind === "block" && current.id) {
        onChange(removeBlock(program, current.id));
        if (current.id === container) setContainer(null);
      }
      return;
    }
    const slot = over.data.current as
      | { containerId: string | null; index: number }
      | undefined;
    if (!slot) return;
    if (current.kind === "palette")
      onChange(
        insertAt(
          program,
          slot.containerId,
          slot.index,
          makeBlock(current.type),
        ),
      );
    else if (current.id)
      onChange(moveBlock(program, current.id, slot.containerId, slot.index));
  }

  const ctx: Ctx = {
    drag,
    editing,
    runningId,
    container,
    setContainer,
    onRemove: (id) => {
      if (id === container) setContainer(null);
      onChange(removeBlock(program, id));
    },
    onTimes: (id, n) => onChange(setTimes(program, id, n)),
    onParam: (id, patch) => onChange(setParams(program, id, patch)),
    compact: countBlocks(program) > 10,
  };

  return (
    <WorkspaceCtx.Provider value={ctx}>
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        accessibility={a11y(t)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDrag(null)}
      >
        <Palette
          allowed={allowed}
          onAdd={(t) => onChange(addBlock(program, container, makeBlock(t)))}
          used={countBlocks(program)}
        />

        <Card className="plank min-h-48 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <h2 className="mb-3 flex items-center justify-between font-bold">
            {t("ws.program")}
            {program.length > 0 && editing && (
              <button
                type="button"
                className="text-sm font-medium text-danger"
                onClick={() => {
                  onChange([]);
                  setContainer(null);
                }}
              >
                {t("ws.clear")}
              </button>
            )}
          </h2>
          <BlockList blocks={program} containerId={null} />
        </Card>

        <DragOverlay dropAnimation={{ duration: 160 }}>
          {drag ? <Chip type={drag.type} floating /> : null}
        </DragOverlay>
      </DndContext>
    </WorkspaceCtx.Provider>
  );
}

function Chip({
  type,
  floating = false,
}: {
  type: BlockType;
  floating?: boolean;
}) {
  const l = blockLabel(type);
  const t = useT();
  return (
    <div
      className={cn(
        "flex items-center gap-2 block-chip rounded-xl px-3 py-2 font-semibold",
        l.color,
        floating &&
          "rotate-2 scale-105 cursor-grabbing shadow-[0_14px_28px_-8px_rgba(0,0,0,0.5)]",
      )}
    >
      <span aria-hidden>{l.icon}</span>
      {t(`block.${type}`)}
    </div>
  );
}

function Palette({
  allowed,
  onAdd,
  used,
}: {
  allowed: BlockType[];
  onAdd: (t: BlockType) => void;
  used: number;
}) {
  const { drag, editing } = useWs();
  const t = useT();
  const deleting = drag?.kind === "block";
  const { setNodeRef, isOver } = useDroppable({
    id: "trash",
    disabled: !deleting,
  });

  return (
    <Card
      className={cn(
        "shrink-0 p-4 transition-shadow",
        deleting && "ring-2 ring-danger/60",
        deleting && isOver && "bg-danger/10 ring-4 ring-danger",
      )}
    >
      <div ref={setNodeRef}>
        <h2 className="mb-1 flex items-center justify-between font-bold">
          {t("ws.blocks")}
          <span className="text-sm font-medium text-muted">{t("ws.used", { n: used })}</span>
        </h2>
        <p className="mb-3 text-xs text-muted">
          {deleting
            ? t("ws.trash")
            : t("ws.paletteHelp")}
        </p>
        <div className="flex flex-wrap gap-2">
          {allowed.map((t) => (
            <PaletteChip
              key={t}
              type={t}
              disabled={!editing}
              onAdd={() => onAdd(t)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PaletteChip({
  type,
  disabled,
  onAdd,
}: {
  type: BlockType;
  disabled: boolean;
  onAdd: () => void;
}) {
  const { setNodeRef, listeners, attributes } = useDraggable({
    id: `palette:${type}`,
    data: { kind: "palette", type },
    disabled,
  });
  const l = blockLabel(type);
  const t = useT();
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      disabled={disabled}
      onClick={onAdd}
      className={cn(
        "flex touch-none select-none items-center gap-2 block-chip rounded-xl px-3 py-2 font-semibold transition-transform hover:scale-105 active:translate-y-0.5 disabled:opacity-40",
        !disabled && "cursor-grab",
        l.color,
      )}
    >
      <span aria-hidden>{l.icon}</span>
      {t(`block.${type}`)}
    </button>
  );
}

/** Hueco donde se puede soltar un bloque (entre dos bloques, al final o dentro de un «repetir»). */
function Slot({
  containerId,
  index,
  empty,
}: {
  containerId: string | null;
  index: number;
  empty?: string;
}) {
  const { drag, editing, compact } = useWs();
  const blocked =
    drag?.kind === "block" &&
    containerId !== null &&
    drag.forbidden.has(containerId);
  const { setNodeRef, isOver } = useDroppable({
    id: `slot|${containerId ?? "root"}|${index}`,
    data: { containerId, index },
    disabled: !editing || blocked,
  });
  const live = !!drag && !blocked;

  return (
    <li
      ref={setNodeRef}
      aria-hidden
      className={cn(
        "flex list-none items-center justify-center rounded-lg text-center text-xs font-semibold transition-colors",
        empty ? "min-h-16 border-2 border-dashed p-3" : compact ? "h-1" : "h-3",
        live && !empty && "border-2 border-dashed border-[#0b1440]/30",
        empty && !live && "border-[#0b1440]/35 text-[#0b1440]/70",
        live && "border-[#0b1440]/40",
        isOver && "border-brand bg-brand/30 text-[#0b1440]",
        isOver && !empty && "h-5",
      )}
    >
      {empty}
    </li>
  );
}

function BlockList({
  blocks,
  containerId,
}: {
  blocks: Block[];
  containerId: string | null;
}) {
  const t = useT();
  const empty =
    blocks.length === 0
      ? containerId === null
        ? t("ws.emptyRoot")
        : t("ws.emptyInner")
      : undefined;
  return (
    <ol className="flex flex-col">
      {blocks.map((b, i) => (
        <Fragment key={b.id}>
          <Slot containerId={containerId} index={i} />
          <BlockRow block={b} />
        </Fragment>
      ))}
      <Slot containerId={containerId} index={blocks.length} empty={empty} />
    </ol>
  );
}

function BlockRow({ block }: { block: Block }) {
  const ctx = useWs();
  const t = useT();
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: block.id,
    data: { kind: "block", type: block.type },
    disabled: !ctx.editing,
  });
  const l = blockLabel(block.type);
  const running = ctx.runningId === block.id;

  return (
    <li
      ref={setNodeRef}
      className={cn("list-none transition-opacity", isDragging && "opacity-30")}
    >
      <div
        className={cn(
          "flex items-center gap-2 block-chip rounded-xl px-3 font-semibold transition-all",
          ctx.compact ? "py-1 text-sm" : "py-2",
          l.color,
          running && "scale-[1.03] ring-4 ring-fg/30",
        )}
      >
        <span
          {...listeners}
          {...attributes}
          aria-label={t("ws.move", { name: t(`block.${block.type}`) })}
          className={cn(
            "flex flex-1 touch-none select-none items-center gap-2",
            ctx.editing && "cursor-grab",
          )}
        >
          <span aria-hidden className="text-lg leading-none opacity-60">
            ⠿
          </span>
          <span aria-hidden>{l.icon}</span>
          <span>{t(`block.${block.type}`)}</span>
        </span>

        <BlockParams
          block={block}
          disabled={!ctx.editing}
          onParam={(patch) => ctx.onParam(block.id, patch)}
        />
        {block.type === "repeat" && (
          <label className="flex items-center gap-1 text-sm">
            <select
              aria-label={t("ws.repeatTimes")}
              value={block.times}
              disabled={!ctx.editing}
              onChange={(e) => ctx.onTimes(block.id, Number(e.target.value))}
              className="rounded-lg bg-black/15 px-1 py-0.5"
            >
              {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {t("ws.timesWord")}
          </label>
        )}
        <button
          type="button"
          aria-label={t("ws.remove", { name: t(`block.${block.type}`) })}
          disabled={!ctx.editing}
          onClick={() => ctx.onRemove(block.id)}
          className="grid h-7 w-7 place-items-center rounded-lg bg-black/15 hover:bg-black/30 disabled:opacity-40"
        >
          ×
        </button>
      </div>

      {isContainer(block) && (
        <div
          className={cn(
            "ml-4 mt-1 rounded-xl border-2 border-dashed p-2",
            ctx.container === block.id
              ? "border-warn bg-warn/10"
              : "border-[#0b1440]/30",
          )}
        >
          <button
            type="button"
            disabled={!ctx.editing}
            onClick={() =>
              ctx.setContainer(ctx.container === block.id ? null : block.id)
            }
            className="mb-1 text-xs font-semibold text-[#0b1440]/70 underline-offset-2 hover:underline"
          >
            {ctx.container === block.id
              ? t("ws.addInsideOn")
              : t("ws.addInside")}
          </button>
          <BlockList blocks={block.body} containerId={block.id} />
        </div>
      )}
    </li>
  );
}
