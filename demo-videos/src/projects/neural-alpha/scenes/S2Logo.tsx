import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import { ChainChip, NeuralMark } from "../ui";

/**
 * S2 · LOGO (bars 4–7, DROP on 4).
 *   4 b0      mark slam; the 8 Cpu pins light two per beat (b0..b3)
 *   5 b0      "NEURAL ALPHA" wordmark; b2 tagline; b3 sub-line
 *   6 b0      BUILT ON BNB CHAIN; chips on b1 · b2 · b3 (BSC 56 · USDT base · PAPER MODE)
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo; // 4

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 180, mass: 0.8 } });
  const word = spring({ frame: frame - b(k + 1), fps, config: { damping: 12, stiffness: 170, mass: 0.8 } });
  const markScale = useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 1, 3)], [0, 100], clamp);
  const pins = [b(k), b(k), b(k, 1), b(k, 1), b(k, 2), b(k, 2), b(k, 3), b(k, 3)];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(14,203,129,0.24)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={240} from={b(k)} count={26} inner={170} spread={760} color={C.neon} opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={240} from={b(k + 2)} count={14} inner={220} spread={420} color={C.gold} opacity={0.5} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 230,
            transform: `translate(-50%, -50%) scale(${markScale * interpolate(slam, [0, 1], [2.2, 1])}) rotate(${(1 - slam) * -25}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
          }}
        >
          <NeuralMark size={230} pins={pins} ink ring={b(k + 1)} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 380,
            textAlign: "center",
            fontFamily: F.sans,
            fontWeight: 800,
            fontSize: 168,
            letterSpacing: "0.06em",
            lineHeight: 1,
            color: C.text,
            opacity: frame < b(k + 1) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
            transform: `translateY(${(1 - word) * 60}px) scale(${0.8 + 0.2 * word})`,
            textShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(14,203,129,0.35)",
          }}
        >
          NEURAL <span style={{ color: C.neon }}>ALPHA</span>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 584, textAlign: "center", fontFamily: F.display, fontSize: 66, color: C.text, opacity: interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 6], [0, 1], clamp) }}>
          An autonomous trading agent for <i style={{ color: C.gold }}>BNB Smart Chain.</i>
        </div>
        <div style={{ position: "absolute", left: 560, width: 800, top: 676, height: 7, borderRadius: 8, background: `linear-gradient(90deg, ${C.neon}, ${C.gold}, ${C.cyan})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(14,203,129,0.6)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 702, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: C.text2, opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 6], [0, 1], clamp) }}>
          Market data → 9-factor signals → risk gate in code → BEP-20 swap
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={38} variant="comic" />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 900, display: "flex", justifyContent: "center", gap: 30 }}>
          <ChainChip at={b(k + 2, 1)} name="BSC mainnet" id={56} size={28} />
          <ChainChip at={b(k + 2, 2)} name="Base currency" id="USDT" size={28} color={C.neon} />
          <ChainChip at={b(k + 2, 3)} name="This demo" id="PAPER MODE" size={28} color={C.gold} />
        </div>
      </Pulse>

      <ComicText text="9 SIGNALS!" from={b(k + 1, 3)} x={1600} y={240} size={84} rotate={9} skewX={6} fill={C.neon} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1, 2)} volume={0.35} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 2)} volume={0.5} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k + 2, i)} volume={0.55} />
      ))}
    </AbsoluteFill>
  );
};
