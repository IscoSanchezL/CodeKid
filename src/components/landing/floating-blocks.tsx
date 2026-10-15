import { blockLabel } from "@/components/game/program-editor";
import type { BlockType } from "@/engine/types";

const BLOCKS: { type: BlockType; cls: string; rot: number; dur: number; delay: number; scale: number }[] = [
  { type: "move", cls: "left-[5%] top-[30%]", rot: -12, dur: 9, delay: 0, scale: 1.1 },
  { type: "repeat", cls: "right-[6%] top-[26%]", rot: 9, dur: 11, delay: -4, scale: 1.2 },
  { type: "right", cls: "left-[10%] bottom-[16%]", rot: 8, dur: 10, delay: -2, scale: 1 },
  { type: "left", cls: "right-[9%] bottom-[20%]", rot: -7, dur: 12, delay: -6, scale: 1 },
  { type: "move", cls: "left-[24%] top-[12%] hidden lg:flex", rot: 14, dur: 8, delay: -3, scale: 0.9 },
  { type: "right", cls: "right-[24%] bottom-[8%] hidden lg:flex", rot: -14, dur: 13, delay: -1, scale: 0.9 },
];

/** Bloques del juego flotando alrededor del logo, con brillo propio. Es decorativo. */
export function FloatingBlocks() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
      {BLOCKS.map((b, i) => {
        const l = blockLabel(b.type);
        return (
          <div key={i} className={`absolute flex ${b.cls}`} style={{ rotate: `${b.rot}deg`, scale: b.scale }}>
            <div className="cosmos-float" style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}>
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-[0_0_28px_-2px_currentColor] sm:text-base ${l.color}`}
              >
                <span>{l.icon}</span>
                {l.text}
                {b.type === "repeat" && <span className="rounded-lg bg-black/20 px-1.5 text-xs">×3</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
