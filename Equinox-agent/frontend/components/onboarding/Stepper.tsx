import { cn } from "@/lib/cn";

interface StepperProps {
  steps: string[];
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol
      className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.16em] sm:gap-3"
      style={{ fontFamily: "var(--font-tech), ui-sans-serif, system-ui" }}
    >
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-2.5 sm:gap-3">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] tabular-nums transition-colors",
                done && "text-white",
                active && "text-white",
                !done && !active &&
                  "border border-border-strong bg-surface/40 text-fg-dim"
              )}
              style={
                done
                  ? { background: "var(--gradient-brand)" }
                  : active
                    ? {
                        background:
                          "linear-gradient(180deg, rgba(145,129,245,0.18), rgba(67,97,252,0.10))",
                        boxShadow:
                          "0 0 0 1px rgba(145,129,245,0.6), 0 0 18px -4px rgba(145,129,245,0.55)",
                      }
                    : undefined
              }
            >
              {done ? (
                <svg viewBox="0 0 12 12" width={12} height={12} aria-hidden>
                  <path
                    d="M2.5 6.5l2.5 2.5L9.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <span
              className={cn(
                "hidden sm:inline",
                active ? "text-fg" : done ? "text-fg-muted" : "text-fg-dim"
              )}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-6 sm:w-10",
                  done ? "bg-violet-soft/50" : "bg-border-strong"
                )}
                style={
                  done
                    ? {
                        background:
                          "linear-gradient(90deg, rgba(145,129,245,0.7), rgba(67,97,252,0.5))",
                      }
                    : undefined
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
