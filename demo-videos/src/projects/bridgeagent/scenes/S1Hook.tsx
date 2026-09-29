import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption, clamp, ComicPanel, ComicText, Halftone, INK, InkFrame, Pulse, Sfx, SpeechBubble, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { FlexChart, Ledger, MaskBot } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 12–16; the file starts at bar 12, mid-plateau).
 *   12 b0 panel 1 "Bots post huge PnL."  (chart shoots up, "+300%!")
 *   12 b2 panel 2 "But who IS this bot?" (hooded, no face)
 *   13 b0 panel 3 "No history. No receipts." (empty ledger)
 *   13 b1–b3 stamps: SCREENSHOT? · ANON · EMPTY
 *   14 b0 "WHO ARE YOU?" slam, b2 "…and where are the receipts?"
 *   15 (dip) b0 "TRUST ME, BRO." · b2 "Nope. Prove it on-chain."
 */
const PW = 548;
const PH = 600;
const PY = 214;
const PX = [96, 686, 1276];

const Stamp: React.FC<{ at: number; text: string; x: number; y: number; rot: number; color?: string }> = ({ at, text, x, y, rot, color = C.red }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = interpolate(f, [at, at + 5], [1.8, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${p})`, padding: "6px 22px", border: `7px solid ${color}`, color, fontFamily: F.comic, fontSize: 64, letterSpacing: "0.06em", background: "rgba(255,255,255,0.75)", opacity: interpolate(f, [at, at + 3], [0, 1], clamp), whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 12

  const p1 = useBeatPunch(beatsIn(k, k + 2), 0.02, 5);
  const chart = interpolate(frame, [b(k), b(k, 2)], [0.1, 1], clamp);
  const who = interpolate(frame, [b(k + 2), b(k + 2) + 5], [0, 1], clamp);
  const bro = frame >= b(k + 3);
  const drain = 1 - 0.6 * who;

  return (
    <AbsoluteFill style={{ background: "#0b140f" }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * who})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k)} x={96} y={84} size={40} bg={C.mossSoft} rot={-1.2} maxWidth={1200}>
            Meanwhile, on crypto twitter…
          </Caption>

          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#D8F3E1" bg2="#8fdcaa" from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <FlexChart x={PW / 2} y={350} s={1.25} p={chart} label="+300%!" />
            </svg>
            <Caption at={b(k)} x={24} y={40} size={34} rot={0} maxWidth={500}>
              Bots post huge PnL.
            </Caption>
            <Stamp at={b(k + 1, 1)} text="SCREENSHOT?" x={PW / 2} y={530} rot={-10} />
          </ComicPanel>

          <ComicPanel at={b(k, 2)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#cfd6d1" bg2="#6b7c72" from="down">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <MaskBot x={PW / 2} y={330} s={1.35} />
            </svg>
            <SpeechBubble at={b(k, 3)} x={300} y={120} w={220} h={100} tailX={120} tailY={200} size={46} shout>
              TRUST ME
            </SpeechBubble>
            <Caption at={b(k, 2)} x={24} y={40} size={34} rot={-1} maxWidth={500}>
              But who IS this bot?
            </Caption>
            <Stamp at={b(k + 1, 2)} text="ANON" x={PW / 2} y={500} rot={8} />
          </ComicPanel>

          <ComicPanel at={b(k + 1)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#f4efe4" bg2="#d8ccb4" from="right">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Ledger x={PW / 2} y={340} s={1.2} rows={0} />
            </svg>
            <Caption at={b(k + 1)} x={24} y={40} size={34} rot={1} maxWidth={480}>
              No history. No receipts.
            </Caption>
            <Stamp at={b(k + 1, 3)} text="EMPTY" x={PW / 2} y={500} rot={-6} />
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(10,20,15,0.9), rgba(6,10,8,0.6))", opacity: who }} />
      <SpeedBurst cx={960} cy={480} from={b(k + 2)} count={22} inner={260} spread={700} color={C.amber} opacity={0.55} width={8} seed="who" />
      <ComicText text="WHO ARE YOU?" from={b(k + 2)} x={960} y={450} size={230} rotate={-6} skewX={-8} tiltX={8} fill={C.amber} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />
      <ComicText text="…and where are the receipts?" from={b(k + 2, 2)} x={960} y={760} size={74} rotate={-2} fill={C.mossSoft} exitAt={b(k + 3) - 2} />

      {bro ? (
        <AbsoluteFill>
          <SpeedBurst cx={960} cy={420} from={b(k + 3)} count={18} inner={240} spread={600} color={C.red} opacity={0.5} width={7} seed="bro" fade />
          <ComicText text="TRUST ME, BRO." from={b(k + 3)} x={960} y={420} size={200} rotate={-4} fill={C.red} variant="onomatopoeia" echoColor={INK} />
          <ComicText text="NOPE. PROVE IT ON-CHAIN." from={b(k + 3, 2)} x={960} y={760} size={96} rotate={2} fill={C.gold} variant="onomatopoeia" echoColor={INK} stagger={1} />
        </AbsoluteFill>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1)} volume={0.55} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`st${i}`} name="tick" at={b(k + 1, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 2)} volume={0.95} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3)} volume={0.85} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
