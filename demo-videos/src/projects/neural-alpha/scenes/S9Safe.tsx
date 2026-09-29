import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Sfx, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S9 · SAFETY CARD (bar 31, the break before the bar-32 drop).
 *   b0 "PAPER MODE." · b1 TWAK CLI: OFF · b2 PRIVATE KEYS: NONE · b3 REAL SWAPS SIGNED: 0
 */
const ROWS = [
  { k: "TWAK CLI", v: "OFF (TWAK_CLI=/usr/bin/false)" },
  { k: "PRIVATE KEYS", v: "NONE" },
  { k: "SWAPS SIGNED", v: "0" },
];

export const S9Safe: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.safe; // 31

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(240,185,11,0.22)" glowB="rgba(14,203,129,0.08)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <ComicText text="PAPER MODE." from={b(k)} x={960} y={330} size={230} rotate={-4} skewX={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 540, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {ROWS.map((r, i) => {
          const at = b(k, i + 1);
          const p = interpolate(frame, [at, at + 5], [0, 1], clamp);
          return (
            <div
              key={r.k}
              style={{
                display: "flex",
                gap: 28,
                alignItems: "baseline",
                padding: "12px 34px",
                background: "rgba(14,16,19,0.94)",
                border: `3px solid ${INK}`,
                outline: `2px solid ${i === 0 ? C.gold : C.neon}`,
                outlineOffset: -7,
                boxShadow: `6px 6px 0 ${INK}`,
                borderRadius: 10,
                opacity: p,
                transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
              }}
            >
              <span style={{ fontFamily: F.comic, fontSize: 52, color: C.text, letterSpacing: "0.04em" }}>{r.k}:</span>
              <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 44, color: i === 0 ? C.gold : C.neon }}>{r.v}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 28, color: C.text2, opacity: interpolate(frame, [b(k, 3), b(k, 3) + 6], [0, 1], clamp) }}>
        Real BSC data in, simulated fills out. Live trading needs your own keys + AGENT_MODE=live.
      </div>
      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k, i)} volume={0.6} />
      ))}
    </AbsoluteFill>
  );
};
