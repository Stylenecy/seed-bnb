import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, Camera, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import type { CamKey } from "../../../kit";
import { PopBall } from "../art";
import { makeShot, RealLabel, Ring, ShotSwap } from "../shots";
import { C, CHAIN, F, SCREEN } from "../theme";
import { BAR } from "../timeline";

/**
 * S5 · THE REAL APP ON BSC TESTNET (bars 24–28) — DROP. The BINGOChain web
 * app built for chain 97, reading the live BSC-testnet proxy (arena #1 is the
 * real 2-player WBNB game from VERIFY-BNB.md; boards are the on-chain reveals):
 *   bar 24 b0  lobby, Arena #1 · Settled · 0.001 WBNB (ring b1)
 *   bar 24 b2  create page: WBNB + $LANCE allowed on BSC (ring b3)
 *   bar 25 b0  arena #1 header; b1 camera onto the two revealed boards
 *   bar 25 b1…bar 26 b1  the five real calls 1·2·3·4·5 drop onto BOTH boards, one per beat
 *   bar 26 b1  "BINGO!" (both lines complete on call #5)
 *   bar 26 b2  camera onto "YOU WON!" · +0.00099 each (rings b3)
 *   bar 27     BREAK: pull back, "IT'S A TIE!" stamp
 */
const SH = makeShot(210, 66, 1500);
// capture-pixel centres of the revealed cells (bsc-arena1-connected.png)
const P1_ROW = [631, 700, 769, 838, 906].map((x) => ({ x, y: 851 })); // 1..5
const P2_ROW = [1288, 1219, 1150, 1082, 1013].map((x) => ({ x, y: 1126 })); // 1..5 (board is reversed)

export const S5Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 24

  const callAt = [b(k + 1, 1), b(k + 1, 2), b(k + 1, 3), b(k + 2), b(k + 2, 1)];

  const cam: CamKey[] = [
    { frame: 0, x: 960, y: 540, scale: 1.0 },
    SH.cam(b(k, 1), 560, 560, 1.45, 760, 540),
    SH.cam(b(k, 2), 960, 560, 1.0, 960, 540),
    SH.cam(b(k, 3), 960, 520, 1.35, 960, 540),
    SH.cam(b(k + 1), 960, 360, 1.35, 960, 520),
    SH.cam(b(k + 1, 1), 960, 990, 1.12, 960, 560),
    SH.cam(b(k + 2, 1), 960, 990, 1.18, 960, 560),
    SH.cam(b(k + 2, 2), 960, 650, 1.55, 960, 540),
    SH.cam(b(k + 3), 960, 650, 1.6, 960, 540),
    SH.cam(b(k + 3, 2), 960, 700, 0.92, 960, 560),
    SH.cam(b(k + 4), 960, 700, 0.9, 960, 560),
  ];

  const tie = b(k + 3);
  const ball = 74 * SH.s;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(111,255,0,0.14)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.3} />
      <Halftone opacity={0.035} gap={22} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.35} shake={0} glow={false}>
          <AbsoluteFill>
            <ShotSwap
              X={SH.X}
              Y={SH.Y}
              W={SH.W}
              url="localhost:3220 · NEXT_PUBLIC_CHAIN_ID=97"
              glowColor="rgba(240,185,11,0.3)"
              shots={[
                { f: 0, src: SCREEN.bscArenas },
                { f: b(k, 2), src: SCREEN.bscCreate },
                { f: b(k + 1), src: SCREEN.bscArena },
              ]}
            />
            <Ring x={SH.pt(374, 494).x} y={SH.pt(374, 494).y} w={380 * SH.s} h={194 * SH.s} at={b(k, 1)} until={b(k, 2)} color={C.gold} />
            <Ring x={SH.pt(888, 406).x} y={SH.pt(888, 406).y} w={144 * SH.s} h={50 * SH.s} at={b(k, 3)} until={b(k + 1)} color={C.gold} r={26} />
            <Ring x={SH.pt(584, 344).x} y={SH.pt(584, 344).y} w={752 * SH.s} h={64 * SH.s} at={b(k + 1)} until={b(k + 1, 1)} color={C.gold} />
            {callAt.map((t, i) => (
              <React.Fragment key={i}>
                <PopBall at={t} x={SH.pt(P1_ROW[i]!.x, P1_ROW[i]!.y).x} y={SH.pt(P1_ROW[i]!.x, P1_ROW[i]!.y).y} size={ball} label={i + 1} drop={70} glow="rgba(111,255,0,0.8)" exitAt={b(k + 2, 2)} />
                <PopBall at={t} x={SH.pt(P2_ROW[i]!.x, P2_ROW[i]!.y).x} y={SH.pt(P2_ROW[i]!.x, P2_ROW[i]!.y).y} size={ball} label={i + 1} drop={70} glow="rgba(111,255,0,0.8)" exitAt={b(k + 2, 2)} />
              </React.Fragment>
            ))}
            <Ring x={SH.pt(586, 570).x} y={SH.pt(586, 570).y} w={750 * SH.s} h={148 * SH.s} at={b(k + 2, 3)} until={b(k + 3, 2)} color={C.neon} r={20} />
          </AbsoluteFill>
        </Pulse>
      </Camera>

      <RealLabel color={C.gold}>Real BINGOChain web · chain 97 · live BSC-testnet reads</RealLabel>
      <div style={{ position: "absolute", right: 60, top: 42 }}>
        <BnbBadge label="BSC TESTNET" at={0} size={26} live variant="dark" />
      </div>

      {/* call counter chip */}
      {frame >= callAt[0]! && frame < b(k + 2, 2) ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 60,
            padding: "14px 22px",
            borderRadius: 16,
            background: "rgba(1,8,40,0.9)",
            border: `2px solid ${C.neon}88`,
            fontFamily: F.sans,
            fontWeight: 700,
            fontSize: 30,
            color: C.text,
          }}
        >
          callNumber <span style={{ fontFamily: F.display, color: C.neon, fontSize: 40 }}>#{callAt.filter((t) => frame >= t).length}</span> of 5 · on-chain
        </div>
      ) : null}

      <SpeedBurst cx={960} cy={520} from={b(k + 2, 1)} count={26} inner={220} spread={820} color={C.neon} opacity={0.55} width={8} seed="bingo" fade />
      <ComicText text="BINGO!" from={b(k + 2, 1)} x={960} y={470} size={280} rotate={-8} skewX={-8} tiltX={6} fill={C.neon} variant="onomatopoeia" echoColor={INK} burst={C.ballO} exitAt={b(k + 2, 2) + 4} />

      {frame >= tie ? <AbsoluteFill style={{ background: "rgba(1,8,40,0.35)", opacity: interpolate(frame, [tie, tie + 6], [0, 1], clamp) }} /> : null}
      <ComicText text="IT'S A TIE!" from={tie} x={960} y={420} size={170} rotate={-5} skewX={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} />
      {frame >= b(k + 3, 2) ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 560,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 6], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 8], [20, 0], clamp)}px)`,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: `5px solid ${INK}`,
              boxShadow: `8px 8px 0 ${INK}`,
              padding: "14px 26px",
              fontFamily: F.sans,
              fontWeight: 800,
              fontSize: 36,
              color: INK,
            }}
          >
            Both lines landed on call #5 → pot split: {CHAIN.smoke.prizeEach} WBNB each
          </div>
        </div>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.gold} />

      <Sfx name="impact" at={0} volume={0.8} />
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="whoosh" at={b(k, 2)} volume={0.45} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.5} />
      {callAt.map((t, i) => (
        <Sfx key={i} name="tick" at={t} volume={0.7} />
      ))}
      <Sfx name="impact" at={b(k + 2, 1)} volume={1} />
      <Sfx name="chime" at={b(k + 2, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 3)} volume={0.6} />
      <Sfx name="impact" at={tie} volume={0.8} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
