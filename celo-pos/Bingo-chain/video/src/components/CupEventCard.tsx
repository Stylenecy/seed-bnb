import { Countdown } from "./Countdown";
import { Badge, type BadgeProps } from "./Badge";
import { Player } from "./Player";
import { cn } from "../lib/cn";
import type { CupEvent, LeaderRow } from "../lib/mock";

const MEDAL = ["🥇", "🥈", "🥉"];

const STATUS_BADGE: Record<CupEvent["status"], BadgeProps["variant"]> = {
  live: "open",
  past: "settled",
};

/** Adapted from apps/web/components/CupEventCard.tsx — button → div, live data
 *  passed in. `top` is the top-3 preview of this cup's board. */
export function CupEventCard({
  event,
  top,
  selected,
  hover = false,
}: {
  event: CupEvent;
  top: LeaderRow[];
  selected: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "group glass relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
        (hover || selected) && "-translate-y-1 border-neon/40 shadow-glow",
        selected && "border-neon/50",
      )}
    >
      <div aria-hidden className={cn("pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-neon/10 blur-2xl transition-opacity duration-300", hover ? "opacity-100" : "opacity-60")} />

      <div className="relative flex items-start justify-between gap-3">
        <h3 className="font-anton text-lg uppercase leading-tight text-cream">{event.title}</h3>
        <Badge variant={STATUS_BADGE[event.status]} dot={event.status === "live"}>
          {event.status}
        </Badge>
      </div>

      <div className="relative flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{event.status === "live" ? "Ends in" : "Ended"}</span>
        {event.status === "live" ? (
          <Countdown fromSeconds={event.endsAtFromNowSec} />
        ) : (
          <span className="font-mono text-muted-foreground">—</span>
        )}
      </div>

      <p className="relative text-xs text-muted-foreground">
        Top <span className="text-cream">{event.topN}</span> win{" "}
        <span className="text-neon">
          {event.prizePerWinner} {event.token}
        </span>{" "}
        each
      </p>

      <div className="relative mt-1 space-y-1.5 border-t border-white/[0.06] pt-3">
        {top.map((r, i) => (
          <div key={r.address} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="w-4 shrink-0 text-center">{MEDAL[i] ?? i + 1}</span>
              <Player address={r.address} name={r.name} size="sm" />
            </span>
            <span className="shrink-0 font-mono text-gold-300">{r.volume}</span>
          </div>
        ))}
      </div>

      <span className="relative mt-1 font-mono text-[11px] uppercase tracking-wider text-neon/70">
        {selected ? "Showing full board ↓" : "View full board →"}
      </span>
    </div>
  );
}
