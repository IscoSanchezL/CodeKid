import { useMemo, useSyncExternalStore } from "react";

/** i18n ligero: español (por defecto) e inglés. Idioma guardado en localStorage["labs-lang"]. */
export type Lang = "es" | "en";
export type Dict = Record<string, string>;
export type Part = { es: Dict; en: Dict };
export type Vars = Record<string, string | number>;
export type TFn = (key: string, vars?: Vars) => string;

export const LANG_KEY = "labs-lang";

const ES: Dict = {};
const EN: Dict = {};

/** Registra un bloque de textos (misma lista de claves en es y en). */
export function register(...parts: Part[]): void {
  for (const p of parts) {
    Object.assign(ES, p.es);
    Object.assign(EN, p.en);
  }
}

export const dictionaries = { es: ES, en: EN } as const;

function detect(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    /* sin almacenamiento */
  }
  const nav = typeof navigator !== "undefined" ? (navigator.language || "es") : "es";
  return nav.toLowerCase().startsWith("en") ? "en" : "es";
}

let current: Lang = "es";
let started = false;
const listeners = new Set<() => void>();

function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  current = detect();
}

export function getLang(): Lang {
  start();
  return current;
}

export function setLang(l: Lang): void {
  if (l !== "es" && l !== "en") return;
  start();
  current = l;
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    /* sin almacenamiento */
  }
  if (typeof document !== "undefined") document.documentElement.lang = l;
  listeners.forEach((f) => f());
}

function subscribe(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  let out = s;
  for (const k of Object.keys(vars)) out = out.split(`{${k}}`).join(String(vars[k]));
  return out;
}

/** Traduce `key` en el idioma `lang`. Si falta en inglés cae al español; si falta en ambos devuelve la clave. */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const s = (lang === "en" ? EN[key] : ES[key]) ?? ES[key] ?? key;
  return interpolate(s, vars);
}

/** Traductor para handlers (clics, toasts, confirm). En el render usa siempre `useT()`. */
export const t: TFn = (key, vars) => translate(getLang(), key, vars);

/** Idioma actual como estado de React (en el servidor y en la hidratación siempre «es»). */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "es");
}

/** Devuelve `t` ligado al idioma actual; el componente se re-renderiza al cambiar de idioma. */
export function useT(): TFn {
  const lang = useLang();
  return useMemo<TFn>(() => (key, vars) => translate(lang, key, vars), [lang]);
}

let reverse: Map<string, string> | null = null;
let patterns: { re: RegExp; key: string; names: string[]; literal: number }[] | null = null;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Traduce un texto que ya llegó en español (mensajes de validación o de las funciones del servidor)
 * buscando la clave cuyo texto en español coincide (también las que llevan {variables}).
 * Si no hay coincidencia devuelve el texto tal cual.
 */
export function translateText(lang: Lang, text: string): string {
  if (lang === "es" || !text) return text;
  if (!reverse || !patterns) {
    reverse = new Map();
    patterns = [];
    for (const k of Object.keys(ES)) {
      const v = ES[k];
      if (!v.includes("{")) {
        if (!reverse.has(v)) reverse.set(v, k);
      } else {
        const names: string[] = [];
        const src = v
          .split(/(\{\w+\})/)
          .map((part) => {
            const m = /^\{(\w+)\}$/.exec(part);
            if (m) {
              names.push(m[1]);
              return "(.+?)";
            }
            return escapeRe(part);
          })
          .join("");
        const literal = v.replace(/\{\w+\}/g, "").trim().length;
        if (literal >= 4) patterns.push({ re: new RegExp(`^${src}$`), key: k, names, literal });
      }
    }
    // Las plantillas con más texto fijo van primero (así «Te faltan {n} monedas» gana a «{n} monedas»)
    patterns.sort((a, b) => b.literal - a.literal);
  }
  const key = reverse.get(text);
  if (key) return translate(lang, key);
  for (const p of patterns) {
    const m = p.re.exec(text);
    if (m) {
      const vars: Vars = {};
      p.names.forEach((n, i) => (vars[n] = m[i + 1]));
      return translate(lang, p.key, vars);
    }
  }
  return text;
}
