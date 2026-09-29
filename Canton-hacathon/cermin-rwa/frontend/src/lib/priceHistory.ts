/**
 * Task 17 — mock-mode price history. Same shape as the backend's
 * `GET /api/price-history` response (`backend/src/priceHistory.ts`): a
 * deterministic synthetic 30-day backfill (`synthetic: true`) followed by
 * real "observed" price ticks (undefined/false `synthetic`). In backend mode
 * the store polls the real endpoint instead of importing this file — see
 * `store.ts`'s `syncFromBackend`.
 */

export interface PricePoint {
  at: string; // ISO timestamp
  price: number;
  synthetic?: boolean;
}

const MS_PER_DAY = 86_400_000;
export const BACKFILL_DAYS = 30;

// Fixed seed: the backfill is a pure function of (anchor price, anchor date),
// never of wall-clock "now" beyond that anchor — so it never rewrites itself
// on a re-render or a page refresh.
const BACKFILL_SEED = 424_242;
// Gentle day-to-day step (+-1.2%) — "gentle random walk", not a wild swing.
const BACKFILL_STEP = 0.012;

/** Deterministic PRNG (mulberry32) — same seed always produces the same
 * sequence, so the synthetic backfill never changes between renders/reloads. */
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
 * time, so two calls with the same anchor return byte-identical arrays.
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

/** The initial chart series for a fresh mock session: 30 synthetic days
 * ending right before "now", plus the seeded demo price as the first real
 * observed point. */
export function seedPriceHistory(price: number, now: Date = new Date()): PricePoint[] {
  return [...syntheticBackfill(price, now), { at: now.toISOString(), price }];
}

/** Append an observed price tick, deduping a repeat of the last recorded
 * price (a `setPrice` call that doesn't actually change anything shouldn't
 * grow the series). Returns the SAME array reference when nothing changed,
 * so callers can skip a state update. */
export function appendPriceTick(history: PricePoint[], price: number, at: Date = new Date()): PricePoint[] {
  const last = history[history.length - 1];
  if (last && last.price === price) return history;
  return [...history, { at: at.toISOString(), price }];
}
