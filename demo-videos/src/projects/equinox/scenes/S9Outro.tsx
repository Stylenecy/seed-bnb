import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { BRAND_GRADIENT, C, CHAIN, F, short } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { EqxMark } from "../ui";

/**
 * S9 · OUTRO (bar 36 → end) — rides the track's outro to silence.
 *   bar 36 b0  mark slam (draws on)      b2 wordmark
 *   bar 37 b0  tagline                   b2 brand streak
 *   bar 38 b0  BUILT ON BNB CHAIN badge
 *   bar 39 b0  repo / network footer     → fade to ink as the music dies (bar 40)
 */
export const S9Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 36

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const draw = interpolate(frame, [b(k), b(k, 2)], [0, 1], clamp);
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 2)], [0, 100], clamp);
  const fadeOut = interpolate(frame, [b(k + 3, 2), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#07080a" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg glowA="rgba(145,129,245,0.24)" glowB="rgba(228,243,61,0.12)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="outro" color="#F0B90B" alt={C.lime} opacity={0.35} />
        <SpeedBurst cx={960} cy={330} from={b(k)} count={20} inner={170} spread={560} color="#F0B90B" opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 44 }}>
            <div style={{ transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
              <EqxMark size={190} draw={draw} />
            </div>
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 160,
                letterSpacing: "-0.02em",
                color: C.text,
                opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
              }}
            >
              <span style={{ fontWeight: 500 }}>Equinox</span> <span style={{ fontWeight: 300, color: C.textMuted }}>Agent</span>
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 460, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 72, color: C.text, letterSpacing: "-0.01em" }}>
              Deposit once. <i style={{ color: C.lime }}>The agent borrows, logs and defends.</i>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 460,
              width: 1000,
              top: 578,
              height: 8,
              borderRadius: 8,
              background: BRAND_GRADIENT,
              clipPath: `inset(0 ${100 - streak}% 0 0)`,
              boxShadow: "0 0 24px rgba(145,129,245,0.6)",
            }}
          />

          <div style={{ position: "absolute", left: 0, right: 0, top: 670, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: C.textMuted, ...fadeUp(frame, b(k + 3), 12, 16) }}>
            seed-bnb-indo / Equinox-agent · BSC Testnet (chainId 97) · EquinoxVaults {short(CHAIN.vaults)}
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
