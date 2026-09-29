import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKFILL_DAYS, PriceHistoryBuffer, syntheticBackfill } from '../src/priceHistory.ts';

const ANCHOR_AT = new Date('2026-07-10T12:00:00.000Z');

test('syntheticBackfill is deterministic: same anchor -> byte-identical arrays', () => {
  const a = syntheticBackfill(1.0, ANCHOR_AT);
  const b = syntheticBackfill(1.0, ANCHOR_AT);
  assert.deepEqual(a, b);
});

test('syntheticBackfill returns exactly `days` points, all synthetic, ascending chronological order', () => {
  const points = syntheticBackfill(1.0, ANCHOR_AT);
  assert.equal(points.length, BACKFILL_DAYS);
  assert.ok(points.every((p) => p.synthetic === true));
  for (let i = 1; i < points.length; i++) {
    assert.ok(new Date(points[i].at).getTime() > new Date(points[i - 1].at).getTime());
  }
  // Last (most recent) backfill point sits exactly one day before the anchor.
  assert.equal(new Date(points[points.length - 1].at).getTime(), ANCHOR_AT.getTime() - 86_400_000);
});

test('syntheticBackfill never produces a non-positive price', () => {
  const points = syntheticBackfill(0.02, ANCHOR_AT, 60);
  assert.ok(points.every((p) => p.price > 0));
});

test('syntheticBackfill respects a custom `days` count', () => {
  assert.equal(syntheticBackfill(1.0, ANCHOR_AT, 7).length, 7);
});

test('PriceHistoryBuffer.getHistory is empty before the first record()', () => {
  const buf = new PriceHistoryBuffer();
  assert.deepEqual(buf.getHistory(), { points: [] });
});

test('PriceHistoryBuffer.record dedupes consecutive equal prices', () => {
  const buf = new PriceHistoryBuffer();
  buf.record(1.0, ANCHOR_AT);
  buf.record(1.0, new Date(ANCHOR_AT.getTime() + 1000)); // same price: no-op
  buf.record(1.0, new Date(ANCHOR_AT.getTime() + 2000)); // still no-op
  const { points } = buf.getHistory();
  // 30 synthetic backfill days + exactly ONE observed point.
  assert.equal(points.length, BACKFILL_DAYS + 1);
  assert.equal(points[points.length - 1].price, 1.0);
});

test('PriceHistoryBuffer.record appends each genuinely new price, oldest first', () => {
  const buf = new PriceHistoryBuffer();
  buf.record(1.0, ANCHOR_AT);
  buf.record(0.9, new Date(ANCHOR_AT.getTime() + 1000));
  buf.record(0.76, new Date(ANCHOR_AT.getTime() + 2000));
  const { points } = buf.getHistory();
  assert.equal(points.length, BACKFILL_DAYS + 3);
  const observed = points.slice(BACKFILL_DAYS);
  assert.deepEqual(
    observed.map((p) => p.price),
    [1.0, 0.9, 0.76],
  );
  assert.ok(observed.every((p) => p.synthetic === undefined));
});

test('PriceHistoryBuffer backfill is anchored at the EARLIEST observed price, not the latest', () => {
  const buf = new PriceHistoryBuffer();
  buf.record(1.0, ANCHOR_AT);
  buf.record(0.5, new Date(ANCHOR_AT.getTime() + 1000)); // a big later move
  const { points } = buf.getHistory();
  const backfill = points.slice(0, BACKFILL_DAYS);
  // The backfill's own last (most recent) point sits one day before the
  // FIRST observed point's timestamp (ANCHOR_AT), not the second one.
  assert.equal(new Date(backfill[backfill.length - 1].at).getTime(), ANCHOR_AT.getTime() - 86_400_000);
});

test('PriceHistoryBuffer caps the observed ring buffer so memory stays bounded', () => {
  const buf = new PriceHistoryBuffer();
  const cap = 2_000;
  for (let i = 0; i < cap + 50; i++) {
    // Every value distinct so none of these dedupe away.
    buf.record(1 + i / 1_000_000, new Date(ANCHOR_AT.getTime() + i * 1000));
  }
  const { points } = buf.getHistory();
  assert.ok(points.length <= BACKFILL_DAYS + cap);
});
