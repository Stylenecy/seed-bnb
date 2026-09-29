import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { NeuralMark, PaperTag } from "../ui";

/**
 * S11 · OUTRO (bars 36–40, DROP on 36; the track's own tail 38–39, silent at 40).
 *   36 b0 mark slam · b2 wordmark
 *   37 b0 tagline · b2 streak
 *   38 b0 BUILT ON BNB CHAIN · b2 paper-mode footnote
 *   39 b0 repo footer → fade to ink from 39 b2
 */
export const S11Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 36

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 2)], [0, 100], clamp);
  const fadeOut = interpolate(frame, [b(k + 3, 2), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base={C.void} glowA="rgba(14,203,129,0.24)" glowB="rgba(240,185,11,0.12)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color={C.neon} alt={C.gold} opacity={0.35} />
        <SpeedBurst cx={960} cy={290} from={b(k)} count={20} inner={170} spread={560} color={C.neon} opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 50 }}>
            <div style={{ transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 30}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
              <NeuralMark size={200} />
            </div>
            <div
              style={{
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: 150,
                letterSpacing: "0.05em",
                lineHeight: 1,
                color: C.text,
                opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
              }}
            >
              NEURAL <span style={{ color: C.neon }}>ALPHA</span>
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 450, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 74, color: C.text }}>
              Signals in code. Risk in code. <i style={{ color: C.gold }}>Built for BNB Chain.</i>
            </div>
          </div>
          <div style={{ position: "absolute", left: 460, width: 1000, top: 574, height: 8, borderRadius: 8, background: `linear-gradient(90deg, ${C.neon}, ${C.gold}, ${C.cyan})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(14,203,129,0.6)" }} />

          <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 770, display: "flex", justifyContent: "center" }}>
            <PaperTag at={b(k + 2, 2)} size={22} label="Demo ran in PAPER MODE · live BSC reads · no keys · no real trades" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily: F.mono, fontSize: 27, color: C.text2, ...fadeUp(frame, b(k + 3), 12, 16) }}>
            seed-bnb-indo / bnbhack-winn · neural-alpha + Narrative-Alpha · BSC mainnet 56
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
