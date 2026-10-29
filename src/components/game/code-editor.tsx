"use client";

import { useRef } from "react";
import type { Lang } from "@/lib/code-parser";
import { NAMES } from "@/lib/code-names";
import { useLang, useT } from "@/i18n";
import { cn } from "@/lib/utils";

type Props = {
  lang: Lang;
  onLang: (l: Lang) => void;
  value: string;
  onChange: (v: string) => void;
  error: { line: number; message: string } | null;
  runningLine: number | null;
  disabled: boolean;
};

/** Atajos para insertar instrucciones, con los nombres del idioma activo. */
function snippets(lang: Lang, api: "es" | "en"): { label: string; text: string }[] {
  const n = NAMES[lang][api];
  const { wall, free, coin, goal } = n.atoms;
  if (lang === "js")
    return [
      { label: `${n.move}()`, text: `${n.move}();\n` },
      { label: `${n.right}()`, text: `${n.right}();\n` },
      { label: `${n.left}()`, text: `${n.left}();\n` },
      { label: "for", text: "for (let i = 0; i < 3; i++) {\n  \n}\n" },
      { label: "while", text: `while (${free}()) {\n  ${n.move}();\n}\n` },
      { label: "if", text: `if (${wall}()) {\n  ${n.right}();\n}\n` },
      { label: `${wall}()`, text: `${wall}()` },
      { label: `${free}()`, text: `${free}()` },
      { label: `${coin}()`, text: `${coin}()` },
      { label: `${goal}()`, text: `${goal}()` },
      { label: "function", text: `function ${n.block("A")}() {\n  \n}\n` },
      { label: n.steps, text: `let ${n.steps} = 1;\n` },
    ];
  return [
    { label: `${n.move}()`, text: `${n.move}()\n` },
    { label: `${n.right}()`, text: `${n.right}()\n` },
    { label: `${n.left}()`, text: `${n.left}()\n` },
    { label: "for", text: "for _ in range(3):\n    \n" },
    { label: "while", text: `while ${free}():\n    ${n.move}()\n` },
    { label: "if", text: `if ${wall}():\n    ${n.right}()\n` },
    { label: `${wall}()`, text: `${wall}()` },
    { label: `${free}()`, text: `${free}()` },
    { label: `${coin}()`, text: `${coin}()` },
    { label: `${goal}()`, text: `${goal}()` },
    { label: "def", text: `def ${n.block("A")}():\n    \n` },
    { label: n.steps, text: `${n.steps} = 1\n` },
  ];
}

/** Editor de código con números de línea, atajos para insertar instrucciones y aviso de errores. */
export function CodeEditor({
  lang,
  onLang,
  value,
  onChange,
  error,
  runningLine,
  disabled,
}: Props) {
  const t = useT();
  const api = useLang();
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = Math.max(value.split("\n").length, 6);
  const indent = lang === "js" ? "  " : "    ";

  function insert(text: string) {
    const el = area.current;
    if (!el || disabled) return;
    const a = el.selectionStart;
    const b = el.selectionEnd;
    const needsBreak =
      a > 0 &&
      value[a - 1] !== "\n" &&
      text.endsWith("\n") &&
      /^[a-z]/.test(text) &&
      !/^[a-zA-Z_]+\(\)$/.test(text);
    const insertion = (needsBreak ? "\n" : "") + text;
    onChange(value.slice(0, a) + insertion + value.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      const pos = a + insertion.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <div
      className="flex min-w-0 flex-col gap-2 rounded-2xl border border-cyan-300/20 bg-[#0b1030] p-3 text-white shadow-[0_0_40px_-12px_rgba(94,160,255,0.5)]"
      data-theme="dark"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label={t("code.language")}
          className="flex overflow-hidden rounded-lg border border-white/15"
        >
          {(["js", "python"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={lang === l}
              disabled={disabled}
              onClick={() => l !== lang && onLang(l)}
              className={cn(
                "px-3 py-1 font-mono text-sm font-bold",
                lang === l
                  ? "bg-cyan-400 text-[#06122e]"
                  : "bg-[#0b1440] text-white/80 hover:bg-[#13205f]",
              )}
            >
              {l === "js" ? "JavaScript" : "Python"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1" aria-label={t("code.insert")}>
          {snippets(lang, api).map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={disabled}
              onClick={() => insert(s.text)}
              className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs text-cyan-100 hover:bg-white/20 disabled:opacity-40"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex overflow-hidden rounded-xl border border-cyan-300/30 bg-[#070b24] shadow-[inset_0_0_30px_rgba(94,160,255,0.12)]">
        <div
          ref={gutter}
          aria-hidden
          className="select-none overflow-hidden bg-black/30 py-2 pl-2 pr-2 text-right font-mono text-sm leading-6 text-white/40"
        >
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                error?.line === i + 1 && "font-bold text-red-400",
                runningLine === i + 1 && "font-bold text-cyan-300",
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {(error || runningLine) && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-2"
              style={{
                transform: `translateY(${((error?.line ?? runningLine ?? 1) - 1) * 24}px)`,
              }}
            >
              <div
                className={cn(
                  "h-6 w-full",
                  error ? "bg-red-500/25" : "bg-cyan-400/20",
                )}
              />
            </div>
          )}
          <textarea
            ref={area}
            value={value}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={t("code.aria", { lang: lang === "js" ? "JavaScript" : "Python" })}
            rows={lines}
            onChange={(e) => onChange(e.target.value)}
            onScroll={(e) => {
              if (gutter.current)
                gutter.current.scrollTop = e.currentTarget.scrollTop;
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                insert(indent);
              }
            }}
            className="relative block w-full resize-none bg-transparent py-2 pl-3 pr-3 font-mono text-sm leading-6 text-cyan-50 outline-none"
          />
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300"
        >
          {t("code.error", { line: error.line, message: error.message })}
        </p>
      )}
    </div>
  );
}
