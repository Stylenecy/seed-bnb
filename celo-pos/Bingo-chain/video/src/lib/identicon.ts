// Deterministic, on-brand player avatars — copied verbatim from
// apps/web/lib/identicon.ts so demo avatars match the app for the same address.

const SHAPES = 3;

function seedFromAddress(addr: string): number {
  let h = 1779033703 ^ addr.length;
  for (let i = 0; i < addr.length; i++) {
    h = Math.imul(h ^ addr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type IdenticonShape = { color: string; x: number; y: number; rot: number; scale: number };
export type Identicon = { bg: string; shapes: IdenticonShape[] };

export function identicon(address: string): Identicon {
  const rnd = mulberry32(seedFromAddress(address.toLowerCase()));
  const baseHue = Math.floor(rnd() * 360);
  const wobble = 36;
  const color = (i: number) => {
    const hue = Math.round((baseHue + (i * 360) / (SHAPES + 1) + (rnd() * wobble - wobble / 2) + 360) % 360);
    const sat = Math.round(56 + rnd() * 18);
    const light = Math.round(46 + rnd() * 16);
    return `hsl(${hue} ${sat}% ${light}%)`;
  };

  const bg = color(0);
  const shapes: IdenticonShape[] = Array.from({ length: SHAPES }, (_, i) => ({
    color: color(i + 1),
    x: rnd() * 100 - 25,
    y: rnd() * 100 - 25,
    rot: Math.round(rnd() * 360),
    scale: 0.5 + rnd() * 0.7,
  }));

  return { bg, shapes };
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
