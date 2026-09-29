"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-ink-950 hover:bg-[var(--color-accent-soft)] " +
    "shadow-[0_0_0_1px_rgba(228,243,61,0.5),0_18px_40px_-18px_rgba(228,243,61,0.55)] " +
    "hover:shadow-[0_0_0_1px_rgba(228,243,61,0.7),0_22px_50px_-16px_rgba(228,243,61,0.7)]",
  secondary:
    "bg-white text-ink-950 hover:bg-ink-100 shadow-[0_0_0_1px_rgba(255,255,255,0.6)]",
  ghost:
    "bg-transparent text-ink-100 hover:bg-white/[0.04] border border-transparent",
  outline:
    "bg-transparent text-ink-50 border border-white/10 hover:border-white/25 hover:bg-white/[0.025]",
  danger:
    "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.005em]",
        "transition-all duration-200 will-change-transform",
        "disabled:opacity-40 disabled:pointer-events-none",
        "active:scale-[0.985]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
