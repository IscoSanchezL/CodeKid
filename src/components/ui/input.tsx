import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Input({ label, id, className, ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <label
      htmlFor={inputId}
      className="flex flex-col gap-1.5 text-sm font-medium"
    >
      {label}
      <input
        id={inputId}
        className={cn(
          "field h-11 rounded-xl border border-border bg-surface px-3 text-base text-fg placeholder:text-muted",
          className,
        )}
        {...props}
      />
    </label>
  );
}
