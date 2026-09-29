import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { AppTile, HubMark, usePop } from "../art";
import { C, F } from "../theme";
import { CeloPill } from "../ui";
import { BAR } from "../timeline";

/**
 * S2 · LOGO (bars 6–8). Hard cut on the bar-6 downbeat.
 *   bar 6  b0 hub mark slams · b1 "LanceHub" · b2 work/play tiles plug in (ink arrows)
 *          b3 tagline "the shared pool of the ecosystem"
 *   bar 7  b0 LIVE ON CELO · b1 NOW ON BNB CHAIN · b2 "MULTICHAIN!" · b3 honesty line
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo; // 6

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const punch = useBeatPunch(beatsIn(k, k + 2), 0.035, 5);
  const spin = interpolate(frame, [0, b(k + 2)], [0, 120]);
  const word = usePop(b(k, 1));
  const tileL = usePop(b(k, 2));
  const tileR = usePop(b(k, 2) + 4);
  const celo = usePop(b(k + 1));
  const bnb = usePop(b(k + 1, 1));

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(228,116,68,0.24)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.55} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={300} from={b(k)} count={26} inner={150} spread={760} color={C.clay} opacity={0.4} width={7} seed="hub" fade />
      <SpeedBurst cx={960} cy={560} from={b(k + 1)} count={16} inner={260} spread={560} color={C.gold} opacity={0.4} width={6} seed="hub2" fade />

      <Pulse intensity={1.2} shake={0.6}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 290,
            transform: `translate(-50%, -50%) scale(${interpolate(slam, [0, 1], [2.4, 1]) * punch}) rotate(${(1 - slam) * -14}deg)`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
          }}
        >
          <HubMark size={250} spin={spin} />
        </div>

        {/* apps plugging into the hub */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g style={{ ...tileL.style, transformOrigin: "420px 290px", transformBox: "view-box" }}>
            <AppTile kind="work" x={420} y={290} s={0.9} label="CLAUDELANCE" />
          </g>
          <g style={{ ...tileR.style, transformOrigin: "1500px 290px", transformBox: "view-box" }}>
            <AppTile kind="play" x={1500} y={290} s={0.9} label="BINGOCHAIN" />
          </g>
          <InkArrow x1={530} y1={290} x2={810} y2={290} at={b(k, 2)} color={C.clay} width={10} />
          <InkArrow x1={1390} y1={290} x2={1110} y2={290} at={b(k, 2) + 4} color={C.neon} width={10} />
        </svg>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 450,
            textAlign: "center",
            fontFamily: F.brand,
            fontWeight: 700,
            fontSize: 170,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: C.text,
            textShadow: `6px 6px 0 ${INK}`,
            ...word.style,
          }}
        >
          Lance<span style={{ color: C.clay }}>Hub</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 650,
            textAlign: "center",
            fontFamily: F.display,
            fontStyle: "italic",
            fontSize: 56,
            color: C.claySoft,
            opacity: interpolate(frame, [b(k, 3), b(k, 3) + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k, 3), b(k, 3) + 10], [24, 0], clamp)}px)`,
          }}
        >
          $LANCE · the shared pool behind the ecosystem
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 780, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
          <div style={celo.style}>
            <CeloPill label="LIVE ON CELO" size={40} />
          </div>
          <div style={bnb.style}>
            <BnbBadge label="NOW ON BNB CHAIN" size={42} variant="comic" />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 930,
            textAlign: "center",
            fontFamily: F.sans,
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: "0.08em",
            color: C.textDim,
            opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 8], [0, 1], clamp),
          }}
        >
          INTERNAL ECOSYSTEM CREDIT · NOT LISTED ON ANY EXCHANGE · POOL TRANSPARENT ON-CHAIN
        </div>
      </Pulse>

      <ComicText text="MULTICHAIN!" from={b(k + 1, 2)} x={1580} y={150} size={96} rotate={8} skewX={6} fill={C.gold} variant="onomatopoeia" echoColor={C.clay} exitAt={b(k + 2) - 10} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor={C.clay} />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.75} />
      <Sfx name="chime" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.45} />
    </AbsoluteFill>
  );
};
