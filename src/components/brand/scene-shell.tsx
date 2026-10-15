import { Meadow, SceneDecor } from "./scene-decor";

/** Página completa con cielo (día/noche) y prado abajo. */
export function SceneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="scene-sky relative min-h-dvh overflow-hidden">
      <SceneDecor sunClass="right-[8%] top-28 h-24 w-24" />
      <div className="relative pb-28">{children}</div>
      <Meadow height={64} />
    </div>
  );
}
