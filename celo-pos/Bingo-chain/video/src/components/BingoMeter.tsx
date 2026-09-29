import { cn } from "../lib/cn";

const LETTERS = ["B", "I", "N", "G", "O"];

/** Copied verbatim from apps/web/components/BingoMeter.tsx (animate-pulse kept;
 *  the `won` glow is also driven by the scene for motion in the render). */
export function BingoMeter({ lines, pulse = false }: { lines: number; pulse?: boolean }) {
  const won = lines >= 5;
  return (
    <div className="flex items-center gap-1.5" aria-label={`${Math.min(lines, 5)} of 5 lines complete`}>
      {LETTERS.map((ch, i) => (
        <span
          key={ch}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg font-anton text-base transition-all duration-300",
            i < lines
              ? "bg-neon text-navy shadow-glow"
              : "border border-white/10 bg-card/60 text-muted-foreground",
          )}
          style={won && pulse ? { filter: "brightness(1.15)" } : undefined}
        >
          {ch}
        </span>
      ))}
      {won && <span className="ml-1 font-anton text-sm uppercase tracking-wide text-neon">Bingo!</span>}
    </div>
  );
}
