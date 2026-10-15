import type { BlockType } from "@/engine/types";

/** Aspecto de cada tipo de bloque (icono, texto y colores). */
const LABELS = {
  move: { icon: "⬆️", text: "Avanzar", color: "bg-brand text-brand-fg" },
  left: { icon: "↰", text: "Girar izquierda", color: "bg-[#ff9b4a] text-[rgb(8_16_48)]" },
  right: { icon: "↱", text: "Girar derecha", color: "bg-success text-white" },
  repeat: { icon: "🔁", text: "Repetir", color: "bg-success text-white" },
} as const;

export function blockLabel(type: BlockType) {
  return LABELS[type];
}
