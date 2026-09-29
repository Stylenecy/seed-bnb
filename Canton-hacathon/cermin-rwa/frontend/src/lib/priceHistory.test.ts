import { describe, expect, it } from 'vitest';
import { appendPriceTick, BACKFILL_DAYS, seedPriceHistory, syntheticBackfill } from './priceHistory';

const ANCHOR_AT = new Date('2026-07-10T12:00:00.000Z');

describe('syntheticBackfill (deterministic 30-day gentle random walk)', () => {
  it('is deterministic: two calls with the same anchor produce byte-identical arrays', () => {
    const a = syntheticBackfill(1.0, ANCHOR_AT);
    const b = syntheticBackfill(1.0, ANCHOR_AT);
    expect(a).toEqual(b);
  });

  it('returns exactly `days` points, all flagged synthetic, in ascending chronological order', () => {
    const points = syntheticBackfill(1.0, ANCHOR_AT);
    expect(points).toHaveLength(BACKFILL_DAYS);
    expect(points.every((p) => p.synthetic === true)).toBe(true);
    for (let i = 1; i < points.length; i++) {
      expect(new Date(points[i].at).getTime()).toBeGreaterThan(new Date(points[i - 1].at).getTime());
    }
    // The last (most recent) backfill point is exactly one day before the anchor.
    expect(new Date(points[points.length - 1].at).getTime()).toBe(ANCHOR_AT.getTime() - 86_400_000);
  });

  it('stays a gentle walk: no single day moves the price by more than ~1.2% (plus rounding slack)', () => {
    const points = syntheticBackfill(1.0, ANCHOR_AT);
    const prices = [1.0, ...points.slice().reverse().map((p) => p.price)];
    for (let i = 1; i < prices.length; i++) {
      const change = Math.abs(prices[i] - prices[i - 1]) / prices[i - 1];
      // Each output point is independently rounded to 4dp, so the day-to-day
      // change on the ROUNDED series can drift slightly past the raw 1.2%
      // step — 2% is a generous ceiling that still catches a wild swing.
      expect(change).toBeLessThan(0.02);
    }
  });

  it('never produces a non-positive price even under a run of down steps', () => {
    const points = syntheticBackfill(0.02, ANCHOR_AT, 60);
    expect(points.every((p) => p.price > 0)).toBe(true);
  });

  it('respects a custom `days` count', () => {
    expect(syntheticBackfill(1.0, ANCHOR_AT, 7)).toHaveLength(7);
  });
});

describe('seedPriceHistory', () => {
  it('returns 30 synthetic days followed by one observed point at the given price', () => {
    const history = seedPriceHistory(1.0, ANCHOR_AT);
    expect(history).toHaveLength(BACKFILL_DAYS + 1);
    expect(history.slice(0, BACKFILL_DAYS).every((p) => p.synthetic === true)).toBe(true);
    const last = history[history.length - 1];
    expect(last.synthetic).toBeUndefined();
    expect(last.price).toBe(1.0);
    expect(last.at).toBe(ANCHOR_AT.toISOString());
  });
});

describe('appendPriceTick', () => {
  it('appends a new observed point when the price changed', () => {
    const history = seedPriceHistory(1.0, ANCHOR_AT);
    const at = new Date(ANCHOR_AT.getTime() + 1000);
    const next = appendPriceTick(history, 0.76, at);
    expect(next).toHaveLength(history.length + 1);
    expect(next[next.length - 1]).toEqual({ at: at.toISOString(), price: 0.76 });
  });

  it('dedupes a repeat of the last recorded price, returning the SAME array reference', () => {
    const history = seedPriceHistory(1.0, ANCHOR_AT);
    const next = appendPriceTick(history, 1.0, new Date(ANCHOR_AT.getTime() + 1000));
    expect(next).toBe(history); // no-op: same reference, no growth
    expect(next).toHaveLength(history.length);
  });

  it('does not dedupe against an earlier (non-last) point with the same price', () => {
    let history = seedPriceHistory(1.0, ANCHOR_AT);
    history = appendPriceTick(history, 0.9, new Date(ANCHOR_AT.getTime() + 1000));
    history = appendPriceTick(history, 1.0, new Date(ANCHOR_AT.getTime() + 2000)); // back to 1.0, not a repeat of 0.9
    expect(history[history.length - 1].price).toBe(1.0);
    expect(history).toHaveLength(BACKFILL_DAYS + 3);
  });
});
