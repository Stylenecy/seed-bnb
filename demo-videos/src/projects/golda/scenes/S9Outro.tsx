import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F, short } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { GoldaMark, GoldStreak, Wordmark } from "../ui";

/**
 * S9 · OUTRO (bar 25 → end of file, 1.5 bars). Bar 25 is the file's last break.
 *   25 b0 mark slam · b1 wordmark · b2 tagline + streak · b3 BUILT ON BNB CHAIN
 *   26 b0 repo / network footer · b1 → end: fade to ink as the file ends
 */
export const S9Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 25

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const draw = interpolate(frame, [b(k), b(k, 1)], [0, 1], clamp);
  const word = spring({ frame: frame - b(k, 1), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k, 2), b(k, 3)], [0, 100], clamp);
  const fadeOut = interpolate(frame, [b(k + 1, 1), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#080705" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base={C.bg} glowA="rgba(217,174,74,0.26)" glowB="rgba(38,161,123,0.12)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="golda-outro" color={C.gold} alt="#F0B90B" opacity={0.35} />
        <SpeedBurst cx={960} cy={320} from={b(k)} count={20} inner={170} spread={560} color={C.gold} opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 44 }}>
            <div style={{ transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
              <GoldaMark size={200} draw={draw} />
            </div>
            <div style={{ opacity: frame < b(k, 1) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp), transform: `translateX(${(1 - word) * 60}px)` }}>
              <Wordmark size={150} />
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 450, textAlign: "center", ...fadeUp(frame, b(k, 2), 10, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 70, color: C.text, letterSpacing: "-0.01em" }}>
              Hold dollars. <i style={{ color: C.goldSoft }}>Hedge into gold, on-chain.</i>
            </div>
          </div>
          <GoldStreak left={460} top={570} width={1000} p={streak} />

          <div style={{ position: "absolute", left: 0, right: 0, top: 660, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k, 3)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: C.textMuted, ...fadeUp(frame, b(k + 1), 10, 16) }}>
            seed-bnb-indo / monad-Golda-finance · BSC Testnet (97) · GoldaVault {short(CHAIN.vault)}
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" innerColor="#F0B90B" />
      </AbsoluteFill>

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 1)} volume={0.4} />
      <Sfx name="chime" at={b(k, 3)} volume={0.6} />
    </AbsoluteFill>
  );
};
