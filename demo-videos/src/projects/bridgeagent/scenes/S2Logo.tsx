import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import { BridgeMark } from "../ui";

/**
 * S2 · LOGO (bars 16–19, phrase downbeat).
 *   16 b0  mark slams + strokes on; b1–b3 "bridgeagent" types in (the page's mono wordmark)
 *   17 b0  the page's own hero line "Autonomous perps, anchored on BNB Chain." · b2 subline + streak
 *   18 b0  NOW ON BNB CHAIN badge (impact + chime) · b2 "ANCHORED!"
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.6, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const draw = interpolate(frame, [b(k), b(k, 1)], [0, 1], clamp);
  const word = "bridgeagent";
  const typed = Math.floor(interpolate(frame, [b(k, 1), b(k, 3)], [0, word.length], clamp));
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 1, 3)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(105,147,120,0.36)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={290} from={b(k)} count={26} inner={170} spread={760} color={C.gold} opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={290} from={b(k + 2)} count={14} inner={220} spread={420} color={C.mossHi} opacity={0.5} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div style={{ position: "absolute", left: 960, top: 250, transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
          <BridgeMark size={250} draw={draw} stroke={1.9} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 410, textAlign: "center", fontFamily: F.mono, fontWeight: 500, fontSize: 150, letterSpacing: "-0.02em", color: C.text, textShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(105,147,120,0.45)", whiteSpace: "pre" }}>
          {word.slice(0, typed)}
          <span style={{ opacity: typed < word.length || Math.floor(frame / 8) % 2 === 0 ? 1 : 0, color: C.moss }}>_</span>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: F.sans, fontWeight: 500, fontSize: 68, letterSpacing: "-0.02em", color: C.text, opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp), transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)` }}>
          Autonomous perps, <span style={{ fontFamily: F.serif, fontStyle: "italic", color: C.bone, fontSize: 80 }}>anchored</span> on BNB Chain.
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", fontFamily: F.mono, fontSize: 30, color: C.textMuted, opacity: interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 6], [0, 1], clamp) }}>
          ERC-8004 identity for the agent · every settled trade in a public TradeJournal
        </div>
        <div style={{ position: "absolute", left: 460, width: 1000, top: 800, height: 7, borderRadius: 8, background: `linear-gradient(90deg, ${C.moss}, ${C.gold})`, clipPath: `inset(0 ${100 - streak}% 0 0)`, boxShadow: "0 0 24px rgba(105,147,120,0.6)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 856, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text="ANCHORED!" from={b(k + 2, 2)} x={1580} y={240} size={110} rotate={9} skewX={6} fill={C.pos} variant="onomatopoeia" echoColor={INK} />

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
