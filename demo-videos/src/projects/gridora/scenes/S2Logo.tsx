import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import { GridoraMark, VoltChip } from "../ui";

/**
 * S2 · LOGO (bars 8–11, DROP).
 *   8  b0 coral mark slams + strokes on · b1–b3 "gridora" types in (Outfit, the site's lowercase)
 *   9  b0 tagline · b2 mono subline + coral→gold streak
 *   10 b0 BUILT ON BNB CHAIN (impact + chime) · b1 3rd-place chip · b2 "ON THE RECORD!"
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo; // 8

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.6, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const draw = interpolate(frame, [b(k), b(k, 1) + 4], [0, 1], clamp);
  const word = "gridora";
  const typed = Math.floor(interpolate(frame, [b(k, 1), b(k, 3)], [0, word.length], clamp));
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 1, 3)], [0, 100], clamp);
  const chip = spring({ frame: frame - b(k + 2, 1), fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,119,87,0.36)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={270} from={b(k)} count={26} inner={170} spread={760} color={C.coralHi} opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={270} from={b(k + 2)} count={14} inner={220} spread={420} color={C.gold} opacity={0.5} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div style={{ position: "absolute", left: 960, top: 250, transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
          <GridoraMark size={270} draw={draw} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontFamily: F.display, fontWeight: 600, fontSize: 190, letterSpacing: "-0.03em", color: C.text, textShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(217,119,87,0.45)", whiteSpace: "pre", lineHeight: 1.1 }}>
          {word.slice(0, typed)}
          <span style={{ opacity: typed < word.length || Math.floor(frame / 8) % 2 === 0 ? 1 : 0, color: C.coral }}>_</span>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 628, textAlign: "center", fontFamily: F.display, fontWeight: 500, fontSize: 66, letterSpacing: "-0.02em", color: C.text, opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp), transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)` }}>
          an adaptive-grid trading agent that <span style={{ color: C.ink, background: C.volt, padding: "0 14px", borderRadius: 12 }}>proves every trade</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 730, textAlign: "center", fontFamily: F.mono, fontSize: 30, color: C.textMuted, opacity: interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 6], [0, 1], clamp) }}>
          ERC-8004 identity · config committed before it trades · every settled trade journaled
        </div>
        <div style={{ position: "absolute", left: 460, width: 1000, top: 790, height: 7, borderRadius: 8, background: `linear-gradient(90deg, ${C.coral}, ${C.gold})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(217,119,87,0.6)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 848, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
          <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={42} variant="comic" />
          {frame >= b(k + 2, 1) ? (
            <div style={{ transform: `scale(${chip})`, opacity: interpolate(chip, [0, 0.3], [0, 1], clamp) }}>
              <VoltChip size={30}>🥉 3rd place · BNB Hack: AI Trading Agent</VoltChip>
            </div>
          ) : null}
        </div>
      </Pulse>

      <ComicText text="ON THE RECORD!" from={b(k + 2, 2)} x={1560} y={210} size={100} rotate={9} skewX={6} fill={C.volt} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color={C.cream} innerColor={C.gold} />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="whoosh" at={b(k + 1, 2)} volume={0.35} />
      <Sfx name="impact" at={b(k + 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
