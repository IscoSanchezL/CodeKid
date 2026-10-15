import { Fuzzy, type FuzzyVariant } from "./fuzzy";

const VARIANTS: FuzzyVariant[] = ["cyan", "purple", "orange", "green", "rainbow"];

/** Variante estable por alumno (a partir de su id), para que siempre vea el mismo personaje. */
export function variantFor(key: string): FuzzyVariant {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return VARIANTS[h % VARIANTS.length];
}

export function FuzzyAvatar({ id, size = 48, className }: { id: string; size?: number; className?: string }) {
  return <Fuzzy variant={variantFor(id)} size={size} dir={2} mood="happy" className={className} />;
}
