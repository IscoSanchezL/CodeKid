import { BrandImage } from "@/components/brand/brand-hero";
import { CosmosSky } from "@/components/brand/cosmos";
import { Logo } from "@/components/brand/logo";
import { CodeRain } from "@/components/landing/code-rain";
import { CodeWindow } from "@/components/landing/code-window";
import { Constellation } from "@/components/landing/constellation";
import { FloatingBlocks } from "@/components/landing/floating-blocks";
import { Reveal } from "@/components/landing/reveal";
import { TeacherPreview } from "@/components/landing/teacher-preview";
import { WardrobeShowcase } from "@/components/landing/wardrobe-showcase";
import { ButtonLink } from "@/components/ui/button";
import { T } from "@/i18n/t";

const FEATURES = [
  { icon: "🧩", id: "f1" },
  { icon: "🔬", id: "f2" },
  { icon: "🪙", id: "f3" },
  { icon: "🏫", id: "f4" },
  { icon: "🛡️", id: "f5" },
  { icon: "♿", id: "f6" },
];

function Heading({ kicker, title, children }: { kicker: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#5ee3ff]">{`// ${kicker}`}</p>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h2>
      {children && <p className="mt-4 text-lg text-white/70">{children}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <div data-theme="dark" className="cosmos-page min-h-dvh overflow-x-clip">
      {/* ── Portal de entrada ─────────────────────────────────────────── */}
      <section className="relative">
        <CosmosSky className="min-h-[100svh]">
          <div className="relative flex min-h-[100svh] flex-col">
            <CodeRain />
            <FloatingBlocks />

            <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center px-4 py-5">
              <Logo />
            </header>

            <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pb-24 pt-2 text-center">
              <p className="glass rounded-full px-4 py-1 text-sm font-semibold text-white/80"><T k="land.badge" /></p>

              <div className="relative mb-14 mt-4 w-full max-w-md">
                <div aria-hidden className="portal portal-b" />
                <div aria-hidden className="portal portal-a" />
                <BrandImage blend className="cosmos-float relative" />
              </div>

              <p className="font-mono text-sm font-bold tracking-[0.35em] text-[#8af0ff]">
                <T k="brand.play" /> <span className="text-white/50">·</span> <span className="text-white"><T k="brand.create" /></span> <span className="text-white/50">·</span>{" "}
                <span className="text-[#ffb454]"><T k="brand.code" /></span>
              </p>

              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                <T k="land.title1" /><span className="text-neon"><T k="land.title2" /></span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/75">
                <T k="land.lead" />
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/clase" size="lg" className="glow-pulse">
                  <T k="land.enterClass" />
                </ButtonLink>
                <ButtonLink href="/login" variant="outline" size="lg" className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20">
                  <T k="land.teacher" />
                </ButtonLink>
              </div>
            </div>

            <p aria-hidden className="relative z-10 pb-6 text-center font-mono text-xs tracking-widest text-white/50">
              <T k="land.discover" />
            </p>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#03051a]" />
          </div>
        </CosmosSky>
      </section>

      <main className="relative">
        {/* ── Bloques ⇄ código ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <Heading kicker={<T k="land.codeKicker" />} title={<T k="land.codeTitle" />}>
              <T k="land.codeText" />
            </Heading>
          </Reveal>
          <Reveal delay={120}>
            <CodeWindow />
          </Reveal>
        </section>

        {/* ── Constelación de niveles ───────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <Heading kicker={<T k="land.worldsKicker" />} title={<T k="land.worldsTitle" />}>
              <T k="land.worldsText" />
            </Heading>
          </Reveal>
          <Reveal delay={120}>
            <Constellation />
          </Reveal>
        </section>

        {/* ── Características ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <Heading kicker={<T k="land.powersKicker" />} title={<T k="land.powersTitle" />} />
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <li key={f.id}>
                <Reveal delay={i * 70} className="h-full">
                  <div className="glass neon h-full rounded-2xl p-6">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#8b5cff]/30 text-2xl" aria-hidden>
                      {f.icon}
                    </span>
                    <h3 className="mt-4 text-xl font-extrabold"><T k={`land.${f.id}.title`} /></h3>
                    <p className="mt-2 text-white/70"><T k={`land.${f.id}.text`} /></p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Tienda ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <Heading kicker={<T k="land.shopKicker" />} title={<T k="land.shopTitle" />}>
              <T k="land.shopText" />
            </Heading>
          </Reveal>
          <Reveal delay={120}>
            <WardrobeShowcase />
          </Reveal>
        </section>

        {/* ── Docentes ──────────────────────────────────────────────── */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#ffb454]"><T k="land.teachKicker" /></p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl"><T k="land.teachTitle" /></h2>
              <ul className="mt-6 space-y-3 text-lg text-white/75">
                {["land.teach1", "land.teach2", "land.teach3"].map((k) => (
                  <li key={k} className="flex gap-3">
                    <span aria-hidden className="mt-1 text-[#5ee3ff]">▸</span>
                    <T k={k} />
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <TeacherPreview />
          </Reveal>
        </section>
      </main>

      <footer className="relative border-t border-white/10 py-10 text-center text-sm text-white/55">
        <p className="font-mono"><T k="land.footer1" /></p>
        <p className="mt-1"><T k="land.footer2" vars={{ year: new Date().getFullYear() }} /></p>
      </footer>
    </div>
  );
}
