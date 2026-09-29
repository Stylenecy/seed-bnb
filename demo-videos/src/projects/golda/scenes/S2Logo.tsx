import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import { GoldaMark, GoldStreak, Wordmark } from "../ui";

/**
 * S2 · LOGO (bars 4–6; bar 4 is the file's second break bar).
 *   bar 4 b0  ingot mark slams + ring draws on (impact) · b2 "Golda Finance" wordmark
 *   bar 5 b0  tagline "A vault that rotates dollars into gold." · b1 gold streak · b2 NOW ON BNB CHAIN · b3 "SAFE HAVEN!"
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo; // 4

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const draw = interpolate(frame, [b(k), b(k, 1)], [0, 1], clamp);
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 2), 0.035, 5);
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
  const streak = interpolate(frame, [b(k + 1, 1), b(k + 1, 2)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,174,74,0.3)" glowB="rgba(38,161,123,0.16)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={300} from={b(k)} count={26} inner={170} spread={760} color={C.gold} opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={300} from={b(k + 1, 2)} count={14} inner={220} spread={420} color="#F0B90B" opacity={0.45} width={6} seed="logo2" fade />

      <Pulse intensity={1.2} shake={0.6}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 290,
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
          }}
        >
          <GoldaMark size={270} draw={draw} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 470,
            display: "flex",
            justifyContent: "center",
            opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
            transform: `translateY(${(1 - word) * 60}px) scale(${0.6 + 0.4 * word})`,
          }}
        >
          <Wordmark size={150} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 668,
            textAlign: "center",
            fontFamily: F.display,
            fontSize: 58,
            color: C.text,
            opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)`,
          }}
        >
          A vault that rotates <span style={{ color: C.usdtSoft }}>dollars</span> into <span style={{ fontStyle: "italic", color: C.goldSoft }}>gold</span>.
        </div>
        <GoldStreak left={560} top={762} width={800} p={streak} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 1, 2)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text={"SAFE\nHAVEN!"} from={b(k + 1, 3)} x={1590} y={250} size={100} rotate={9} skewX={6} fill={C.goldSoft} variant="onomatopoeia" echoColor={C.usdt} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.6} />
    </AbsoluteFill>
  );
};
