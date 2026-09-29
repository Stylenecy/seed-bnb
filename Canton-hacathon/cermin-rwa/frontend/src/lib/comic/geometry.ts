import { seededRandom, seededRange } from './rng';

/**
 * DOM-free geometry for the comic kit's SVG accents. Kept pure (no React, no
 * `Math.random`) so the same seed always renders the same speed-burst / coin
 * arcs and the shapes can be unit-tested directly — the pattern the PriceChart
 * uses for `lib/chart.ts`.
 *
 * All coordinates live in a normalized 100×100 viewBox centered at (50, 50),
 * so a component can drop the shapes into any square SVG and scale with CSS.
 */

export const VIEWBOX = 100;
export const CENTER = VIEWBOX / 2;

export interface SpeedRay {
  /** Quadratic-bezier path, bent slightly perpendicular for a hand-drawn wobble. */
  d: string;
  /** Stroke width in viewBox units. */
  width: number;
}

export interface SpeedRayOptions {
  count?: number;
  seed?: string;
  /** Inner radius the rays start from (viewBox units). */
  inner?: number;
  /** Outer reach of the longest ray (viewBox units). */
  spread?: number;
  /** Base stroke width (viewBox units). */
  width?: number;
}

/** Radial comic speed-lines snapping out from center. Each ray gets a seeded
 * angle jitter, length, perpendicular bow and width so the burst reads
 * hand-inked rather than mechanical. */
export function buildSpeedRays({
  count = 12,
  seed = 'burst',
  inner = 16,
  spread = 46,
  width = 2,
}: SpeedRayOptions = {}): SpeedRay[] {
  const rays: SpeedRay[] = [];
  for (let i = 0; i < count; i++) {
    const baseAng = (i / count) * Math.PI * 2;
    const ang = baseAng + (seededRandom(`${seed}-a-${i}`) - 0.5) * 0.18;
    const r0 = inner * (0.82 + seededRandom(`${seed}-r-${i}`) * 0.34);
    const len = spread * (0.5 + seededRandom(`${seed}-l-${i}`) * 0.55);
    const r1 = r0 + len;
    const x1 = CENTER + Math.cos(ang) * r0;
    const y1 = CENTER + Math.sin(ang) * r0;
    const x2 = CENTER + Math.cos(ang) * r1;
    const y2 = CENTER + Math.sin(ang) * r1;
    const perp = ang + Math.PI / 2;
    const bow = (seededRandom(`${seed}-b-${i}`) - 0.5) * 6;
    const mx = (x1 + x2) / 2 + Math.cos(perp) * bow;
    const my = (y1 + y2) / 2 + Math.sin(perp) * bow;
    const w = width * (0.55 + seededRandom(`${seed}-w-${i}`) * 0.9);
    rays.push({
      d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      width: Number(w.toFixed(2)),
    });
  }
  return rays;
}

export interface CoinArc {
  /** Final horizontal offset from origin (px). */
  dx: number;
  /** Final vertical offset from origin (px) — negative = up. */
  dy: number;
  /** Peak arc height (px) — how high it lofts before falling. */
  lift: number;
  /** Spin (deg) at the end of the arc. */
  spin: number;
  /** Stagger before this coin starts (seconds). */
  delay: number;
  /** Coin radius (px). */
  r: number;
}

export interface CoinArcOptions {
  count?: number;
  seed?: string;
  /** How far the coins spray horizontally (px). */
  spread?: number;
  /** How high they loft (px). */
  rise?: number;
}

/** A short fountain of coins arcing up-and-out from a point — the faucet /
 * celebration particle set. Deterministic per seed so a re-render mid-flight
 * doesn't reshuffle the spray. */
export function buildCoinArcs({
  count = 8,
  seed = 'coins',
  spread = 90,
  rise = 70,
}: CoinArcOptions = {}): CoinArc[] {
  const coins: CoinArc[] = [];
  for (let i = 0; i < count; i++) {
    // Fan the coins across the top half, biased outward from center.
    const t = count === 1 ? 0.5 : i / (count - 1);
    const dir = (t - 0.5) * 2; // -1 .. 1
    const dx = dir * spread * (0.55 + seededRandom(`${seed}-x-${i}`) * 0.6);
    const dy = -rise * (0.7 + seededRandom(`${seed}-y-${i}`) * 0.6);
    const lift = rise * (0.5 + seededRandom(`${seed}-h-${i}`) * 0.5);
    coins.push({
      dx: Number(dx.toFixed(2)),
      dy: Number(dy.toFixed(2)),
      lift: Number(lift.toFixed(2)),
      spin: Math.round(seededRange(`${seed}-s-${i}`, -220, 220)),
      delay: Number((seededRandom(`${seed}-d-${i}`) * 0.12).toFixed(3)),
      r: Number(seededRange(`${seed}-r-${i}`, 5, 8).toFixed(2)),
    });
  }
  return coins;
}
