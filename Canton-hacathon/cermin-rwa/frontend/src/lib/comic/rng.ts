/**
 * Deterministic seeded pseudo-random — the comic kit's SpeedBurst / CoinBurst
 * wobble must be stable across renders (no `Math.random` in render, or the
 * speed-lines would jump every frame) yet still look hand-drawn. A string seed
 * hashes (FNV-1a) then runs one mulberry32 step, so the same seed always yields
 * the same value in [0, 1) and different seeds decorrelate. Pure + framework
 * free so it unit-tests directly.
 */

/** FNV-1a 32-bit hash of a string -> unsigned 32-bit int. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic value in [0, 1) for a string seed. Stateless: compose the
 * seed (e.g. `${base}-ray-${i}-angle`) to draw an independent stream. */
export function seededRandom(seed: string): number {
  let t = (hashSeed(seed) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Deterministic value in [min, max) for a string seed. */
export function seededRange(seed: string, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}
