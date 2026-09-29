import { useMemo, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  buildAreaPath,
  buildLinePath,
  computeDeltaPercent,
  computeYDomain,
  isCoincidentLines,
  linearScale,
  nearestIndex,
  pickTickIndices,
  selectFloorCaption,
  shouldClearTooltipOnPointerUp,
} from '../lib/chart';
import { formatPrice, formatShortDate } from '../lib/format';
import type { HealthStatus } from '../lib/health';

export interface ChartPoint {
  at: string; // ISO timestamp
  price: number;
  synthetic?: boolean;
}

interface PriceChartProps {
  points: ChartPoint[];
  /** "Cermin defends · $X" dashed line price. 0 hides the line (no live loan). */
  defensePrice: number;
  /** "Protection floor · $Y" dashed line price. 0 hides the line (vault >= outstanding). */
  floorPrice: number;
  /** Shadow Vault balance — drives the Task 20 coincident-line rule (vault
   * <= 0 always merges the two lines) and which caption variant applies. */
  vaultBalance: number;
  /** The same three-state classification the rest of the app uses
   * (lib/health.ts `healthStatus`) — 'action' means price has already
   * dropped below the defense line (a breach). No new math: this is passed
   * straight through by the caller, never re-derived here. */
  status: HealthStatus;
  /** Below-chart Cermin caption (nudge / breach voice / grace-period
   * explanation, state-aware per Task 20). Defaults to shown; the Landing
   * page's static illustrative hero opts out to keep its own curated copy. */
  showCaption?: boolean;
}

// Task 18: the chart reads cramped at the old 640x220 (2.9:1) box — the two
// reference lines squashed near the bottom edge on top of a small overall
// canvas. The viewBox is now a taller authoring space; the *rendered* CSS
// height is set independently per breakpoint (see the <svg> className below,
// `preserveAspectRatio="none"`) so mobile gets a genuinely shorter box
// (~300px) and desktop a genuinely taller one (~440px) instead of one fixed
// aspect ratio stretched thin at narrow widths.
const WIDTH = 640;
const HEIGHT = 400;
const PAD_X = 8;
const PAD_TOP = 40;
const PAD_BOTTOM = 32;
const PLOT_TOP = PAD_TOP;
const PLOT_BOTTOM = HEIGHT - PAD_BOTTOM;

/** One accessible sentence summarizing the whole chart for screen readers —
 * the SVG's `aria-label` (role="img" makes its children presentational).
 * "Liquidation" appears here, and only here, as the thing that never
 * happens (CLAUDE.md hard rule #2 / the Task 17 brief). `coincident`
 * (Task 20) drops the separate floor sentence when the two lines have
 * merged into one — a screen reader shouldn't hear about a second line
 * that isn't drawn. */
function buildAriaLabel(
  currentPrice: number,
  deltaPercent: number,
  defense: number,
  floor: number,
  coincident: boolean,
): string {
  const direction = deltaPercent >= 0 ? 'up' : 'down';
  let label = `Price chart, last 30 days: currently ${formatPrice(currentPrice)}, ${direction} ${Math.abs(deltaPercent).toFixed(1)} percent over the window.`;
  if (defense > 0) label += ` Cermin defends at ${formatPrice(defense)}.`;
  if (floor > 0 && !coincident) {
    label += ` Below ${formatPrice(floor)}, Cermin's protection floor, I open a grace period instead of a liquidation.`;
  }
  return label;
}

/**
 * Task 17 — hand-rolled SVG area chart (no chart library). One gold price
 * line + warm area fill, a dashed "Cermin defends" line, a dashed
 * "Protection floor" line, and a pulsing current-price dot. Both dashed
 * lines recompute live from the caller's props — after a rescue repays part
 * of the loan, `defensePrice` drops and the line visibly moves down on the
 * next render (see store.ts `selectDefensePrice`).
 *
 * Task 20 — chart state-awareness: the two reference lines merge into one
 * whenever they'd otherwise coincide or the vault is empty (never two
 * stacked labels), the defense line switches to terracotta once price has
 * actually breached it, and the caption underneath speaks in the right
 * Cermin voice for whichever of those states is showing.
 */
export function PriceChart({ points, defensePrice, floorPrice, vaultBalance, status, showCaption = true }: PriceChartProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const prices = useMemo(() => points.map((p) => p.price), [points]);
  const currentPrice = prices[prices.length - 1] ?? 0;
  const deltaPercent = useMemo(() => computeDeltaPercent(prices), [prices]);

  const times = useMemo(() => points.map((p) => new Date(p.at).getTime()), [points]);
  const xDomain: [number, number] = times.length > 0 ? [times[0], times[times.length - 1]] : [0, 1];
  const yDomain = useMemo(() => computeYDomain(prices, defensePrice, floorPrice), [prices, defensePrice, floorPrice]);

  const xScale = linearScale(xDomain, [PAD_X, WIDTH - PAD_X]);
  const yScale = linearScale(yDomain, [PLOT_BOTTOM, PLOT_TOP]);

  const pixelPoints = useMemo(
    () => points.map((p) => ({ x: xScale(new Date(p.at).getTime()), y: yScale(p.price) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, yDomain],
  );
  const xs = useMemo(() => pixelPoints.map((p) => p.x), [pixelPoints]);

  const linePath = buildLinePath(pixelPoints);
  const areaPath = buildAreaPath(pixelPoints, PLOT_BOTTOM);

  const tickIndices = pickTickIndices(points.length, 3);

  const hasDefense = defensePrice > 0;
  const hasFloor = floorPrice > 0;
  const defenseY = hasDefense ? yScale(defensePrice) : null;
  const floorY = hasFloor ? yScale(floorPrice) : null;
  // Task 20 (binding rule): one dashed line + one label when the vault is
  // empty or the two lines would land within 14px of each other — never two
  // stacked, illegible labels.
  const coincident = isCoincidentLines(defenseY, floorY, vaultBalance);
  const showFloorLine = floorY !== null && !coincident;
  // Breach: price has already dropped below the defense line — reuses the
  // same three-state classification the rest of the app shows (no new
  // health math here), just switches the defense line's color/urgency.
  const isBreach = status === 'action';
  const defenseColor = isBreach ? 'var(--color-terracotta)' : 'var(--color-amber)';
  const caption = showCaption
    ? selectFloorCaption({ hasDefense, hasFloor, isBreach, coincident, vaultBalance })
    : null;

  const lastPoint = pixelPoints[pixelPoints.length - 1];

  const hover = activeIndex !== null ? points[activeIndex] : null;
  const hoverXY = activeIndex !== null ? pixelPoints[activeIndex] : null;

  function updateFromClientX(clientX: number, target: Element) {
    const rect = target.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const localX = (clientX - rect.left) * scaleX;
    setActiveIndex(nearestIndex(xs, localX));
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (points.length === 0) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, (i ?? points.length - 1) - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(points.length - 1, (i ?? points.length - 1) + 1));
    } else if (e.key === 'Escape') {
      setActiveIndex(null);
    }
  }

  // Task 20 — the "stuck tooltip" fix: a touch pointer gets implicit
  // capture, so `pointerleave` never fires when a finger drags off the
  // chart and lifts elsewhere (unlike a mouse). `pointerup` always fires on
  // the original target regardless, so clear on release for any non-mouse
  // pointer (touch, pen) — a mouse's tooltip keeps tracking via
  // pointermove/pointerleave/blur as before.
  function onPointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    if (shouldClearTooltipOnPointerUp(e.pointerType)) setActiveIndex(null);
  }

  // Tooltip box, clamped so it never overflows the viewBox.
  const TOOLTIP_W = 140;
  const TOOLTIP_H = 46;
  const tooltipX = hoverXY ? Math.min(Math.max(hoverXY.x - TOOLTIP_W / 2, PAD_X), WIDTH - PAD_X - TOOLTIP_W) : 0;
  const tooltipY = hoverXY ? Math.max(hoverXY.y - TOOLTIP_H - 14, PLOT_TOP) : 0;

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-foreground-faint uppercase">Price</p>
          <p className="mt-1 text-xs text-foreground-faint">Last 30 days</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-foreground tabular-nums">{formatPrice(currentPrice)}</p>
          <p className={`text-xs font-medium tabular-nums ${deltaPercent >= 0 ? 'text-sage' : 'text-terracotta'}`}>
            {deltaPercent >= 0 ? '+' : ''}
            {deltaPercent.toFixed(1)}% · 30d
          </p>
        </div>
      </div>

      {/* `relative` wrapper: the svg below stays `role="img"` (its subtree is
          presentational, collapsed to the one aria-label sentence built by
          buildAriaLabel), and the actually-interactive control is a sibling
          <button> overlay, not a descendant — a focusable element nested
          under role="img" is stripped of its own name/role by assistive
          tech, which is exactly the bug this sibling layout avoids. */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="block h-[300px] w-full sm:h-[440px]"
          role="img"
          aria-label={buildAriaLabel(currentPrice, deltaPercent, defensePrice, floorPrice, coincident)}
        >
          {/* Area fill — a warm wash, never a saturated block. */}
          <path d={areaPath} fill="var(--color-gold)" fillOpacity={0.12} stroke="none" />
          {/* Price line. */}
          <path d={linePath} fill="none" stroke="var(--color-gold)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

          {/* Defense line — "Cermin defends · $X", dashed, label right-aligned
              on the chart. Task 18: thicker dashes + bigger label so the two
              reference lines read instantly instead of blending into the
              price line. Task 20: amber normally, terracotta once price has
              actually breached it (`isBreach`) — same line, this is now also
              the only line drawn at all when the two lines coincide. */}
          {defenseY !== null && (
            <g aria-hidden="true">
              <line x1={PAD_X} x2={WIDTH - PAD_X} y1={defenseY} y2={defenseY} stroke={defenseColor} strokeWidth={2.5} strokeDasharray="9 6" />
              <ChartLineLabel
                x={WIDTH - PAD_X}
                y={Math.max(PLOT_TOP + 16, Math.min(defenseY - 10, PLOT_BOTTOM - 10))}
                color={defenseColor}
                text={`Cermin defends · ${formatPrice(defensePrice)}`}
              />
            </g>
          )}

          {/* Protection floor line — dashed terracotta. NOT "liquidation": the
              one-line caption below the chart explains the grace period.
              Task 20: hidden whenever `coincident` is true (empty vault, or
              the two lines would otherwise land within 14px of each other)
              — the defense line above stands alone rather than stacking two
              illegible labels. */}
          {showFloorLine && floorY !== null && (
            <g aria-hidden="true">
              <line x1={PAD_X} x2={WIDTH - PAD_X} y1={floorY} y2={floorY} stroke="var(--color-terracotta)" strokeWidth={2.5} strokeDasharray="9 6" />
              <ChartLineLabel
                x={WIDTH - PAD_X}
                y={Math.max(PLOT_TOP + 16, Math.min(floorY - 10, PLOT_BOTTOM - 10))}
                color="var(--color-terracotta)"
                text={`Protection floor · ${formatPrice(floorPrice)}`}
              />
            </g>
          )}

          {/* x-axis date ticks. */}
          {tickIndices.map((idx) => {
            const isFirst = idx === tickIndices[0];
            const isLast = idx === tickIndices[tickIndices.length - 1];
            return (
              <text
                key={idx}
                x={pixelPoints[idx].x}
                y={HEIGHT - 12}
                textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                fontSize={12}
                fill="var(--color-foreground-faint)"
              >
                {formatShortDate(new Date(points[idx].at))}
              </text>
            );
          })}

          {/* Current price dot, pulsing unless the OS asks for reduced motion. */}
          {lastPoint && (
            <g aria-hidden="true">
              {!reduceMotion && (
                <motion.circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r={5}
                  fill="var(--color-gold)"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.6 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  style={{ transformOrigin: `${lastPoint.x}px ${lastPoint.y}px` }}
                />
              )}
              <circle cx={lastPoint.x} cy={lastPoint.y} r={5.5} fill="var(--color-gold)" stroke="var(--color-surface-raised)" strokeWidth={2.5} />
            </g>
          )}

          {/* Hover/focus crosshair + tooltip. */}
          {hoverXY && hover && (
            <g aria-hidden="true">
              <line x1={hoverXY.x} x2={hoverXY.x} y1={PLOT_TOP} y2={PLOT_BOTTOM} stroke="var(--color-hairline-strong)" strokeWidth={1} />
              <circle cx={hoverXY.x} cy={hoverXY.y} r={5} fill="var(--color-gold)" stroke="var(--color-surface-raised)" strokeWidth={2.5} />
              <rect
                x={tooltipX}
                y={tooltipY}
                width={TOOLTIP_W}
                height={TOOLTIP_H}
                rx={8}
                fill="var(--color-surface-overlay-strong)"
                stroke="var(--color-hairline-strong)"
              />
              <text x={tooltipX + 10} y={tooltipY + 18} fontSize={14} fontWeight={600} fill="var(--color-foreground)">
                {formatPrice(hover.price)}
              </text>
              <text x={tooltipX + 10} y={tooltipY + 33} fontSize={11} fill="var(--color-foreground-faint)">
                {formatShortDate(new Date(hover.at))}
              </text>
            </g>
          )}
        </svg>
        {/* Full-height pointer/keyboard interaction layer, sized well past
            the 44px touch-target minimum. A sibling <button> (not an svg
            descendant) so it carries its own accessible name/role instead of
            being collapsed by the svg's role="img" above. Tabbable so the
            tooltip is keyboard-reachable (Arrow keys step point-to-point,
            Escape closes). */}
        <button
          type="button"
          aria-label="Explore price history — arrow keys move the crosshair"
          className="absolute inset-0 h-full w-full cursor-default appearance-none border-0 bg-transparent p-0"
          onPointerMove={(e) => updateFromClientX(e.clientX, e.currentTarget)}
          onPointerLeave={() => setActiveIndex(null)}
          onPointerDown={(e) => updateFromClientX(e.clientX, e.currentTarget)}
          onPointerUp={onPointerUp}
          onFocus={() => setActiveIndex((i) => i ?? points.length - 1)}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={onKeyDown}
        />
      </div>

      {caption && <p className="mt-4 text-xs leading-relaxed text-foreground-faint">{caption}</p>}
    </div>
  );
}

/** A small legibility trick for on-chart text: draw it twice, once as a wide
 * surface-colored stroke (a halo) and once filled, so the label reads over
 * the gold area fill or the dark/light surface behind it either way. */
function ChartLineLabel({ x, y, color, text }: { x: number; y: number; color: string; text: string }) {
  return (
    <>
      <text x={x} y={y} textAnchor="end" fontSize={15} fontWeight={700} stroke="var(--color-surface-raised)" strokeWidth={5} strokeLinejoin="round">
        {text}
      </text>
      <text x={x} y={y} textAnchor="end" fontSize={15} fontWeight={700} fill={color}>
        {text}
      </text>
    </>
  );
}
