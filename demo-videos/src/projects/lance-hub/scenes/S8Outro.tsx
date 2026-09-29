import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { AppTile, HubMark, LanceCoin, usePop } from "../art";
import { C, CELO, CHAIN, F } from "../theme";
import { CeloPill } from "../ui";
import { BAR, TOTAL } from "../timeline";

/**
 * S8 · OUTRO (bars 19 → end). DROP: hard cut.
 *   bar 19  b0 hub mark slams · b1 Claudelance tile + arrow · b2 BingoChain tile + arrow · b3 wordmark
 *   bar 20  b0 tagline · b1 LIVE ON CELO · b2 NOW ON BNB CHAIN · b3 addresses
 *   bar 21  b0 honesty line; the lockup holds, fade from bar 21 b2 to the end of the file
 * Orbiting coins tick round the hub on every beat.
 */
export const S8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn, start } = useSceneClock();
  const k = BAR.outro; // 19

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const punch = useBeatPunch(beatsIn(k, k + 2), 0.03, 5);
  const endLocal = TOTAL - start;
  const fade = interpolate(frame, [b(k + 2, 2), endLocal], [0, 1], clamp);
  const beatsSoFar = beatsIn(k, k + 4).filter((t) => frame >= t).length;
  const orbit = frame * 0.8 + beatsSoFar * 12;
  const tL = usePop(b(k, 1));
  const tR = usePop(b(k, 2));
  const word = usePop(b(k, 3));
  const celo = usePop(b(k + 1, 1));
  const bnb = usePop(b(k + 1, 2));

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(228,116,68,0.22)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.5} />
      <Halftone opacity={0.05} gap={20} mask="radial-gradient(ellipse at center, transparent 35%, black 85%)" />
      <SpeedBurst cx={960} cy={260} from={b(k)} count={24} inner={170} spread={760} color={C.clay} opacity={0.35} width={6} seed="outro" fade />

      <Pulse intensity={1.0} shake={0.3}>
        <div style={{ transform: `scale(${punch})`, position: "absolute", inset: 0 }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {/* orbiting coins */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = ((orbit + i * 60) * Math.PI) / 180;
              return frame >= b(k) + 6 ? <LanceCoin key={i} x={960 + Math.cos(a) * 190} y={260 + Math.sin(a) * 120} r={20} opacity={0.9} /> : null;
            })}
            <g style={{ ...tL.style, transformOrigin: "470px 260px", transformBox: "view-box" }}>
              <AppTile kind="work" x={470} y={260} s={0.85} label="CLAUDELANCE" />
            </g>
            <g style={{ ...tR.style, transformOrigin: "1450px 260px", transformBox: "view-box" }}>
              <AppTile kind="play" x={1450} y={260} s={0.85} label="BINGOCHAIN" />
            </g>
            <InkArrow x1={575} y1={260} x2={820} y2={260} at={b(k, 1)} color={C.clay} width={9} bend={-30} />
            <InkArrow x1={1345} y1={260} x2={1100} y2={260} at={b(k, 2)} color={C.neon} width={9} bend={-30} />
          </svg>

          <div
            style={{
              position: "absolute",
              left: 960,
              top: 260,
              transform: `translate(-50%, -50%) scale(${interpolate(slam, [0, 1], [2.2, 1])}) rotate(${(1 - slam) * 12}deg)`,
              opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
            }}
          >
            <HubMark size={200} spin={frame * 0.8} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 430,
              textAlign: "center",
              fontFamily: F.brand,
              fontWeight: 700,
              fontSize: 150,
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
              top: 610,
              textAlign: "center",
              fontFamily: F.display,
              fontStyle: "italic",
              fontSize: 54,
              color: C.claySoft,
              opacity: interpolate(frame, [b(k + 1), b(k + 1) + 8], [0, 1], clamp),
            }}
          >
            One shared pool for the whole ecosystem.
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 715, display: "flex", justifyContent: "center", alignItems: "center", gap: 36 }}>
            <div style={celo.style}>
              <CeloPill label="LIVE ON CELO" size={34} />
            </div>
            <div style={bnb.style}>
              <BnbBadge label="NOW ON BNB CHAIN" size={36} variant="comic" />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 850,
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: 28,
              color: C.textDim,
              opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 8], [0, 1], clamp),
            }}
          >
            Celo {CELO.proxy.slice(0, 6)}…{CELO.proxy.slice(-4)} <span style={{ color: C.clay }}>·</span> BSC testnet {CHAIN.proxy.slice(0, 6)}…{CHAIN.proxy.slice(-4)}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 915,
              textAlign: "center",
              fontFamily: F.sans,
              fontSize: 22,
              letterSpacing: "0.08em",
              color: "rgba(239,236,231,0.55)",
              opacity: interpolate(frame, [b(k + 2), b(k + 2) + 8], [0, 1], clamp),
            }}
          >
            INTERNAL ECOSYSTEM CREDIT · NOT LISTED ON ANY EXCHANGE
          </div>
        </div>
      </Pulse>

      <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" innerColor={C.clay} />
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k, 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.45} />
    </AbsoluteFill>
  );
};
