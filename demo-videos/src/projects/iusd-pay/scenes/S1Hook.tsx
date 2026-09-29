import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Caption,
  clamp,
  CoinDot,
  ComicPanel,
  ComicText,
  GasPump,
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
  Wallet,
} from "../../../kit";
import { C } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (bars 0–4) — a three-panel comic strip stating the problem, one
 * panel per bar, beats driving every inner pop:
 *   bar 0  "Pay a friend 10 USDT."          (panel 1 slams, bubble b1, coin b2, arrow b3)
 *   bar 1  "First… buy BNB for gas?!"      (panel 2, needle drops to EMPTY on b2, "?!" b3)
 *   bar 2  "Your friend needs gas to claim" (panel 3, sweat b2, "0 BNB" wallet b3)
 *   bar 3  BREAK — camera leans in, "UGH." onomatopoeia slams on the downbeat,
 *          the page drains toward the hard cut → logo drop at bar 4.
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

  // bar-3 break: slow push-in + desaturate toward the cut.
  const brk = interpolate(frame, [b(k0 + 3), b(k0 + 4)], [0, 1], clamp);
  const pageScale = 1 + 0.06 * brk;
  const drain = 1 - 0.45 * interpolate(frame, [b(k0 + 3), b(k0 + 3, 1)], [0, 1], clamp);

  // Needle: full → empty on beat 2 of bar 1.
  const needle = interpolate(frame, [b(k0 + 1), b(k0 + 1, 2)], [0.55, 0], clamp);
  const coinT = interpolate(frame, [b(k0, 2), b(k0, 3)], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: "#0d0d0f" }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${pageScale})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          {/* Top narration caption */}
          <Caption at={b(k0)} x={96} y={84} size={40} bg={C.yellow} rot={-1.2} maxWidth={900}>
            Meanwhile, in crypto payments…
          </Caption>

          {/* PANEL 1 — pay a friend */}
          <ComicPanel at={b(k0)} x={PX[0]!} y={PY} w={PANEL_W} h={PANEL_H} rot={-1.6} bg="#FFE27A" bg2="#F7B955" from="up" punch={p1}>
            <svg width={PANEL_W} height={PANEL_H} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}>
              <Person x={170} y={470} s={1.35} body={C.pink} mood="happy" pose="hold">
                <Phone x={0} y={-8} s={0.62} screen="#141414" label="$" labelColor={C.cardYellow} />
              </Person>
              <InkArrow x1={250} y1={420} x2={470} y2={330} at={b(k0, 3)} dur={8} bend={-60} color="#fff" />
              {coinT > 0 ? (
                <CoinDot cx={250 + 190 * coinT} cy={380 - 120 * Math.sin(coinT * Math.PI) - 20 * coinT} r={40} label="10" rotate={coinT * 30} scaleX={Math.cos(coinT * 9) * 0.3 + 0.7} />
              ) : null}
            </svg>
            <SpeechBubble at={b(k0, 1)} x={230} y={70} w={290} h={150} tailX={40} tailY={240} size={34}>
              Sending you 10 USDT!
            </SpeechBubble>
            <Caption at={b(k0)} x={24} y={PANEL_H - 96} size={34} rot={0}>
              Pay a friend 10 USDT.
            </Caption>
          </ComicPanel>

          {/* PANEL 2 — gas */}
          <ComicPanel at={b(k0 + 1)} x={PX[1]!} y={PY + 16} w={PANEL_W} h={PANEL_H} rot={1.3} bg="#FF9BB5" bg2="#F26A8F" from="down" punch={p2}>
            <svg width={PANEL_W} height={PANEL_H} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}>
              <GasPump x={380} y={380} s={1.25} level={needle} label={frame >= b(k0 + 1, 2) ? "EMPTY" : ""} />
              <Person x={150} y={470} s={1.2} body={C.pink} mood="shock" pose="hold">
                <Phone x={0} y={-8} s={0.6} screen="#141414" label="0" labelColor="#FF5A4E" />
              </Person>
              {frame >= b(k0 + 1, 2) ? <SweatDrops x={214} y={250} s={1.2} /> : null}
            </svg>
            <Caption at={b(k0 + 1)} x={24} y={60} size={34} rot={-1}>
              First… buy BNB for gas?
            </Caption>
            <ComicText text="?!" from={b(k0 + 1, 3)} x={130} y={210} size={120} rotate={-10} fill="#FF5A4E" variant="onomatopoeia" echoColor={INK} />
          </ComicPanel>

          {/* PANEL 3 — friend needs gas too */}
          <ComicPanel at={b(k0 + 2)} x={PX[2]!} y={PY - 6} w={PANEL_W} h={PANEL_H} rot={-1.1} bg="#A8EC8E" bg2="#5DBB63" from="right" punch={p3}>
            <svg width={PANEL_W} height={PANEL_H} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}>
              <Person x={300} y={440} s={1.35} body="#2F7BD9" skin="#F2C49B" mood="sad" pose="slump" />
              {frame >= b(k0 + 2, 3) ? <Wallet x={300} y={600} s={0.95} label="0 BNB" fill="#5b3a22" /> : null}
              {frame >= b(k0 + 2, 2) ? <SweatDrops x={380} y={250} s={1.1} /> : null}
            </svg>
            <Caption at={b(k0 + 2)} x={24} y={60} size={32} rot={1} maxWidth={500}>
              Your friend needs gas to claim it, too.
            </Caption>
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(8,9,11,0.75), rgba(8,9,11,0.35))", opacity: interpolate(frame, [b(k0 + 3), b(k0 + 3) + 5], [0, 1], clamp) }} />
      {/* BAR 3 — the break: "UGH." slams across the strip on the downbeat. */}
      <SpeedBurst cx={960} cy={560} from={b(k0 + 3)} count={22} inner={260} spread={700} color={C.pink} opacity={0.6} width={8} seed="ugh" />
      <ComicText text="UGH." from={b(k0 + 3)} x={960} y={560} size={330} rotate={-8} skewX={-8} tiltX={8} fill={C.yellow} variant="onomatopoeia" echoColor={C.pink} />
      <ComicText text="There has to be a better way." from={b(k0 + 3, 2)} x={960} y={850} size={64} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      {/* SFX: impact per panel slam, tick on inner pops, big impact on UGH. */}
      <Sfx name="impact" at={b(k0)} volume={0.55} />
      <Sfx name="impact" at={b(k0 + 1)} volume={0.55} />
      <Sfx name="impact" at={b(k0 + 2)} volume={0.55} />
      <Sfx name="tick" at={b(k0, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k0 + 1, 2)} volume={0.6} />
      <Sfx name="impact" at={b(k0 + 3)} volume={0.9} />
    </AbsoluteFill>
  );
};
