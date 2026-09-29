import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import { DriftMark } from "../ui";

/**
 * S2 · LOGO (bars 28–31).
 *   bar 28 b0  DRIFT mark slams (impact); b1 "DRIFT" wordmark stamps in letter by letter on b1–b2
 *   bar 29 b0  "Macro-regime-aware trading agent"; b2 "…with an on-chain MacroGuard" (streak)
 *   bar 30 b0  NOW ON BNB CHAIN badge (impact + chime); b2 "GUARDED!"
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.6, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const letters = "DRIFT".split("");
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 1, 3)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(154,168,240,0.3)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={300} from={b(k)} count={26} inner={170} spread={760} color={C.gold} opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={300} from={b(k + 2)} count={14} inner={220} spread={420} color={C.peri} opacity={0.5} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div style={{ position: "absolute", left: 960, top: 270, transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
          <DriftMark size={260} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", gap: 6 }}>
          {letters.map((ch, i) => {
            const at = b(k, 1) + Math.round((i * (b(k, 3) - b(k, 1))) / letters.length);
            const p = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
            return (
              <span
                key={i}
                style={{
                  fontFamily: F.sans,
                  fontWeight: 800,
                  fontSize: 200,
                  letterSpacing: "0.04em",
                  color: C.text,
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 70}px) scale(${0.5 + 0.5 * p})`,
                  opacity: frame < at ? 0 : interpolate(p, [0, 0.3], [0, 1], clamp),
                  textShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(154,168,240,0.35)",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 668, textAlign: "center", fontFamily: F.display, fontSize: 60, color: C.text, opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp), transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)` }}>
          A macro-regime-aware trading agent{" "}
          <span style={{ fontStyle: "italic", color: C.peri, opacity: interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 6], [0, 1], clamp) }}>with an on-chain MacroGuard</span>
        </div>
        <div style={{ position: "absolute", left: 460, width: 1000, top: 762, height: 8, borderRadius: 8, background: `linear-gradient(90deg, ${C.peri}, ${C.gold})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(154,168,240,0.6)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text={"GUARDED!"} from={b(k + 2, 2)} x={1560} y={250} size={110} rotate={9} skewX={6} fill={C.peri} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="whoosh" at={b(k + 1, 2)} volume={0.35} />
      <Sfx name="impact" at={b(k + 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
