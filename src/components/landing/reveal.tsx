"use client";

import { useEffect, useRef, useState } from "react";

/** Hace aparecer su contenido con un deslizamiento suave cuando entra en pantalla. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"init" | "hidden" | "shown">("init");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      setState("shown");
      return;
    }
    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${state === "hidden" ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
      style={{ transitionDelay: state === "shown" ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
