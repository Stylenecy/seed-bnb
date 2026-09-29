import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, Glass } from "../../kit";
import { C, F, GOLD_GRADIENT } from "./theme";

/**
 * Golda mark (code-drawn): a bullion ingot in a thin ring with a serif "G".
 * `draw` 0..1 draws the ring on.
 */
export const GoldaMark: React.FC<{ size?: number; draw?: number; glow?: boolean }> = ({ size = 120, draw = 1, glow = true }) => {
  const id = React.useId().replace(/:/g, "");
  const ring = 2 * Math.PI * 46;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block", overflow: "visible", filter: glow ? `drop-shadow(0 0 ${size * 0.09}px rgba(217,174,74,0.55))` : undefined }}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={C.goldSoft} />
          <stop offset="55%" stopColor={C.gold} />
          <stop offset="100%" stopColor={C.goldDeep} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke={`url(#g${id})`} strokeWidth="2.4" strokeDasharray={ring} strokeDashoffset={ring * (1 - draw)} transform="rotate(-90 50 50)" />
      <g opacity={Math.min(1, draw * 1.6)}>
        <path d="M22 66 L32 44 L68 44 L78 66 Z" fill={`url(#g${id})`} stroke="#3a2c0c" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M32 44 L38 34 L62 34 L68 44 Z" fill={C.goldSoft} stroke="#3a2c0c" strokeWidth="1.4" strokeLinejoin="round" />
        <text x="50" y="63" textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize="19" fill="#3a2c0c">
          G
        </text>
      </g>
    </svg>
  );
};

/** Pill tag that pops on LOCAL frame `at` ("CONCEPT UI", "BSC MAINNET FORK", …). */
export const Tag: React.FC<{ at?: number; label: string; color?: string; dashed?: boolean; size?: number; style?: React.CSSProperties }> = ({
  at = 0,
  label,
  color = C.amber,
  dashed = false,
  size = 22,
  style,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 220, mass: 0.6 } });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: `${size * 0.45}px ${size * 0.9}px`,
        borderRadius: 999,
        background: "rgba(16,13,8,0.94)",
        border: `2px ${dashed ? "dashed" : "solid"} ${color}`,
        color,
        fontFamily: F.sans,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        transform: `scale(${0.7 + 0.3 * p})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        ...style,
      }}
    >
      <span style={{ width: size * 0.45, height: size * 0.45, borderRadius: 99, background: color }} />
      {label}
    </div>
  );
};

/** Allocation donut: `parts` fractions (sum ≤ 1), drawn clockwise from 12 o'clock. */
export const Donut: React.FC<{
  size?: number;
  parts: { v: number; color: string }[];
  center?: React.ReactNode;
  track?: string;
  width?: number;
}> = ({ size = 360, parts, center, track = "rgba(255,255,255,0.07)", width = 34 }) => {
  const r = 50 - width / 2 / (size / 100) - 2;
  const circ = 2 * Math.PI * r;
  const sw = (width / size) * 100;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth={sw} />
        {parts.map((p, i) => {
          const len = circ * Math.max(0, Math.min(1, p.v));
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={sw}
              strokeDasharray={`${len} ${circ}`}
              strokeDashoffset={-circ * acc}
              transform="rotate(-90 50 50)"
              style={{ filter: len > 0.5 ? `drop-shadow(0 0 3px ${p.color}88)` : undefined }}
            />
          );
          acc += p.v;
          return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{center}</div>
    </div>
  );
};

/** Concept app window: glass frame + app header (mark, name, nav, network pill). */
export const AppWindow: React.FC<{ w: number; h: number; glow?: number; children?: React.ReactNode }> = ({ w, h, glow = 0.35, children }) => (
  <Glass radius={22} glow={glow} glowColor="rgba(217,174,74,0.4)" fill="rgba(16,13,9,0.94)" style={{ width: w, height: h }}>
    <div style={{ height: 76, display: "flex", alignItems: "center", gap: 16, padding: "0 30px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <GoldaMark size={44} glow={false} />
      <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 30, color: C.text }}>Golda</span>
      <span style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 18, color: C.textMuted, marginLeft: 26 }}>Vault</span>
      <span style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 18, color: C.textDim, marginLeft: 16 }}>Agent log</span>
      <span style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 18, color: C.textDim, marginLeft: 16 }}>Docs</span>
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 16px",
          borderRadius: 999,
          border: "1px solid rgba(240,185,11,0.5)",
          background: "rgba(240,185,11,0.08)",
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 16,
          color: "#F0B90B",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 99, background: "#34C759" }} /> BSC Testnet · 97
      </div>
    </div>
    <div style={{ position: "relative", height: h - 79 }}>{children}</div>
  </Glass>
);

/** Thin gold streak (brand underline) that wipes on 0..100. */
export const GoldStreak: React.FC<{ left: number; top: number; width: number; p: number }> = ({ left, top, width, p }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width,
      height: 8,
      borderRadius: 8,
      background: GOLD_GRADIENT,
      clipPath: `inset(0 ${100 - p}% 0 0)`,
      boxShadow: "0 0 24px rgba(217,174,74,0.6)",
    }}
  />
);

/** Wordmark "Golda Finance" in the display serif, gold-gradient text. */
export const Wordmark: React.FC<{ size?: number; sub?: boolean }> = ({ size = 150, sub = true }) => (
  <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1 }}>
    <span style={{ background: GOLD_GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Golda</span>
    {sub ? <span style={{ color: C.text, fontWeight: 300, marginLeft: size * 0.25 }}>Finance</span> : null}
  </span>
);
