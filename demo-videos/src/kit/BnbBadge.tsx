import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "./fonts";
import { BNB_GOLD, clamp, INK } from "./tokens";

/**
 * Code-drawn BNB Chain diamond mark (5-part geometry: roof chevron, floor
 * chevron, side diamonds, centre diamond) in #F0B90B. Pure SVG, any size.
 */
export const BnbMark: React.FC<{ size?: number; color?: string; outline?: string; style?: React.CSSProperties }> = ({
  size = 64,
  color = BNB_GOLD,
  outline,
  style,
}) => (
  <svg width={size} height={size} viewBox="-4 -4 134.61 134.61" style={{ display: "block", overflow: "visible", ...style }}>
    <g fill={color} stroke={outline} strokeWidth={outline ? 5 : 0} strokeLinejoin="round">
      <path d="M38.73 53.2 63.32 28.62 87.92 53.22 102.22 38.91 63.32 0 24.43 38.9Z" />
      <path d="M0 63.31 14.3 49 28.61 63.31 14.3 77.61Z" />
      <path d="M38.73 73.41 63.32 98 87.92 73.4 102.23 87.69 63.32 126.61 24.42 87.72Z" />
      <path d="M98 63.31 112.3 49 126.61 63.31 112.3 77.61Z" />
      <path d="M77.83 63.3 63.32 48.78 48.81 63.29 63.32 77.8Z" />
    </g>
  </svg>
);

/**
 * Pill badge: BNB mark + label (e.g. "NOW ON BNB CHAIN", "LIVE ON BSC
 * TESTNET"). Pops on LOCAL frame `at`; `live` adds a pulsing status dot.
 */
export const BnbBadge: React.FC<{
  label?: string;
  at?: number;
  size?: number;
  live?: boolean;
  variant?: "dark" | "gold" | "comic";
  style?: React.CSSProperties;
}> = ({ label = "BUILT ON BNB CHAIN", at = 0, size = 30, live = false, variant = "dark", style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  if (f < at) return null;
  const gold = variant === "gold";
  const comic = variant === "comic";
  const pulse = 0.5 + 0.5 * Math.sin((f - at) / 5);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.5,
        padding: `${size * 0.42}px ${size * 0.8}px ${size * 0.42}px ${size * 0.55}px`,
        borderRadius: comic ? 8 : 999,
        background: gold ? BNB_GOLD : comic ? "#1a1406" : "rgba(240,185,11,0.08)",
        border: comic ? `4px solid ${INK}` : `1.5px solid ${gold ? BNB_GOLD : "rgba(240,185,11,0.55)"}`,
        boxShadow: comic ? `6px 6px 0 ${INK}, 0 0 0 2px ${BNB_GOLD} inset` : `0 0 ${24 + 16 * pulse}px rgba(240,185,11,${gold ? 0.5 : 0.22})`,
        transform: `scale(${0.6 + 0.4 * p})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <BnbMark size={size * 1.25} color={gold ? INK : BNB_GOLD} />
      {live ? (
        <span style={{ position: "relative", width: size * 0.45, height: size * 0.45 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: "#34C759", opacity: 0.35, transform: `scale(${1 + pulse})` }} />
          <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: "#34C759" }} />
        </span>
      ) : null}
      <span
        style={{
          fontFamily: comic ? FONTS.comic : FONTS.manrope,
          fontWeight: comic ? 400 : 800,
          fontSize: comic ? size * 1.05 : size * 0.72,
          letterSpacing: comic ? "0.04em" : "0.18em",
          color: gold ? INK : BNB_GOLD,
        }}
      >
        {label}
      </span>
    </div>
  );
};
