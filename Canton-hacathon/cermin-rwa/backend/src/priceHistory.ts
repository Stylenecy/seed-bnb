// Task 17 — dashboard price chart backend support.
//
// A small, ledger-agnostic module (kept out of ledger.ts's route-facing
// surface on purpose): an in-memory ring buffer of OBSERVED prices, deduped
// on consecutive equal values, prefixed on read by a deterministic synthetic
// 30-day backfill anchored to end at the earliest observed price. Every
// Ledger implementation (Mock / v1 / v2) owns one `PriceHistoryBuffer` and
// calls `.record(price)` wherever it already reads the current price
// (`getPosition`, `simPrice`) — see ledger.ts. The `/api/price-history` route
// itself stays a one-line pass-through (STATE.md §3 "keep routes thin").

export interface PricePoint {
  at: string; // ISO timestamp
  price: number;
  synthetic?: boolean;
}

const MS_PER_DAY = 86_400_000;
export const BACKFILL_DAYS = 30;

// Fixed seed + no dependency on wall-clock "now" beyond the anchor itself,
// so repeated reads (and server restarts, given the same anchor) never
// rewrite the backfill — "deterministic" per the Task 17 brief.
const BACKFILL_SEED = 424_242;
const BACKFILL_STEP = 0.012; // gentle +-1.2% daily step

/** Ring buffer cap: bounds memory over a long-running demo session without
 * ever mattering in practice (a real session logs far fewer price changes). */
const MAX_OBSERVED = 2_000;

/** Deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * A deterministic, gentle 30-day random walk ending (chronologically) right
 * before `anchorAt`, walking backward from `anchorPrice`. Same seed every
 * call, so two calls with the same anchor return byte-identical arrays —
 * that's what makes it safe to regenerate on every `getHistory()` read
 * instead of persisting it.
 */
export function syntheticBackfill(anchorPrice: number, anchorAt: Date, days: number = BACKFILL_DAYS): PricePoint[] {
  const rand = mulberry32(BACKFILL_SEED);
  const out: PricePoint[] = [];
  let price = anchorPrice;
  for (let i = 1; i <= days; i++) {
    const step = (rand() - 0.5) * 2 * BACKFILL_STEP;
    price = Math.max(0.01, price * (1 - step));
    out.push({
      at: new Date(anchorAt.getTime() - i * MS_PER_DAY).toISOString(),
      price: Math.round(price * 10_000) / 10_000,
      synthetic: true,
    });
  }
  return out.reverse(); // chronological, oldest first
}

/**
 * In-memory ring buffer of observed (real, non-synthetic) prices. `record`
 * is safe to call on every position read — it's a no-op unless the price
 * actually changed since the last recorded tick ("dedupe consecutive equal
 * prices" per the brief).
 */
export class PriceHistoryBuffer {
  private observed: PricePoint[] = [];

  record(price: number, at: Date = new Date()): void {
    const last = this.observed[this.observed.length - 1];
    if (last && last.price === price) return;
    this.observed.push({ at: at.toISOString(), price });
    if (this.observed.length > MAX_OBSERVED) this.observed.shift();
  }

  /** Synthetic 30-day backfill (anchored to the earliest observed point) +
   * every observed tick since, oldest first. Empty until the first `record`. */
  getHistory(): { points: PricePoint[] } {
    if (this.observed.length === 0) return { points: [] };
    const anchor = this.observed[0];
    const backfill = syntheticBackfill(anchor.price, new Date(anchor.at));
    return { points: [...backfill, ...this.observed] };
  }
}
