import { AchievementBadges } from "./AchievementBadges";
import { MY_STATS, MY_RECENT } from "../lib/mock";

/** Adapted from apps/web/components/PlayerStatsCard.tsx — static demo stats. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function PlayerStatsCard() {
  const s = MY_STATS;
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Games" value={String(s.games)} />
        <Stat label="Wins" value={String(s.wins)} />
        <Stat label="Volume" value={s.volume} />
        <Stat label="Won" value={s.earnings} />
      </div>

      <AchievementBadges stats={s} />

      <div className="glass rounded-xl p-4">
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Recent games</p>
        <ul className="space-y-1.5 text-sm">
          {MY_RECENT.slice(0, 6).map((m) => (
            <li key={m.arenaId} className="flex items-center justify-between gap-3">
              <span className="font-mono text-muted-foreground">#{m.arenaId}</span>
              <span
                className={
                  m.outcome === "win"
                    ? "text-state-open"
                    : m.outcome === "cancelled"
                      ? "text-muted-foreground"
                      : "text-foreground"
                }
              >
                {m.outcome}
              </span>
              <span className="font-mono text-foreground">{m.outcome === "win" ? `+${m.prize}` : m.stake}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
