import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  BNB_GOLD,
  Caption,
  clamp,
  CoinDot,
  ComicPanel,
  ComicText,
  Halftone,
  INK,
  InkArrow,
  InkFrame,
  Person,
  Phone,
  Pulse,
  Sfx,
  SpeechBubble,
  SpeedBurst,
  SweatDrops,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (bars 4–8, the track's intro). The original video's hook —
 * "your coins make you rich, but to spend them you usually have to sell" —
 * as a three-panel strip, one panel per bar:
 *   bar 4  "You hold BNB."              (panel slams, bubble b1, coins b2/b3)
 *   bar 5  "Rent's due. Sell it?"        (SELL tapped on b2, "?!" b3)
 *   bar 6  "Sold… then it pumps."        (chart climbs b1→b2, "+10%" b3)
 *   bar 7  soft bar — "OUCH." slams on the downbeat, question on b2.
 */
const PANEL_W = 548;
const PANEL_H = 700;
const PY = 214;
const PX = [96, 686, 1276];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k0 = BAR.hook;

  const p1 = useBeatPunch(beatsIn(k0, k0 + 1), 0.025, 5);
  const p2 = useBeatPunch(beatsIn(k0 + 1, k0 + 2), 0.025, 5);
  const p3 = useBeatPunch(beatsIn(k0 + 2, k0 + 3), 0.025, 5);

  const brk = interpolate(frame, [b(k0 + 3), b(k0 + 4)], [0, 1], clamp);
  const drain = 1 - 0.5 * interpolate(frame, [b(k0 + 3), b(k0 + 3, 1)], [0, 1], clamp);

  // Panel-3 chart draws up between b1 and b2.
  const chartT = interpolate(frame, [b(k0 + 2, 1), b(k0 + 2, 2)], [0, 1], clamp);
  const pts = [
    [60, 380],
    [130, 350],
    [190, 365],
    [260, 290],
    [330, 310],
    [400, 210],
    [470, 170],
  ];
  const n = Math.max(2, Math.ceil(chartT * pts.length));
  const poly = pts.slice(0, n).map((p) => p.join(",")).join(" ");
  const sold = frame >= b(k0 + 1, 2);

  return (
    <AbsoluteFill style={{ background: "#120f0c" }}>
      <Halftone opacity={0.07} gap={18} color={C.amberHi} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.06 * brk})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k0)} x={96} y={84} size={40} bg={C.ivory} rot={-1.2} maxWidth={900}>
            Meanwhile, in your wallet…
          </Caption>

          {/* PANEL 1 — you hold BNB */}
          <ComicPanel at={b(k0)} x={PX[0]!} y={PY} w={PANEL_W} h={PANEL_H} rot={-1.6} bg="#F7E9CB" bg2="#E8C99A" from="up" punch={p1}>
            <svg width={PANEL_W} height={PANEL_H} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}>
              <Person x={190} y={470} s={1.35} body={C.amber} mood="happy" pose="hold">
                <CoinDot cx={0} cy={-6} r={46} label="BNB" />
              </Person>
              {frame >= b(k0, 2) ? <CoinDot cx={400} cy={520} r={40} label="BNB" rotate={-10} /> : null}
              {frame >= b(k0, 3) ? <CoinDot cx={440} cy={440} r={34} label="BNB" rotate={12} /> : null}
            </svg>
            <SpeechBubble at={b(k0, 1)} x={250} y={60} w={270} h={150} tailX={30} tailY={250} size={36}>
              Never selling!
            </SpeechBubble>
            <Caption at={b(k0)} x={24} y={PANEL_H - 96} size={34} rot={0}>
              You hold BNB.
            </Caption>
          </ComicPanel>

          {/* PANEL 2 — rent is due */}
          <ComicPanel at={b(k0 + 1)} x={PX[1]!} y={PY + 16} w={PANEL_W} h={PANEL_H} rot={1.3} bg="#F4D5C0" bg2="#E8B89A" from="down" punch={p2}>
            <svg width={PANEL_W} height={PANEL_H} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}>
              {/* the bill */}
              <g transform={`translate(390 330) rotate(8)`}>
                <rect x={-80} y={-104} width={160} height={208} rx={6} fill="#fffaf0" stroke={INK} strokeWidth={6} />
                <text x={0} y={-50} textAnchor="middle" fontFamily={F.comic} fontSize={40} fill={C.danger}>
                  RENT
                </text>
                {[0, 1, 2].map((i) => (
                  <rect key={i} x={-54} y={-22 + i * 30} width={108 - i * 20} height={10} rx={4} fill="#d8cdbb" />
                ))}
                <text x={0} y={88} textAnchor="middle" fontFamily={F.comic} fontSize={34} fill={INK}>
                  DUE!
                </text>
              </g>
              <Person x={160} y={470} s={1.2} body={C.amber} mood="shock" pose="hold">
                <Phone x={0} y={-8} s={0.62} screen={sold ? C.danger : "#26211c"} label="SELL" labelColor={sold ? "#fff" : C.dangerHi} />
              </Person>
              {sold ? <SweatDrops x={226} y={250} s={1.2} /> : null}
            </svg>
            <Caption at={b(k0 + 1)} x={24} y={60} size={34} rot={-1}>
              Rent's due. Sell it?
            </Caption>
            <ComicText text="?!" from={b(k0 + 1, 3)} x={120} y={230} size={120} rotate={-10} fill={C.dangerHi} variant="onomatopoeia" echoColor={INK} />
          </ComicPanel>

          {/* PANEL 3 — sold, then it pumps */}
          <ComicPanel at={b(k0 + 2)} x={PX[2]!} y={PY - 6} w={PANEL_W} h={PANEL_H} rot={-1.1} bg="#EDE4D5" bg2="#D4A36B" from="right" punch={p3}>
            <svg width={PANEL_W} height={PANEL_H} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}>
              <polyline points={poly} fill="none" stroke={INK} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={poly} fill="none" stroke="#3fae5a" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
              {chartT >= 1 ? <InkArrow x1={400} y1={210} x2={492} y2={120} at={b(k0 + 2, 2)} dur={5} bend={-10} color="#3fae5a" width={8} /> : null}
              <Person x={150} y={560} s={1.1} body={C.amber} mood="sad" pose="slump" />
            </svg>
            <Caption at={b(k0 + 2)} x={24} y={60} size={34} rot={1} maxWidth={500}>
              Sold… then it pumps.
            </Caption>
            <ComicText text="+10%" from={b(k0 + 2, 3)} x={400} y={560} size={96} rotate={-8} fill="#8fe39f" variant="onomatopoeia" echoColor={INK} />
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(14,11,8,0.8), rgba(14,11,8,0.4))",
          opacity: interpolate(frame, [b(k0 + 3), b(k0 + 3) + 5], [0, 1], clamp),
        }}
      />
      <SpeedBurst cx={960} cy={540} from={b(k0 + 3)} count={22} inner={260} spread={700} color={C.amber} opacity={0.6} width={8} seed="ouch" />
      <ComicText text="OUCH." from={b(k0 + 3)} x={960} y={540} size={330} rotate={-8} skewX={-8} tiltX={8} fill={BNB_GOLD} variant="onomatopoeia" echoColor={C.amber} />
      <ComicText text="What if you never had to sell?" from={b(k0 + 3, 2)} x={960} y={850} size={64} rotate={-2} fill={C.cream} />

      <InkFrame inset={22} width={5} opacity={0.9} color={C.cream} />

      <Sfx name="impact" at={b(k0)} volume={0.55} />
      <Sfx name="impact" at={b(k0 + 1)} volume={0.55} />
      <Sfx name="impact" at={b(k0 + 2)} volume={0.55} />
      <Sfx name="tick" at={b(k0, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k0 + 1, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k0 + 2, 2)} volume={0.6} />
      <Sfx name="impact" at={b(k0 + 3)} volume={0.9} />
    </AbsoluteFill>
  );
};
