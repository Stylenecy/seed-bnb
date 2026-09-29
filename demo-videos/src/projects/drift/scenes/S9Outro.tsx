import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F, short } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { DriftMark } from "../ui";

/**
 * S9 · OUTRO (bars 56–60) — the music splices to the track's own outro tail
 * (file bars 68–72) and dies to silence exactly at the end.
 *   56 b0 mark slam   b2 wordmark
 *   57 b0 tagline     b2 streak
 *   58 b0 BUILT ON BNB CHAIN
 *   59 b0 repo / contract footer → fade to ink from 59 b2
 */
export const S9Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 56

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 2)], [0, 100], clamp);
  const fadeOut = interpolate(frame, [b(k + 3, 2), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#07080a" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base={C.bg} glowA="rgba(154,168,240,0.26)" glowB="rgba(240,185,11,0.12)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color={C.gold} alt={C.peri} opacity={0.35} />
        <SpeedBurst cx={960} cy={300} from={b(k)} count={20} inner={170} spread={560} color={C.gold} opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <div style={{ transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
              <DriftMark size={220} />
            </div>
            <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 190, letterSpacing: "0.04em", color: C.text, opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp), transform: `translateX(${(1 - word) * 60}px)` }}>
              DRIFT
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 70, color: C.text, letterSpacing: "-0.01em" }}>
              Test it. Trust it. Trade. <i style={{ color: C.peri }}>The guard has the last word.</i>
            </div>
          </div>
          <div style={{ position: "absolute", left: 460, width: 1000, top: 560, height: 8, borderRadius: 8, background: `linear-gradient(90deg, ${C.peri}, ${C.gold})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(154,168,240,0.6)" }} />

          <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: C.textMuted, ...fadeUp(frame, b(k + 3), 12, 16) }}>
            seed-bnb-indo / drift · BSC Testnet (chainId 97) · MacroGuard {short(CHAIN.guard)}
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
