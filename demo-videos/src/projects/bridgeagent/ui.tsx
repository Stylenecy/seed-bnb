import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, Glass } from "../../kit";
import { C, F, SHOT_H, SHOT_W } from "./theme";

/**
 * The BridgeAgent mark, redrawn from web/components/Wordmark.tsx (viewBox 18×18):
 * three horizontal spans + a left pier (a glyphic "B" / a bridge), with the
 * moss-500 dot at the top-right end. `draw` 0..1 strokes it on.
 */
export const BridgeMark: React.FC<{ size?: number; color?: string; draw?: number; glow?: number; stroke?: number }> = ({
  size = 200,
  color = C.mossSoft,
  draw = 1,
  glow = 1,
  stroke = 1.5,
}) => {
  const seg = (d: string, len: number, i: number) => {
    const p = interpolate(draw, [i * 0.18, i * 0.18 + 0.4], [0, 1], clamp);
    return <path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="square" fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />;
  };
  return (
    <svg
      viewBox="0 0 18 18"
      width={size}
      height={size}
      style={{ display: "block", overflow: "visible", filter: `drop-shadow(0 0 ${size * 0.06 * glow}px rgba(105,147,120,${0.9 * glow}))` }}
    >
      {seg("M2 3 V15", 12, 0)}
      {seg("M2 3 H14", 12, 1)}
      {seg("M2 9 H11", 9, 2)}
      {seg("M2 15 H14", 12, 3)}
      <circle cx={14} cy={3} r={1.1} fill={C.gold} opacity={interpolate(draw, [0.85, 1], [0, 1], clamp)} />
    </svg>
  );
};

/** Moss pill in the page's own uppercase tracking style. */
export const Pill: React.FC<{ color?: string; children: React.ReactNode; size?: number; dot?: boolean; style?: React.CSSProperties }> = ({
  color = C.mossHi,
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
      letterSpacing: "0.12em",
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
    <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "8px 24px 8px 10px", borderRadius: 999, background: "rgba(9,17,13,0.94)", border: `1px solid ${C.line}`, transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: "left center", opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <Pill color={C.pos} size={20}>real app</Pill>
      <span style={{ fontFamily: F.mono, fontSize: 21, color: C.textMuted }}>{label}</span>
    </div>
  );
};

/** A 1920×1200 capture drawn `w` px wide in a glass browser frame; children in SCREENSHOT px. */
export const Shot: React.FC<{ src: string; w: number; url: string; glow?: number; children?: React.ReactNode }> = ({ src, w, url, glow = 0.4, children }) => {
  const barH = Math.round(w * 0.03);
  const k = (w - 3) / SHOT_W;
  return (
    <Glass radius={18} glow={glow} glowColor="rgba(105,147,120,0.5)" fill={C.bg}>
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

export type TermLine = { at: number; txt: string; col?: string; bold?: boolean };

/** Glass terminal whose lines type on at their LOCAL frame. */
export const Terminal: React.FC<{ title: string; lines: TermLine[]; w: number; minH?: number; size?: number; glowColor?: string; glow?: number }> = ({
  title,
  lines,
  w,
  minH = 400,
  size = 25,
  glowColor = "rgba(105,147,120,0.45)",
  glow = 0.4,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: w }}>
      <Glass radius={22} glow={glow} glowColor={glowColor} fill="rgba(8,14,11,0.96)">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.line}` }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, opacity: 0.85 }} />
          ))}
          <span style={{ marginLeft: 14, fontFamily: F.mono, fontSize: 20, color: C.textMuted }}>{title}</span>
        </div>
        <div style={{ padding: "20px 26px", minHeight: minH }}>
          {lines.map((l, i) => {
            if (frame < l.at) return null;
            const typed = Math.min(l.txt.length, Math.floor(((frame - l.at) / 5) * l.txt.length));
            return (
              <div key={i} style={{ fontFamily: F.mono, fontSize: size, lineHeight: 1.7, color: l.col ?? C.text, fontWeight: l.bold ? 700 : 400, whiteSpace: "pre" }}>
                {l.txt.slice(0, typed)}
                {typed < l.txt.length ? <span style={{ background: C.mossHi, color: C.bg }}> </span> : null}
              </div>
            );
          })}
        </div>
      </Glass>
    </div>
  );
};
