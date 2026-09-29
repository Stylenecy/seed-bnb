import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { EqxMark } from "../ui";
import { BRAND_GRADIENT, C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S2 · LOGO (bars 4–7) — DROP 1.
 *   bar 4 b0  Equinox mark slams + draws on (impact); b1–b3 "Equinox" "Agent" stamp in
 *   bar 5 b0  subtitle "Agent-managed vaults with a shadow wallet"; b2 "ON WATCH 24/7!"
 *   bar 6 b0  NOW ON BNB CHAIN badge (impact) + brand-gradient streak
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const draw = interpolate(frame, [b(k), b(k, 1)], [0, 1], clamp);
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const words = [
    { t: "Equinox", at: b(k, 1), c: C.text, w: 500 },
    { t: "Agent", at: b(k, 2), c: C.textMuted, w: 300 },
  ];
  const streak = interpolate(frame, [b(k + 2), b(k + 2, 2)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(145,129,245,0.28)" glowB="rgba(228,243,61,0.14)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={330} from={b(k)} count={26} inner={170} spread={760} color="#F0B90B" opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={330} from={b(k + 2)} count={14} inner={220} spread={420} color={C.violet} opacity={0.5} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 300,
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
          }}
        >
          <EqxMark size={250} draw={draw} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 450, display: "flex", justifyContent: "center", gap: 40 }}>
          {words.map((w) => {
            const p = spring({ frame: frame - w.at, fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
            return (
              <span
                key={w.t}
                style={{
                  fontFamily: F.sans,
                  fontWeight: w.w,
                  fontSize: 160,
                  letterSpacing: "-0.02em",
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
            fontSize: 58,
            color: C.text,
            opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)`,
          }}
        >
          Agent-managed vaults <span style={{ fontStyle: "italic", color: C.lime }}>with a shadow wallet</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 560,
            width: 800,
            top: 762,
            height: 8,
            borderRadius: 8,
            background: BRAND_GRADIENT,
            clipPath: `inset(0 ${100 - streak}% 0 0)`,
            boxShadow: "0 0 24px rgba(145,129,245,0.6)",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text={"ON WATCH\n24/7!"} from={b(k + 1, 2)} x={1570} y={250} size={92} rotate={9} skewX={6} fill={C.lime} variant="onomatopoeia" echoColor={C.violet} exitAt={b(k + 2, 3)} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="impact" at={b(k + 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 2)} volume={0.5} />
    </AbsoluteFill>
  );
};

