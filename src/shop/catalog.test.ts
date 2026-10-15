import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Glasses, Hat, Neck } from "@/components/game/outfits";
import { priceWithDiscount } from "@/lib/wallet";
import { CATALOG, SLOT_KEY, SLOTS, type Slot } from "./catalog";

describe("catálogo de la tienda", () => {
  it("tiene ids únicos y precios no negativos", () => {
    expect(new Set(CATALOG.map((i) => i.id)).size).toBe(CATALOG.length);
    for (const i of CATALOG) expect(i.price).toBeGreaterThanOrEqual(0);
  });

  it("coincide con lo sembrado en la base de datos (migración 0007)", () => {
    const sql = readFileSync("supabase/migrations/0007_shop_and_coins.sql", "utf8");
    const rows = [...sql.matchAll(/\('([^']+)', '([^']+)', '([^']+)', '([^']+)', (\d+), \d+\)/g)].map((m) => ({
      id: m[1], slot: m[2], name: m[3], rarity: m[4], price: Number(m[5]),
    }));
    expect(rows.length).toBe(CATALOG.length);
    for (const item of CATALOG) {
      expect(rows.find((r) => r.id === item.id), `falta ${item.id} en el SQL`).toEqual({
        id: item.id, slot: item.slot, name: item.name, rarity: item.rarity, price: item.price,
      });
    }
  });

  it("todas las ranuras tienen artículos y los colores iniciales son gratis", () => {
    for (const { slot } of SLOTS) expect(CATALOG.some((i) => i.slot === slot)).toBe(true);
    expect(CATALOG.filter((i) => i.slot === "color" && i.price === 0).length).toBeGreaterThanOrEqual(2);
  });

  it("cada artículo tiene su dibujo", () => {
    for (const item of CATALOG) {
      if (item.slot === "hat") expect(Hat({ id: item.id }), item.id).not.toBeNull();
      if (item.slot === "glasses") expect(Glasses({ id: item.id }), item.id).not.toBeNull();
      if (item.slot === "neck") expect(Neck({ id: item.id }), item.id).not.toBeNull();
    }
  });

  it("cada color existe como variante del personaje", () => {
    const src = readFileSync("src/components/game/fuzzy.tsx", "utf8");
    for (const item of CATALOG.filter((i) => i.slot === "color")) {
      const v = item.id.slice(6);
      expect(src.includes(`${v}: {`), `variante ${v}`).toBe(true);
    }
  });

  it("las ranuras guardan en claves válidas del avatar", () => {
    const keys: Record<Slot, string> = { color: "variant", hat: "hat", glasses: "glasses", neck: "neck" };
    expect(SLOT_KEY).toEqual(keys);
  });
});

describe("descuento de la oferta del día", () => {
  it("redondea hacia abajo, igual que la base de datos", () => {
    expect(priceWithDiscount(100, 20)).toBe(80);
    expect(priceWithDiscount(90, 20)).toBe(72);
    expect(priceWithDiscount(60, 20)).toBe(48);
    expect(priceWithDiscount(40, 20)).toBe(32);
    expect(priceWithDiscount(250, 20)).toBe(200);
    expect(priceWithDiscount(45, 20)).toBe(36);
    expect(priceWithDiscount(55, 20)).toBe(44);
  });
});
