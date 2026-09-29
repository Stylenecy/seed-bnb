import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, F, LOGO } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { CeloPill } from "./S2Logo";

/**
 * S9 · OUTRO (bars 36–40).
 *   36 b0 logo slam · b1 wordmark · b2 tagline · b3 streak
 *   37 b0 LIVE ON CELO · b1 NOW ALSO ON BNB CHAIN · b2 links
 *   38 b2 → 40 fade to ink with the music
 */
export const S9Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 36

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 1), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k, 3), b(k + 1)], [0, 100], clamp);
  const endLocal = TOTAL - start;
  const fadeOut = interpolate(frame, [b(k + 2, 2), endLocal], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#07080a" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base={C.bg} glowA="rgba(228,116,68,0.26)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color="#F0B90B" alt={C.clay} opacity={0.35} />
        <SpeedBurst cx={960} cy={300} from={b(k)} count={20} inner={170} spread={560} color={C.clay} opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.15}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 44 }}>
            <div
              style={{
                width: 190,
                height: 190,
                borderRadius: 999,
                overflow: "hidden",
                background: "#000",
                border: "5px solid #08090b",
                transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`,
                opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
                boxShadow: "10px 10px 0 #08090b, 0 0 60px rgba(228,116,68,0.5)",
              }}
            >
              <Img src={LOGO} style={{ width: "100%", height: "100%", transform: "scale(1.5)" }} />
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 170,
                color: C.text,
                opacity: frame < b(k, 1) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
                letterSpacing: "-0.045em",
              }}
            >
              Claudelance
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", ...fadeUp(frame, b(k, 2), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 72, color: C.text, letterSpacing: "-0.02em" }}>
              Idle agents, <span style={{ fontFamily: F.serif, fontStyle: "italic", color: C.clay }}>onchain payroll.</span>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 460,
              width: 1000,
              top: 540,
              height: 8,
              borderRadius: 8,
              background: `linear-gradient(90deg, ${C.celo}, ${C.clay}, ${C.gold})`,
              clipPath: `inset(0 ${100 - streak}% 0 0)`,
              boxShadow: "0 0 24px rgba(228,116,68,0.6)",
            }}
          />

          <div style={{ position: "absolute", left: 0, right: 0, top: 630, display: "flex", justifyContent: "center", gap: 40 }}>
            <CeloPill at={b(k + 1)} label="LIVE ON CELO" size={38} />
            <BnbBadge label="NOW ALSO ON BNB CHAIN" at={b(k + 1, 1)} size={38} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: C.textDim, lineHeight: 1.6, ...fadeUp(frame, b(k + 1, 2), 12, 16) }}>
            github.com/yeheskieltame/claudelance · claudelance.xyz
            <br />
            npm @yeheskieltame/claudelance-sdk · network: &apos;celo&apos; | &apos;bscTestnet&apos;
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" innerColor={C.clay} />
      </AbsoluteFill>

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 1)} volume={0.4} />
      <Sfx name="impact" at={b(k + 1)} volume={0.6} />
      <Sfx name="chime" at={b(k + 1, 1)} volume={0.6} />
    </AbsoluteFill>
  );
};
