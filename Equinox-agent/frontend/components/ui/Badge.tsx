import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "positive" | "warning" | "danger" | "muted";

const tones: Record<Tone, string> = {
  neutral: "bg-white/[0.04] text-ink-100 border-white/10",
  accent: "bg-[var(--color-accent)]/12 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  positive: "bg-[var(--color-positive)]/12 text-[var(--color-positive)] border-[var(--color-positive)]/25",
  warning: "bg-[var(--color-warning)]/12 text-[var(--color-warning)] border-[var(--color-warning)]/25",
  danger: "bg-[var(--color-danger)]/12 text-[var(--color-danger)] border-[var(--color-danger)]/25",
  muted: "bg-white/[0.025] text-ink-300 border-white/[0.06]",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot = false,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        "uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "positive" && "bg-[var(--color-positive)] animate-pulse-soft",
            tone === "warning" && "bg-[var(--color-warning)]",
            tone === "danger" && "bg-[var(--color-danger)] animate-pulse-soft",
            tone === "accent" && "bg-[var(--color-accent)] animate-pulse-soft",
            tone === "neutral" && "bg-ink-300",
            tone === "muted" && "bg-ink-400",
          )}
        />
      )}
      {children}
    </span>
  );
}
