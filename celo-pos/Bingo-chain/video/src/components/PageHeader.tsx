import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Copied verbatim from apps/web/components/PageHeader.tsx. */
export function PageHeader({
  eyebrow,
  title,
  accent,
  accentClassName,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  accent?: string;
  accentClassName?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.28em] text-neon/80">{eyebrow}</p>
        )}
        <div className="relative inline-block">
          <h1 className="font-anton text-[2.6rem] uppercase leading-[0.9] text-cream [text-shadow:0_2px_28px_rgba(1,8,40,0.6)] sm:text-[3.5rem]">
            {title}
          </h1>
          {accent && (
            <span
              className={cn(
                "font-condiment pointer-events-none absolute -bottom-3 -right-3 -rotate-3 text-3xl normal-case text-neon mix-blend-exclusion sm:-bottom-5 sm:-right-7 sm:text-[2.75rem]",
                accentClassName,
              )}
            >
              {accent}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/70 sm:text-base">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
