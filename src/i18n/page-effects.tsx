"use client";

import "./index";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { challengeTitle, levelTitle } from "./content";
import { useLang, useT } from "./core";
import { getChallenge } from "@/engine/levels";
import { isAdvanced, levelMeta, planetOf } from "@/lib/levels";

const STATIC_TITLES: Record<string, string> = {
  "/login": "title.login",
  "/registro": "title.register",
  "/recuperar": "title.recover",
  "/actualizar-clave": "title.updatePass",
  "/clase": "title.class",
  "/docente": "title.teacher",
  "/mapa": "title.map",
  "/tienda": "title.shop",
};

/** Mantiene <html lang>, el título de la pestaña y la descripción al día con el idioma activo (sin recargar). */
export function PageEffects() {
  const lang = useLang();
  const t = useT();
  const path = usePathname();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const brand = "CodeKid";
    let title = t("title.default");
    if (path !== "/") {
      let page = "";
      const m = /^\/nivel\/(\d+)(?:\/(\d+))?\/?$/.exec(path);
      if (m) {
        const n = Number(m[1]);
        if (m[2]) {
          const c = getChallenge(n, Number(m[2]));
          page = c ? t(isAdvanced(n) ? "title.challengeAdv" : "title.challenge", { title: challengeTitle(t, n, c.challenge, c.title), n }) : t("title.notFound");
        } else {
          const meta = levelMeta(n);
          page = meta
            ? t(isAdvanced(n) ? "title.levelAdv" : "title.level", { n: isAdvanced(n) ? planetOf(n) : n, title: levelTitle(t, n, meta.title) })
            : t("title.notFound");
        }
      } else if (STATIC_TITLES[path]) page = t(STATIC_TITLES[path]);
      if (page) title = `${page} · ${brand}`;
    }
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t("title.description"));
  }, [t, path]);

  return null;
}
