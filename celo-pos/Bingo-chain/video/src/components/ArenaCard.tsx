import { Badge, type BadgeProps } from "./Badge";
import { cn } from "../lib/cn";
import type { ArenaState, MockArena } from "../lib/mock";

const STATE: Record<ArenaState, { label: string; variant: BadgeProps["variant"] }> = {
  created: { label: "Open", variant: "open" },
  committed: { label: "Full", variant: "full" },
  playing: { label: "Playing", variant: "playing" },
  revealing: { label: "Revealing", variant: "revealing" },
  settled: { label: "Settled", variant: "settled" },
  cancelled: { label: "Cancelled", variant: "cancelled" },
};

/** Adapted from apps/web/components/ArenaCard.tsx (Link → div, formatted strings
 *  passed in). `hover` lifts the card to simulate a pointer hover. */
export function ArenaCard({ arena, hover = false }: { arena: MockArena; hover?: boolean }) {
  const s = STATE[arena.state] ?? STATE.created;
  const live = arena.state === "playing" || arena.state === "created";
  const seats = Math.min(arena.max, 12);

  return (
    <div
      className={cn(
        "group glass relative block overflow-hidden rounded-2xl p-5 transition-all duration-300",
        hover ? "-translate-y-1 border-neon/40 shadow-glow" : "",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent opacity-60" />
      <div aria-hidden className={cn("pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-neon/10 blur-2xl transition-opacity duration-300", hover ? "opacity-100" : "opacity-60")} />
      <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-state-playing/10 opacity-50 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="font-anton text-lg uppercase tracking-tight text-cream">
          Arena <span className="font-mono text-neon">#{arena.id}</span>
        </span>
        <Badge variant={s.variant} dot={live}>
          {s.label}
        </Badge>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">Stake</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold leading-none text-cream">
            {arena.stake}
            <span className="ml-1 text-xs font-normal text-muted-foreground">{arena.symbol}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">Seats</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold leading-none text-cream">
            {arena.joined}
            <span className="text-muted-foreground">/{arena.max}</span>
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-1.5">
        {Array.from({ length: seats }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-all duration-300",
              i < arena.joined
                ? "bg-neon shadow-[0_0_8px_hsl(var(--primary)/0.65)]"
                : "border border-white/10 bg-white/[0.04]",
            )}
          />
        ))}
      </div>
    </div>
  );
}
