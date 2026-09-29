import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, Glass } from "../../kit";
import { C, F } from "./theme";

/**
 * ZA mark — redrawn in code from the project's logo (zero-arena-demo-video/
 * public/logo.png: a faceted double ring around a sheared "ZA"), in the
 * dashboard's emerald with the old demo's violet glow. `draw` 0..1 draws it on.
 */
export const ZaMark: React.FC<{ size?: number; draw?: number; glow?: boolean }> = ({ size = 200, draw = 1, glow = true }) => {
  const ring = 2 * Math.PI * 44;
  const oct = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const r = i % 2 ? 47 : 49.5;
    return `${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`;
  }).join(" ");
  const zLen = 120;
  const aLen = 110;
  const d1 = Math.min(1, draw * 1.6);
  const d2 = Math.max(0, Math.min(1, draw * 1.6 - 0.35));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block", overflow: "visible", filter: glow ? `drop-shadow(0 0 ${size * 0.06}px rgba(52,211,153,0.55)) drop-shadow(0 0 ${size * 0.12}px rgba(167,139,250,0.35))` : undefined }}
    >
      <circle cx={50} cy={50} r={46} fill="#0d0d14" />
      <polygon points={oct} fill="none" stroke={C.violet} strokeWidth={1.4} opacity={0.8 * draw} />
      <circle cx={50} cy={50} r={44} fill="none" stroke={C.emerald} strokeWidth={2.4} strokeDasharray={ring} strokeDashoffset={ring * (1 - draw)} transform="rotate(-90 50 50)" />
      <g transform="translate(50 51) skewX(-12)" fill="none" strokeLinejoin="miter" strokeLinecap="square">
        <path d="M-24 -16 H2 L-22 16 H2" stroke={C.text} strokeWidth={6.5} strokeDasharray={zLen} strokeDashoffset={zLen * (1 - d1)} />
        <path d="M4 17 L15 -17 L26 17 M8.5 7 H21.5" stroke={C.emerald} strokeWidth={6.5} strokeDasharray={aLen} strokeDashoffset={aLen * (1 - d2)} />
      </g>
    </svg>
  );
};

/** "● REAL APP · LIVE BSC TESTNET DATA" pill. */
export const RealTag: React.FC<{ at?: number; label?: string; size?: number; style?: React.CSSProperties }> = ({
  at = 0,
  label = "Real dashboard · live BSC testnet data",
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
        background: "rgba(8,20,15,0.94)",
        border: `1.5px solid ${C.emerald}aa`,
        color: C.emerald,
        fontFamily: F.sans,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        transform: `scale(${0.7 + 0.3 * p})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        ...style,
      }}
    >
      <span style={{ width: size * 0.45, height: size * 0.45, borderRadius: 99, background: C.emerald, boxShadow: `0 0 10px ${C.emerald}` }} />
      {label}
    </div>
  );
};

/**
 * A 1920×1080 capture drawn `w` px wide inside a glass browser frame.
 * `children` render in SCREENSHOT px (scaled with the image).
 */
export const Shot: React.FC<{ src: string; w: number; url?: string; glow?: number; children?: React.ReactNode }> = ({ src, w, url = "localhost:3251", glow = 0.4, children }) => {
  const barH = Math.round(w * 0.032);
  const k = (w - 3) / 1920;
  return (
    <Glass radius={18} glow={glow} glowColor="rgba(52,211,153,0.35)" fill="#0e0e10">
      <div style={{ height: barH, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: barH * 0.32, height: barH * 0.32, borderRadius: 99, background: c, opacity: 0.85 }} />
        ))}
        <div
          style={{
            marginLeft: 16,
            width: w * 0.4,
            height: barH * 0.6,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.55)",
            fontFamily: F.mono,
            fontSize: barH * 0.34,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: w - 3, height: (w - 3) * (1080 / 1920), overflow: "hidden" }}>
        <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "0 0" }}>{children}</div>
      </div>
    </Glass>
  );
};

/** Highlight ring in SCREENSHOT px, pops at `at` (local), optional `until`. */
export const Ring: React.FC<{ x: number; y: number; w: number; h: number; at: number; until?: number; color?: string; label?: string; below?: boolean }> = ({
  x,
  y,
  w,
  h,
  at,
  until = Infinity,
  color = C.emerald,
  label,
  below = false,
}) => {
  const f = useCurrentFrame();
  if (f < at || f >= until) return null;
  const p = interpolate(f, [at, at + 6], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 10,
        top: y - 10,
        width: w + 20,
        height: h + 20,
        borderRadius: 14,
        border: `4px solid ${color}`,
        boxShadow: `0 0 30px ${color}88, inset 0 0 20px ${color}33`,
        opacity: p,
        transform: `scale(${1.15 - 0.15 * p})`,
      }}
    >
      {label ? (
        <div
          style={{
            position: "absolute",
            left: -4,
            top: below ? h + 34 : -46,
            padding: "4px 12px",
            background: color,
            color: "#08090b",
            fontFamily: F.comic,
            fontSize: 26,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            border: "3px solid #08090b",
            boxShadow: "4px 4px 0 #08090b",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
