import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useCameraScale } from "./Camera";
import { clamp, INK, PAPER } from "./tokens";

/**
 * Spring-driven pointer living in camera CONTENT space (counter-scaled so it
 * stays ~size px on screen). Each waypoint starts moving at `frame`; set
 * `click: true` to press + ripple when it arrives (~`clickDelay` frames later
 * — give waypoints a beat BEFORE the beat you want the click to land on, or
 * set clickDelay so arrival + press lands on the beat).
 */
export type CursorKey = { frame: number; x: number; y: number; click?: boolean; clickDelay?: number };

export const Cursor: React.FC<{
  keyframes: readonly CursorKey[];
  size?: number;
  color?: string;
  rippleColor?: string;
  hideBefore?: number;
  hideAfter?: number;
}> = ({ keyframes, size = 34, color = PAPER, rippleColor = "#F0B90B", hideBefore, hideAfter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = useCameraScale();
  if (hideBefore !== undefined && frame < hideBefore) return null;
  if (hideAfter !== undefined && frame > hideAfter) return null;

  let idx = 0;
  for (let i = 0; i < keyframes.length; i++) if (frame >= keyframes[i]!.frame) idx = i;
  const to = keyframes[idx]!;
  const from = idx > 0 ? keyframes[idx - 1]! : to;
  const p = spring({ frame: frame - to.frame, fps, config: { damping: 20, stiffness: 140, mass: 0.8 } });
  const x = interpolate(p, [0, 1], [from.x, to.x]);
  const y = interpolate(p, [0, 1], [from.y, to.y]);

  // Press + ripple for every click waypoint already reached.
  let press = 0;
  const ripples: React.ReactNode[] = [];
  keyframes.forEach((k, i) => {
    if (!k.click) return;
    const at = k.frame + (k.clickDelay ?? 8);
    const d = frame - at;
    if (d < 0 || d > 22) return;
    press = Math.max(press, interpolate(d, [0, 3, 8], [0, 1, 0], clamp));
    const r = interpolate(d, [0, 22], [6, 70], clamp);
    ripples.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: k.x - r / cam,
          top: k.y - r / cam,
          width: (2 * r) / cam,
          height: (2 * r) / cam,
          borderRadius: "50%",
          border: `${4 / cam}px solid ${rippleColor}`,
          opacity: interpolate(d, [0, 22], [0.95, 0], clamp),
          boxShadow: `0 0 ${18 / cam}px ${rippleColor}`,
        }}
      />,
    );
  });
  const s = (size / cam) * (1 - 0.18 * press);
  return (
    <>
      {ripples}
      <div style={{ position: "absolute", left: x, top: y, width: s, height: s, transform: "translate(-14%, -8%)", pointerEvents: "none" }}>
        <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.6))" }}>
          <path d="M4 2 L4 19 L8.5 14.8 L11.3 21.2 L14.1 20 L11.3 13.7 L17.5 13.7 Z" fill={color} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
};
