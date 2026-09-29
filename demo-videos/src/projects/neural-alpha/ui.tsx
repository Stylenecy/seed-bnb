import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, Glass, Halftone, INK, PAPER } from "../../kit";
import { C, F, SHOT_H, SHOT_W } from "./theme";

/* ------------------------------------------------------------------ pills -- */

export const Pill: React.FC<{ color?: string; children: React.ReactNode; size?: number; dot?: boolean; style?: React.CSSProperties }> = ({
  color = C.neon,
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

/** "REAL …" tag (real app / real output). */
export const RealTag: React.FC<{ at?: number; label: string; kind?: string; color?: string }> = ({ at = 0, label, kind = "real app", color = C.neon }) => {
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
        background: "rgba(7,9,10,0.92)",
        border: `1px solid ${C.lineBright}`,
        transform: `scale(${0.7 + 0.3 * p})`,
        transformOrigin: "left center",
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
      }}
    >
      <Pill color={color} size={20}>
        {kind}
      </Pill>
      <span style={{ fontFamily: F.mono, fontSize: 21, color: C.text2 }}>{label}</span>
    </div>
  );
};

/** Comic rubber stamp that thunks in at LOCAL frame `at`. */
export const Stamp: React.FC<{ at: number; x: number; y: number; text: string; color?: string; size?: number; rot?: number; fill?: string }> = ({
  at,
  x,
  y,
  text,
  color = C.gold,
  size = 44,
  rot = -8,
  fill,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 10, stiffness: 320, mass: 0.5 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${interpolate(p, [0, 1], [2.2, 1])})`,
        opacity: interpolate(p, [0, 0.2], [0, 1], clamp),
        padding: `${size * 0.14}px ${size * 0.4}px`,
        border: `${Math.max(4, size * 0.1)}px solid ${color}`,
        borderRadius: 8,
        background: fill ?? "rgba(7,9,10,0.82)",
        boxShadow: `5px 5px 0 ${INK}`,
        fontFamily: F.comic,
        fontSize: size,
        letterSpacing: "0.04em",
        color,
        whiteSpace: "nowrap",
        lineHeight: 1.05,
      }}
    >
      {text}
    </div>
  );
};

/* -------------------------------------------------------------- terminal -- */

export type TermLine = {
  /** Text, verbatim from a real run. */
  t: string;
  /** LOCAL frame the line prints. */
  at: number;
  color?: string;
  /** Command line: typed out over `type` frames after `at` (with the prompt). */
  cmd?: boolean;
  type?: number;
  weight?: number;
};
export type TermMark = {
  /** Line index into `lines`. */
  line: number;
  at: number;
  /** Char columns [c0, c1) to highlight (default whole line). */
  c0?: number;
  c1?: number;
  color?: string;
};

/**
 * Comic-styled terminal panel: paper bezel + ink outline + hard offset shadow,
 * a Bangers tab, and an obsidian screen printing REAL output line by line on
 * beats. Highlighter marks sweep across char columns (IBM Plex Mono = 0.6em).
 */
export const ComicTerminal: React.FC<{
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  tab?: string;
  tabColor?: string;
  lines: TermLine[];
  marks?: TermMark[];
  size?: number;
  lh?: number;
  rot?: number;
  punch?: number;
  from?: "up" | "down" | "left" | "right";
  prompt?: string;
  children?: React.ReactNode;
}> = ({ at, x, y, w, h, title, tab = "TERMINAL", tabColor = C.gold, lines, marks = [], size = 23, lh = 1.42, rot = -0.6, punch = 1, from = "down", prompt = "~/neural-alpha $", children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 180, mass: 0.75 } });
  const d = 1 - p;
  const off = { up: `translateY(${-d * 240}px)`, down: `translateY(${d * 240}px)`, left: `translateX(${-d * 300}px)`, right: `translateX(${d * 300}px)` }[from];
  const cw = size * 0.6;
  const rowH = size * lh;
  const TB = 58;
  const visible = lines.filter((l) => f >= l.at);
  const last = visible[visible.length - 1];
  const blink = Math.floor(f / 8) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `${off} rotate(${rot + d * (rot >= 0 ? 5 : -5)}deg) scale(${punch})`,
        opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
      }}
    >
      <div style={{ position: "absolute", inset: 0, transform: "translate(12px, 12px)", background: INK, borderRadius: 20 }} />
      <div style={{ position: "absolute", inset: 0, background: PAPER, border: `5px solid ${INK}`, borderRadius: 20, overflow: "hidden" }}>
        {/* title bar */}
        <div style={{ height: TB, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", borderBottom: `5px solid ${INK}`, background: `linear-gradient(180deg, ${PAPER}, #dcd6c6)` }}>
          {["#ef5d5d", "#e8b23a", "#5fd1a0"].map((c) => (
            <span key={c} style={{ width: 20, height: 20, borderRadius: 99, background: c, border: `3px solid ${INK}` }} />
          ))}
          <span
            style={{
              marginLeft: 8,
              padding: "2px 14px",
              background: tabColor,
              border: `3px solid ${INK}`,
              boxShadow: `3px 3px 0 ${INK}`,
              fontFamily: F.comic,
              fontSize: 28,
              letterSpacing: "0.05em",
              color: INK,
              transform: "rotate(-2deg)",
            }}
          >
            {tab}
          </span>
          <span style={{ flex: 1, textAlign: "center", fontFamily: F.mono, fontWeight: 600, fontSize: 21, color: "#2a2f33", whiteSpace: "nowrap", overflow: "hidden" }}>{title}</span>
        </div>
        {/* screen */}
        <div style={{ position: "absolute", left: 12, right: 12, top: TB + 12, bottom: 12, borderRadius: 12, background: C.void, border: `3px solid ${INK}`, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 70% at 30% 20%, rgba(14,203,129,0.06), transparent 70%)` }} />
          <Halftone opacity={0.05} gap={14} color={C.neon} />
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 4px)" }} />
          <div style={{ position: "absolute", left: 26, top: 18, right: 20 }}>
            {lines.map((l, i) => {
              if (f < l.at) return null;
              const text = l.cmd ? l.t.slice(0, Math.round(interpolate(f, [l.at, l.at + (l.type ?? 12)], [0, l.t.length], clamp))) : l.t;
              const wipe = l.cmd ? 1 : interpolate(f, [l.at, l.at + 3], [0, 1], clamp);
              const lineMarks = marks.filter((m) => m.line === i && f >= m.at);
              return (
                <div key={i} style={{ position: "relative", height: rowH, whiteSpace: "pre", fontFamily: F.mono, fontSize: size, lineHeight: `${rowH}px`, color: l.color ?? C.text, fontWeight: l.weight ?? (l.cmd ? 600 : 400) }}>
                  {lineMarks.map((m, j) => {
                    const c0 = m.c0 ?? l.t.length - l.t.trimStart().length;
                    const c1 = m.c1 ?? l.t.length;
                    const mp = interpolate(f, [m.at, m.at + 5], [0, 1], clamp);
                    const col = m.color ?? C.gold;
                    return (
                      <div
                        key={j}
                        style={{
                          position: "absolute",
                          left: (l.cmd ? (prompt.length + 1) * cw : 0) + c0 * cw - 6,
                          top: 2,
                          height: rowH - 4,
                          width: ((c1 - c0) * cw + 12) * mp,
                          background: `${col}33`,
                          border: `2px solid ${col}`,
                          borderRadius: 6,
                          boxShadow: `0 0 18px ${col}66`,
                        }}
                      />
                    );
                  })}
                  <span style={{ position: "relative", clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, display: "inline-block" }}>
                    {l.cmd ? <span style={{ color: C.neon }}>{prompt} </span> : null}
                    {text}
                    {l === last && blink ? <span style={{ display: "inline-block", width: cw, height: size * 1.05, background: C.text, verticalAlign: "middle", marginLeft: l.t.length ? 4 : 0, opacity: 0.85 }} /> : null}
                  </span>
                </div>
              );
            })}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ shot -- */

/** A 1920×1200 capture drawn `w` px wide inside a glass browser frame. */
export const Shot: React.FC<{ src: string; w: number; url: string; glow?: number; children?: React.ReactNode }> = ({ src, w, url, glow = 0.4, children }) => {
  const barH = Math.round(w * 0.03);
  const k = (w - 3) / SHOT_W;
  return (
    <Glass radius={18} glow={glow} glowColor="rgba(14,203,129,0.35)" fill={C.surface}>
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

/** Chain chip: "BNB Smart Chain · 56". */
export const ChainChip: React.FC<{ at: number; name: string; id: number | string; color?: string; size?: number }> = ({ at, name, id, color = C.gold, size = 30 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return <span style={{ visibility: "hidden" }} />;
  const p = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 240, mass: 0.55 } });
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: `${size * 0.3}px ${size * 0.6}px`,
        background: "#15130a",
        border: `4px solid ${INK}`,
        outline: `2px solid ${color}`,
        outlineOffset: -7,
        boxShadow: `6px 6px 0 ${INK}`,
        borderRadius: 10,
        transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -10}deg)`,
        opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: size, color: C.text }}>{name}</span>
      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: size * 0.85, color }}>{id}</span>
    </span>
  );
};

/* ------------------------------------------------------------------ mark -- */

/** Lucide `Cpu` pins (24-unit box) — the dashboard header logo glyph. */
const PINS = ["M15 2v2", "M9 2v2", "M20 9h2", "M20 15h2", "M15 20v2", "M9 20v2", "M2 15h2", "M2 9h2"];

/**
 * The Neural Alpha mark, drawn from the dashboard header: a rounded neon tile
 * (bg-neon/10, border-neon/20) with the lucide Cpu glyph. `pins` = LOCAL frames
 * at which the 8 pins light up (omit = all lit). `ink` = comic outline.
 */
export const NeuralMark: React.FC<{ size?: number; pins?: number[]; ink?: boolean; glow?: number; ring?: number }> = ({ size = 200, pins, ink = false, glow = 1, ring }) => {
  const f = useCurrentFrame();
  const ringP = ring === undefined ? 0 : ((f - ring) % 60) / 60;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {ink ? <div style={{ position: "absolute", inset: 0, transform: `translate(${size * 0.05}px, ${size * 0.05}px)`, background: INK, borderRadius: size * 0.22 }} /> : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: size * 0.22,
          background: `linear-gradient(160deg, rgba(14,203,129,0.22), rgba(14,203,129,0.06) 60%), ${C.surface}`,
          border: ink ? `${Math.max(4, size * 0.035)}px solid ${INK}` : `2px solid rgba(14,203,129,0.35)`,
          boxShadow: glow > 0 ? `0 0 ${size * 0.35 * glow}px rgba(14,203,129,${0.35 * glow}), inset 0 0 ${size * 0.2}px rgba(14,203,129,0.18)` : undefined,
          outline: ink ? `2px solid rgba(14,203,129,0.5)` : undefined,
          outlineOffset: ink ? -size * 0.07 : undefined,
        }}
      />
      {ring !== undefined && f >= ring ? (
        <div style={{ position: "absolute", inset: -size * 0.2 * ringP, borderRadius: size * 0.3, border: `3px solid ${C.neon}`, opacity: 0.5 * (1 - ringP) }} />
      ) : null}
      <svg width={size} height={size} viewBox="-4 -4 32 32" style={{ position: "absolute", inset: 0, overflow: "visible", filter: `drop-shadow(0 0 ${size * 0.03}px ${C.neon})` }}>
        <g fill="none" stroke={C.neon} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect width={16} height={16} x={4} y={4} rx={2} />
          <rect width={6} height={6} x={9} y={9} rx={1} fill={pins && f < (pins[7] ?? 0) ? "none" : "rgba(14,203,129,0.35)"} />
          {PINS.map((d, i) => {
            const at = pins?.[i];
            const on = at === undefined || f >= at;
            const p = at === undefined ? 1 : interpolate(f, [at, at + 4], [0, 1], clamp);
            return <path key={i} d={d} opacity={on ? p : 0} strokeWidth={2 + (1 - p) * 2} />;
          })}
        </g>
      </svg>
    </div>
  );
};

/** Persistent honesty tag: this demo ran in PAPER mode. */
export const PaperTag: React.FC<{ at?: number; size?: number; label?: string }> = ({ at = 0, size = 20, label = "PAPER MODE · simulated fills · TWAK off · no keys" }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const o = interpolate(f, [at, at + 6], [0, 1], clamp);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.6,
        padding: `${size * 0.35}px ${size * 0.8}px`,
        borderRadius: 999,
        background: "rgba(24,18,2,0.94)",
        border: `2px solid ${C.gold}`,
        boxShadow: `0 0 22px rgba(240,185,11,0.35)`,
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.06em",
        color: C.gold,
        opacity: o,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: 3, background: C.gold, transform: "rotate(45deg)" }} />
      {label}
    </div>
  );
};
