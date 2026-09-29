import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
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
import { Bank, Coffee, QrisStand, Tag } from "../art";
import { C } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (bars 4–8). Frame 0 is the bar-4 DROP of the track.
 *   bar 4  "Paid in USDC."             panel slams b0, coin b1, bubble b2, arrow b3
 *   bar 5  "Coffee? QRIS only."        panel b0, QRIS stand b1, "?!" b3
 *   bar 6  "Sell · wait · pay fees"    panel b0, clock spins, DAYS tag b1, FEES tag b2
 *   bar 7  BREAK — "STUCK." slams on the downbeat, the page drains toward the cut.
 */
const PW = 548;
const PH = 700;
const PY = 214;
const PX = [96, 686, 1276];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook;

  const p1 = useBeatPunch(beatsIn(k, k + 1), 0.025, 5);
  const p2 = useBeatPunch(beatsIn(k + 1, k + 2), 0.025, 5);
  const p3 = useBeatPunch(beatsIn(k + 2, k + 3), 0.025, 5);

  const brk = interpolate(frame, [b(k + 3), b(k + 4)], [0, 1], clamp);
  const drain = 1 - 0.5 * interpolate(frame, [b(k + 3), b(k + 3, 1)], [0, 1], clamp);
  const coinIn = interpolate(frame, [b(k, 1), b(k, 1) + 8], [0, 1], clamp);
  const hand = interpolate(frame, [b(k + 2), b(k + 3)], [0, Math.PI * 6], clamp);

  return (
    <AbsoluteFill style={{ background: "#08110e" }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.06 * brk})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k)} x={96} y={84} size={40} bg={C.gold} rot={-1.2} maxWidth={1000}>
            Meanwhile, in Jakarta…
          </Caption>

          {/* PANEL 1 — paid in USDC */}
          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#9CF0C4" bg2="#2fd98a" from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Person x={180} y={470} s={1.35} body={C.emerald} mood="happy" pose="hold">
                <Phone x={0} y={-8} s={0.62} screen="#101e1a" label="$" labelColor={C.bright} />
              </Person>
              {coinIn > 0 ? <CoinDot cx={400} cy={300 - 40 * coinIn} r={74} face="#6FB1FF" ring="#D6E9FF" label="USDC" rotate={-10} opacity={coinIn} /> : null}
              <InkArrow x1={400} y1={390} x2={250} y2={410} at={b(k, 3)} dur={8} bend={40} color="#fff" />
            </svg>
            <SpeechBubble at={b(k, 2)} x={250} y={60} w={270} h={130} tailX={20} tailY={230} size={32}>
              Invoice paid!
            </SpeechBubble>
            <Caption at={b(k)} x={24} y={PH - 96} size={34} rot={0}>
              Paid in USDC.
            </Caption>
          </ComicPanel>

          {/* PANEL 2 — coffee is QRIS-only */}
          <ComicPanel at={b(k + 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#FFE0A8" bg2={C.gold} from="down" punch={p2}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              {frame >= b(k + 1, 1) ? <QrisStand x={390} y={290} s={1.05} price="Rp 45,000" /> : null}
              <Coffee x={410} y={600} s={0.62} steam={frame / 6} />
              <Person x={150} y={480} s={1.2} body={C.emerald} mood="shock" pose="hold">
                <Phone x={0} y={-8} s={0.6} screen="#101e1a" label="USDC" labelColor={C.bright} />
              </Person>
              {frame >= b(k + 1, 2) ? <SweatDrops x={214} y={260} s={1.2} /> : null}
            </svg>
            <Caption at={b(k + 1)} x={24} y={60} size={34} rot={-1}>
              Coffee? QRIS only.
            </Caption>
            <ComicText text="?!" from={b(k + 1, 3)} x={130} y={220} size={120} rotate={-10} fill={C.rose} variant="onomatopoeia" echoColor={INK} />
          </ComicPanel>

          {/* PANEL 3 — the exchange detour */}
          <ComicPanel at={b(k + 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#FFB4A6" bg2={C.rose} from="right" punch={p3}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Bank x={300} y={300} s={1.2} hand={hand} />
              <Person x={140} y={520} s={1.1} body={C.emerald} mood="sad" pose="slump" />
              {frame >= b(k + 2, 1) ? <Tag x={400} y={500} s={1} rot={-8} text="DAYS" fill="#3b4a5a" /> : null}
              {frame >= b(k + 2, 2) ? <Tag x={400} y={580} s={1} rot={6} text="FEES" /> : null}
            </svg>
            <Caption at={b(k + 2)} x={24} y={60} size={32} rot={1} maxWidth={500}>
              Sell it, wait for the bank, pay fees.
            </Caption>
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(6,18,14,0.78), rgba(6,18,14,0.4))", opacity: interpolate(frame, [b(k + 3), b(k + 3) + 5], [0, 1], clamp) }} />
      <SpeedBurst cx={960} cy={540} from={b(k + 3)} count={22} inner={260} spread={700} color={C.rose} opacity={0.6} width={8} seed="stuck" />
      <ComicText text="STUCK." from={b(k + 3)} x={960} y={540} size={320} rotate={-7} skewX={-8} tiltX={8} fill={C.gold} variant="onomatopoeia" echoColor={C.rose} />
      <ComicText text="Just to buy a coffee." from={b(k + 3, 2)} x={960} y={840} size={64} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 2)} volume={0.55} />
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.6} />
      <Sfx name="impact" at={b(k + 3)} volume={0.9} />
    </AbsoluteFill>
  );
};
