import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption, clamp, CoinDot, ComicPanel, ComicText, Halftone, INK, InkFrame, Person, Pulse, Sfx, SpeechBubble, SpeedBurst, SweatDrops, useBeatPunch, useSceneClock } from "../../../kit";
import { AddressTag, Magnifier, TabStack } from "../art";
import { C, CHAIN, F, short } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 16–20; the file starts at bar 16, first plateau bar).
 *   16 b0  panel 1 "Someone sends you an address." (analyst + address tag, "Who IS this?")
 *   16 b1  panel 2 "It lives on 11 chains." (chain coins pop b1→b3)
 *   16 b2  panel 3 "So you open 11 explorers…" (tabs stack up on the beats)
 *   17     questions stamp on each beat: CONTRACT? · WHALE? · WHICH CHAIN? · REAL?
 *   18 b0  "TAB HELL!" slam; b2 "What if one command read them all?"
 *   19 b0  magnifier drops; b2 "ONE SCAN. EVERY CHAIN."
 */
const PW = 548;
const PH = 640;
const PY = 214;
const PX = [96, 686, 1276];
const COINS = ["BSC", "opBNB", "tBNB", "ETH", "BASE", "OP", "ARB", "MNT", "SCR", "LNA", "ZK"];
const QUESTIONS = ["CONTRACT?", "WHALE?", "WHICH CHAIN?", "REAL?"];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 16

  const p1 = useBeatPunch(beatsIn(k, k + 2), 0.02, 5);
  const coinsShown = Math.floor(interpolate(frame, [b(k, 1), b(k + 1)], [3, 11], clamp));
  const tabs = frame < b(k, 2) ? 0 : 1 + Math.min(6, Math.floor((frame - b(k, 2)) / 6));
  const hell = interpolate(frame, [b(k + 2), b(k + 2) + 5], [0, 1], clamp);
  const mag = interpolate(frame, [b(k + 3) - 6, b(k + 3)], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * hell})`, filter: `saturate(${1 - 0.5 * hell})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k)} x={96} y={84} size={40} bg={C.signal} rot={-1.2} maxWidth={1200}>
            Due diligence, the old way…
          </Caption>

          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#FFE0D2" bg2="#e8633a" from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Person x={170} y={460} s={1.25} body={C.signalDeep} mood="neutral" pose="hold" />
              <AddressTag x={330} y={330} s={0.85} rot={-8} text={short(CHAIN.hotWallet)} />
            </svg>
            <SpeechBubble at={b(k) + 3} x={250} y={120} w={270} h={110} tailX={130} tailY={250} size={46} shout>
              Who IS this?
            </SpeechBubble>
            <Caption at={b(k)} x={24} y={40} size={32} rot={0} maxWidth={500}>
              Someone sends you an address.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#DDF7F5" bg2="#46d6d0" from="down">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              {COINS.slice(0, coinsShown).map((c, i) => {
                const col = i < 3;
                const cx = 90 + (i % 4) * 122 + (Math.floor(i / 4) % 2) * 50;
                const cy = 200 + Math.floor(i / 4) * 140;
                return <CoinDot key={c} cx={cx} cy={cy} r={i < 3 ? 56 : 46} face={col ? C.gold : "#f4efe4"} ring={INK} label={c} />;
              })}
            </svg>
            <Caption at={b(k, 1)} x={24} y={40} size={32} rot={-1} maxWidth={500}>
              It could live on 11 chains.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#2a3238" bg2="#151c21" from="right">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <TabStack x={290} y={330} n={tabs} s={1.05} labels={["bscscan", "opbnb", "etherscan", "basescan", "arbiscan", "testnet"]} />
              {frame >= b(k + 1) ? <Person x={120} y={540} s={0.9} body={C.ember} mood="shock" pose="stand" /> : null}
              {frame >= b(k + 1, 2) ? <SweatDrops x={170} y={390} s={0.9} /> : null}
            </svg>
            <Caption at={b(k, 2)} x={24} y={40} size={32} rot={1} maxWidth={470}>
              So you open 11 explorers…
            </Caption>
          </ComicPanel>

          {QUESTIONS.map((q, i) => (
            <div key={q} style={{ position: "absolute", left: [300, 890, 1470, 900][i], top: [900, 180, 900, 930][i] }}>
              {frame >= b(k + 1, i) ? (
                <div
                  style={{
                    transform: `translate(-50%, -50%) rotate(${[-6, 5, -3, 7][i]}deg) scale(${interpolate(frame, [b(k + 1, i), b(k + 1, i) + 5], [1.8, 1], clamp)})`,
                    padding: "6px 22px",
                    background: [C.gold, C.signal, C.ember, "#f4efe4"][i],
                    border: `5px solid ${INK}`,
                    boxShadow: `6px 6px 0 ${INK}`,
                    fontFamily: F.comic,
                    fontSize: 58,
                    color: INK,
                    whiteSpace: "nowrap",
                  }}
                >
                  {q}
                </div>
              ) : null}
            </div>
          ))}
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(40,14,6,0.88), rgba(7,9,10,0.6))", opacity: hell * (1 - 0.3 * mag) }} />
      <SpeedBurst cx={960} cy={500} from={b(k + 2)} count={22} inner={260} spread={700} color={C.ember} opacity={0.6} width={8} seed="tabs" />
      <ComicText text="TAB HELL!" from={b(k + 2)} x={960} y={470} size={270} rotate={-7} skewX={-8} tiltX={8} fill={C.ember} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />
      <ComicText text="What if one command read them all?" from={b(k + 2, 2)} x={960} y={790} size={66} rotate={-2} fill={C.signal} exitAt={b(k + 3) - 2} />

      {frame >= b(k + 3) - 6 ? (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <Magnifier x={960} y={interpolate(mag, [0, 1], [-260, 400])} s={1.6 * (1 + 0.1 * (1 - mag))} rot={-30 + (1 - mag) * -30} />
          </svg>
          <SpeedBurst cx={960} cy={400} from={b(k + 3)} count={18} inner={240} spread={600} color={C.signal} opacity={0.55} width={7} seed="mag" fade />
          <ComicText text="ONE SCAN. EVERY CHAIN." from={b(k + 3, 2)} x={960} y={860} size={100} rotate={-3} fill={C.gold} variant="onomatopoeia" echoColor={INK} stagger={1} />
        </AbsoluteFill>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="impact" at={b(k, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`q${i}`} name="tick" at={b(k + 1, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 2)} volume={0.95} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.7} />
    </AbsoluteFill>
  );
};
