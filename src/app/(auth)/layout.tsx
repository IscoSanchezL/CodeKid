import { Logo } from "@/components/brand/logo";
import { Meadow, SceneDecor } from "@/components/brand/scene-decor";
import { Fuzzy } from "@/components/game/fuzzy";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="scene-sky relative min-h-dvh overflow-hidden">
      <SceneDecor sunClass="right-[8%] top-28 h-24 w-24" />
      <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 pb-28 pt-10">
        <Logo />
        {children}
      </main>
      <Meadow height={64} />
      <div aria-hidden className="pointer-events-none absolute bottom-3 left-4 hidden sm:block lg:left-24">
        <div className="fz-idle">
          <Fuzzy variant="rainbow" size={110} dir={1} mood="happy" />
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute bottom-3 right-4 hidden sm:block lg:right-24">
        <div className="fz-idle" style={{ animationDelay: "0.8s" }}>
          <Fuzzy variant="purple" size={96} dir={3} mood="happy" />
        </div>
      </div>
    </div>
  );
}
