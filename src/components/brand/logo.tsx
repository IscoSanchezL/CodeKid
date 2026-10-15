import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/codekid-mark.svg" alt="" aria-hidden width={40} height={40} className="h-10 w-10 drop-shadow" />
      <span>
        Code<span className="text-brand">Kid</span>
      </span>
    </Link>
  );
}
