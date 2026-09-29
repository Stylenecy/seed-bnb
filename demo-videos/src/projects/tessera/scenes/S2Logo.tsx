import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import { ChainChip, TesseraMark } from "../ui";

/**
 * S2 · LOGO (bars 20–23).
 *   20 b0..b3  the four tessera diamonds fly in, one per beat (impact + ticks)
 *   21 b0      "Tessera" wordmark; b2 "Evidence over narrative."
 *   21 b3      "A multi-chain address scanner + due-diligence agent"
 *   22 b0      NOW ON BNB CHAIN badge; chain chips 56 · 204 · 97 on b1 · b2 · b3
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const word = spring({ frame: frame - b(k + 1), fps, config: { damping: 12, stiffness: 170, mass: 0.8 } });
  const markScale = useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 1, 3)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(232,99,58,0.26)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={250} from={b(k)} count={26} inner={170} spread={760} color={C.gold} opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={250} from={b(k + 2)} count={14} inner={220} spread={420} color={C.signal} opacity={0.5} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div style={{ position: "absolute", left: 960, top: 230, transform: `translate(-50%, -50%) scale(${markScale})` }}>
          <TesseraMark size={250} tiles={[b(k), b(k, 1), b(k, 2), b(k, 3)]} ink />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 350,
            textAlign: "center",
            fontFamily: F.display,
            fontSize: 210,
            lineHeight: 1,
            color: C.bone,
            opacity: frame < b(k + 1) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
            transform: `translateY(${(1 - word) * 60}px) scale(${0.8 + 0.2 * word})`,
            textShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(232,99,58,0.3)",
          }}
        >
          Tessera
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 582, textAlign: "center", fontFamily: F.display, fontSize: 70, color: C.bone, opacity: interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 6], [0, 1], clamp) }}>
          Evidence over <i style={{ color: C.ember }}>narrative.</i>
        </div>
        <div style={{ position: "absolute", left: 560, width: 800, top: 672, height: 7, borderRadius: 8, background: `linear-gradient(90deg, ${C.ember}, ${C.gold}, ${C.signal})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(232,99,58,0.6)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 36, color: C.boneDim, opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 6], [0, 1], clamp) }}>
          A multi-chain address scanner + due-diligence agent
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2)} size={38} variant="comic" />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 902, display: "flex", justifyContent: "center", gap: 30 }}>
          <ChainChip at={b(k + 2, 1)} name="BNB Smart Chain" id={56} size={28} />
          <ChainChip at={b(k + 2, 2)} name="opBNB" id={204} size={28} />
          <ChainChip at={b(k + 2, 3)} name="BSC Testnet" id={97} size={28} />
        </div>
      </Pulse>

      <ComicText text="+8 MORE CHAINS!" from={b(k + 2, 3)} x={1560} y={250} size={84} rotate={9} skewX={6} fill={C.signal} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1, 2)} volume={0.35} />
      <Sfx name="impact" at={b(k + 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 2)} volume={0.5} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k + 2, i)} volume={0.55} />
      ))}
    </AbsoluteFill>
  );
};
