import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BnbBadge,
  clamp,
  ComicText,
  Halftone,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { C, CARD_GRADIENT, F, LOGO } from "../theme";
import { BAR } from "../timeline";

/**
 * S2 · LOGO (bars 4–7) — DROP 1. Hard cut + flash onto the logo slam.
 *   bar 4 b0  logo slams from 2.4× with a gold speed burst (impact)
 *   bar 4 b1–b3 wordmark letters "iUSD pay" stamp in, one per beat
 *   bar 5 b0  subtitle; b2 "GAS? COVERED." onomatopoeia
 *   bar 6 b0  "NOW ON BNB CHAIN" badge slams (impact); pay-card streak sweeps
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const letters = ["i", "U", "S", "D", " ", "p", "a", "y"];
  const letterAt = (i: number) => b(k, 1 + Math.min(2, Math.floor(i / 3)));

  const streak = interpolate(frame, [b(k + 2), b(k + 2, 2)], [-40, 140], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(232,69,126,0.26)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={420} from={b(k)} count={26} inner={170} spread={760} color="#F0B90B" opacity={0.42} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={420} from={b(k + 2)} count={14} inner={220} spread={420} color={C.pink} opacity={0.45} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        {/* logo */}
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 330,
            width: 230,
            height: 230,
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
            borderRadius: 58,
            background: "#fff",
            padding: 10,
            boxShadow: "0 0 0 6px #08090b, 12px 12px 0 6px #08090b, 0 0 90px rgba(240,185,11,0.35)",
          }}
        >
          <Img src={LOGO} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>

        {/* wordmark */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center", gap: 6 }}>
          {letters.map((ch, i) => {
            const p = spring({ frame: frame - letterAt(i), fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
            return (
              <span
                key={i}
                style={{
                  fontFamily: F.sans,
                  fontWeight: 300,
                  fontSize: 150,
                  letterSpacing: "0.04em",
                  color: C.text,
                  width: ch === " " ? 44 : undefined,
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 60}px) scale(${0.5 + 0.5 * p})`,
                  opacity: frame < letterAt(i) ? 0 : interpolate(p, [0, 0.3], [0, 1], clamp),
                  textShadow: "0 8px 40px rgba(0,0,0,0.6)",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* subtitle */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 690,
            textAlign: "center",
            fontFamily: F.display,
            fontSize: 58,
            color: C.text,
            opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)`,
          }}
        >
          Stablecoin payments <span style={{ fontStyle: "italic", color: C.yellow }}>&amp; gifts</span>
        </div>

        {/* pay-card streak under the subtitle */}
        <div
          style={{
            position: "absolute",
            left: 560,
            width: 800,
            top: 778,
            height: 8,
            borderRadius: 8,
            background: CARD_GRADIENT,
            clipPath: `inset(0 ${100 - Math.max(0, Math.min(100, streak))}% 0 0)`,
            boxShadow: "0 0 24px rgba(236,211,94,0.5)",
          }}
        />

        {/* NOW ON BNB CHAIN */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 846, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text={"Zero-gas\nclaims!"} from={b(k + 1, 2)} x={1560} y={260} size={92} rotate={9} skewX={6} fill={C.yellow} variant="onomatopoeia" echoColor={C.pink} exitAt={b(k + 2, 3)} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="impact" at={b(k + 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
