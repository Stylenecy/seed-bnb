import { cn } from "@/lib/cn";

type Tone = "violet" | "emerald" | "cyan" | "neutral";

type Props = {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
};

export function Badge({ children, className, tone = "neutral" }: Props) {
  const tones: Record<Tone, string> = {
    violet: "border-violet/30 text-violet-soft bg-violet/5",
    emerald: "border-emerald/30 text-emerald-soft bg-emerald/5",
    cyan: "border-cyan/30 text-cyan bg-cyan/5",
    neutral: "border-border-strong text-fg-muted bg-white/[0.03]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide uppercase",
        tones[tone],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone === "violet" && "bg-violet",
          tone === "emerald" && "bg-emerald",
          tone === "cyan" && "bg-cyan",
          tone === "neutral" && "bg-fg-muted"
        )}
      />
      {children}
    </span>
  );
}
