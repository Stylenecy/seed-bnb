import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashSeed, seededRandom, seededRange } from './rng';
import { buildCoinArcs, buildSpeedRays, CENTER } from './geometry';
import { radialMaskStyle } from './mask';
import { prefersReducedMotion } from './motion';

/**
 * Pure-logic tests for the comic kit. This project's vitest environment is
 * `node` (no jsdom) — every function here is DOM-free, and the reduced-motion
 * read is exercised through a stubbed `window.matchMedia`, the same class of
 * fake `backend.test.ts` uses for `localStorage`.
 */

describe('seeded rng', () => {
  it('is deterministic — same seed, same value', () => {
    expect(seededRandom('cermin')).toBe(seededRandom('cermin'));
    expect(hashSeed('cermin')).toBe(hashSeed('cermin'));
  });

  it('stays in [0, 1)', () => {
    for (const s of ['a', 'b', 'c', 'saved-3', 'coin-x-7', '']) {
      const v = seededRandom(s);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('decorrelates distinct seeds', () => {
    const values = new Set(Array.from({ length: 50 }, (_, i) => seededRandom(`ray-${i}`)));
    // No collisions across 50 distinct seeds.
    expect(values.size).toBe(50);
  });

  it('seededRange maps into [min, max)', () => {
    for (let i = 0; i < 30; i++) {
      const v = seededRange(`r-${i}`, -220, 220);
      expect(v).toBeGreaterThanOrEqual(-220);
      expect(v).toBeLessThan(220);
    }
  });
});

describe('buildSpeedRays', () => {
  it('returns exactly `count` rays, deterministically', () => {
    const a = buildSpeedRays({ count: 12, seed: 'x' });
    const b = buildSpeedRays({ count: 12, seed: 'x' });
    expect(a).toHaveLength(12);
    expect(a).toEqual(b);
  });

  it('varies with the seed', () => {
    expect(buildSpeedRays({ seed: 'x' })).not.toEqual(buildSpeedRays({ seed: 'y' }));
  });

  it('emits valid quadratic-bezier paths starting near center with a positive width', () => {
    for (const ray of buildSpeedRays({ count: 8, seed: 'z', inner: 16, spread: 40 })) {
      expect(ray.d).toMatch(/^M [\d.-]+ [\d.-]+ Q [\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+$/);
      expect(ray.width).toBeGreaterThan(0);
      const [, mx] = ray.d.match(/^M ([\d.-]+) /)!;
      // Ray starts within the inner radius of the center.
      expect(Math.abs(Number(mx) - CENTER)).toBeLessThanOrEqual(22);
    }
  });
});

describe('buildCoinArcs', () => {
  it('returns `count` coins, deterministically, that loft upward', () => {
    const a = buildCoinArcs({ count: 8, seed: 'c' });
    expect(a).toHaveLength(8);
    expect(buildCoinArcs({ count: 8, seed: 'c' })).toEqual(a);
    for (const coin of a) {
      expect(coin.dy).toBeLessThan(0); // negative = up
      expect(coin.lift).toBeGreaterThan(0);
      expect(coin.r).toBeGreaterThan(0);
      expect(coin.delay).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles the single-coin edge (no divide-by-zero on the fan)', () => {
    const one = buildCoinArcs({ count: 1, seed: 'c' });
    expect(one).toHaveLength(1);
    expect(Number.isFinite(one[0]!.dx)).toBe(true);
  });
});

describe('radialMaskStyle', () => {
  it('builds a matching mask-image + WebkitMaskImage from the fade fractions', () => {
    const style = radialMaskStyle(0.5, 0.74);
    expect(style.maskImage).toBe(style.WebkitMaskImage);
    expect(style.maskImage).toContain('radial-gradient');
    expect(style.maskImage).toContain('50%');
    expect(style.maskImage).toContain('74%');
    expect(style.maskImage).toContain('transparent');
  });

  it('respects custom inner/outer fractions', () => {
    expect(radialMaskStyle(0.4, 0.9).maskImage).toContain('40%');
    expect(radialMaskStyle(0.4, 0.9).maskImage).toContain('90%');
  });
});

describe('prefersReducedMotion (matchMedia stub)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is true when the reduce query matches', () => {
    vi.stubGlobal('window', { matchMedia: (q: string) => ({ matches: q.includes('reduce') }) });
    expect(prefersReducedMotion()).toBe(true);
  });

  it('is false when the reduce query does not match', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(prefersReducedMotion()).toBe(false);
  });

  it('is false (no throw) when matchMedia is unavailable', () => {
    vi.stubGlobal('window', {});
    expect(prefersReducedMotion()).toBe(false);
  });
});
