import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BNB_GOLD, clamp, CoinDot, ComicPanel, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock, Wallet } from "../../../kit";
import { AppTile, FlyCoin, LanceCoin, PoolTank } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S4 · HOW THE HUB WORKS (bars 10–13). Whips in on the bar-10 downbeat.
 * Four comic steps around one shared pool, two per bar (b0 + b2):
 *   bar 10  1 DEPOSIT (WBNB in, $LANCE minted at NAV) · 2 USE (stake/pay in the apps)
 *   bar 11  (lift) 3 FUND POOL (ecosystem revenue in, no mint) · 4 REDEEM (1% fee stays)
 *   bar 12  "ONE POOL. EVERY APP." slams on b0; b2 "same contract on Celo + BNB Chain"
 */
const PW = 410;
const PH = 590;
const XS = [70, 525, 985, 1440];
const PY = 262;

type Step = { n: string; title: string; body: string; at: number; bg: string; bg2: string; art: (f: number) => React.ReactNode };

export const S4HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 10

  const punch = [useBeatPunch(beatsIn(k, k + 1), 0.025, 5), useBeatPunch(beatsIn(k + 1, k + 2), 0.03, 5)];
  const fin = b(k + 2);
  const dim = interpolate(frame, [fin, fin + 6], [0, 1], clamp);

  const steps: Step[] = [
    {
      n: "1",
      title: "DEPOSIT",
      body: "WBNB in → $LANCE minted at the current NAV",
      at: b(k),
      bg: "#fff1b8",
      bg2: BNB_GOLD,
      art: (f) => (
        <>
          <Wallet x={110} y={120} s={0.8} />
          <PoolTank x={300} y={140} s={0.55} level={0.35 + 0.1 * interpolate(f, [b(k, 0.5), b(k, 1.5)], [0, 1], clamp)} t={f} />
          <g>
            <CoinDot cx={interpolate(f, [b(k, 0.5), b(k, 1)], [150, 290], clamp)} cy={interpolate(f, [b(k, 0.5), b(k, 1)], [100, 70], clamp)} r={22} label="B" opacity={f < b(k, 1) + 4 ? 1 : 0} />
          </g>
          {f >= b(k, 1) ? <LanceCoin x={210} y={240} r={34} /> : null}
        </>
      ),
    },
    {
      n: "2",
      title: "USE IT",
      body: "stake in Bingo arenas · pay Claudelance bounties",
      at: b(k, 2),
      bg: "#dcffc4",
      bg2: "#4fb80a",
      art: (f) => (
        <>
          <AppTile kind="work" x={110} y={150} s={0.62} />
          <AppTile kind="play" x={300} y={150} s={0.62} />
          <LanceCoin x={205} y={interpolate(f, [b(k, 2), b(k, 3)], [40, 70], clamp) + Math.sin(f / 5) * 5} r={30} />
        </>
      ),
    },
    {
      n: "3",
      title: "FUND POOL",
      body: "ecosystem revenue flows in · no new $LANCE minted",
      at: b(k + 1),
      bg: "#ffd9c4",
      bg2: C.clay,
      art: (f) => (
        <>
          <PoolTank x={205} y={150} s={0.62} level={0.4 + 0.14 * interpolate(f, [b(k + 1, 0.5), b(k + 1, 1.5)], [0, 1], clamp)} t={f} />
          {[0, 1, 2].map((i) => (
            <CoinDot key={i} cx={130 + i * 75} cy={interpolate(f, [b(k + 1, 0.4 + i * 0.3), b(k + 1, 0.9 + i * 0.3)], [-10, 120], clamp)} r={18} label="B" opacity={f < b(k + 1, 0.9 + i * 0.3) ? 1 : 0} />
          ))}
        </>
      ),
    },
    {
      n: "4",
      title: "REDEEM",
      body: "$LANCE → WBNB at NAV · 1% fee stays in the pool",
      at: b(k + 1, 2),
      bg: "#cfe8ff",
      bg2: "#3d8bff",
      art: (f) => (
        <>
          <PoolTank x={110} y={150} s={0.55} level={0.5} t={f} />
          <Wallet x={310} y={150} s={0.8} />
          {f >= b(k + 1, 2) && f < b(k + 1, 3) + 4 ? (
            <CoinDot cx={interpolate(f, [b(k + 1, 2.4), b(k + 1, 3)], [150, 290], clamp)} cy={interpolate(f, [b(k + 1, 2.4), b(k + 1, 3)], [70, 110], clamp)} r={22} label="B" />
          ) : null}
        </>
      ),
    },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(228,116,68,0.2)" glowB="rgba(240,185,11,0.14)" glow="top" floor={0.4} />
      <Halftone opacity={0.05} gap={20} />

      <AbsoluteFill style={{ filter: `saturate(${1 - 0.4 * dim})` }}>
        <Pulse intensity={0.9} shake={0.3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: "0.24em", color: C.clay, ...fadeUp(frame, 0, 10, 20) }}>HOW THE HUB WORKS</div>
            <div style={{ fontFamily: F.display, fontSize: 64, color: C.text, marginTop: 6, ...fadeUp(frame, 3, 12, 26) }}>
              One pool. Transparent rate: <span style={{ color: C.emerald, fontFamily: F.mono, fontSize: 52 }}>NAV = pool ÷ supply</span>
            </div>
          </div>

          {steps.map((s, i) => (
            <ComicPanel key={s.n} at={s.at} x={XS[i]!} y={PY + (i % 2 ? 16 : 0)} w={PW} h={PH} rot={[-1.4, 1.1, -0.9, 1.3][i]} bg={s.bg} bg2={s.bg2} from={(["left", "down", "up", "right"] as const)[i]} punch={punch[Math.floor(i / 2)]}>
              <div style={{ padding: "22px 26px 0", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 54, height: 54, borderRadius: 99, background: INK, color: "#fff", fontFamily: F.comic, fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</div>
                <div style={{ fontFamily: F.comic, fontSize: 50, color: INK, letterSpacing: "0.03em" }}>{s.title}</div>
              </div>
              <svg width={PW} height={360} viewBox={`0 0 ${PW} 360`} style={{ display: "block" }}>
                <g transform="translate(0 20) scale(1.0)">{s.art(frame)}</g>
              </svg>
              <div style={{ padding: "0 26px", fontFamily: F.sans, fontWeight: 700, fontSize: 27, lineHeight: 1.25, color: INK }}>{s.body}</div>
            </ComicPanel>
          ))}
        </Pulse>
      </AbsoluteFill>

      {/* coins flying into the centre on the finale */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3].map((i) => (
          <FlyCoin key={i} at={fin + i * 2} dur={12} x1={XS[i]! + PW / 2} y1={PY + PH / 2} x2={960} y2={520} r={30} />
        ))}
      </svg>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(14,12,11,0.85), rgba(14,12,11,0.45))", opacity: dim }} />
      <SpeedBurst cx={960} cy={520} from={fin} count={24} inner={260} spread={760} color={C.clay} opacity={0.5} width={7} seed="onepool" />
      <ComicText text="ONE POOL. EVERY APP." from={fin} x={960} y={500} size={170} rotate={-5} skewX={-6} fill={C.clay} variant="onomatopoeia" echoColor={C.gold} burst={C.gold} />
      <ComicText text="Same contract source on Celo and BNB Chain" from={b(k + 2, 2)} x={960} y={760} size={64} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={4} opacity={0.7} color="#f4efe4" innerColor={C.clay} />

      {steps.map((s) => (
        <Sfx key={s.n} name="impact" at={s.at} volume={0.6} />
      ))}
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.5} />
      <Sfx name="impact" at={fin} volume={1} />
      <Sfx name="chime" at={fin} volume={0.5} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
