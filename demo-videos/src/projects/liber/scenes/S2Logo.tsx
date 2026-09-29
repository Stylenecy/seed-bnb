import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { LiberMark } from "../art";
import { C, CARD_GRADIENT, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S2 · LOGO (bars 8–11) — DROP. Hard cut + flash onto the mark slam.
 *   bar 8  b0  Liber mark slams from 2.4× (impact); b1–b3 "Liber" letters stamp in
 *   bar 9  b0  subtitle "Spend QRIS straight from USDC."; b2 "NO BANK!" onomatopoeia
 *   bar 10 b0  NOW ON BNB CHAIN badge slams (impact + chime); emerald streak sweeps
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const letters = ["L", "i", "b", "e", "r"];
  const letterAt = (i: number) => b(k, 1 + Math.min(2, Math.floor((i * 3) / 5)));
  const streak = interpolate(frame, [b(k + 2), b(k + 2, 2)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(47,217,138,0.24)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={400} from={b(k)} count={26} inner={170} spread={760} color="#F0B90B" opacity={0.42} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={400} from={b(k + 2)} count={14} inner={220} spread={420} color={C.bright} opacity={0.45} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 46 }}>
          <div
            style={{
              transform: `scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
              opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
              borderRadius: 60,
              boxShadow: "0 0 0 6px #08090b, 12px 12px 0 6px #08090b, 0 0 90px rgba(47,217,138,0.4)",
            }}
          >
            <LiberMark size={240} />
          </div>
          <div style={{ display: "flex" }}>
            {letters.map((ch, i) => {
              const p = spring({ frame: frame - letterAt(i), fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: F.display,
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: 230,
                    color: C.text,
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
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 520,
            textAlign: "center",
            fontFamily: F.display,
            fontSize: 70,
            color: C.text,
            opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)`,
          }}
        >
          Spend QRIS <span style={{ fontStyle: "italic", color: C.bright }}>straight from USDC.</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 620,
            textAlign: "center",
            fontFamily: F.sans,
            fontSize: 32,
            color: C.dim,
            opacity: interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 8], [0, 1], clamp),
          }}
        >
          A non-custodial stablecoin wallet for Indonesia
        </div>

        <div
          style={{
            position: "absolute",
            left: 560,
            width: 800,
            top: 700,
            height: 8,
            borderRadius: 8,
            background: CARD_GRADIENT,
            clipPath: `inset(0 ${100 - streak}% 0 0)`,
            boxShadow: "0 0 24px rgba(47,217,138,0.5)",
          }}
        />

        <div style={{ position: "absolute", left: 0, right: 0, top: 780, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text={"You hold\nthe keys!"} from={b(k + 1, 2)} x={1620} y={900} size={80} rotate={9} skewX={6} fill={C.gold} variant="onomatopoeia" echoColor={C.emerald} exitAt={b(k + 2, 3)} />

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
