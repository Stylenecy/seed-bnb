import { useCurrentFrame, interpolate, Easing } from "remotion";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { ArenaCard } from "../components/ArenaCard";
import { Cursor } from "../components/Cursor";
import { cn } from "../lib/cn";
import { LOBBY_ARENAS } from "../lib/mock";

const FILTERS = ["All", "Open", "Live"];

/** /arenas — the onchain bingo lobby. */
export function Arenas() {
  const frame = useCurrentFrame();
  // Cursor drifts from a hovered card up to the "+ Create arena" button, then taps.
  const cx = interpolate(frame, [10, 120, 200, 235], [760, 760, 1430, 1430], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(frame, [10, 120, 200, 235], [620, 620, 250, 250], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const down = interpolate(frame, [232, 240, 250], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hoverCard = frame > 30 && frame < 150;

  return (
    <AppShell active="/arenas">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-7 px-6 py-10">
        <PageHeader
          eyebrow="Onchain bingo lobby"
          title="Arenas"
          accent="live"
          subtitle={
            <>
              Sealed boards, verifiable winners. Claim a seat, stake <span className="text-neon">$LANCE</span>, and race
              to call the winning line.
            </>
          }
          actions={
            <Button size="lg" className="px-7">
              + Create arena
            </Button>
          }
        />

        <div className="glass flex flex-row items-center gap-3 rounded-2xl p-3">
          <div className="flex h-11 max-w-xs flex-1 items-center rounded-lg border-0 bg-white/[0.03] px-3.5 text-sm text-muted-foreground">
            Search by arena # or token…
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {FILTERS.map((f) => (
              <span
                key={f}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                  f === "Open" ? "bg-neon/15 text-neon ring-1 ring-neon/30" : "text-muted-foreground",
                )}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="-mt-3 text-right font-mono text-xs text-muted-foreground">6 open · 14 recent</p>

        <div className="grid grid-cols-3 gap-4">
          {LOBBY_ARENAS.map((a, i) => (
            <ArenaCard key={a.id} arena={a} hover={hoverCard && i === 0} />
          ))}
        </div>
      </main>
      <Cursor x={cx} y={cy} down={down} />
    </AppShell>
  );
}
