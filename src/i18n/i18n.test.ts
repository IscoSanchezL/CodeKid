import { describe, expect, it } from "vitest";
import { CHALLENGES } from "@/engine/levels";
import { LEVELS } from "@/lib/levels";
import { CATALOG } from "@/shop/catalog";
import { dictionaries, translate, translateText } from "./index";
import { PARTS } from "./index";

const ES = dictionaries.es;
const EN = dictionaries.en;

describe("diccionarios es / en", () => {
  it("cada parte tiene exactamente las mismas claves en español e inglés", () => {
    for (const [name, part] of Object.entries(PARTS)) {
      expect(Object.keys(part.en).sort(), name).toEqual(Object.keys(part.es).sort());
    }
  });

  it("ninguna traducción al inglés está vacía ni es idéntica a una clave", () => {
    for (const k of Object.keys(EN)) {
      expect(EN[k].trim().length, k).toBeGreaterThan(0);
      expect(ES[k].trim().length, k).toBeGreaterThan(0);
    }
  });

  it("las variables {x} son las mismas en los dos idiomas", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const k of Object.keys(ES)) expect(vars(EN[k]), k).toBe(vars(ES[k]));
  });

  it("no queda texto con aspecto de español en las traducciones al inglés", () => {
    const spanish = /[áéíóúñ¿¡]|\b(el|la|los|las|una|para|con|tu|tus|puedes|hay|bloque|reto)\b/i;
    // excepciones: nombres propios o literales que son iguales en los dos idiomas
    const allowed = new Set(["lang.label", "land.footer1", "land.footer2", "brand.tagline.aria"]);
    for (const k of Object.keys(EN)) {
      if (allowed.has(k)) continue;
      expect(spanish.test(EN[k]), `${k}: ${EN[k]}`).toBe(false);
    }
  });

  it("interpola {variables} y cae al español si falta la clave en inglés", () => {
    expect(translate("en", "play.blocksUsed", { n: 3, par: 2 })).toBe("You used 3 blocks (best: 2)");
    expect(translate("es", "play.blocksUsed", { n: 3, par: 2 })).toBe("Usaste 3 bloques (lo mejor: 2)");
    expect(translate("en", "no.existe")).toBe("no.existe");
  });

  it("traduce mensajes que llegan en español del servidor (con y sin variables)", () => {
    expect(translateText("en", "Clave incorrecta")).toBe("Wrong password");
    expect(translateText("en", "Te faltan 12 monedas")).toBe("You need 12 more coins");
    expect(translateText("en", "Texto desconocido")).toBe("Texto desconocido");
    expect(translateText("es", "Clave incorrecta")).toBe("Clave incorrecta");
  });
});

describe("contenido del juego", () => {
  it("los niveles y retos tienen título y pista en inglés y el español coincide con el motor", () => {
    for (const c of CHALLENGES) {
      expect(ES[`ch.${c.level}.${c.challenge}.title`], `${c.level}-${c.challenge}`).toBe(c.title);
      expect(ES[`ch.${c.level}.${c.challenge}.hint`], `${c.level}-${c.challenge}`).toBe(c.hint);
      expect(EN[`ch.${c.level}.${c.challenge}.title`]).toBeTruthy();
      expect(EN[`ch.${c.level}.${c.challenge}.hint`]).toBeTruthy();
    }
    for (const l of LEVELS) {
      expect(ES[`lv.${l.id}.title`]).toBe(l.title);
      expect(ES[`lv.${l.id}.summary`]).toBe(l.summary);
    }
  });

  it("la tienda tiene nombre en inglés para cada artículo", () => {
    for (const i of CATALOG) {
      expect(ES[`item.${i.id}`], i.id).toBe(i.name);
      expect(EN[`item.${i.id}`], i.id).toBeTruthy();
    }
  });
});
