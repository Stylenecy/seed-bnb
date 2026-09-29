/**
 * Task 17 — hand-rolled SVG price chart geometry. Pure, DOM-free functions so
 * they're directly testable (this project's vitest environment is `node`,
 * no jsdom) and so `PriceChart.tsx` stays a thin rendering layer over math
 * that lives here, the same separation `lib/health.ts` keeps for the ratio
 * math (STATE.md §3 "math lives once").
 */

export interface XY {
  x: number;
  y: number;
}

/** A linear scale from a numeric domain to a pixel range — the same tiny
 * primitive d3 calls `scaleLinear`, hand-rolled to avoid a chart dependency. */
export function linearScale(domain: [number, number], range: [number, number]): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  if (span === 0) return () => (r0 + r1) / 2;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** Absolute floor under the proportional y-padding (see `computeYDomain`) so
 * a near-flat span (or a single reference price with nothing else) still
 * gets a visible band instead of collapsing toward zero height. */
const MIN_Y_PAD = 0.01;

/**
 * The y-axis domain for the price chart (Task 20 rule, binding — supersedes
 * Task 18's `*0.95`/`*1.05` formula): first take the raw min/max across the
 * series AND the two reference prices (a hidden line, `defensePrice`/
 * `floorPrice` <= 0 — no live loan, or the vault fully covers outstanding —
 * is excluded from its side rather than pulling the domain toward 0), then
 * pad both ends by ~4% of that raw span (`MIN_Y_PAD` floor for a near-zero
 * span). Padding a flat percentage of the raw *values* (Task 18) over- or
 * under-pads depending on how large the anchor price happens to be, and
 * left a huge dead band once a reference line sat far from the series (a
 * breached position with an empty vault, e.g. defense ~$1 while price has
 * crashed to $0.62 — the old formula's 5%-of-defense-value pad barely
 * shrank the gap). Padding relative to the actual plotted span scales with
 * however far apart price/defense/floor actually are, so both dashed lines
 * always sit inside the domain with visible-but-proportionate padding.
 */
export function computeYDomain(prices: number[], defensePrice = 0, floorPrice = 0): [number, number] {
  const hasSeries = prices.length > 0;
  const hasFloor = floorPrice > 0;
  const hasDefense = defensePrice > 0;
  if (!hasSeries && !hasFloor && !hasDefense) return [0, 1];

  const seriesMin = hasSeries ? Math.min(...prices) : Number.POSITIVE_INFINITY;
  const seriesMax = hasSeries ? Math.max(...prices) : Number.NEGATIVE_INFINITY;

  const rawMin = hasFloor ? Math.min(seriesMin, floorPrice) : seriesMin;
  const rawMax = hasDefense ? Math.max(seriesMax, defensePrice) : seriesMax;

  const min = Number.isFinite(rawMin) ? rawMin : 0;
  const max = Number.isFinite(rawMax) ? rawMax : 1;

  const pad = Math.max((max - min) * 0.04, MIN_Y_PAD);
  return [Math.max(0, min - pad), max + pad];
}

/**
 * Task 20 — the coincident-line rule: the chart's two dashed reference
 * lines (defense + protection floor) render as ONE line with ONE label,
 * never two stacked/overlapping ones, whenever either (a) their pixel rows
 * land within `thresholdPx` of each other, or (b) the vault is empty. (b)
 * is belt-and-suspenders: an empty vault already makes `protectionFloorPrice`
 * algebraically equal to `defensePrice` (lib/health.ts — "outstanding minus
 * the vault" collapses to plain "outstanding", the same quantity
 * `defensePrice` uses), so (a) catches it in practice too; (b) guards
 * against a rounding hair separating their exact pixel rows.
 */
export function isCoincidentLines(
  defenseY: number | null,
  floorY: number | null,
  vaultBalance: number,
  thresholdPx = 14,
): boolean {
  if (vaultBalance <= 0) return true;
  if (defenseY === null || floorY === null) return false;
  return Math.abs(floorY - defenseY) < thresholdPx;
}

/**
 * The one-line Cermin caption shown under the chart, in priority order:
 * 1. Breach (price already below the defense line — the caller passes
 *    `healthStatus === 'action'`, the same classification the rest of the
 *    app uses, never re-derived here) always wins: reassurance if the
 *    vault still has money to act with, an explicit nudge if it's empty.
 * 2. Otherwise, if the two lines coincide (`isCoincidentLines`), a nudge to
 *    fund the vault so the floor line has somewhere of its own to live.
 * 3. Otherwise, the standing explanation of what the protection floor
 *    means, whenever it's actually drawn.
 * `null` when there's no active loan at all (no defense line) — nothing to
 * caption.
 */
export function selectFloorCaption(input: {
  hasDefense: boolean;
  hasFloor: boolean;
  isBreach: boolean;
  coincident: boolean;
  vaultBalance: number;
}): string | null {
  const { hasDefense, hasFloor, isBreach, coincident, vaultBalance } = input;
  if (!hasDefense) return null;
  if (isBreach) {
    return vaultBalance > 0 ? "I'm stepping in on my next check." : 'Your vault is empty — top up so I can act.';
  }
  if (coincident) {
    return "Fund your Shadow Vault to open a buffer below this line — that's where I repay from.";
  }
  if (hasFloor) {
    return "Below the protection floor, I open a grace period instead of a fire-sale — there's no forced liquidation here.";
  }
  return null;
}

/**
 * Task 20 — the tooltip's touch fix: a touch pointer gets implicit capture,
 * so `pointerleave` never fires when a finger drags off the chart and lifts
 * elsewhere (unlike a mouse, which reliably fires it) — that's why the
 * tooltip could get "stuck" mid-chart after a touch. `pointerup`, however,
 * always fires on the original target regardless of where the finger ends
 * up, so any non-mouse pointer (touch, pen) clears the tooltip on release;
 * a mouse's tooltip keeps tracking until a real `pointerleave`/`blur`.
 */
export function shouldClearTooltipOnPointerUp(pointerType: string): boolean {
  return pointerType !== 'mouse';
}

/** SVG path `d` for the price line, one `M`/`L` per point. */
export function buildLinePath(points: XY[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

/** SVG path `d` for the area fill under the line, closed down to `baselineY`. */
export function buildAreaPath(points: XY[], baselineY: number): string {
  if (points.length === 0) return '';
  const line = buildLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${last.x.toFixed(2)},${baselineY.toFixed(2)} L${first.x.toFixed(2)},${baselineY.toFixed(2)} Z`;
}

/** 3 evenly-spaced indices into a series of `length` points (first, middle,
 * last) — the chart's x-axis date ticks. Degenerates gracefully for short
 * series (a single point just gets index 0). */
export function pickTickIndices(length: number, count = 3): number[] {
  if (length <= 0) return [];
  if (length === 1 || count <= 1) return [0];
  const idx = new Set<number>();
  for (let i = 0; i < count; i++) {
    idx.add(Math.round((i * (length - 1)) / (count - 1)));
  }
  return [...idx].sort((a, b) => a - b);
}

/** Index of the x position closest to `x` — powers the hover/tap crosshair
 * (snap to the nearest data point rather than requiring a pixel-perfect hit). */
export function nearestIndex(xs: number[], x: number): number {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < xs.length; i++) {
    const dist = Math.abs(xs[i] - x);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/** Percent change from the first to the last price in the window (e.g. 4.2
 * for +4.2%). 0 when there's nothing to compare (fewer than 2 points, or the
 * window opens at a worthless price). */
export function computeDeltaPercent(prices: number[]): number {
  if (prices.length < 2) return 0;
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (first <= 0) return 0;
  return ((last - first) / first) * 100;
}
