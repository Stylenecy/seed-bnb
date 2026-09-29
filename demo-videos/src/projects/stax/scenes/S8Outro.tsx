import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, F, HERO_GRAD, LOGO } from "../theme";
import { BAR, TOTAL } from "../timeline";

/**
 * S8 · OUTRO (bar 21 → end) — rides the track's last bar and a half.
 *   bar 21 b0 logo slam · b1 wordmark · b2 tagline · b3 sage streak
 *   bar 22 b0 BUILT ON BNB CHAIN + footer → fade to ink over the last 2 beats
 */
export const S8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 21

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 1), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k, 3), b(k + 1)], [0, 100], clamp);
  const endLocal = TOTAL - start;
  const fadeOut = interpolate(frame, [b(k + 1, 1), endLocal], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#07080a" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base={C.bg} glowA="rgba(108,192,156,0.24)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color="#F0B90B" alt={C.sage} opacity={0.35} />
        <SpeedBurst cx={960} cy={320} from={b(k)} count={20} inner={170} spread={560} color="#F0B90B" opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.2}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <div
              style={{
                width: 200,
                height: 194,
                transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`,
                opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
                filter: "drop-shadow(10px 10px 0 #08090b) drop-shadow(0 0 50px rgba(108,192,156,0.4))",
              }}
            >
              <Img src={LOGO} style={{ width: "100%", height: "100%" }} />
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 500,
                fontSize: 190,
                color: C.text,
                opacity: frame < b(k, 1) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
                letterSpacing: "-0.02em",
              }}
            >
              Stax
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 450, textAlign: "center", ...fadeUp(frame, b(k, 2), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 74, color: C.text, letterSpacing: "-0.01em" }}>
              Say what you want. <i style={{ color: C.sage }}>Vera invests it, on-chain.</i>
            </div>
          </div>
          <div style={{ position: "absolute", left: 460, width: 1000, top: 570, height: 8, borderRadius: 8, background: HERO_GRAD, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(108,192,156,0.6)" }} />

          <div style={{ position: "absolute", left: 0, right: 0, top: 660, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 1)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 810, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: C.textDim, ...fadeUp(frame, b(k + 1), 12, 16) }}>
            stax.best · BSC Testnet (chainId 97) · StaxExecutor 0x8d68…2bdf · Vera ERC-8004 97:2473
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" innerColor="#F0B90B" />
      </AbsoluteFill>

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 1)} volume={0.4} />
      <Sfx name="chime" at={b(k + 1)} volume={0.6} />
    </AbsoluteFill>
  );
};
