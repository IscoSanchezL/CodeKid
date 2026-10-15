"use client";

import { useEffect, useMemo, useState } from "react";
import { blockLabel } from "@/components/game/program-editor";
import type { Block } from "@/engine/types";
import { toCode, type Lang } from "@/lib/codegen";

/** Programa de ejemplo: el reto «Zigzag» del nivel 2. */
const DEMO: Block[] = [
  {
    id: "r",
    type: "repeat",
    times: 3,
    body: [
      { id: "a", type: "move" },
      { id: "b", type: "right" },
      { id: "c", type: "move" },
      { id: "d", type: "left" },
    ],
  },
];

const KEYWORDS = new Set(["for", "let", "in", "range", "pass"]);

/** Colorea una línea de código (palabras clave, funciones, números y comentarios). */
function Highlight({ line }: { line: string }) {
  const parts = line.match(/\/\/.*|#.*|[A-Za-z_]\w*|\d+|\s+|./g) ?? [];
  return (
    <>
      {parts.map((p, i) => {
        let cls = "text-[#c9d6ff]";
        if (p.startsWith("//") || p.startsWith("#")) cls = "text-[#6b7bb5] italic";
        else if (KEYWORDS.has(p)) cls = "text-[#c792ff]";
        else if (/^\d+$/.test(p)) cls = "text-[#ffb454]";
        else if (/^[A-Za-z_]\w*$/.test(p) && line.slice(line.indexOf(p) + p.length).startsWith("(")) cls = "text-[#5ee3ff]";
        return (
          <span key={i} className={cls}>
            {p}
          </span>
        );
      })}
    </>
  );
}

function BlockTree({ blocks }: { blocks: Block[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {blocks.map((b) => {
        const l = blockLabel(b.type);
        return (
          <li key={b.id}>
            <div className={`flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold shadow-[0_2px_0_rgba(0,0,0,0.3)] ${l.color}`}>
              <span aria-hidden>{l.icon}</span>
              {l.text}
              {b.type === "repeat" && <span className="rounded bg-black/20 px-1.5 text-xs">{b.times} veces</span>}
            </div>
            {b.type === "repeat" && (
              <div className="ml-4 mt-1.5 border-l-2 border-dashed border-white/25 pl-3">
                <BlockTree blocks={b.body} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Ventana de editor: a la izquierda los bloques, a la derecha el mismo programa escrito en vivo en código real. */
export function CodeWindow() {
  const [lang, setLang] = useState<Lang>("js");
  const full = useMemo(() => toCode(DEMO, lang), [lang]);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    setTyped(0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTyped(full.length);
      return;
    }
    let n = 0;
    let wait = 0;
    const t = window.setInterval(() => {
      if (n < full.length) {
        n += 1;
        setTyped(n);
      } else if (++wait > 70) {
        n = 0;
        wait = 0; // vuelve a empezar, como una demostración
        setTyped(0);
      }
    }, 38);
    return () => window.clearInterval(t);
  }, [full]);

  const lines = full.slice(0, typed).split("\n");

  return (
    <div className="glass mx-auto max-w-4xl overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/25 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-white/60">reto-2-zigzag</span>
        <div className="ml-auto flex gap-1 rounded-lg bg-black/30 p-1" role="tablist" aria-label="Lenguaje">
          {(["js", "python"] as const).map((l) => (
            <button
              key={l}
              role="tab"
              type="button"
              aria-selected={lang === l}
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1 text-xs font-bold ${lang === l ? "bg-[#22d3ee] text-[#03051a]" : "text-white/70 hover:text-white"}`}
            >
              {l === "js" ? "JavaScript" : "Python"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_1.25fr]">
        <div className="p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#5ee3ff]">Tus bloques</p>
          <BlockTree blocks={DEMO} />
        </div>
        <div aria-hidden className="hidden items-center md:flex">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#22d3ee] text-xl font-black text-[#03051a] shadow-[0_0_24px_#22d3ee]">⇄</span>
        </div>
        <div className="border-t border-white/10 bg-black/30 p-5 md:border-l md:border-t-0">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#ffb454]">…y el código real</p>
          <pre className="min-h-[9.5rem] font-mono text-sm leading-relaxed" aria-label="Código generado">
            {lines.map((ln, i) => (
              <div key={i}>
                <Highlight line={ln} />
                {i === lines.length - 1 && <span className="caret" />}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
