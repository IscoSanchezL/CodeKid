import { HeroScene } from "@/components/brand/hero-scene";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEVELS } from "@/lib/levels";

const FEATURES = [
  { title: "Bloques y código", text: "Arrastra bloques y mira tu programa convertirse en JavaScript o Python." },
  { title: "Depura paso a paso", text: "Ejecuta lento, resalta cada instrucción y entiende dónde falla." },
  { title: "Para el aula", text: "Los docentes crean clases, asignan retos y ven el progreso de cada alumno." },
  { title: "Accesible", text: "Teclado completo, modo daltónico, alto contraste y fuente para dislexia." },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Docentes
          </ButtonLink>
          <ButtonLink href="/clase" size="sm">
            Entrar con mi clase
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-center sm:pt-20">
          <p className="mx-auto mb-4 w-fit rounded-full border border-border bg-surface px-4 py-1 text-sm font-medium text-muted">
            Para 9 a 16 años · 10 niveles · en español
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Aprende a programar <span className="text-brand">jugando</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Empieza con bloques visuales y termina escribiendo código real. Resuelve retos, gana
            logros y crea tus propios juegos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/clase" size="lg">
              Entrar con mi clase
            </ButtonLink>
            <ButtonLink href="/registro" variant="outline" size="lg">
              Soy docente: crear cuenta
            </ButtonLink>
          </div>
          <HeroScene />
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <h2 className="text-lg font-bold">{f.title}</h2>
              <p className="mt-2 text-muted">{f.text}</p>
            </Card>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <h2 className="mb-6 text-2xl font-bold">Tu ruta de aprendizaje</h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LEVELS.map((l) => (
              <li key={l.id} className="rounded-2xl border border-border bg-surface p-4">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-mono text-sm font-bold text-brand-fg">
                  {l.id}
                </span>
                <h3 className="mt-3 font-bold">{l.title}</h3>
                <p className="mt-1 text-sm text-muted">{l.summary}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} CodeKid · Sin publicidad · Pensado para menores
      </footer>
    </>
  );
}
