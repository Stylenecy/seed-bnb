import React from "react";
import { Img } from "remotion";
import { Glass, INK } from "../../kit";
import { C, F } from "./theme";

/**
 * A real capture (1920×1200) cropped to region (cx, cy, cw, ch) and shown at
 * `scale`, inside a glass browser chrome. `children` are drawn on top in
 * DISPLAY px; use `pt()` from cropPt to place rings over capture pixels.
 */
export const cropPt = (cx: number, cy: number, scale: number) => (px: number, py: number) => ({ x: (px - cx) * scale, y: (py - cy) * scale });

export const CropShot: React.FC<{
  src: string;
  cx: number;
  cy: number;
  cw: number;
  ch: number;
  scale: number;
  url: string;
  glowColor?: string;
  zoom?: number;
  children?: React.ReactNode;
}> = ({ src, cx, cy, cw, ch, scale, url, glowColor = "rgba(228,116,68,0.35)", zoom = 1, children }) => {
  const w = cw * scale;
  const h = ch * scale;
  return (
    <Glass radius={18} glow={0.6} glowColor={glowColor} fill="#0e0e10">
      <div style={{ height: 40, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, opacity: 0.85 }} />
        ))}
        <div
          style={{
            marginLeft: 14,
            flex: 1,
            height: 26,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            fontFamily: F.mono,
            fontSize: 16,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: w, height: h, overflow: "hidden", borderRadius: "0 0 16px 16px" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
          <Img src={src} style={{ position: "absolute", left: -cx * scale, top: -cy * scale, width: 1920 * scale, height: 1200 * scale }} />
          {children}
        </div>
      </div>
    </Glass>
  );
};

/** "● REAL … APP" label pill. */
export const RealLabel: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.clay, style }) => (
  <div
    style={{
      display: "inline-block",
      padding: "8px 16px",
      borderRadius: 999,
      border: `1.5px solid ${color}88`,
      background: "rgba(14,12,11,0.85)",
      fontFamily: F.sans,
      fontWeight: 700,
      fontSize: 19,
      letterSpacing: "0.14em",
      color,
      textTransform: "uppercase",
      ...style,
    }}
  >
    ● {children}
  </div>
);

/** Celo pill (comic style) with a live dot. */
export const CeloPill: React.FC<{ label: string; size?: number; style?: React.CSSProperties }> = ({ label, size = 34, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.45,
      padding: `${size * 0.36}px ${size * 0.8}px`,
      borderRadius: 8,
      background: C.celo,
      border: `4px solid ${INK}`,
      boxShadow: `6px 6px 0 ${INK}`,
      fontFamily: F.comic,
      fontSize: size,
      letterSpacing: "0.06em",
      color: INK,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <span style={{ width: size * 0.62, height: size * 0.62, borderRadius: 99, border: `${size * 0.14}px solid ${INK}`, display: "inline-block" }} />
    {label}
  </div>
);
