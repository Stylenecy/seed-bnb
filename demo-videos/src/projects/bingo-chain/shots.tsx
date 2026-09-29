import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BrowserFrame, clamp } from "../../kit";
import type { CamKey } from "../../kit";
import { C, F, SHOT_ASPECT } from "./theme";

/**
 * A real-UI browser shot placed at (X, Y) with width W on the camera plane.
 * Shots are 1920×1200 captures; `pt(px, py)` maps a capture pixel to the plane.
 */
export const makeShot = (X: number, Y: number, W: number) => {
  const barH = Math.round(W * 0.032);
  const s = (W - 3) / 1920;
  const pt = (px: number, py: number) => ({ x: X + 1.5 + px * s, y: Y + 1.5 + barH + py * s });
  /** Camera key that puts capture pixel (px,py) at screen (sx,sy) with `scale`. */
  const cam = (frame: number, px: number, py: number, scale: number, sx = 960, sy = 540): CamKey => {
    const p = pt(px, py);
    return { frame, x: p.x + (960 - sx) / scale, y: p.y + (540 - sy) / scale, scale };
  };
  return { X, Y, W, pt, cam, s };
};

/** Browser frame that swaps between shots at given local frames (white flash on swap). */
export const ShotSwap: React.FC<{
  shots: { f: number; src: string }[];
  X: number;
  Y: number;
  W: number;
  url: string;
  glowColor?: string;
  children?: React.ReactNode;
}> = ({ shots, X, Y, W, url, glowColor = "rgba(111,255,0,0.35)", children }) => {
  const frame = useCurrentFrame();
  let shot = shots[0]!;
  for (const s of shots) if (frame >= s.f) shot = s;
  const flash = shots.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 4], [0.45, 0], clamp)) : m), 0);
  return (
    <div style={{ position: "absolute", left: X, top: Y }}>
      <BrowserFrame src={shot.src} width={W} aspect={SHOT_ASPECT} url={url} glow={0.6} glowColor={glowColor}>
        <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
        {children}
      </BrowserFrame>
    </div>
  );
};

/** "● Real BINGOChain app · …" label pill. */
export const RealLabel: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.neon }) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      top: 50,
      padding: "8px 16px",
      borderRadius: 999,
      border: `1.5px solid ${color}88`,
      background: "rgba(1,8,40,0.85)",
      fontFamily: F.sans,
      fontWeight: 700,
      fontSize: 20,
      letterSpacing: "0.14em",
      color,
      textTransform: "uppercase",
    }}
  >
    ● {children}
  </div>
);

/** Highlight ring drawn on the camera plane around a capture region. */
export const Ring: React.FC<{ x: number; y: number; w: number; h: number; at: number; until?: number; color?: string; r?: number }> = ({
  x,
  y,
  w,
  h,
  at,
  until = Infinity,
  color = C.neon,
  r = 14,
}) => {
  const frame = useCurrentFrame();
  if (frame < at || frame >= until) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        border: `3px solid ${color}`,
        boxShadow: `0 0 26px ${color}`,
        transform: `scale(${interpolate(frame, [at, at + 6], [1.25, 1], clamp)})`,
        opacity: interpolate(frame, [at, at + 4], [0, 1], clamp),
      }}
    />
  );
};
