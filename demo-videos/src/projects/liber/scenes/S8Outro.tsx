import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { LiberMark } from "../art";
import { C, CARD_GRADIENT, CHAIN, F } from "../theme";
import { BAR, TOTAL } from "../timeline";

/**
 * S8 · OUTRO (bar 36 → end) — rides the track's outro to silence.
 *   bar 36 b0  mark slam (hard cut)   b2 wordmark
 *   bar 37 b0  tagline                b2 emerald streak
 *   bar 38 b0  BUILT ON BNB CHAIN badge
 *   bar 39 b0  URL / repo footer → fade to ink as the music dies (bar 40)
 */
export const S8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 36

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 2)], [0, 100], clamp);
  const fadeOut = interpolate(frame, [b(k + 3, 2), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#07080a" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg glowA="rgba(47,217,138,0.22)" glowB="rgba(240,185,11,0.18)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color="#F0B90B" alt={C.bright} opacity={0.35} />
        <SpeedBurst cx={960} cy={330} from={b(k)} count={20} inner={170} spread={560} color="#F0B90B" opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 160, display: "flex", justifyContent: "center", alignItems: "center", gap: 44 }}>
            <div
              style={{
                transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`,
                opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
                borderRadius: 50,
                boxShadow: "0 0 0 5px #08090b, 10px 10px 0 5px #08090b, 0 0 80px rgba(47,217,138,0.35)",
              }}
            >
              <LiberMark size={200} />
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 210,
                color: C.text,
                opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
              }}
            >
              Liber
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 460, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 78, color: C.text, letterSpacing: "-0.01em" }}>
              Your money, <i style={{ color: C.bright }}>borderless.</i>
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 34, color: C.dim, marginTop: 10 }}>Scan any QRIS · pay from USDC · keep your keys</div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 460,
              width: 1000,
              top: 650,
              height: 8,
              borderRadius: 8,
              background: CARD_GRADIENT,
              clipPath: `inset(0 ${100 - streak}% 0 0)`,
              boxShadow: "0 0 24px rgba(47,217,138,0.5)",
            }}
          />

          <div style={{ position: "absolute", left: 0, right: 0, top: 710, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 850, textAlign: "center", ...fadeUp(frame, b(k + 3), 12, 16) }}>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 38, color: C.text }}>liber-qris.vercel.app</div>
            <div style={{ fontFamily: F.mono, fontSize: 24, color: C.dim, marginTop: 10 }}>
              seed-bnb-indo / stellar-apac · BSC Testnet (97) · MockUSDC {CHAIN.mockUsdc.slice(0, 6)}…{CHAIN.mockUsdc.slice(-4)}
            </div>
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" innerColor="#F0B90B" />
      </AbsoluteFill>

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 2)} volume={0.4} />
      <Sfx name="chime" at={b(k + 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
