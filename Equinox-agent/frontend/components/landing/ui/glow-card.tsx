"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  glow?: "violet" | "indigo" | "emerald" | "cyan" | "none";
  interactive?: boolean;
};

const glowColors: Record<NonNullable<Props["glow"]>, string> = {
  violet: "rgba(145,129,245,0.22)",
  indigo: "rgba(64,97,252,0.22)",
  emerald: "rgba(22,217,168,0.18)",
  cyan: "rgba(92,216,255,0.18)",
  none: "transparent",
};

export function GlowCard({
  children,
  className,
  glow = "violet",
  interactive = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      style={
        {
          ["--glow-color" as string]: glowColors[glow],
        } as React.CSSProperties
      }
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface/70 backdrop-blur-sm",
        "transition-all duration-500 ease-out",
        "shadow-[var(--shadow-card)]",
        interactive &&
          "hover:border-border-strong hover:-translate-y-[2px] hover:bg-surface-2/80",
        className
      )}
    >
      {interactive && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), var(--glow-color), transparent 45%)",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
