import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { ZaMark } from "../ui";

/**
 * S9 · OUTRO (bar 21 → end, the file's last bar + 2 beats).
 *   bar 21 b0 mark slam   b1 wordmark   b2 tagline   b3 BUILT ON BNB CHAIN
 *   bar 21 b3 also the repo / network footer; bar 22 → fade to ink with the music
 */
export const S9Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 21

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const draw = interpolate(frame, [b(k), b(k, 1)], [0, 1], clamp);
  const word = spring({ frame: frame - b(k, 1), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const fadeOut = interpolate(frame, [b(k + 1), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#07080a" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg glowA="rgba(52,211,153,0.24)" glowB="rgba(167,139,250,0.16)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="zaoutro" color={C.gold} alt={C.emerald} opacity={0.35} />
        <SpeedBurst cx={960} cy={330} from={b(k)} count={20} inner={170} spread={560} color={C.gold} opacity={0.35} width={6} seed="zaout" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 44 }}>
            <div style={{ transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
              <ZaMark size={210} draw={draw} />
            </div>
            <div
              style={{
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: 160,
                letterSpacing: "-0.04em",
                color: C.text,
                opacity: frame < b(k, 1) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
              }}
            >
              Zero <span style={{ color: C.emerald }}>Arena</span>
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", ...fadeUp(frame, b(k, 2), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 70, color: C.text, letterSpacing: "-0.01em" }}>
              Build. Certify. <i style={{ color: C.emerald }}>Compete on-chain.</i>
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k, 3)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: C.textMuted, ...fadeUp(frame, b(k, 3), 10, 16) }}>
            npm i zeroarena · seed-bnb-indo / zero-arena · BSC Testnet (chainId 97)
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" innerColor={C.gold} />
      </AbsoluteFill>

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 1)} volume={0.4} />
      <Sfx name="chime" at={b(k, 3)} volume={0.6} />
    </AbsoluteFill>
  );
};
