import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BnbBadge,
  clamp,
  ComicText,
  Halftone,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { C, F, LOGO } from "../theme";
import { BAR } from "../timeline";

/**
 * S2 · LOGO (bars 8–11) — the track's drop. Hard cut + flash.
 *   bar 8  b0  C-mirror mark slams on a cream tile (impact), gold burst
 *   bar 8  b1–b3  "Cermin" stamps in, two letters a beat
 *   bar 9  b0  the frontend's own headline: "Your BNB stays whole." / b2 "The Shadow is what you live on."
 *   bar 9  b2  "NEVER SELL!" onomatopoeia
 *   bar 10 b0  NOW ON BNB CHAIN badge (impact) · b2 native-BNB line
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const letters = "Cermin".split("");
  const letterAt = (i: number) => b(k, 1 + Math.min(2, Math.floor(i / 2)));
  const line = (at: number) => ({
    opacity: interpolate(frame, [at, at + 8], [0, 1], clamp),
    transform: `translateY(${interpolate(frame, [at, at + 10], [24, 0], clamp)}px)`,
  });

  return (
    <AbsoluteFill>
      <PremiumBg base="#110e0b" glowA="rgba(199,122,58,0.32)" glowB="rgba(240,185,11,0.18)" glow="center" floor={0.5} />
      <Halftone opacity={0.05} gap={20} color={C.amberHi} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={300} from={b(k)} count={26} inner={160} spread={760} color="#F0B90B" opacity={0.42} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={300} from={b(k + 2)} count={14} inner={220} spread={420} color={C.amber} opacity={0.45} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 250,
            width: 210,
            height: 210,
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
            borderRadius: 56,
            background: C.cream,
            padding: 22,
            boxShadow: "0 0 0 6px #0b0907, 12px 12px 0 6px #0b0907, 0 0 90px rgba(240,185,11,0.35)",
          }}
        >
          <Img src={LOGO} style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 370, display: "flex", justifyContent: "center", gap: 2 }}>
          {letters.map((ch, i) => {
            const p = spring({ frame: frame - letterAt(i), fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
            return (
              <span
                key={i}
                style={{
                  fontFamily: F.display,
                  fontWeight: 500,
                  fontSize: 170,
                  letterSpacing: "-0.02em",
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

        <div style={{ position: "absolute", left: 0, right: 0, top: 600, textAlign: "center", fontFamily: F.display, fontSize: 62, color: C.text, lineHeight: 1.15 }}>
          <div style={line(b(k + 1))}>
            Your BNB stays <i>whole</i>.
          </div>
          <div style={line(b(k + 1, 2))}>
            <i style={{ color: C.muted }}>The</i> <i>Shadow</i> is what you <i style={{ color: C.amber }}>live on</i>.
          </div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2)} size={42} variant="comic" />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 918, textAlign: "center", fontFamily: F.sans, fontSize: 28, color: C.textDim, ...line(b(k + 2, 2)) }}>
          Native BNB collateral · a self-driving CDP vault · BSC testnet live
        </div>
      </Pulse>

      <ComicText text={"NEVER\nSELL!"} from={b(k + 1, 2)} x={1600} y={250} size={100} rotate={9} skewX={6} fill="#F0B90B" variant="onomatopoeia" echoColor={C.amber} exitAt={b(k + 2, 3)} />

      <InkFrame inset={22} width={5} opacity={0.85} color={C.cream} innerColor="#F0B90B" />

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
