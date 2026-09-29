import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS } from "./tokens";
import {
  barA,
  barB,
  beatIndexAt,
  beatPhase,
  compFramesAt,
  energyAt,
  isDownbeatAt,
} from "./beat";

/**
 * Pulse — the global beat-intensity wrapper. Wrap a scene's MAIN CONTENT group
 * (not its atmosphere background) and it will breathe with the track:
 *
 *  • scale-pulses 1 → 1 + 0.012·intensity·energy with a fast attack on every
 *    beat and a ~half-beat exponential decay (a musical "pump"),
 *  • lifts brightness a touch on downbeats (energy-scaled), and
 *  • adds an energy-gated micro-shake on strong downbeats (energy > 0.85):
 *    3–6px translate + ≤0.25° rotate, decaying within the beat.
 *
 * `sceneStart` is the COMP frame at which this scene's local frame 0 sits — the
 * scenes all know it as their `S` constant — so the wrapper can read the shared
 * (seam-aware) energy/beat grid even though `useCurrentFrame` is scene-local.
 */
export const Pulse: React.FC<{
  children: React.ReactNode;
  /** Comp frame where this scene's local frame 0 lands (its `S`). */
  sceneStart: number;
  /** Multiplies the scale pump. 1 = default; bump for S1/S7, drop for footage. */
  intensity?: number;
  /** Micro-shake magnitude multiplier. 0 disables (e.g. keep footage steady). */
  shake?: number;
  /** Downbeat brightness lift. Off for footage so text stays readable. */
  glow?: boolean;
  style?: React.CSSProperties;
}> = ({ children, sceneStart, intensity = 1, shake = 1, glow = true, style }) => {
  const local = useCurrentFrame();
  const f = local + sceneStart;

  const energy = energyAt(f);
  const phase = beatPhase(f);
  // Sharp attack on the beat (phase 0), exponential decay over ~half a beat.
  const env = Math.exp(-phase * 5.5);
  const scale = 1 + 0.012 * intensity * energy * env;

  const down = isDownbeatAt(f);
  const downEnv = down ? env : 0;
  const brightness = 1 + (glow ? 0.06 : 0) * energy * downEnv;

  let sx = 0;
  let sy = 0;
  let rot = 0;
  if (shake > 0 && down && energy > 0.85) {
    const mag = Math.min((energy - 0.85) / 0.15, 1); // 0..1
    const bar = Math.floor(beatIndexAt(f) / 4);
    const dx = random(`pshx-${bar}`) - 0.5;
    const dy = random(`pshy-${bar}`) - 0.5;
    const dr = random(`pshr-${bar}`) - 0.5;
    const amp = 6 * mag * shake * env;
    sx = dx * 2 * amp;
    sy = dy * 2 * amp;
    rot = dr * 0.5 * 0.25 * 2 * mag * shake * env; // ≤ ±0.25°
  }

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${sx}px, ${sy}px) scale(${scale}) rotate(${rot}deg)`,
        transformOrigin: "50% 50%",
        filter: brightness !== 1 ? `brightness(${brightness})` : undefined,
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------- section flashes */

type Flash = { f: number; color: string; peak: number };

/** Parchment camera-flash at drops; terracotta at the big breaks. Each entry
 *  fans out to every comp frame the music-time appears at (Part A + Part B). */
/** The explainer window (S4a journey + S4b yield + S4c mechanism chart) must
 *  stay flash-free so every step / line reads clearly — suppress any flash
 *  landing inside it. */
const S4_WINDOW: [number, number] = [barA(15), barB(22)];

const FLASHES: Flash[] = [
  ...compFramesAt(7.738).map((f) => ({ f, color: COLORS.text, peak: 0.5 })),
  ...compFramesAt(45.24).map((f) => ({ f, color: COLORS.text, peak: 0.5 })),
  ...compFramesAt(35.86).map((f) => ({ f, color: COLORS.terracotta, peak: 0.42 })),
  ...compFramesAt(43.36).map((f) => ({ f, color: COLORS.terracotta, peak: 0.42 })),
].filter((fl) => fl.f < S4_WINDOW[0] || fl.f >= S4_WINDOW[1]);

/**
 * Full-frame 1-frame flashes on section changes. Mount at the TOP level of the
 * comp (outside any Sequence) so `useCurrentFrame` is the true comp frame.
 */
export const SectionFlashes: React.FC = () => {
  const frame = useCurrentFrame();
  let color: string = COLORS.text;
  let op = 0;
  for (const fl of FLASHES) {
    const v = interpolate(frame, [fl.f - 1, fl.f, fl.f + 1], [0, fl.peak, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    if (v > op) {
      op = v;
      color = fl.color;
    }
  }
  if (op <= 0.001) return null;
  return (
    <AbsoluteFill
      style={{ background: color, opacity: op, pointerEvents: "none" }}
    />
  );
};
