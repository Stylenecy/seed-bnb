import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, F, MAINNET, short, TESTNET } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { GridoraMark } from "../ui";

/**
 * S9 · OUTRO (bars 36–40+, the last drop into the track's outro tail).
 *   36 b0 mark slam · b2 wordmark
 *   37 b0 tagline · b2 streak
 *   38 b0 BUILT ON BNB CHAIN · b2 URL
 *   39 b0 contract footer → fade to ink from 39 b2 to the end (the music dies at 40)
 */
export const S9Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 36

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 2)], [0, 100], clamp);
  const fadeOut = interpolate(frame, [b(k + 3, 2), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#080706" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base={C.bg} glowA="rgba(217,119,87,0.32)" glowB="rgba(240,185,11,0.12)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color={C.gold} alt={C.coralHi} opacity={0.35} />
        <SpeedBurst cx={960} cy={300} from={b(k)} count={20} inner={170} spread={560} color={C.coralHi} opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <div style={{ transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
              <GridoraMark size={230} draw={interpolate(frame, [b(k), b(k, 1) + 4], [0, 1], clamp)} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 200, letterSpacing: "-0.03em", color: C.text, opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp), transform: `translateX(${(1 - word) * 60}px)` }}>
              gridora
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 452, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 72, letterSpacing: "-0.02em", color: C.text }}>
              buy dips, sell rips, <span style={{ color: C.ink, background: C.volt, padding: "0 16px", borderRadius: 14 }}>prove every trade.</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: 460, width: 1000, top: 580, height: 7, borderRadius: 8, background: `linear-gradient(90deg, ${C.coral}, ${C.gold})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(217,119,87,0.6)" }} />

          <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: F.mono, fontWeight: 600, fontSize: 40, color: C.coralHi, ...fadeUp(frame, b(k + 2, 2), 10, 16) }}>
            gridora.vercel.app · github.com/yeheskieltame/gridora
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 850, textAlign: "center", fontFamily: F.mono, fontSize: 25, lineHeight: 1.6, color: C.textMuted, ...fadeUp(frame, b(k + 3), 12, 16) }}>
            BSC mainnet · IdentityRegistry {short(MAINNET.identity)} · TradeJournal {short(MAINNET.journal)} · StrategyLedger {short(MAINNET.ledger)}
            <br />
            BSC testnet · IdentityRegistry {short(TESTNET.identity)} · TradeJournal {short(TESTNET.journal)} · StrategyLedger {short(TESTNET.ledger)}
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color={C.cream} innerColor={C.gold} />
      </AbsoluteFill>

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 2)} volume={0.4} />
      <Sfx name="tick" at={b(k + 1)} volume={0.4} />
      <Sfx name="chime" at={b(k + 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.4} />
    </AbsoluteFill>
  );
};
