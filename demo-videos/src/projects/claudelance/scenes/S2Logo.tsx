import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F, LOGO } from "../theme";
import { BAR } from "../timeline";

/** Celo pill, same shape language as BnbBadge. */
export const CeloPill: React.FC<{ at: number; label: string; size?: number }> = ({ at, label, size = 30 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  if (f < at) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.45,
        padding: `${size * 0.42}px ${size * 0.8}px ${size * 0.42}px ${size * 0.55}px`,
        borderRadius: 8,
        background: "#1a1a06",
        border: "4px solid #08090b",
        boxShadow: `6px 6px 0 #08090b, 0 0 0 2px ${C.celo} inset`,
        transform: `scale(${0.6 + 0.4 * p})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: size * 0.9, height: size * 0.9, borderRadius: 999, background: C.celo, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: 999, border: `${size * 0.1}px solid #111` }} />
      </span>
      <span style={{ fontFamily: F.comic, fontSize: size, letterSpacing: "0.04em", color: C.celo }}>{label}</span>
      <span style={{ width: size * 0.32, height: size * 0.32, borderRadius: 99, background: C.emerald, boxShadow: `0 0 ${10 + 6 * Math.sin(f / 5)}px ${C.emerald}` }} />
    </div>
  );
};

/**
 * S2 · LOGO (bars 8–10). DROP: hard cut + flash onto the logo slam.
 *   bar 8 b0  mark slams from 2.4× · b1–b3 wordmark chunks stamp in
 *   bar 9 b0  tagline · b1 LIVE ON CELO · b2 NOW ALSO ON BNB CHAIN · b3 "WAKE UP!"
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo;

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 2), 0.035, 5);
  const chunks = ["Clau", "de", "lance"];
  const streak = interpolate(frame, [b(k + 1), b(k + 1, 1)], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(228,116,68,0.3)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={300} from={b(k)} count={26} inner={170} spread={760} color={C.clay} opacity={0.45} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={300} from={b(k + 1, 2)} count={14} inner={220} spread={420} color="#F0B90B" opacity={0.45} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.4}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 250,
            width: 230,
            height: 230,
            borderRadius: 999,
            overflow: "hidden",
            background: "#000",
            border: "6px solid #08090b",
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
            boxShadow: "12px 12px 0 #08090b, 0 0 80px rgba(228,116,68,0.55)",
          }}
        >
          <Img src={LOGO} style={{ width: "100%", height: "100%", transform: "scale(1.5)" }} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center" }}>
          {chunks.map((ch, i) => {
            const at = b(k, 1 + i);
            const p = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
            return (
              <span
                key={i}
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 176,
                  color: C.text,
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 60}px) scale(${0.5 + 0.5 * p})`,
                  opacity: frame < at ? 0 : interpolate(p, [0, 0.3], [0, 1], clamp),
                  textShadow: "0 8px 40px rgba(0,0,0,0.6)",
                  letterSpacing: "-0.04em",
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
            top: 640,
            textAlign: "center",
            fontFamily: F.display,
            fontWeight: 500,
            fontSize: 64,
            color: C.text,
            letterSpacing: "-0.02em",
            opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 1), b(k + 1) + 10], [24, 0], clamp)}px)`,
          }}
        >
          Got Claude Code? Earn while it <span style={{ fontFamily: F.serif, fontStyle: "italic", color: C.clay }}>sleeps.</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 560,
            width: 800,
            top: 738,
            height: 8,
            borderRadius: 8,
            background: `linear-gradient(90deg, ${C.celo}, ${C.clay}, ${C.gold})`,
            clipPath: `inset(0 ${100 - streak}% 0 0)`,
            boxShadow: "0 0 24px rgba(228,116,68,0.6)",
          }}
        />

        <div style={{ position: "absolute", left: 0, right: 0, top: 810, display: "flex", justifyContent: "center", gap: 40 }}>
          <CeloPill at={b(k + 1, 1)} label="LIVE ON CELO" size={40} />
          <BnbBadge label="NOW ALSO ON BNB CHAIN" at={b(k + 1, 2)} size={40} variant="comic" />
        </div>
      </Pulse>

      <ComicText text={"WAKE\nUP!"} from={b(k + 1, 3)} x={1560} y={300} size={120} rotate={9} skewX={-6} fill={C.claySoft} variant="onomatopoeia" echoColor={C.clay} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor={C.clay} />

      <Sfx name="impact" at={b(k)} volume={1} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k, i)} volume={0.5} />
      ))}
      <Sfx name="chime" at={b(k + 1)} volume={0.4} />
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.85} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.55} />
    </AbsoluteFill>
  );
};
