import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "btn-gloss inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all hover:-translate-y-0.5 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-fg shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_14px_24px_-10px_rgb(var(--brand)/0.55)] hover:brightness-110 active:translate-y-1 active:shadow-[0_0_0_0_rgba(0,0,0,0.28)]",
        secondary: "bg-surface-2 text-fg hover:bg-border/60",
        outline: "border border-border bg-surface text-fg hover:bg-surface-2",
        ghost: "text-fg hover:bg-surface-2",
        go: "bg-[#22c55e] text-white shadow-[0_4px_0_0_#15803d,0_14px_24px_-10px_rgba(34,197,94,0.6)] hover:brightness-110 active:translate-y-1 active:shadow-none",
        danger: "btn-exit hover:brightness-110",
        accent:
          "bg-accent text-[rgb(8_16_48)] shadow-[0_4px_0_0_rgba(0,0,0,0.25)] hover:brightness-110 active:translate-y-1 active:shadow-none",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-base",
        lg: "h-14 px-7 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = VariantProps<typeof buttonVariants> & { className?: string };

export function Button({
  className,
  variant,
  size,
  ...props
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: Props & React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
