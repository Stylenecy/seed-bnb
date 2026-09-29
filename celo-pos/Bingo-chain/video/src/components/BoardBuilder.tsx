import { cn } from "../lib/cn";

const ALL = Array.from({ length: 25 }, (_, i) => i + 1);

/** Presentational version of apps/web/components/BoardBuilder.tsx — the empty
 *  grid + number tray. `value` is the current placement (null = empty), driven
 *  per-frame by the scene to animate an auto-fill. `armed` highlights a tray
 *  number; `dropHighlight` shows the armed-drop cell tint. */
export function BoardBuilder({
  value,
  armed = null,
  dropHighlight = false,
}: {
  value: (number | null)[];
  armed?: number | null;
  dropHighlight?: boolean;
}) {
  const placed = new Set(value.filter((n): n is number => n !== null));
  const tray = ALL.filter((n) => !placed.has(n));

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="grid grid-cols-5 gap-1.5 lg:flex-1">
        {value.map((n, i) => (
          <div
            key={i}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all",
              n !== null
                ? "border-neon/40 bg-neon/15 text-neon"
                : "border-dashed border-white/15 bg-card/40 text-muted-foreground",
              dropHighlight && n === null && "border-neon/60 bg-neon/[0.07]",
            )}
          >
            {n ?? ""}
          </div>
        ))}
      </div>

      <div className="lg:w-44">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {tray.length ? `Numbers · ${tray.length} left` : "Board complete"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tray.map((n) => (
            <div
              key={n}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all",
                armed === n
                  ? "scale-110 border-neon bg-neon text-navy shadow-glow"
                  : "border-white/10 bg-card/60 text-cream",
              )}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
