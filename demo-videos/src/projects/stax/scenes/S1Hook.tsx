import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Caption,
  clamp,
  ComicPanel,
  ComicText,
  Halftone,
  INK,
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
import { QMark, StockTile } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (bars 0–3). Three comic panels, one per bar, beats drive the pops:
 *   bar 0  "I want to own Apple & Tesla."   (bubble b1, AAPL tile b2, TSLA tile b3)
 *   bar 1  "Which ones? How much? How risky?" (a "?" pops on b1, b2, b3)
 *   bar 2  BREAK: panel 3 "Who checks the risk?" on b0, then "UGH." slams on b2
 */
const PW = 548;
const PH = 700;
const PY = 214;
const PX = [96, 686, 1276];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k0 = BAR.hook;

  const p1 = useBeatPunch(beatsIn(k0, k0 + 1), 0.025, 5);
  const p2 = useBeatPunch(beatsIn(k0 + 1, k0 + 2), 0.025, 5);
  const p3 = useBeatPunch([b(k0 + 2), b(k0 + 2, 1)], 0.025, 5);

  const ugh = b(k0 + 2, 2);
  const brk = interpolate(frame, [b(k0 + 2), b(k0 + 3)], [0, 1], clamp);
  const drain = 1 - 0.45 * interpolate(frame, [ugh, ugh + 8], [0, 1], clamp);
  const draw = (at: number) => interpolate(frame, [at, at + 14], [0, 1], clamp);
  const needle = interpolate(frame, [b(k0 + 2), b(k0 + 2, 1)], [0.3, 0.97], clamp);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Halftone opacity={0.07} gap={18} color={C.sage} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * brk})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.5}>
          <Caption at={b(k0)} x={96} y={84} size={40} bg={C.sageLight} rot={-1.2} maxWidth={900}>
            Meanwhile, in investing…
          </Caption>

          {/* PANEL 1 — the wish */}
          <ComicPanel at={b(k0)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#BFE8D2" bg2="#6cc09c" from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Person x={150} y={480} s={1.3} body={C.sageDeep} mood="happy" pose="hold">
                <Phone x={0} y={-8} s={0.6} screen="#141414" label="$20" labelColor={C.sageLight} />
              </Person>
              {frame >= b(k0, 2) ? <StockTile x={400} y={300} s={0.95} rot={-6} sym="AAPL" draw={draw(b(k0, 2))} /> : null}
              {frame >= b(k0, 3) ? <StockTile x={410} y={470} s={0.95} rot={5} sym="TSLA" fill={C.terracotta} draw={draw(b(k0, 3))} /> : null}
            </svg>
            <SpeechBubble at={b(k0, 1)} x={40} y={40} w={320} h={150} tailX={120} tailY={250} size={32}>
              I want Apple &amp; Tesla. I have $20.
            </SpeechBubble>
            <Caption at={b(k0)} x={24} y={PH - 96} size={34}>
              Own a slice of the best companies.
            </Caption>
          </ComicPanel>

          {/* PANEL 2 — the confusion */}
          <ComicPanel at={b(k0 + 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#F7D2B8" bg2="#ecab7e" from="down" punch={p2}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Person x={PW / 2} y={470} s={1.35} body={C.sageDeep} mood="shock" pose="stand" />
              {frame >= b(k0 + 1, 1) ? <QMark x={120} y={250} rot={-14} text="?" /> : null}
              {frame >= b(k0 + 1, 2) ? <QMark x={430} y={230} rot={12} text="%?" fill={C.sageLight} /> : null}
              {frame >= b(k0 + 1, 3) ? <QMark x={PW / 2} y={150} rot={-4} text="?!" fill="#fff" /> : null}
              {frame >= b(k0 + 1, 2) ? <SweatDrops x={350} y={330} s={1.1} /> : null}
            </svg>
            <Caption at={b(k0 + 1)} x={24} y={PH - 110} size={32} rot={-1} maxWidth={500}>
              Which ones? How much each? How risky?
            </Caption>
          </ComicPanel>

          {/* PANEL 3 — no one guards the risk */}
          <ComicPanel at={b(k0 + 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#E7B1A0" bg2="#ec8d6c" from="right" punch={p3}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              {/* runaway risk meter */}
              <g transform="translate(274 300)">
                <path d="M-150 0 A150 150 0 0 1 150 0" fill="none" stroke="#f4efe4" strokeWidth={30} />
                <path d="M106 -106 A150 150 0 0 1 150 0" fill="none" stroke={INK} strokeWidth={30} />
                <line x1={0} y1={0} x2={Math.cos(Math.PI * (1 - needle)) * 130} y2={-Math.sin(Math.PI * (1 - needle)) * 130} stroke={INK} strokeWidth={12} strokeLinecap="round" />
                <circle r={20} fill={C.neg} stroke={INK} strokeWidth={6} />
                <text x={0} y={70} textAnchor="middle" fontFamily={F.comic} fontSize={44} fill={INK}>
                  RISK
                </text>
              </g>
              <Person x={274} y={560} s={0.9} body={C.sageDeep} mood="sad" pose="slump" />
            </svg>
            <Caption at={b(k0 + 2)} x={24} y={60} size={32} rot={1} maxWidth={500}>
              …and who stops a plan that's too risky?
            </Caption>
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(8,9,11,0.78), rgba(8,9,11,0.4))", opacity: interpolate(frame, [ugh, ugh + 5], [0, 1], clamp) }} />
      <SpeedBurst cx={960} cy={560} from={ugh} count={22} inner={260} spread={700} color={C.sage} opacity={0.6} width={8} seed="ugh" />
      <ComicText text="UGH." from={ugh} x={960} y={540} size={330} rotate={-8} skewX={-8} tiltX={8} fill={C.sageLight} variant="onomatopoeia" echoColor={C.terracotta} />
      <ComicText text="There has to be a smarter way." from={b(k0 + 2, 3)} x={960} y={850} size={64} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k0)} volume={0.55} />
      <Sfx name="tick" at={b(k0, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k0, 3)} volume={0.6} />
      <Sfx name="impact" at={b(k0 + 1)} volume={0.55} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k0 + 1, i)} volume={0.5} />
      ))}
      <Sfx name="impact" at={b(k0 + 2)} volume={0.55} />
      <Sfx name="impact" at={ugh} volume={0.9} />
    </AbsoluteFill>
  );
};
