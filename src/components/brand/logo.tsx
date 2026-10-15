import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-mono text-brand-fg shadow-pop"
      >
        {"</>"}
      </span>
      <span>
        Code<span className="text-brand">Kid</span>
      </span>
    </Link>
  );
}
