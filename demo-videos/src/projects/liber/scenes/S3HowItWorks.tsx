import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
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
  PremiumBg,
  Pulse,
  Sfx,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { BnbCoin, Coffee, KoloCard, NoTrustline, QrisStand } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 11–16). Slides in on the bar-11 break with the
 * title; then one comic step per bar, each slamming on its downbeat:
 *   bar 12 ACTIVATE   keys on your phone + 0.001 BNB for gas  ("NO TRUSTLINE!")
 *   bar 13 SCAN       any QRIS → live USDC quote             ("BEEP!")
 *   bar 14 TOP UP     one BEP-20 transfer to your Kolo card  ("ZOOM!")
 *   bar 15 PAY        same QRIS in GoPay / DANA, Kolo Visa   ("PAID!")  (break bar)
 */
const PW = 390;
const PH = 700;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 262;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Activate", body: "Keys stay on your phone. 0.001 BNB for gas activates it.", bg: "#FFE9A8", bg2: "#F0B90B" },
  { n: "2", title: "Scan", body: "Scan any QRIS. Liber quotes the USDC price live.", bg: "#FFD0C4", bg2: "#E88A6F" },
  { n: "3", title: "Top up", body: "One BEP-20 USDC transfer to your Kolo card.", bg: "#B8F5D6", bg2: "#2fd98a" },
  { n: "4", title: "Pay", body: "Pay the same QRIS in GoPay or DANA with Kolo.", bg: "#C9DCFF", bg2: "#7EA6F2" },
];

const StepLabel: React.FC<{ s: Step }> = ({ s }) => (
  <div style={{ position: "absolute", left: 22, right: 22, bottom: 22 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: 999,
          background: INK,
          color: C.gold,
          fontFamily: F.comic,
          fontSize: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {s.n}
      </span>
      <span style={{ fontFamily: F.comic, fontSize: 52, color: INK, letterSpacing: "0.02em", textTransform: "uppercase" }}>{s.title}</span>
    </div>
    <div
      style={{
        marginTop: 10,
        background: "#fff",
        border: `4px solid ${INK}`,
        boxShadow: `5px 5px 0 ${INK}`,
        padding: "12px 14px",
        fontFamily: F.sans,
        fontWeight: 600,
        fontSize: 24,
        lineHeight: 1.25,
        color: INK,
        minHeight: 118,
      }}
    >
      {s.body}
    </div>
  </div>
);

export const S3HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 11 — the break; steps on 12..15
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + 1 + i, k + 2 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const hop = (i: number) => interpolate(frame, [b(k + 1 + i, 2), b(k + 1 + i, 3)], [0, 1], clamp);
  const send = interpolate(frame, [b(k + 3, 1), b(k + 3, 3)], [0, 1], clamp);
  const bnbDrop = interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 8], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(47,217,138,0.16)" glowB="rgba(231,163,58,0.16)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill={C.gold} stagger={1} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 196,
          textAlign: "center",
          fontFamily: F.display,
          fontStyle: "italic",
          fontSize: 36,
          color: C.text,
          opacity: interpolate(frame, [b(k, 2), b(k, 2) + 8], [0, 1], clamp),
        }}
      >
        four steps · Liber never touches the payment
      </div>

      <Pulse intensity={0.9} shake={0.5}>
        {STEPS.map((s, i) =>
          frame < b(k + 1 + i) ? (
            <div
              key={`g${s.n}`}
              style={{
                position: "absolute",
                left: px(i),
                top: PY + (i % 2 === 0 ? 0 : 20),
                width: PW,
                height: PH,
                border: "4px dashed rgba(244,239,228,0.22)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.comic,
                fontSize: 160,
                color: "rgba(244,239,228,0.12)",
                opacity: interpolate(frame, [b(k, 1) + i * 3, b(k, 1) + i * 3 + 6], [0, 1], clamp),
              }}
            >
              {s.n}
            </div>
          ) : null,
        )}
        {STEPS.map((s, i) => (
          <ComicPanel
            key={s.n}
            at={b(k + 1 + i)}
            x={px(i)}
            y={PY + (i % 2 === 0 ? 0 : 20)}
            w={PW}
            h={PH}
            rot={[-1.4, 1.1, -0.9, 1.5][i]}
            bg={s.bg}
            bg2={s.bg2}
            from={(["up", "down", "up", "down"] as const)[i]}
            punch={punches[i]}
          >
            <svg width={PW} height={420} viewBox={`0 0 ${PW} 420`} style={{ position: "absolute", left: 0, top: 0 }}>
              {i === 0 ? (
                <>
                  <Person x={120} y={260} s={1.05} body={C.emerald} mood="happy" pose="hold">
                    <Phone x={0} y={-8} s={0.55} screen="#101e1a" label="0x" labelColor={C.gold} />
                  </Person>
                  {bnbDrop > 0 ? <BnbCoin x={290} y={110 + 60 * bnbDrop} s={0.9} label="0.001 BNB" opacity={bnbDrop} /> : null}
                  {frame >= b(k + 1, 2) ? <NoTrustline x={300} y={330} s={0.5} /> : null}
                </>
              ) : null}
              {i === 1 ? (
                <>
                  <QrisStand x={260} y={200} s={0.95} />
                  <Person x={96} y={270} s={0.95} body={C.emerald} mood="happy" pose="point" wave={Math.sin(frame * 0.4) * 5}>
                    <Phone x={96} y={-40} s={0.5} screen="#101e1a" label="≈" labelColor={C.bright} />
                  </Person>
                </>
              ) : null}
              {i === 2 ? (
                <>
                  <Phone x={90} y={170} s={1.1} screen="#101e1a" label="USDC" labelColor={C.bright} />
                  <KoloCard x={270} y={250} s={0.85} rot={-8} glow={send >= 1} />
                  {send > 0 && send < 1 ? <CoinDot cx={110 + 150 * send} cy={170 - Math.sin(send * Math.PI) * 90 + 70 * send} r={30} label="5" rotate={send * 360} /> : null}
                </>
              ) : null}
              {i === 3 ? (
                <>
                  <Person x={120} y={260} s={1.05} body={C.emerald} mood="happy" pose="cheer" wave={Math.sin(frame * 0.5) * 8} />
                  <Coffee x={290} y={250} s={0.85} steam={frame / 6} />
                </>
              ) : null}
            </svg>
            <StepLabel s={s} />
          </ComicPanel>
        ))}

        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[0, 1, 2].map((i) => {
            const x1 = px(i) + PW - 14;
            const x2 = px(i + 1) + 14;
            const y = PY + 240;
            const h = hop(i);
            return (
              <g key={i}>
                <InkArrow x1={x1} y1={y} x2={x2} y2={y} at={b(k + 1 + i, 2)} dur={6} bend={-46} color={C.gold} width={8} />
                {h > 0 && h < 1 ? <CoinDot cx={x1 + (x2 - x1) * h} cy={y - 34 - Math.sin(h * Math.PI) * 70} r={22} rotate={h * 180} /> : null}
              </g>
            );
          })}
        </svg>
      </Pulse>

      <ComicText text="NO TRUSTLINE!" from={b(k + 1, 3)} x={px(0) + PW / 2} y={PY + 30} size={58} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2, 3)} />
      <ComicText text="BEEP!" from={b(k + 2, 1)} x={px(1) + PW / 2} y={PY + 30} size={86} rotate={7} fill="#fff" variant="onomatopoeia" echoColor={C.rose} exitAt={b(k + 3, 3)} />
      <ComicText text="ZOOM!" from={b(k + 3, 3)} x={px(2) + PW / 2} y={PY + 30} size={86} rotate={-6} fill={C.bright} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 4, 3)} />
      <ComicText text="PAID!" from={b(k + 4, 1)} x={px(3) + PW / 2} y={PY + 30} size={90} rotate={-5} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`im${i}`} name="impact" at={b(k + 1 + i)} volume={0.55} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`wh${i}`} name="tick" at={b(k + 1 + i, 2)} volume={0.6} />
      ))}
      <Sfx name="whoosh" at={b(k + 3, 3)} volume={0.4} />
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.6} />
    </AbsoluteFill>
  );
};
