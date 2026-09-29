import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { PopBall } from "../art";
import { BALL_COLORS, C, F, LOGO } from "../theme";
import { BAR } from "../timeline";

/**
 * S2 · LOGO (bars 12–15) — DROP. Hard cut + flash onto the logo slam.
 *   bar 12 b0      astronaut logo slams from 2.4× (impact, neon burst)
 *   bar 12 b1–b3,
 *   bar 13 b0–b1   B · I · N · G · O balls drop one per beat
 *   bar 13 b2      "CHAIN" stamps in; b3 tagline
 *   bar 14 b0      "LIVE ON CELO" + "NOW ON BNB CHAIN" badges; b2 "MULTICHAIN!"
 */
export const CeloPill: React.FC<{ at: number; label: string; size?: number }> = ({ at, label, size = 34 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const pulse = 0.5 + 0.5 * Math.sin((f - at) / 5);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.45,
        padding: `${size * 0.36}px ${size * 0.8}px`,
        borderRadius: 999,
        background: C.celo,
        border: `4px solid ${INK}`,
        boxShadow: `6px 6px 0 ${INK}`,
        fontFamily: F.comic,
        fontSize: size,
        letterSpacing: "0.06em",
        color: INK,
        transform: `scale(${interpolate(p, [0, 1], [0.4, 1])}) rotate(${(1 - p) * -8}deg)`,
        opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
      }}
    >
      <span style={{ width: size * 0.62, height: size * 0.62, borderRadius: 99, border: `${size * 0.14}px solid ${INK}`, display: "inline-block" }} />
      {label}
      <span style={{ width: size * 0.34, height: size * 0.34, borderRadius: 99, background: "#1f9d55", opacity: 0.55 + 0.45 * pulse, boxShadow: `0 0 12px #1f9d55` }} />
    </div>
  );
};

export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo; // 12

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.4, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.035, 5);
  const ballHits = [b(k, 1), b(k, 2), b(k, 3), b(k + 1), b(k + 1, 1)];
  const ballPunch = useBeatPunch(beatsIn(k + 1, k + 3), 0.05, 5);
  const chain = spring({ frame: frame - b(k + 1, 2), fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(111,255,0,0.2)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={250} from={b(k)} count={26} inner={140} spread={760} color={C.neon} opacity={0.4} width={7} seed="logo" fade />
      <SpeedBurst cx={960} cy={560} from={b(k + 2)} count={16} inner={260} spread={520} color={C.gold} opacity={0.45} width={6} seed="logo2" fade />

      <Pulse intensity={1.3} shake={0.8}>
        {/* logo */}
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 250,
            width: 230,
            height: 230,
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
            borderRadius: 999,
            overflow: "hidden",
            boxShadow: `0 0 0 7px ${INK}, 12px 12px 0 7px ${INK}, 0 0 90px rgba(111,255,0,0.4)`,
          }}
        >
          <Img src={LOGO} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>

        {/* B I N G O balls + CHAIN */}
        {"BINGO".split("").map((ch, i) => (
          <PopBall key={ch} at={ballHits[i]!} x={430 + i * 170} y={560} size={172} label={ch} color={BALL_COLORS[i]} rot={(i - 2) * 4} drop={220} punch={ballPunch} />
        ))}
        {frame >= b(k + 1, 2) ? (
          <div
            style={{
              position: "absolute",
              left: 1290,
              top: 470,
              fontFamily: F.display,
              fontSize: 190,
              lineHeight: 1,
              color: C.neon,
              letterSpacing: "0.01em",
              textShadow: `6px 6px 0 ${INK}, 0 0 40px rgba(111,255,0,0.45)`,
              transform: `translateX(${(1 - chain) * 160}px) scale(${0.6 + 0.4 * chain}) skewX(-6deg)`,
              opacity: interpolate(chain, [0, 0.25], [0, 1], clamp),
            }}
          >
            CHAIN
          </div>
        ) : null}

        {/* tagline */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 700,
            textAlign: "center",
            fontFamily: F.display,
            fontSize: 62,
            letterSpacing: "0.02em",
            color: C.text,
            opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 10], [24, 0], clamp)}px)`,
          }}
        >
          SEAL YOUR BOARD. CALL THE <span style={{ color: C.neon }}>WINNING LINE.</span>
          <span style={{ fontFamily: F.script, fontSize: 64, color: C.neonSoft, marginLeft: 22, letterSpacing: 0 }}>onchain bingo</span>
        </div>

        {/* chain badges */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
          <CeloPill at={b(k + 2)} label="LIVE ON CELO" size={40} />
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2, 1)} size={42} variant="comic" />
        </div>
      </Pulse>

      <ComicText text="MULTICHAIN!" from={b(k + 2, 2)} x={1560} y={190} size={100} rotate={9} skewX={6} fill={C.gold} variant="onomatopoeia" echoColor={C.neonDeep} exitAt={b(k + 3, 2)} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor={C.neon} />

      <Sfx name="impact" at={b(k)} volume={1} />
      {ballHits.slice(0, 4).map((t, i) => (
        <Sfx key={i} name="tick" at={t} volume={0.65} />
      ))}
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k + 2)} volume={0.8} />
      <Sfx name="chime" at={b(k + 2, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
