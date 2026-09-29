import { useCurrentFrame, interpolate, Easing } from "remotion";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { ConnectButton } from "../components/ConnectButton";
import { Cursor } from "../components/Cursor";
import { cn } from "../lib/cn";

const TOKENS = ["LANCE", "CELO", "cUSD", "USDC", "USDT"];
const label = "block font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground";

/** /create — open a new arena (LANCE · 10 · 4 seats). The seats slider animates
 *  from 2 → 4 and the cursor taps Create at the end. */
export function Create() {
  const frame = useCurrentFrame();
  const seats = Math.round(interpolate(frame, [40, 95], [2, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }));
  const pct = ((seats - 2) / (6 - 2)) * 100;

  // Cursor: rides the slider, then drops to the Create button.
  const cx = interpolate(frame, [20, 40, 95, 150, 175], [760, 690, 880, 760, 760], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(frame, [20, 40, 95, 150, 175], [560, 560, 560, 720, 720], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const down = interpolate(frame, [168, 176, 188], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const creating = frame > 178;

  return (
    <AppShell active="/arenas">
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 py-10">
        <span className="inline-flex items-center gap-1 self-start font-mono text-xs text-muted-foreground">← Back</span>
        <PageHeader eyebrow="Open a table" title="New arena" accent="go onchain" actions={<ConnectButton />} />

        <div className="glass flex flex-col gap-6 rounded-2xl p-5">
          <label className="space-y-2">
            <span className={label}>Settlement token</span>
            <div className="grid grid-cols-3 gap-2">
              {TOKENS.map((k) => (
                <span
                  key={k}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-center text-sm font-semibold transition",
                    k === "LANCE" ? "border-neon bg-neon text-navy shadow-glow" : "border-white/10 text-muted-foreground",
                  )}
                >
                  {k}
                </span>
              ))}
            </div>
          </label>

          <label className="space-y-2">
            <span className={label}>Entry stake (LANCE)</span>
            <div className="flex h-11 w-full items-center rounded-lg border border-border bg-card/60 px-3.5 text-sm text-foreground">10</div>
          </label>

          <label className="space-y-3">
            <span className={`${label} flex items-baseline justify-between`}>
              Players
              <span className="font-mono text-base text-neon">{seats}</span>
            </span>
            <div className="relative h-2 w-full rounded-full bg-white/10">
              <div className="absolute inset-y-0 left-0 rounded-full bg-neon" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-neon shadow-glow" style={{ left: `calc(${pct}% - 8px)` }} />
            </div>
            <span className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>2</span>
              <span>6</span>
            </span>
          </label>

          <div
            className={cn(
              "flex h-12 w-full items-center justify-center rounded-lg bg-primary px-7 text-base font-semibold text-primary-foreground shadow-glow",
              creating && "opacity-80",
            )}
          >
            {creating ? "Creating…" : "Create arena"}
          </div>
        </div>
      </main>
      <Cursor x={cx} y={cy} down={down} />
    </AppShell>
  );
}
