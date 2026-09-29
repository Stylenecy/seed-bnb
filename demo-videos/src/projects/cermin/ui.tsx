import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbMark, clamp, Glass } from "../../kit";
import { C, F, short } from "./theme";

/**
 * A rectangular crop (sx, sy, sw, sh in screenshot px) of a real capture,
 * rendered `w` px wide. Used to lift single dashboard cards out of the
 * 1920×1200 desktop captures without re-rendering any UI.
 */
export const CropShot: React.FC<{
  src: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  w: number;
  srcW?: number;
  radius?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ src, sx, sy, sw, sh, w, srcW = 1920, radius = 26, style, children }) => {
  const k = w / sw;
  return (
    <div style={{ position: "relative", width: w, height: sh * k, overflow: "hidden", borderRadius: radius, ...style }}>
      <Img src={src} style={{ position: "absolute", left: -sx * k, top: -sy * k, width: srcW * k }} />
      {children}
    </div>
  );
};

/** Dashboard hero-card crop boxes (captures from scripts/cermin/live.mjs). */
export const HERO = { sx: 298, sy: 344, sw: 1324, sh: 279 } as const;
export const HERO_DIP = { sx: 298, sy: 313, sw: 1324, sh: 279 } as const;
export const CARDS = { sx: 296, sy: 358, sw: 1326, sh: 414 } as const;
export const ACTIVITY = { sx: 298, sy: 480, sw: 1324, sh: 404 } as const;

/** Small tx pill: BNB mark + label + short hash + ✓ — REAL hashes only. */
export const TxChip: React.FC<{ label: string; hash: string; at: number; style?: React.CSSProperties; tone?: string }> = ({
  label,
  hash,
  at,
  style,
  tone = "#F0B90B",
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 220, mass: 0.6 } });
  return (
    <div
      style={{
        display: "inline-flex",
        transform: `translateY(${(1 - p) * 26}px) scale(${0.85 + 0.15 * p})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        ...style,
      }}
    >
      <Glass radius={999} glow={0.3} glowColor="rgba(240,185,11,0.3)" fill="rgba(20,16,12,0.9)" innerStyle={{ padding: "12px 22px 12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, whiteSpace: "nowrap" }}>
          <BnbMark size={30} />
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 24, color: tone }}>{label}</span>
          <span style={{ fontFamily: F.mono, fontSize: 22, color: C.text }}>{short(hash, 10, 6)}</span>
          <span
            style={{
              fontFamily: F.sans,
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "0.1em",
              color: "#34C759",
              border: "1px solid rgba(52,199,89,0.5)",
              background: "rgba(52,199,89,0.12)",
              borderRadius: 8,
              padding: "4px 10px",
            }}
          >
            ✓ BSC TESTNET
          </span>
        </div>
      </Glass>
    </div>
  );
};

/** Kicker + serif headline + sub, the copy column used next to real screens. */
export const Copy: React.FC<{ kicker: string; head: React.ReactNode; sub?: React.ReactNode; style?: React.CSSProperties }> = ({
  kicker,
  head,
  sub,
  style,
}) => (
  <div style={style}>
    <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 22, letterSpacing: "0.22em", textTransform: "uppercase", color: C.amberHi }}>{kicker}</div>
    <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 80, lineHeight: 1.03, color: C.text, marginTop: 14, letterSpacing: "-0.015em" }}>{head}</div>
    {sub ? <div style={{ fontFamily: F.sans, fontSize: 30, color: C.textDim, marginTop: 20, lineHeight: 1.35 }}>{sub}</div> : null}
  </div>
);

/** "REAL APP" provenance tag for screen captures. */
export const RealTag: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      fontFamily: F.mono,
      fontSize: 19,
      color: "rgba(244,237,226,0.75)",
      background: "rgba(20,16,12,0.72)",
      border: "1px solid rgba(232,201,154,0.28)",
      borderRadius: 999,
      padding: "8px 16px",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <span style={{ width: 9, height: 9, borderRadius: 99, background: "#34C759", boxShadow: "0 0 10px #34C759" }} />
    {children}
  </div>
);
