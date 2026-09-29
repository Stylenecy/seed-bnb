import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { useBeat, useSceneStart } from "./BeatContext";
import { clamp, PAPER } from "./tokens";

/**
 * Pulse — wrap a scene's MAIN content (not its background) and it breathes
 * with the track:
 *  • scale pump 1 → 1 + 0.014·intensity·energy on every beat (fast attack,
 *    ~half-beat decay), stronger on downbeats;
 *  • a small brightness lift on downbeats;
 *  • energy-gated micro-shake on strong downbeats (energy > 0.85).
 * Reads the grid from <BeatProvider> and the scene start from <SceneTimeline>.
 */
export const Pulse: React.FC<{
  children: React.ReactNode;
  intensity?: number;
  /** Micro-shake multiplier (0 = off; keep low for UI screenshots). */
  shake?: number;
  glow?: boolean;
  style?: React.CSSProperties;
}> = ({ children, intensity = 1, shake = 1, glow = true, style }) => {
  const g = useBeat();
  const f = useCurrentFrame() + useSceneStart();
  const energy = g.energyAt(f);
  const env = Math.exp(-g.beatPhase(f) * 5.5);
  const down = g.isDownbeatAt(f);
  const scale = 1 + 0.014 * intensity * energy * env * (down ? 1.35 : 1);
  const bright = 1 + (glow ? 0.07 : 0) * energy * (down ? env : 0);

  let sx = 0;
  let sy = 0;
  let rot = 0;
  if (shake > 0 && down && energy > 0.85) {
    const mag = Math.min((energy - 0.85) / 0.15, 1);
    const bar = Math.floor(g.beatIndexAt(f) / g.beatsPerBar);
    const amp = 6 * mag * shake * env;
    sx = (random(`psx-${bar}`) - 0.5) * 2 * amp;
    sy = (random(`psy-${bar}`) - 0.5) * 2 * amp;
    rot = (random(`psr-${bar}`) - 0.5) * 0.5 * mag * shake * env;
  }
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${sx}px, ${sy}px) scale(${scale}) rotate(${rot}deg)`,
        filter: bright !== 1 ? `brightness(${bright})` : undefined,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export type Flash = { f: number; color?: string; peak?: number; len?: number };

/**
 * 1-frame (default) full-screen flashes at COMP frames — mount at the top
 * level of Main (outside the SceneTimeline) and feed it the drop downbeats.
 */
export const Flashes: React.FC<{ hits: Flash[] }> = ({ hits }) => {
  const frame = useCurrentFrame();
  let op = 0;
  let color = PAPER;
  for (const h of hits) {
    const len = h.len ?? 1;
    const v = interpolate(frame, [h.f - 0.01, h.f, h.f + len], [0, h.peak ?? 0.55, 0], clamp);
    if (v > op) {
      op = v;
      color = h.color ?? PAPER;
    }
  }
  if (op <= 0.001) return null;
  return <AbsoluteFill style={{ background: color, opacity: op, pointerEvents: "none" }} />;
};

/** Scale bump driven by explicit beat hits (local frames) — for single elements. */
export const useBeatPunch = (hits: readonly number[], amt = 0.06, decay = 4): number => {
  const f = useCurrentFrame();
  let e = 0;
  for (const h of hits) if (f >= h) e = Math.max(e, amt * Math.exp(-(f - h) / decay));
  return 1 + e;
};
