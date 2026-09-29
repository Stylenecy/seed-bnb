import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import { ZaMark } from "../ui";

/**
 * S2 · LOGO (bars 3–5).
 *   bar 3 b0  ZA mark slams + draws on (impact)   b1 "Zero"   b2 "Arena"   b3 "PROVEN!" pop
 *   bar 4     BREAK — b0 tagline   b1 "backtest qualifies · seasons prove"   b2 NOW ON BNB CHAIN
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo; // 3

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const draw = interpolate(frame, [b(k), b(k, 1)], [0, 1], clamp);
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 2), 0.035, 5);
  const words = [
    { t: "Zero", at: b(k, 1), c: C.text },
    { t: "Arena", at: b(k, 2), c: C.emerald },
  ];
  const streak = interpolate(frame, [b(k + 1), b(k + 1, 2)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(52,211,153,0.24)" glowB="rgba(167,139,250,0.18)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={300} from={b(k)} count={26} inner={170} spread={760} color={C.gold} opacity={0.4} width={7} seed="zalogo" fade />
      <SpeedBurst cx={960} cy={300} from={b(k + 1, 2)} count={14} inner={220} spread={420} color={C.violet} opacity={0.5} width={6} seed="zalogo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 280,
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
          }}
        >
          <ZaMark size={290} draw={draw} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", gap: 36 }}>
          {words.map((w) => {
            const p = spring({ frame: frame - w.at, fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
            return (
              <span
                key={w.t}
                style={{
                  fontFamily: F.sans,
                  fontWeight: 800,
                  fontSize: 168,
                  letterSpacing: "-0.04em",
                  color: w.c,
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 60}px) scale(${0.5 + 0.5 * p})`,
                  opacity: frame < w.at ? 0 : interpolate(p, [0, 0.3], [0, 1], clamp),
                  textShadow: "0 8px 40px rgba(0,0,0,0.6)",
                }}
              >
                {w.t}
              </span>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 668,
            textAlign: "center",
            fontFamily: F.display,
            fontSize: 60,
            color: C.text,
            opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)`,
          }}
        >
          The on-chain arena for <span style={{ fontStyle: "italic", color: C.emerald }}>AI trading agents</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 758,
            textAlign: "center",
            fontFamily: F.sans,
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: C.textMuted,
            opacity: interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 8], [0, 1], clamp),
          }}
        >
          Backtest qualifies you · seasons prove you
        </div>
        <div
          style={{
            position: "absolute",
            left: 560,
            width: 800,
            top: 818,
            height: 6,
            borderRadius: 8,
            background: `linear-gradient(90deg, ${C.violet}, ${C.emerald}, ${C.cyan})`,
            clipPath: `inset(0 ${100 - streak}% 0 0)`,
            boxShadow: "0 0 24px rgba(52,211,153,0.6)",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, top: 870, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 1, 2)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text={"VERIFIABLE!"} from={b(k, 3)} x={1560} y={230} size={96} rotate={9} skewX={6} fill={C.emerald} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 3)} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor={C.gold} />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k, 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
