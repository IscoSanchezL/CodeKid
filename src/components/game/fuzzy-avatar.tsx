import { Fuzzy, type FuzzyVariant } from "./fuzzy";

const VARIANTS: FuzzyVariant[] = ["cyan", "purple", "orange", "green", "rainbow"];

/** Variante estable por alumno (a partir de su id) mientras no haya elegido un color propio. */
export function variantFor(key: string): FuzzyVariant {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return VARIANTS[h % VARIANTS.length];
}

export type Avatar = Record<string, string> | null | undefined;

export function FuzzyAvatar({ id, avatar, size = 48, className }: { id: string; avatar?: Avatar; size?: number; className?: string }) {
  return (
    <Fuzzy
      variant={(avatar?.variant as FuzzyVariant | undefined) ?? variantFor(id)}
      outfit={{ hat: avatar?.hat, glasses: avatar?.glasses, neck: avatar?.neck }}
      dir={2}
      mood="happy"
      size={size}
      className={className}
    />
  );
}
