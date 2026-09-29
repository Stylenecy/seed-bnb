import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BnbBadge, Camera, ComicText, Cursor, fadeUp, Halftone, INK, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN } from "../theme";
import { makeShot, RealLabel, Ring, ShotSwap } from "../shots";
import { BAR } from "../timeline";

/**
 * S5 · PRODUCT ON BNB CHAIN (bars 18–24). The REAL web app (next build with
 * apps/web/.env.bsc-testnet), wallet = the VERIFY-BNB.md test worker on
 * BSC testnet (97), read-only. Two bars per screen:
 *   18–19  home: header shows "BNB Smart Chain Testnet", hero "…now also on BNB Chain"; click network (19 b3)
 *   20–21  RainbowKit chain switcher: Celo / BSC / BNB Smart Chain Testnet (Connected); click Profile (21 b3)
 *   22–23  profile assets read from chain 97: 2.98 USDT (the bounty payout)
 */
const SH = makeShot(60, 150, 1260);

export const S5Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 18

  const cam: CamKey[] = [
    { frame: 0, x: 960, y: 540, scale: 1 },
    SH.cam(b(k, 1), 1350, 60, 1.55, 700, 330),
    SH.cam(b(k, 3), 1350, 60, 1.55, 700, 330),
    SH.cam(b(k + 1), 620, 600, 1.5, 690, 560),
    SH.cam(b(k + 1, 2), 900, 300, 1.05, 690, 560),
    SH.cam(b(k + 2), 960, 600, 1.0, 690, 560),
    SH.cam(b(k + 2, 1), 960, 620, 1.6, 690, 560),
    SH.cam(b(k + 3, 2), 960, 620, 1.6, 690, 560),
    SH.cam(b(k + 4), 960, 600, 1.0, 690, 560),
    SH.cam(b(k + 4, 1), 730, 510, 1.7, 690, 540),
    SH.cam(b(k + 5), 730, 510, 1.7, 690, 540),
    SH.cam(b(k + 5, 2), 1190, 660, 1.5, 690, 560),
    SH.cam(b(k + 6), 1190, 660, 1.52, 690, 560),
  ];

  const net = SH.pt(1124, 57);
  const bscRow = SH.pt(900, 679);
  const profile = SH.pt(817, 57);
  const cursor: CursorKey[] = [
    { frame: 0, x: 900, y: 700 },
    { frame: b(k + 1, 2), x: net.x + 20, y: net.y + 30 },
    { frame: b(k + 1, 3) - 4, x: net.x + 4, y: net.y + 4, click: true, clickDelay: 4 },
    { frame: b(k + 2, 1), x: bscRow.x - 60, y: bscRow.y + 40 },
    { frame: b(k + 2, 2) - 4, x: bscRow.x, y: bscRow.y, click: true, clickDelay: 4 },
    { frame: b(k + 3, 2), x: profile.x + 30, y: profile.y + 50 },
    { frame: b(k + 3, 3) - 4, x: profile.x, y: profile.y + 4, click: true, clickDelay: 4 },
    { frame: b(k + 4, 1), x: SH.pt(760, 530).x, y: SH.pt(760, 530).y },
  ];

  const COPY: { from: number; to: number; kicker: string; head: React.ReactNode; sub: string }[] = [
    {
      from: 0,
      to: b(k + 2),
      kicker: "01 · Same app",
      head: (
        <>
          Now also on <i style={{ color: C.gold }}>BNB Chain</i>
        </>
      ),
      sub: "The live Claudelance web app, wallet connected to BNB Smart Chain Testnet.",
    },
    {
      from: b(k + 2),
      to: b(k + 4),
      kicker: "02 · One click",
      head: (
        <>
          Celo <span style={{ color: C.textDim }}>⇄</span> <i style={{ color: C.gold }}>BNB</i>
        </>
      ),
      sub: "RainbowKit chain switcher: Celo, BSC and BSC testnet. Celo stays the default.",
    },
    {
      from: b(k + 4),
      to: b(k + 6),
      kicker: "03 · Real balance",
      head: (
        <>
          <i style={{ color: C.emerald }}>2.98 USDT</i> in the wallet
        </>
      ),
      sub: "The test worker's balance, read live from chain 97: 2 → 2.98 USDT after the bounty paid out.",
    },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.18)" glowB="rgba(228,116,68,0.16)" glow="left" floor={0.4} />
      <Halftone opacity={0.04} gap={20} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.4} shake={0} glow={false}>
          <AbsoluteFill>
            <ShotSwap
              X={SH.X}
              Y={SH.Y}
              W={SH.W}
              url="claudelance · BNB Smart Chain Testnet"
              glowColor="rgba(240,185,11,0.35)"
              shots={[
                { f: 0, src: SCREEN.bscHome },
                { f: b(k + 2), src: SCREEN.bscChains },
                { f: b(k + 4), src: SCREEN.bscProfile },
              ]}
            />
            <Ring x={SH.pt(1030, 36).x} y={SH.pt(1030, 36).y} w={640 * SH.s} h={44 * SH.s} at={b(k, 2)} until={b(k + 1)} color={C.gold} r={999} />
            <Ring x={SH.pt(286, 645).x} y={SH.pt(286, 645).y} w={490 * SH.s} h={40 * SH.s} at={b(k + 1, 1)} until={b(k + 2)} color={C.gold} r={8} />
            <Ring x={SH.pt(764, 654).x} y={SH.pt(764, 654).y} w={392 * SH.s} h={52 * SH.s} at={b(k + 2, 2)} until={b(k + 4)} color={C.gold} r={10} />
            <Ring x={SH.pt(548, 472).x} y={SH.pt(548, 472).y} w={370 * SH.s} h={76 * SH.s} at={b(k + 4, 2)} until={b(k + 6)} color={C.emerald} />
            <Cursor keyframes={cursor} size={38} hideAfter={b(k + 6)} />
          </AbsoluteFill>
        </Pulse>
      </Camera>

      <RealLabel color={C.gold}>Real Claudelance app · BSC testnet (97)</RealLabel>

      <AbsoluteFill style={{ background: "linear-gradient(90deg, transparent 62%, rgba(17,15,13,0.94) 70%)" }} />
      {COPY.map((c, i) =>
        frame >= c.from && frame < c.to ? (
          <div key={i} style={{ position: "absolute", left: 1380, top: 300, width: 480, ...fadeUp(frame, c.from, 10, 30) }}>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold }}>{c.kicker}</div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 76, lineHeight: 1.02, color: C.text, marginTop: 14, letterSpacing: "-0.03em" }}>{c.head}</div>
            <div style={{ fontFamily: F.sans, fontSize: 28, color: C.textDim, marginTop: 20, lineHeight: 1.35 }}>{c.sub}</div>
          </div>
        ) : null,
      )}
      <div style={{ position: "absolute", left: 1380, top: 760 }}>
        <BnbBadge label="BSC TESTNET · 97" at={b(k, 1)} size={28} live variant="dark" />
      </div>

      <ComicText text="SWITCHED!" from={b(k + 2, 3)} x={700} y={930} size={120} rotate={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 4)} />
      <SpeedBurst cx={700} cy={900} from={b(k + 4, 2)} count={16} inner={120} spread={360} color={C.emerald} opacity={0.5} seed="usdt" fade />
      <ComicText text="+0.98 USDT!" from={b(k + 4, 2)} x={700} y={930} size={120} rotate={-5} fill={C.emerald} variant="onomatopoeia" echoColor={INK} />

      <Sfx name="tick" at={b(k, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.45} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k + 2, 3)} volume={0.7} />
      <Sfx name="tick" at={b(k + 3, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 4)} volume={0.45} />
      <Sfx name="impact" at={b(k + 4, 2)} volume={0.8} />
      <Sfx name="chime" at={b(k + 4, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
