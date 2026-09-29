import { useId } from "react";
import { cn } from "../lib/cn";
import { LINES, completedLineIndices } from "../lib/board";

// Cell center in a 0..100 viewBox (5 columns), used to strike completed lines.
const center = (cell: number) => ({ x: (cell % 5) * 20 + 10, y: Math.floor(cell / 5) * 20 + 10 });

/** 5×5 board — adapted from apps/web/components/BoardGrid.tsx (motion/react
 *  replaced by frame-driven props). Called cells are neon; `lastPulse` (0..1)
 *  animates the just-called ring; `highlightCell` shows the on-turn hover style
 *  (the board doubles as the call pad). Completed lines get a masked neon strike. */
export function BoardGrid({
  board,
  called,
  lastCalled,
  lastPulse = 0,
  highlightCell = null,
  callable = false,
}: {
  board: number[];
  called?: Set<number>;
  lastCalled?: number;
  lastPulse?: number;
  highlightCell?: number | null;
  callable?: boolean;
}) {
  const struck = called ? completedLineIndices(board, called) : [];
  const maskId = `bm-${useId().replace(/:/g, "")}`;

  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-1.5">
        {board.map((n, i) => {
          const marked = called?.has(n);
          const isLast = marked && n === lastCalled;
          const isHover = callable && !marked && highlightCell === i;
          return (
            <div
              key={i}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg font-mono text-sm font-bold transition-colors",
                marked
                  ? "bg-gold-sheen text-primary-foreground shadow-glow"
                  : "border border-white/[0.06] bg-card/60 text-muted-foreground",
                isHover && "border-gold-400/40 text-gold-300",
              )}
            >
              {isLast && (
                <span
                  className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-gold-300"
                  style={{ opacity: 0.85 * (1 - lastPulse), transform: `scale(${1 + lastPulse * 0.5})` }}
                />
              )}
              {n}
            </div>
          );
        })}
      </div>

      {struck.length > 0 && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          <defs>
            <mask id={maskId}>
              <rect width="100" height="100" fill="white" />
              {board.map((_, i) => {
                const c = center(i);
                return <circle key={i} cx={c.x} cy={c.y} r="6.5" fill="black" />;
              })}
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            {struck.map((li) => {
              const a = center(LINES[li][0]);
              const b = center(LINES[li][4]);
              return (
                <g key={li}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--primary))" strokeWidth={6} strokeLinecap="round" opacity={0.2} />
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--primary))" strokeWidth={3} strokeLinecap="round" opacity={0.95} />
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}
