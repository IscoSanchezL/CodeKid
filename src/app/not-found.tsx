import { ButtonLink } from "@/components/ui/button";
import { T } from "@/i18n/t";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl" aria-hidden>
        🛸
      </p>
      <h1 className="text-2xl font-extrabold">
        <T k="notfound.title" />
      </h1>
      <ButtonLink href="/">
        <T k="notfound.back" />
      </ButtonLink>
    </main>
  );
}
