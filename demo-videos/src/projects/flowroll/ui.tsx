import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame, clamp } from "../../kit";
import { C, F, SCREEN, SHOT_H, SHOT_W } from "./theme";

/** The real Flowroll mark (flowroll-frontend/public/flowroll_logo.png). */
export const FlowMark: React.FC<{ size?: number; glow?: number; style?: React.CSSProperties }> = ({ size = 200, glow = 1, style }) => (
  <Img
    src={SCREEN.logo}
    style={{
      width: size,
      height: size,
      display: "block",
      filter: `drop-shadow(0 0 ${size * 0.12 * glow}px rgba(16,185,129,${0.55 * glow})) drop-shadow(0 0 ${size * 0.04 * glow}px rgba(167,139,250,${0.5 * glow}))`,
      ...style,
    }}
  />
);

/** Gradient headline text in the landing's violet → teal. */
export const GradText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span
    style={{
      backgroundImage: `linear-gradient(90deg, ${C.violetLite}, ${C.tealLite})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      ...style,
    }}
  >
    {children}
  </span>
);

export const Pill: React.FC<{ color?: string; children: React.ReactNode; size?: number; dot?: boolean; style?: React.CSSProperties }> = ({
  color = C.emerald,
  children,
  size = 22,
  dot = true,
  style,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.45,
      padding: `${size * 0.3}px ${size * 0.7}px`,
      borderRadius: 999,
      border: `1.5px solid ${color}66`,
      background: `${color}1c`,
      color,
      fontFamily: F.mono,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {dot ? <span style={{ width: size * 0.4, height: size * 0.4, borderRadius: 99, background: color, boxShadow: `0 0 10px ${color}` }} /> : null}
    {children}
  </span>
);

/** "REAL APP" tag for captured screens. */
export const RealTag: React.FC<{ at?: number; label: string }> = ({ at = 0, label }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 220, mass: 0.6 } });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        padding: "8px 24px 8px 10px",
        borderRadius: 999,
        background: "rgba(8,10,16,0.92)",
        border: `1px solid ${C.line}`,
        transform: `scale(${0.7 + 0.3 * p})`,
        transformOrigin: "left center",
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
      }}
    >
      <Pill color={C.emerald} size={20}>real app</Pill>
      <span style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 24, color: C.text }}>{label}</span>
    </div>
  );
};

/** A real capture in a browser frame. Screen px (1920×1200) map to `w` wide. */
export const Shot: React.FC<{ src: string; w: number; url: string; children?: React.ReactNode }> = ({ src, w, url, children }) => (
  <BrowserFrame src={src} width={w} aspect={SHOT_H / SHOT_W} url={url} glow={0.55} glowColor="rgba(124,58,237,0.4)">
    {children}
  </BrowserFrame>
);

/** Ring highlight in screen-local px (inside a Shot). */
export const Ring: React.FC<{ x: number; y: number; w: number; h: number; from: number; to: number; color: string; k: number }> = ({ x, y, w, h, from, to, color, k }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (x - w / 2) * k,
        top: (y - h / 2) * k,
        width: w * k,
        height: h * k,
        borderRadius: 14 * k,
        border: `${Math.max(2, 5 * k)}px solid ${color}`,
        boxShadow: `0 0 24px ${color}`,
        transform: `scale(${interpolate(frame, [from, from + 6], [1.35, 1], clamp)})`,
        opacity: interpolate(frame, [from, from + 4], [0, 1], clamp),
      }}
    />
  );
};
