"use client";
import "./index";

import { translateText, useLang, useT, type Vars } from "./core";

/** Texto traducido para usar dentro de componentes de servidor: <T k="clave" />. */
export function T({ k, vars }: { k: string; vars?: Vars }) {
  const t = useT();
  return <>{t(k, vars)}</>;
}

/** Texto que ya viene en español (p. ej. un error del servidor): lo muestra en el idioma activo. */
export function TX({ text }: { text: string }) {
  const lang = useLang();
  return <>{translateText(lang, text)}</>;
}
