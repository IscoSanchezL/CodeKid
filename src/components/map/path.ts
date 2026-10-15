export type Pt = readonly [number, number];

/** Ruta suave que pasa por todos los puntos (Catmull-Rom convertida a curvas de Bézier). */
export function smoothPath(pts: readonly Pt[]): { d: string; samples: Pt[] } {
  const p = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  const samples: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
    for (let t = 0; t <= 1; t += 0.05) {
      const u = 1 - t;
      samples.push([
        u * u * u * p1[0] +
          3 * u * u * t * c1[0] +
          3 * u * t * t * c2[0] +
          t * t * t * p2[0],
        u * u * u * p1[1] +
          3 * u * u * t * c1[1] +
          3 * u * t * t * c2[1] +
          t * t * t * p2[1],
      ]);
    }
  }
  return { d, samples };
}

/** Generador pseudoaleatorio con semilla: el paisaje es siempre el mismo (sin saltos al hidratar). */
export function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
