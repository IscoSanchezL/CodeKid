import type { BlockType } from "@/engine/types";

/** Aspecto de cada tipo de bloque (icono, texto y colores). */
const LABELS = {
  move: { icon: "⬆️", text: "Avanzar", color: "bg-brand text-brand-fg" },
  left: {
    icon: "↰",
    text: "Girar izquierda",
    color: "bg-[#ff9b4a] text-[rgb(8_16_48)]",
  },
  right: { icon: "↱", text: "Girar derecha", color: "bg-success text-white" },
  repeat: { icon: "🔁", text: "Repetir", color: "bg-success text-white" },
  if: { icon: "❓", text: "Si", color: "bg-[#8b5cf6] text-white" },
  while: { icon: "♾️", text: "Mientras", color: "bg-[#7c3aed] text-white" },
  def: { icon: "🧩", text: "Crear bloque", color: "bg-[#0ea5a4] text-white" },
  call: {
    icon: "▶️",
    text: "Usar bloque",
    color: "bg-[#14b8a6] text-[rgb(8_16_48)]",
  },
  setvar: { icon: "📦", text: "pasos =", color: "bg-[#ec4899] text-white" },
  addvar: {
    icon: "➕",
    text: "pasos",
    color: "bg-[#f472b6] text-[rgb(8_16_48)]",
  },
  movevar: {
    icon: "🔢",
    text: "Avanzar «pasos»",
    color: "bg-[#3b82f6] text-white",
  },
  list: {
    icon: "📋",
    text: "Lista de giros",
    color: "bg-[#f59e0b] text-[rgb(8_16_48)]",
  },
  foreach: {
    icon: "🔂",
    text: "Por cada giro",
    color: "bg-[#d97706] text-white",
  },
  turnitem: {
    icon: "🧭",
    text: "Girar según el giro",
    color: "bg-[#fbbf24] text-[rgb(8_16_48)]",
  },
} as const;

export function blockLabel(type: BlockType) {
  return LABELS[type];
}
