import { useCurrentFrame, interpolate, Easing } from "remotion";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { CupEventCard } from "../components/CupEventCard";
import { Player } from "../components/Player";
import { Badge } from "../components/Badge";
import { Cursor } from "../components/Cursor";
import { cn } from "../lib/cn";
import { CUP_EVENTS, CUP_LEADERBOARD } from "../lib/mock";

const MEDAL = ["🥇", "🥈", "🥉"];

/** /competition — the Cup: live events + a window-scoped leaderboard. */
export function Cup() {
  const frame = useCurrentFrame();
  const tops = [
    CUP_LEADERBOARD.slice(0, 3),
    CUP_LEADERBOARD.slice(1, 4),
    CUP_LEADERBOARD.slice(0, 3),
  ];
  // Cursor drifts across the event cards.
  const cx = interpolate(frame, [20, 130, 200], [560, 960, 960], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(frame, [20, 130, 200], [430, 430, 430], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  return (
    <AppShell active="/competition">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
        <span className="inline-flex items-center gap-1 self-start font-mono text-xs text-muted-foreground">← Back</span>
        <PageHeader
          eyebrow="Tournament"
          title="Cup"
          accent="for glory"
          subtitle={
            <>
              Compete for <span className="text-neon">$LANCE</span> by total volume staked. Live events run a countdown;
              past events keep their final standings.
            </>
          }
        />

        <div className="flex gap-2">
          {["live", "past"].map((t) => (
            <span
              key={t}
              className={cn(
                "rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                t === "live" ? "bg-neon/15 text-neon ring-1 ring-neon/30" : "text-muted-foreground",
              )}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {CUP_EVENTS.map((c, i) => (
            <CupEventCard key={c.id} event={c} top={tops[i]} selected={i === 0} />
          ))}
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-anton text-xl uppercase text-cream">
              Genesis Cup <span className="text-muted-foreground">· full standings</span>
            </h2>
            <Badge variant="open" dot>live</Badge>
          </div>
          <div className="glass overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">Games</th>
                  <th className="px-4 py-3 text-right">Wins</th>
                  <th className="px-4 py-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {CUP_LEADERBOARD.map((r) => (
                  <tr key={r.address} className={cn("border-b border-border/40", r.rank <= 10 && "bg-neon/[0.05]")}>
                    <td className="px-4 py-2.5 font-mono">{r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}</td>
                    <td className="px-4 py-2.5">
                      <Player address={r.address} name={r.name} size="sm" />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.games}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.wins}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{r.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Cursor x={cx} y={cy} />
    </AppShell>
  );
}
