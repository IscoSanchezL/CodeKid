/**
 * Catálogo de la tienda. Los precios son los de la base de datos (tabla shop_items):
 * un test comprueba que esta lista y la migración 0007 coinciden.
 */
export type Slot = "color" | "hat" | "glasses" | "neck";
export type Rarity = "comun" | "raro" | "epico";
export type ShopItem = { id: string; slot: Slot; name: string; rarity: Rarity; price: number };

export const SLOTS: { slot: Slot; label: string; icon: string }[] = [
  { slot: "color", label: "Colores", icon: "🎨" },
  { slot: "hat", label: "Sombreros", icon: "🎩" },
  { slot: "glasses", label: "Gafas", icon: "🕶️" },
  { slot: "neck", label: "Accesorios", icon: "🧣" },
];

/** Clave con la que cada ranura se guarda en profiles.avatar. */
export const SLOT_KEY: Record<Slot, "variant" | "hat" | "glasses" | "neck"> = {
  color: "variant",
  hat: "hat",
  glasses: "glasses",
  neck: "neck",
};

export const RARITY_LABEL: Record<Rarity, string> = { comun: "Común", raro: "Raro", epico: "Épico" };

export const CATALOG: ShopItem[] = [
  // colores (los dos primeros vienen gratis)
  { id: "color-cyan", slot: "color", name: "Celeste", rarity: "comun", price: 0 },
  { id: "color-green", slot: "color", name: "Menta", rarity: "comun", price: 0 },
  { id: "color-purple", slot: "color", name: "Violeta", rarity: "comun", price: 40 },
  { id: "color-orange", slot: "color", name: "Naranja", rarity: "comun", price: 40 },
  { id: "color-pink", slot: "color", name: "Chicle", rarity: "comun", price: 60 },
  { id: "color-red", slot: "color", name: "Fresa", rarity: "comun", price: 60 },
  { id: "color-rainbow", slot: "color", name: "Arcoíris", rarity: "raro", price: 150 },
  { id: "color-gold", slot: "color", name: "Dorado", rarity: "epico", price: 250 },
  // sombreros
  { id: "hat-flower", slot: "hat", name: "Flor", rarity: "comun", price: 30 },
  { id: "hat-cap", slot: "hat", name: "Gorra", rarity: "comun", price: 30 },
  { id: "hat-chef", slot: "hat", name: "Gorro de chef", rarity: "comun", price: 40 },
  { id: "hat-antenna", slot: "hat", name: "Antenas", rarity: "comun", price: 50 },
  { id: "hat-cowboy", slot: "hat", name: "Vaquero", rarity: "comun", price: 60 },
  { id: "hat-top", slot: "hat", name: "Sombrero de copa", rarity: "comun", price: 80 },
  { id: "hat-pirate", slot: "hat", name: "Pirata", rarity: "raro", price: 90 },
  { id: "hat-wizard", slot: "hat", name: "Gorro de mago", rarity: "raro", price: 100 },
  { id: "hat-astro", slot: "hat", name: "Casco espacial", rarity: "raro", price: 150 },
  { id: "hat-crown", slot: "hat", name: "Corona", rarity: "epico", price: 200 },
  // gafas
  { id: "gl-round", slot: "glasses", name: "Gafas redondas", rarity: "comun", price: 30 },
  { id: "gl-sun", slot: "glasses", name: "Gafas de sol", rarity: "comun", price: 50 },
  { id: "gl-heart", slot: "glasses", name: "Corazones", rarity: "comun", price: 60 },
  { id: "gl-monocle", slot: "glasses", name: "Monóculo", rarity: "comun", price: 70 },
  { id: "gl-nerd", slot: "glasses", name: "Visor de programador", rarity: "raro", price: 80 },
  { id: "gl-star", slot: "glasses", name: "Estrellas", rarity: "raro", price: 120 },
  // accesorios
  { id: "neck-bow", slot: "neck", name: "Corbatín", rarity: "comun", price: 30 },
  { id: "neck-scarf", slot: "neck", name: "Bufanda", rarity: "comun", price: 50 },
  { id: "neck-medal", slot: "neck", name: "Medalla", rarity: "comun", price: 70 },
  { id: "neck-cape", slot: "neck", name: "Capa de héroe", rarity: "raro", price: 120 },
  { id: "neck-wings", slot: "neck", name: "Alas", rarity: "epico", price: 220 },
];

export const itemById = (id: string) => CATALOG.find((i) => i.id === id);
export const itemsOf = (slot: Slot) => CATALOG.filter((i) => i.slot === slot);
export const isFree = (id: string) => (itemById(id)?.price ?? 1) === 0;
