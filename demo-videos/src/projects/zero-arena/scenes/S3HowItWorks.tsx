import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, CoinDot, ComicPanel, ComicText, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Robot, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { Candles, CertDoc, ChainLink, NftCard, Trophy } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 5–9). Slides in on bar 5 with the title (b0); the
 * four steps are the real contract calls of the smoke flow:
 *   5 b1  CERTIFY  AgentCertificate.submit(runHash)      ("STAMPED!")
 *   6 b0  MINT     ZeroArenaINFT.mint → ERC-7857 iNFT    ("MINTED!")
 *   7 b0  LIVE     operator → LiveCertificate.update()   ("COMMIT!")
 *   8 b0  SEASON   Season.enroll → settle()              ("SETTLED!")
 */
const PW = 390;
const PH = 690;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 270;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Certify", body: "Deterministic backtest → runHash anchored in AgentCertificate.", bg: "#C9F7E4", bg2: C.emerald },
  { n: "2", title: "Mint iNFT", body: "The agent becomes an ERC-7857 iNFT. Strategy stays private.", bg: "#E2D9FF", bg2: C.violet },
  { n: "3", title: "Live run", body: "An operator commits every epoch to LiveCertificate, hash-chained.", bg: "#CDEFFF", bg2: C.cyan },
  { n: "4", title: "Season", body: "Enroll the iNFT, compete, then settle() pays the prize on-chain.", bg: "#FFF0B8", bg2: C.gold },
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
          color: C.emerald,
          fontFamily: F.comic,
          fontSize: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {s.n}
      </span>
      <span style={{ fontFamily: F.comic, fontSize: 50, color: INK, letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{s.title}</span>
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
  const k = BAR.how; // 5
  const AT = [b(k, 1), b(k + 1), b(k + 2), b(k + 3)];
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + i, k + 1 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const shine = interpolate(frame, [b(k + 1, 2), b(k + 1, 3)], [0, 1], clamp);
  const candles = Math.min(8, 3 + Math.max(0, Math.floor((frame - b(k + 2)) / (b(k + 2, 1) - b(k + 2)))) * 2);
  const links = frame >= b(k + 2, 3) ? 3 : frame >= b(k + 2, 2) ? 2 : frame >= b(k + 2, 1) ? 1 : 0;
  const coin = (i: number) => interpolate(frame, [b(k + 3, 1 + i), b(k + 3, 1 + i) + 8], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(52,211,153,0.18)" glowB="rgba(167,139,250,0.12)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill={C.emerald} stagger={1} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 198,
          textAlign: "center",
          fontFamily: F.display,
          fontStyle: "italic",
          fontSize: 34,
          color: C.text,
          opacity: interpolate(frame, [b(k, 1), b(k, 1) + 8], [0, 1], clamp),
        }}
      >
        four contract calls · every result on-chain
      </div>

      <Pulse intensity={0.9} shake={0.5}>
        {STEPS.map((s, i) =>
          frame < AT[i]! ? (
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
              }}
            >
              {s.n}
            </div>
          ) : null,
        )}
        {STEPS.map((s, i) => (
          <ComicPanel
            key={s.n}
            at={AT[i]!}
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
              {i === 0 ? <CertDoc x={PW / 2} y={218} s={1.2} rot={-4} /> : null}
              {i === 1 ? <NftCard x={PW / 2} y={218} s={1.2} rot={4} shine={shine} /> : null}
              {i === 2 ? (
                <>
                  <Candles x={PW / 2 + 10} y={130} s={1.2} n={candles} />
                  <Robot x={92} y={300} s={0.8} fill="#B7C2D6" visor={C.cyan} flame={0.6 + 0.4 * Math.sin(frame * 1.3)} />
                  {Array.from({ length: links }).map((_, j) => (
                    <ChainLink key={j} x={190 + j * 62} y={318} s={0.95} color={C.emerald} />
                  ))}
                </>
              ) : null}
              {i === 3 ? (
                <>
                  <Trophy x={PW / 2} y={220} s={1.35} />
                  {[0, 1].map((j) => (coin(j) > 0 ? <CoinDot key={j} cx={PW / 2 + (j ? 110 : -110)} cy={330 - coin(j) * 60} r={30} label="BNB" rotate={coin(j) * 360} /> : null))}
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
            return <InkArrow key={i} x1={x1} y1={y} x2={x2} y2={y} at={AT[i + 1]! - 6} dur={6} bend={-46} color={C.emerald} width={8} />;
          })}
        </svg>
      </Pulse>

      <ComicText text="STAMPED!" from={b(k, 2)} x={px(0) + PW / 2} y={PY + 30} size={76} rotate={-8} fill={C.emerald} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1)} />
      <ComicText text="MINTED!" from={b(k + 1, 1)} x={px(1) + PW / 2} y={PY + 50} size={80} rotate={7} fill="#fff" variant="onomatopoeia" echoColor={C.violet} exitAt={b(k + 2)} />
      <ComicText text="COMMIT!" from={b(k + 2, 1)} x={px(2) + PW / 2} y={PY + 30} size={80} rotate={-6} fill={C.cyan} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />
      <ComicText text="SETTLED!" from={b(k + 3, 1)} x={px(3) + PW / 2} y={PY + 50} size={76} rotate={-5} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {AT.map((t, i) => (
        <Sfx key={`im${i}`} name="impact" at={t} volume={0.55} />
      ))}
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`lk${i}`} name="tick" at={b(k + 2, i)} volume={0.5} />
      ))}
      <Sfx name="chime" at={b(k + 3, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
