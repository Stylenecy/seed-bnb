import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BnbBadge,
  clamp,
  DriftDots,
  fadeUp,
  Halftone,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  useSceneClock,
} from "../../../kit";
import { C, CARD_GRADIENT, F, LOGO } from "../theme";
import { BAR, TOTAL } from "../timeline";

/**
 * S8 · OUTRO (bar 36 → end) — rides the track's outro to silence.
 *   bar 36 b0  logo slam (hard cut)     b2 wordmark
 *   bar 37 b0  tagline                  b2 pay-card streak
 *   bar 38 b0  BUILT ON BNB CHAIN badge (outro tail)
 *   bar 39 b0  repo / network footer    → fade to ink as the music dies (bar 40)
 */
export const S8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 36

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 2)], [0, 100], clamp);
  const endLocal = TOTAL - start;
  const fadeOut = interpolate(frame, [b(k + 3, 2), endLocal], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#07080a" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg glowA="rgba(240,185,11,0.2)" glowB="rgba(232,69,126,0.18)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color="#F0B90B" alt={C.pink} opacity={0.35} />
        <SpeedBurst cx={960} cy={360} from={b(k)} count={20} inner={170} spread={560} color="#F0B90B" opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <div
              style={{
                width: 190,
                height: 190,
                borderRadius: 48,
                background: "#fff",
                padding: 8,
                transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`,
                opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
                boxShadow: "0 0 0 5px #08090b, 10px 10px 0 5px #08090b, 0 0 80px rgba(240,185,11,0.3)",
              }}
            >
              <Img src={LOGO} style={{ width: "100%", height: "100%" }} />
            </div>
            <div
              style={{
                fontFamily: F.sans,
                fontWeight: 300,
                fontSize: 170,
                letterSpacing: "0.04em",
                color: C.text,
                opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
              }}
            >
              iUSD pay
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 76, color: C.text, letterSpacing: "-0.01em" }}>
              Send USDT like a text. <i style={{ color: C.yellow }}>They never need gas.</i>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 460,
              width: 1000,
              top: 590,
              height: 8,
              borderRadius: 8,
              background: CARD_GRADIENT,
              clipPath: `inset(0 ${100 - streak}% 0 0)`,
              boxShadow: "0 0 24px rgba(236,211,94,0.5)",
            }}
          />

          <div style={{ position: "absolute", left: 0, right: 0, top: 680, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 830,
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: 28,
              color: C.textDim,
              ...fadeUp(frame, b(k + 3), 12, 16),
            }}
          >
            seed-bnb-indo / iusd-payment · BSC Testnet (chainId 97) · IPayPool 0xa2Ae…A34F
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
