import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F, short } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { BridgeMark } from "../ui";

/**
 * S10 · OUTRO (bars 44–48) — the music splices to the track's own outro tail
 * (file bars 68–72) and dies to silence exactly at the end.
 *   44 b0 mark slam   b2 wordmark
 *   45 b0 tagline     b2 streak
 *   46 b0 BUILT ON BNB CHAIN
 *   47 b0 repo / contract footer → fade to ink from 47 b2
 */
export const S10Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 44

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 2)], [0, 100], clamp);
  const fadeOut = interpolate(frame, [b(k + 3, 2), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#060b08" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base={C.bg} glowA="rgba(105,147,120,0.32)" glowB="rgba(240,185,11,0.12)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color={C.gold} alt={C.mossHi} opacity={0.35} />
        <SpeedBurst cx={960} cy={300} from={b(k)} count={20} inner={170} spread={560} color={C.gold} opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 44 }}>
            <div style={{ transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
              <BridgeMark size={200} draw={interpolate(frame, [b(k), b(k, 1)], [0, 1], clamp)} stroke={1.9} />
            </div>
            <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 150, letterSpacing: "-0.02em", color: C.text, opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp), transform: `translateX(${(1 - word) * 60}px)` }}>
              bridgeagent
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 450, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 70, letterSpacing: "-0.02em", color: C.text }}>
              Verifiable agentic trading. <span style={{ fontFamily: F.serif, fontStyle: "italic", color: C.bone, fontSize: 84 }}>Receipts included.</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: 460, width: 1000, top: 580, height: 7, borderRadius: 8, background: `linear-gradient(90deg, ${C.moss}, ${C.gold})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(105,147,120,0.6)" }} />

          <div style={{ position: "absolute", left: 0, right: 0, top: 660, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", fontFamily: F.mono, fontSize: 27, color: C.textMuted, ...fadeUp(frame, b(k + 3), 12, 16) }}>
            seed-bnb-indo / BridgeAgent · BSC Testnet (chainId 97) · IdentityRegistry {short(CHAIN.registry)} · TradeJournal {short(CHAIN.journal)}
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
