import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption, clamp, ComicPanel, ComicText, Halftone, InkFrame, Person, Pulse, Sfx, SpeechBubble, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { AppTile, LanceCoin } from "../art";
import { C } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 4–6). Frame 0 is the bar-4 downbeat.
 *   bar 4  b0 work panel (Claudelance-style app) · b1 play panel (Bingo-style)
 *          b2 caption "two apps, two separate balances" · b3 a wall drops between
 *   bar 5  b0 "SILOED!" slams · b2 "Nothing flows between them."
 */
const PW = 800;
const PH = 560;
const PY = 250;

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 4

  const p1 = useBeatPunch(beatsIn(k, k + 1), 0.02, 5);
  const slam = b(k + 1);
  const dim = interpolate(frame, [slam, slam + 5], [0, 1], clamp);
  const wall = interpolate(frame, [b(k, 3), b(k, 3) + 6], [-700, 0], clamp);
  const bob = (o: number) => Math.sin((frame + o) / 7) * 6;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Halftone opacity={0.07} gap={18} color={C.clay} />
      <AbsoluteFill style={{ filter: `saturate(${1 - 0.5 * dim})`, transform: `scale(${1 + 0.04 * dim})` }}>
        <Pulse intensity={1} shake={0.3}>
          <Caption at={b(k)} x={100} y={110} size={40} bg={C.claySoft} rot={-1.2} maxWidth={1300}>
            One ecosystem. Work in one app, play in another…
          </Caption>

          <ComicPanel at={b(k)} x={100} y={PY} w={PW} h={PH} rot={-1.4} bg="#ffd9c4" bg2={C.clay} from="left" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Person x={190} y={400} s={1.1} body="#3d8bff" mood="happy" pose="point" />
              <AppTile kind="work" x={520} y={250} s={1.1} label="WORK APP" />
              <LanceCoin x={660} y={120 + bob(0)} r={40} face={C.clayLight} label="A" />
            </svg>
            <SpeechBubble at={b(k, 1)} x={30} y={30} w={290} h={100} tailX={150} tailY={170} size={28}>
              Got paid here!
            </SpeechBubble>
          </ComicPanel>

          <ComicPanel at={b(k, 1)} x={1020} y={PY + 10} w={PW} h={PH} rot={1.3} bg="#dcffc4" bg2="#4fb80a" from="right" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <AppTile kind="play" x={280} y={250} s={1.1} label="GAME APP" />
              <Person x={620} y={400} s={1.1} body="#ff4d6d" mood="shock" pose="slump" />
              <LanceCoin x={140} y={120 + bob(9)} r={40} face="#9adf6a" label="B" />
            </svg>
            <SpeechBubble at={b(k, 2)} x={440} y={30} w={330} h={100} tailX={170} tailY={170} size={28} shout>
              Can't stake it here?!
            </SpeechBubble>
          </ComicPanel>

          {/* the wall between the two apps */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(0 ${wall})`}>
              <rect x={930} y={210} width={60} height={640} fill="#6b625a" stroke="#08090b" strokeWidth={6} />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line key={i} x1={930} x2={990} y1={290 + i * 80} y2={290 + i * 80} stroke="#08090b" strokeWidth={4} />
              ))}
            </g>
          </svg>
          <Caption at={b(k, 2)} x={560} y={880} size={36} rot={1} bg="#fff" maxWidth={900}>
            Two apps. Two separate balances.
          </Caption>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,12,11,0.85), rgba(14,12,11,0.5))", opacity: dim }} />
      <SpeedBurst cx={960} cy={500} from={slam} count={24} inner={260} spread={720} color={C.clay} opacity={0.55} width={8} seed="silo" />
      <ComicText text="SILOED!" from={slam} x={960} y={480} size={280} rotate={-6} skewX={-8} fill={C.clay} variant="onomatopoeia" echoColor={C.gold} burst={C.gold} />
      <ComicText text="Nothing flows between them." from={b(k + 1, 2)} x={960} y={820} size={70} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.6} />
      <Sfx name="impact" at={b(k, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k, 3)} volume={0.6} />
      <Sfx name="impact" at={slam} volume={0.95} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
