import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, Glass, Halftone, INK, PAPER } from "../../kit";
import { C, F, SHOT_H, SHOT_W } from "./theme";

/* ------------------------------------------------------------------ mark -- */

/** The four tessera diamonds (frontend/src/app/icon.svg geometry, 64-unit box). */
const TILES = [
  { pts: "32,9 43,20 32,31 21,20", fill: C.ember, dx: 0, dy: -1 },
  { pts: "44,21 55,32 44,43 33,32", fill: C.signal, dx: 1, dy: 0 },
  { pts: "32,33 43,44 32,55 21,44", fill: C.bone, dx: 0, dy: 1 },
  { pts: "20,21 31,32 20,43 9,32", fill: C.boneDim, dx: -1, dy: 0 },
];

/**
 * The Tessera mosaic mark. `tiles` = LOCAL frames at which each diamond flies in
 * (omit = all assembled). `ink` adds a comic outline.
 */
export const TesseraMark: React.FC<{ size?: number; tiles?: number[]; ink?: boolean; glow?: number }> = ({ size = 200, tiles, ink = false, glow = 1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: "block", overflow: "visible", filter: glow > 0 ? `drop-shadow(0 0 ${size * 0.08 * glow}px rgba(232,99,58,${0.45 * glow}))` : undefined }}
    >
      {TILES.map((t, i) => {
        const at = tiles?.[i];
        const p = at === undefined ? 1 : f < at ? 0 : spring({ frame: f - at, fps, config: { damping: 11, stiffness: 210, mass: 0.6 } });
        const off = (1 - p) * 40;
        return (
          <polygon
            key={i}
            points={t.pts}
            fill={t.fill}
            stroke={ink ? INK : undefined}
            strokeWidth={ink ? 1.6 : 0}
            strokeLinejoin="round"
            opacity={at !== undefined && f < at ? 0 : interpolate(p, [0, 0.25], [0, 1], clamp)}
            transform={`translate(${t.dx * off} ${t.dy * off}) rotate(${(1 - p) * 90} ${[32, 44, 32, 20][i]} ${[20, 32, 44, 32][i]})`}
          />
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ pills -- */

export const Pill: React.FC<{ color?: string; children: React.ReactNode; size?: number; dot?: boolean; style?: React.CSSProperties }> = ({
  color = C.signal,
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
export const RealTag: React.FC<{ at?: number; label: string; kind?: string; color?: string }> = ({ at = 0, label, kind = "real app", color = C.good }) => {
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
      <span style={{ fontFamily: F.mono, fontSize: 21, color: C.boneDim }}>{label}</span>
    </div>
  );
};

/** Comic rubber stamp that thunks in at LOCAL frame `at`. */
export const Stamp: React.FC<{ at: number; x: number; y: number; text: string; color?: string; size?: number; rot?: number; fill?: string }> = ({
  at,
  x,
  y,
  text,
  color = C.ember,
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
}> = ({ at, x, y, w, h, title, tab = "TERMINAL", tabColor = C.ember, lines, marks = [], size = 23, lh = 1.42, rot = -0.6, punch = 1, from = "down", prompt = "~/Tessera $", children }) => {
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
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 70% at 30% 20%, rgba(70,214,208,0.07), transparent 70%)` }} />
          <Halftone opacity={0.05} gap={14} color={C.signal} />
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 4px)" }} />
          <div style={{ position: "absolute", left: 26, top: 18, right: 20 }}>
            {lines.map((l, i) => {
              if (f < l.at) return null;
              const text = l.cmd ? l.t.slice(0, Math.round(interpolate(f, [l.at, l.at + (l.type ?? 12)], [0, l.t.length], clamp))) : l.t;
              const wipe = l.cmd ? 1 : interpolate(f, [l.at, l.at + 3], [0, 1], clamp);
              const lineMarks = marks.filter((m) => m.line === i && f >= m.at);
              return (
                <div key={i} style={{ position: "relative", height: rowH, whiteSpace: "pre", fontFamily: F.mono, fontSize: size, lineHeight: `${rowH}px`, color: l.color ?? C.bone, fontWeight: l.weight ?? (l.cmd ? 600 : 400) }}>
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
                    {l.cmd ? <span style={{ color: C.signal }}>{prompt} </span> : null}
                    {text}
                    {l === last && blink ? <span style={{ display: "inline-block", width: cw, height: size * 1.05, background: C.bone, verticalAlign: "middle", marginLeft: l.t.length ? 4 : 0, opacity: 0.85 }} /> : null}
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
    <Glass radius={18} glow={glow} glowColor="rgba(232,99,58,0.4)" fill={C.bg}>
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
      <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: size, color: C.bone }}>{name}</span>
      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: size * 0.85, color }}>{id}</span>
    </span>
  );
};
