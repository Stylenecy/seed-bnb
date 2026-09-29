import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, Glass } from "../../kit";
import { C, F, SCREEN, SHOT_H, SHOT_W } from "./theme";

/** The real DRIFT mark (apps/web/public/drift-logo.png, white on transparent). */
export const DriftMark: React.FC<{ size?: number; glow?: number; style?: React.CSSProperties }> = ({ size = 200, glow = 1, style }) => (
  <Img
    src={SCREEN.logo}
    style={{
      width: size,
      height: size,
      display: "block",
      filter: `drop-shadow(0 0 ${size * 0.09 * glow}px rgba(154,168,240,${0.75 * glow})) drop-shadow(0 0 ${size * 0.02}px rgba(255,255,255,0.6))`,
      ...style,
    }}
  />
);

/** Periwinkle pill in the app's own badge style (features/dashboard primitives). */
export const Pill: React.FC<{ color?: string; children: React.ReactNode; size?: number; dot?: boolean; style?: React.CSSProperties }> = ({
  color = C.peri,
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

/** "REAL APP" tag for the captured screens. */
export const RealTag: React.FC<{ at?: number; label: string }> = ({ at = 0, label }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 220, mass: 0.6 } });
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "8px 24px 8px 10px", borderRadius: 999, background: "rgba(8,9,11,0.92)", border: `1px solid ${C.line}`, transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: "left center", opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <Pill color={C.green} size={20}>real app</Pill>
      <span style={{ fontFamily: F.mono, fontSize: 21, color: C.textMuted }}>{label}</span>
    </div>
  );
};

/**
 * A 1920×1200 capture drawn `w` px wide inside a glass browser frame.
 * `children` render in SCREENSHOT px (scaled with the image).
 */
export const Shot: React.FC<{ src: string; w: number; url: string; glow?: number; children?: React.ReactNode }> = ({ src, w, url, glow = 0.4, children }) => {
  const barH = Math.round(w * 0.03);
  const k = (w - 3) / SHOT_W;
  return (
    <Glass radius={18} glow={glow} glowColor="rgba(154,168,240,0.45)" fill="#0b0c0f">
      <div style={{ height: barH, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: `1px solid ${C.line}` }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: barH * 0.32, height: barH * 0.32, borderRadius: 99, background: c, opacity: 0.85 }} />
        ))}
        <div style={{ marginLeft: 16, width: w * 0.4, height: barH * 0.6, borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontFamily: F.mono, fontSize: barH * 0.36, display: "flex", alignItems: "center", padding: "0 12px" }}>
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: w - 3, height: (w - 3) * (SHOT_H / SHOT_W), overflow: "hidden" }}>
        <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: SHOT_W, height: SHOT_H, transform: `scale(${k})`, transformOrigin: "0 0" }}>{children}</div>
      </div>
    </Glass>
  );
};

/** Signal light: Long / Short / Flat allowed() state. */
export const SignalLight: React.FC<{ name: string; ok: boolean; flash?: number }> = ({ name, ok, flash = 0 }) => {
  const col = ok ? C.green : C.red;
  return (
    <div style={{ flex: 1, padding: "18px 22px", borderRadius: 16, border: `1.5px solid ${col}66`, background: `${col}${ok ? "14" : "1f"}`, boxShadow: `0 0 ${18 + 40 * flash}px ${col}${flash > 0.05 ? "aa" : "33"}`, transform: `scale(${1 + 0.06 * flash})` }}>
      <div style={{ fontFamily: F.mono, fontSize: 20, color: C.textMuted, letterSpacing: "0.12em" }}>allowed({name})</div>
      <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 44, color: col, marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 16, height: 16, borderRadius: 99, background: col, boxShadow: `0 0 14px ${col}` }} />
        {ok ? "true" : "false"}
      </div>
    </div>
  );
};
