import React, { useId } from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, Glass } from "../../kit";
import { C, F, SHOT_H, SHOT_W } from "./theme";

const c01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * The real Gridora mark (frontend/web/public/gridora-mark.svg, via Gridora/video Logo.tsx):
 * a coral-gradient arc-"G" + inner bar, an etched grid texture and 3 cream endpoint dots.
 * `draw` 0..1 strokes the arc on, then the bar, the etched grid and the dots.
 */
export const GridoraMark: React.FC<{ size?: number; draw?: number; glow?: number }> = ({ size = 200, draw = 1, glow = 1 }) => {
  const uid = useId().replace(/[:]/g, "");
  const clip = `gclip-${uid}`;
  const grad = `gcoral-${uid}`;
  const arc = c01(draw / 0.8);
  const barOp = c01((draw - 0.55) / 0.25);
  const gridOp = c01((draw - 0.2) / 0.5) * 0.5;
  const dots = c01((draw - 0.8) / 0.2);
  const lines = [180, 232, 284, 336, 388, 440, 492, 544, 596, 648, 700, 752, 804, 856];
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" style={{ display: "block", overflow: "visible", filter: `drop-shadow(0 0 ${size * 0.08 * glow}px rgba(217,119,87,${0.7 * glow}))` }}>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2AE80" />
          <stop offset="0.5" stopColor="#D97757" />
          <stop offset="1" stopColor="#A24E32" />
        </linearGradient>
        <clipPath id={clip}>
          <path d="M 741.8 704.8 A 300 300 0 1 1 741.8 319.2" fill="none" stroke="#000" strokeWidth="128" strokeLinecap="round" />
          <rect x="506" y="448" width="308" height="128" rx="64" />
        </clipPath>
      </defs>
      <path d="M 741.8 704.8 A 300 300 0 1 1 741.8 319.2" fill="none" stroke={`url(#${grad})`} strokeWidth="128" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arc} />
      <rect x="506" y="448" width="308" height="128" rx="64" fill={`url(#${grad})`} opacity={barOp} />
      <g clipPath={`url(#${clip})`} stroke={C.etch} strokeOpacity={gridOp} strokeWidth="6">
        {lines.map((x) => (
          <line key={`v${x}`} x1={x} y1="160" x2={x} y2="864" />
        ))}
        {lines.map((y) => (
          <line key={`h${y}`} x1="160" y1={y} x2="864" y2={y} />
        ))}
      </g>
      <g opacity={dots}>
        {[
          [806, 512],
          [741.8, 704.8],
          [741.8, 319.2],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={30 * interpolate(dots, [0, 1], [0.4, 1])} fill={C.cream} />
        ))}
      </g>
    </svg>
  );
};

/** The site's `.chip-volt`: a volt fill with ink text. */
export const VoltChip: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 24, style }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.4, padding: `${size * 0.28}px ${size * 0.7}px`, borderRadius: 999, background: C.volt, color: C.ink, fontFamily: F.mono, fontWeight: 700, fontSize: size, letterSpacing: "0.02em", whiteSpace: "nowrap", ...style }}>
    {children}
  </span>
);

/** Mono pill with a status dot. */
export const Pill: React.FC<{ color?: string; children: React.ReactNode; size?: number; dot?: boolean; style?: React.CSSProperties }> = ({ color = C.coralHi, children, size = 22, dot = true, style }) => (
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
      letterSpacing: "0.1em",
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
export const RealTag: React.FC<{ at?: number; label: string; color?: string }> = ({ at = 0, label, color = C.volt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 220, mass: 0.6 } });
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "8px 24px 8px 10px", borderRadius: 999, background: "rgba(14,12,11,0.94)", border: `1px solid ${C.line}`, transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: "left center", opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <Pill color={color} size={20}>real app</Pill>
      <span style={{ fontFamily: F.mono, fontSize: 21, color: C.textMuted }}>{label}</span>
    </div>
  );
};

/** A 1920×1200 capture drawn `w` px wide in a glass browser frame; children in SCREENSHOT px. */
export const Shot: React.FC<{ src: string; w: number; url: string; glow?: number; children?: React.ReactNode }> = ({ src, w, url, glow = 0.4, children }) => {
  const barH = Math.round(w * 0.03);
  const k = (w - 3) / SHOT_W;
  return (
    <Glass radius={18} glow={glow} glowColor="rgba(217,119,87,0.45)" fill={C.porcelain}>
      <div style={{ height: barH, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#16120f", borderBottom: `1px solid ${C.line}`, borderRadius: "16px 16px 0 0" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: barH * 0.32, height: barH * 0.32, borderRadius: 99, background: c, opacity: 0.85 }} />
        ))}
        <div style={{ marginLeft: 16, width: w * 0.4, height: barH * 0.6, borderRadius: 8, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.66)", fontFamily: F.mono, fontSize: barH * 0.36, display: "flex", alignItems: "center", padding: "0 12px" }}>
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: w - 3, height: (w - 3) * (SHOT_H / SHOT_W), overflow: "hidden", borderRadius: "0 0 16px 16px" }}>
        <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: SHOT_W, height: SHOT_H, transform: `scale(${k})`, transformOrigin: "0 0" }}>{children}</div>
      </div>
    </Glass>
  );
};

export type TermLine = { at: number; txt: string; col?: string; bold?: boolean };

/** Glass terminal whose lines type on at their LOCAL frame. */
export const Terminal: React.FC<{ title: string; lines: TermLine[]; w: number; minH?: number; size?: number; glow?: number }> = ({ title, lines, w, minH = 400, size = 25, glow = 0.4 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: w }}>
      <Glass radius={22} glow={glow} glowColor="rgba(217,119,87,0.4)" fill="rgba(12,10,9,0.96)">
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
              <div key={i} style={{ fontFamily: F.mono, fontSize: size, lineHeight: 1.65, color: l.col ?? C.text, fontWeight: l.bold ? 700 : 400, whiteSpace: "pre" }}>
                {l.txt.slice(0, typed)}
                {typed < l.txt.length ? <span style={{ background: C.coral, color: C.bg }}> </span> : null}
              </div>
            );
          })}
        </div>
      </Glass>
    </div>
  );
};
