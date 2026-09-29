import { staticFile } from "remotion";

/** Screenshot in `public/screens/`. */
export const screen = (name: string): string => staticFile(`screens/${name}.png`);

/** Mascot image in `public/images/` (webp). */
export const mascot = (name: "watch" | "shield"): string =>
  staticFile(`images/mascot-${name}.webp`);

/**
 * Flat 2D comic panel in `public/images/comic/` (webp, 2752×1536, ~1.4× zoom
 * headroom). Ink/gold/parchment/terracotta brand palette, halftone shading, no
 * baked-in text — the lettering is added in-scene via ComicText.
 *   h1..h4 — the S1 cold-open HOOK panels (tokenized · in-public · one-dip · liquidation)
 *   s1..s6 — the S3 how-it-works strip (post · borrow · vault · watch · crash · saved)
 *   p1     — the S5 privacy opener (blind banker at a wall of empty frames)
 */
export type ComicName =
  | "h1-tokenized"
  | "h2-inpublic"
  | "h3-onedip"
  | "h4-liquidation"
  | "s1-post"
  | "s2-borrow"
  | "s3-vault"
  | "s4-watch"
  | "s5-crash"
  | "s6-saved"
  | "p1-blind";
export const comicImg = (name: ComicName): string =>
  staticFile(`images/comic/${name}.webp`);

/** Background music — "Bring It On (Airstream)", 128 BPM, 78.75s. */
export const MUSIC = staticFile(
  "audio/bring-it-on-airstream-main-version-41938-01-18.mp3",
);

/** Sound effect in `public/audio/sfx/` (all mp3). */
export const sfx = (name: "whoosh" | "chime" | "click" | "riser"): string =>
  staticFile(`audio/sfx/${name}.mp3`);
