import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F, HERO_GRAD, LOGO, VERA } from "../theme";
import { BAR } from "../timeline";

/**
 * S2 · LOGO (bars 3–5). Hard cut + flash onto the logo slam.
 *   bar 3 b0  Stax mark slams from 2.4× (impact, gold + sage bursts)
 *   bar 3 b1–b3  wordmark letters "Stax" stamp in
 *   bar 4 (break) b0 subtitle · b1 Vera orb floats in · b2 "NOW ON BNB CHAIN" · b3 "AI PICKS!"
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 2), 0.035, 5);
  const letters = ["S", "t", "a", "x"];
  const letterAt = (i: number) => b(k, 1 + Math.min(2, i));
  const vera = spring({ frame: frame - b(k + 1, 1), fps, config: { damping: 14, stiffness: 120 } });
  const streak = interpolate(frame, [b(k + 1), b(k + 1, 1)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(108,192,156,0.28)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={380} from={b(k)} count={26} inner={170} spread={760} color="#F0B90B" opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={380} from={b(k + 1, 2)} count={14} inner={220} spread={420} color={C.sage} opacity={0.45} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.7}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 300,
            width: 240,
            height: 232,
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
            filter: "drop-shadow(12px 12px 0 #08090b) drop-shadow(0 0 60px rgba(108,192,156,0.45))",
          }}
        >
          <Img src={LOGO} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", gap: 4 }}>
          {letters.map((ch, i) => {
            const p = spring({ frame: frame - letterAt(i), fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
            return (
              <span
                key={i}
                style={{
                  fontFamily: F.display,
                  fontWeight: 500,
                  fontSize: 190,
                  color: C.text,
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 60}px) scale(${0.5 + 0.5 * p})`,
                  opacity: frame < letterAt(i) ? 0 : interpolate(p, [0, 0.3], [0, 1], clamp),
                  textShadow: "0 8px 40px rgba(0,0,0,0.6)",
                  letterSpacing: "-0.02em",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 690,
            textAlign: "center",
            fontFamily: F.display,
            fontSize: 60,
            color: C.text,
            opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)`,
          }}
        >
          Tokenized stocks, <span style={{ fontStyle: "italic", color: C.sage }}>allocated by AI</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 560,
            width: 800,
            top: 782,
            height: 8,
            borderRadius: 8,
            background: HERO_GRAD,
            clipPath: `inset(0 ${100 - streak}% 0 0)`,
            boxShadow: "0 0 24px rgba(108,192,156,0.6)",
          }}
        />

        {/* Vera, the investing agent */}
        {frame >= b(k + 1, 1) ? (
          <div
            style={{
              position: "absolute",
              left: 1370,
              top: 250,
              width: 180,
              height: 180,
              transform: `scale(${vera}) translateY(${Math.sin(frame / 9) * 8}px)`,
              filter: "drop-shadow(0 0 40px rgba(108,192,156,0.6))",
            }}
          >
            <Img src={VERA} style={{ width: "100%", height: "100%" }} />
            <div style={{ position: "absolute", top: 190, left: -40, right: -40, textAlign: "center", fontFamily: F.sans, fontWeight: 700, fontSize: 26, color: C.sageLight }}>
              meet Vera
            </div>
          </div>
        ) : null}

        <div style={{ position: "absolute", left: 0, right: 0, top: 850, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 1, 2)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text={"AI\nPICKS!"} from={b(k + 1, 3)} x={390} y={330} size={110} rotate={-9} skewX={-6} fill={C.sageLight} variant="onomatopoeia" echoColor={C.terracotta} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={1} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k, i)} volume={0.5} />
      ))}
      <Sfx name="chime" at={b(k + 1, 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.85} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.55} />
    </AbsoluteFill>
  );
};
