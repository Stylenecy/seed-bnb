import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, GLASS } from "./tokens";

/**
 * Liquid-glass surface (perps-agent): gradient border frame, blur, inset
 * highlight and an optional coloured glow ring.
 */
export const Glass: React.FC<{
  radius?: number;
  /** 0..1 glow strength. */
  glow?: number;
  glowColor?: string;
  fill?: string;
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ radius = 24, glow = 0, glowColor = "rgba(240,185,11,0.45)", fill = GLASS.fill, style, innerStyle, children }) => (
  <div
    style={{
      position: "relative",
      borderRadius: radius,
      padding: 1.5,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.14) 20%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.14) 80%, rgba(255,255,255,0.4) 100%)",
      boxShadow:
        glow > 0.02
          ? `0 0 ${glow * 60}px ${glowColor}, 0 40px 90px -40px rgba(0,0,0,0.9)`
          : "0 40px 90px -44px rgba(0,0,0,0.9)",
      ...style,
    }}
  >
    <div
      style={{
        borderRadius: radius - 1.5,
        height: "100%",
        background: fill,
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -1px 1px rgba(0,0,0,0.3)",
        overflow: "hidden",
        position: "relative",
        ...innerStyle,
      }}
    >
      {children}
    </div>
  </div>
);

/** Diagonal sheen sweeping across its parent once from LOCAL frame `from`. */
export const Glint: React.FC<{ from: number; dur?: number; radius?: number; strength?: number }> = ({
  from,
  dur = 30,
  radius = 24,
  strength = 0.45,
}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [from, from + dur], [-30, 130], clamp);
  const op = interpolate(f, [from, from + dur * 0.4, from + dur], [0, strength, 0], clamp);
  if (op <= 0.001) return null;
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(100deg, transparent ${x - 14}%, rgba(255,255,255,${op}) ${x}%, transparent ${x + 14}%)`,
        }}
      />
    </div>
  );
};
