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

const FEATURES = [
  { icon: "🧩", title: "Bloques y código", text: "Arrastra bloques y mira tu programa convertirse en JavaScript o Python reales." },
  { icon: "🔬", title: "Depura paso a paso", text: "Ejecuta despacio, resalta cada instrucción y entiende dónde falla." },
  { icon: "🪙", title: "Monedas y trajes", text: "Cada reto da monedas para vestir a tu personaje en la tienda." },
  { icon: "🏫", title: "Para el aula", text: "Los docentes crean clases con código propio y ven el progreso de cada alumno." },
  { icon: "🛡️", title: "Pensado para menores", text: "Sin publicidad ni correos de alumnos. Entran con el código de su clase." },
  { icon: "♿", title: "Accesible", text: "Teclado completo, modo daltónico, alto contraste y fuente para dislexia." },
];

function Heading({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
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
              <p className="glass rounded-full px-4 py-1 text-sm font-semibold text-white/80">Para 9 a 16 años · 10 niveles · en español</p>

              <div className="relative mb-14 mt-4 w-full max-w-md">
                <div aria-hidden className="portal portal-b" />
                <div aria-hidden className="portal portal-a" />
                <BrandImage blend className="cosmos-float relative" />
              </div>

              <p className="font-mono text-sm font-bold tracking-[0.35em] text-[#8af0ff]">
                JUEGA <span className="text-white/50">·</span> <span className="text-white">CREA</span> <span className="text-white/50">·</span>{" "}
                <span className="text-[#ffb454]">PROGRAMA</span>
              </p>

              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Aprende a programar <span className="text-neon">jugando</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/75">
                Empieza con bloques y termina escribiendo código real. Resuelve retos, gana monedas y viaja por una galaxia de programación.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/clase" size="lg" className="glow-pulse">
                  Entrar con mi clase
                </ButtonLink>
                <ButtonLink href="/login" variant="outline" size="lg" className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20">
                  Soy docente
                </ButtonLink>
              </div>
            </div>

            <p aria-hidden className="relative z-10 pb-6 text-center font-mono text-xs tracking-widest text-white/50">
              ↓ DESCUBRE CÓMO FUNCIONA
            </p>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#03051a]" />
          </div>
        </CosmosSky>
      </section>

      <main className="relative">
        {/* ── Bloques ⇄ código ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <Heading kicker="bloques ⇄ código" title="Hoy mueves bloques. Mañana escribes código.">
              Cada bloque tiene su equivalente en JavaScript y Python. Míralo escribirse solo, línea por línea.
            </Heading>
          </Reveal>
          <Reveal delay={120}>
            <CodeWindow />
          </Reveal>
        </section>

        {/* ── Constelación de niveles ───────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <Heading kicker="10 mundos" title="Una galaxia entera por explorar">
              De las secuencias a tus propios proyectos: cada planeta enseña una idea nueva de la programación.
            </Heading>
          </Reveal>
          <Reveal delay={120}>
            <Constellation />
          </Reveal>
        </section>

        {/* ── Características ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <Heading kicker="superpoderes" title="Todo lo que hace especial a CodeKid" />
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <li key={f.title}>
                <Reveal delay={i * 70} className="h-full">
                  <div className="glass neon h-full rounded-2xl p-6">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#8b5cff]/30 text-2xl" aria-hidden>
                      {f.icon}
                    </span>
                    <h3 className="mt-4 text-xl font-extrabold">{f.title}</h3>
                    <p className="mt-2 text-white/70">{f.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Tienda ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <Heading kicker="tienda" title="Gana monedas y viste a tu personaje">
              Sombreros, gafas, capas y colores: cada reto superado te acerca a un nuevo look.
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
              <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#ffb454]">{`// para docentes`}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">Tu clase, lista en un minuto</h2>
              <ul className="mt-6 space-y-3 text-lg text-white/75">
                {[
                  "Crea la clase con el código y la clave que prefieras.",
                  "Tus alumnos entran tocando su nombre: sin correos ni datos personales.",
                  "Mira estrellas, monedas y avance de cada uno desde tu panel.",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden className="mt-1 text-[#5ee3ff]">▸</span>
                    {t}
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
        <p className="font-mono">{"</>"} CodeKid · Juega. Crea. Programa.</p>
        <p className="mt-1">© {new Date().getFullYear()} · Sin publicidad · Pensado para menores</p>
      </footer>
    </div>
  );
}
