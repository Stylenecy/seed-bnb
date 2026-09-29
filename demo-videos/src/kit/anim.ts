import { Easing, interpolate, spring } from "remotion";
import { clamp } from "./tokens";

/** Premium easings (perps-agent). */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Clamped 0..1 progress with expo-out easing. */
export const ramp = (f: number, start: number, dur: number): number =>
  interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: EASE_OUT });

/** Fade + rise style. */
export const fadeUp = (f: number, start: number, dur = 18, dist = 24): React.CSSProperties => {
  const p = ramp(f, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
};

/** Overshooting pop 0→1 (use as a scale multiplier). */
export const popIn = (f: number, fps: number, start: number, from = 0.6): number =>
  from + (1 - from) * spring({ frame: f - start, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });

/** Beat-stepped counter: jumps toward `to` in `steps` ticks landing on the given frames. */
export const steppedCount = (f: number, ticks: readonly number[], values: readonly number[]): number => {
  let v = values[0] ?? 0;
  ticks.forEach((t, i) => {
    if (f >= t) v = values[i] ?? v;
  });
  return v;
};

/** Smooth counter between frames [a, b]. */
export const countUp = (f: number, a: number, b: number, from: number, to: number): number =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: EASE_OUT });

/** Scrambles a hex string until `at`, then resolves left→right over `dur`. */
export const scrambleHex = (f: number, text: string, at: number, dur = 12): string => {
  const HEX = "0123456789abcdef";
  const p = interpolate(f, [at, at + dur], [0, 1], clamp);
  const n = Math.floor(p * text.length);
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (i < n || ch === "x" || ch === "…" || ch === "." || (i < 2 && text.startsWith("0x"))) out += ch;
    else out += HEX[(i * 7 + Math.floor(f / 2) * 3) % 16];
  }
  return out;
};
