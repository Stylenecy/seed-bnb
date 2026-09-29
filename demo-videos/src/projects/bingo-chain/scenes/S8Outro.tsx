import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { PopBall } from "../art";
import { C, F, LOGO } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { CeloPill } from "./S2Logo";

/**
 * S8 · OUTRO (bars 36–40). Logo + wordmark slam on the bar-36 downbeat, the
 * tagline on b2, chain badges on bar 37, URL on 37 b2; balls keep dropping
 * on every beat of 36–37 around the lockup; the tail (38–39) holds and fades
 * with the music.
 */
const RING = [
  { x: 260, y: 250 }, { x: 1660, y: 260 }, { x: 180, y: 820 }, { x: 1740, y: 800 },
  { x: 470, y: 120 }, { x: 1450, y: 110 }, { x: 420, y: 960 }, { x: 1500, y: 960 },
];

export const S8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn, start } = useSceneClock();
  const k = BAR.outro; // 36

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const punch = useBeatPunch(beatsIn(k, k + 2), 0.03, 5);
  const drops = beatsIn(k, k + 2);
  const endLocal = TOTAL - start;
  const fade = interpolate(frame, [b(k + 3, 2), endLocal], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(111,255,0,0.2)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.5} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 35%, black 85%)" />
      <SpeedBurst cx={960} cy={380} from={b(k)} count={24} inner={180} spread={760} color={C.neon} opacity={0.35} width={6} seed="outro" fade />

      {drops.map((t, i) => (
        <PopBall key={i} at={t} x={RING[i]!.x} y={RING[i]!.y} size={130} label={[1, 2, 3, 4, 5, 13, 21, 25][i]!} rot={(i % 3 - 1) * 12} drop={180} />
      ))}

      <Pulse intensity={1.0} shake={0.4}>
        <div style={{ transform: `scale(${punch})`, position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              left: 960,
              top: 300,
              width: 210,
              height: 210,
              transform: `translate(-50%, -50%) scale(${interpolate(slam, [0, 1], [2.2, 1])}) rotate(${(1 - slam) * 12}deg)`,
              opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
              borderRadius: 999,
              overflow: "hidden",
              boxShadow: `0 0 0 7px ${INK}, 10px 10px 0 7px ${INK}, 0 0 80px rgba(111,255,0,0.4)`,
            }}
          >
            <Img src={LOGO} style={{ width: "100%", height: "100%", display: "block" }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 420,
              textAlign: "center",
              fontFamily: F.display,
              fontSize: 170,
              lineHeight: 1,
              letterSpacing: "0.01em",
              color: C.text,
              textShadow: `6px 6px 0 ${INK}`,
              opacity: interpolate(frame, [b(k, 1), b(k, 1) + 5], [0, 1], clamp),
              transform: `scale(${interpolate(frame, [b(k, 1), b(k, 1) + 8], [1.3, 1], clamp)})`,
            }}
          >
            <span style={{ color: C.neon }}>BINGO</span>CHAIN
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 612,
              textAlign: "center",
              fontFamily: F.display,
              fontSize: 54,
              letterSpacing: "0.03em",
              color: C.text,
              opacity: interpolate(frame, [b(k, 2), b(k, 2) + 8], [0, 1], clamp),
            }}
          >
            SEAL YOUR BOARD. CALL THE <span style={{ color: C.neon }}>WINNING LINE.</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center", alignItems: "center", gap: 36 }}>
            <CeloPill at={b(k + 1)} label="LIVE ON CELO" size={34} />
            <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 1, 1)} size={36} variant="comic" />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 850,
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: 34,
              color: C.textDim,
              opacity: interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 8], [0, 1], clamp),
            }}
          >
            bingochain.vercel.app <span style={{ color: C.neon }}>·</span> BSC testnet proxy 0x5011…d110
          </div>
        </div>
      </Pulse>

      <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" innerColor={C.neon} />
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.6} />
      <Sfx name="chime" at={b(k + 1, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
