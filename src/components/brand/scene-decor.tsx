/** Decoración de cielo: estrellas (solo de noche), sol/luna y nubes. Va dentro de un contenedor `scene-sky relative`. */
export function SceneDecor({ scale = 1, sunClass = "-right-6 -top-6 h-28 w-28" }: { scale?: number; sunClass?: string }) {
  return (
    <>
      <div aria-hidden className="scene-stars pointer-events-none absolute inset-0" />
      <div aria-hidden className={`scene-sun absolute rounded-full ${sunClass}`} />
      <div aria-hidden className="bd-cloud" style={{ top: "9%", left: "6%", width: 100 * scale, height: 30 * scale }} />
      <div
        aria-hidden
        className="bd-cloud bd-cloud-slow"
        style={{ top: "22%", right: "9%", width: 130 * scale, height: 38 * scale }}
      />
    </>
  );
}

/** Prado con relieve en la parte baja de un contenedor `relative`. */
export function Meadow({ height = 40 }: { height?: number }) {
  return (
    <>
      <div aria-hidden className="scene-meadow absolute inset-x-0 bottom-0" style={{ height }} />
      <div aria-hidden className="scene-meadow-edge absolute inset-x-0 bottom-0" style={{ height: Math.max(8, height / 4) }} />
    </>
  );
}
