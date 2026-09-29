import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Robot, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { HashSeal, JournalBook, KeyShield, MiniLadder } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 11–16). Slides in on the bar-11 break (title + "4 STEPS."),
 * then one comic step per bar, slamming on the downbeat, detail on b2 (README "How it works"):
 *   12 GRID     a ladder of maker orders inside a volatility-sized band — buy dips, sell rips
 *   13 COMMIT   StrategyLedger.commit(): the config hash goes on-chain BEFORE the first order
 *   14 TRADE    the Trust Wallet Agent Kit signs every order locally — keys never leave
 *   15 ATTEST   outcome attested + TradeJournal.record() — gated by the ERC-8004 identity
 */
const PW = 404;
const PH = 600;
const PY = 300;
const GAP = 38;
const X0 = (1920 - (PW * 4 + GAP * 3)) / 2;
const px = (i: number) => X0 + i * (PW + GAP);

const Step: React.FC<{ n: number; title: string; sub: React.ReactNode; subAt: number; children: React.ReactNode }> = ({ n, title, sub, subAt, children }) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", left: 22, top: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 54, height: 54, borderRadius: 99, background: INK, color: C.volt, fontFamily: F.comic, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
        <span style={{ fontFamily: F.comic, fontSize: 46, color: INK, letterSpacing: "0.03em" }}>{title}</span>
      </div>
      <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", inset: 0 }}>
        {children}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          padding: "12px 16px",
          background: "#f4efe4",
          border: `4px solid ${INK}`,
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 25,
          lineHeight: 1.25,
          color: INK,
          opacity: interpolate(f, [subAt, subAt + 5], [0, 1], clamp),
          transform: `translateY(${interpolate(f, [subAt, subAt + 7], [16, 0], clamp)}px)`,
        }}
      >
        {sub}
      </div>
    </>
  );
};

const code: React.CSSProperties = { fontFamily: F.mono, fontSize: 21, fontWeight: 700 };

export const S3HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 11
  const s = k + 1; // 12

  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(s + i, s + i + 1), 0.025, 5)); // eslint-disable-line react-hooks/rules-of-hooks
  const title = interpolate(frame, [b(k), b(k) + 10], [0, 1], clamp);
  const ladder = interpolate(frame, [b(s), b(s + 1)], [0.05, 1], clamp);
  const press = interpolate(frame, [b(s + 1, 1), b(s + 1, 1) + 6], [0, 1], clamp);
  const shield = interpolate(frame, [b(s + 2, 2), b(s + 2, 3)], [0, 1], clamp);
  const rows = frame >= b(s + 3, 2) ? 2 : frame >= b(s + 3, 1) ? 1 : 0;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,119,87,0.26)" glowB="rgba(159,255,0,0.08)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 92, textAlign: "center", opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: "0.3em", color: C.coralHi }}>HOW IT WORKS</div>
        <div style={{ fontFamily: F.display, fontWeight: 600, letterSpacing: "-0.02em", fontSize: 78, color: C.text, marginTop: 4 }}>
          buy dips, sell rips, <span style={{ color: C.coralHi }}>prove every step.</span>
        </div>
      </div>

      <Pulse intensity={1} shake={0.4}>
        <ComicPanel at={b(s)} x={px(0)} y={PY} w={PW} h={PH} rot={-1.4} bg={C.cream} bg2={C.coralHi} from="up" punch={punches[0]}>
          <Step n={1} title="GRID" sub="Maker orders on a ladder inside a volatility-sized band. Each round trip banks a spread." subAt={b(s, 2)}>
            <MiniLadder x={202} y={290} s={0.95} p={ladder} w={290} h={260} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 1)} x={px(1)} y={PY + 14} w={PW} h={PH} rot={1.2} bg="#FFE9A8" bg2={C.gold} from="down" punch={punches[1]}>
          <Step n={2} title="COMMIT" sub={<>Config hash → <span style={code}>StrategyLedger.commit()</span> before the first order.</>} subAt={b(s + 1, 2)}>
            <HashSeal x={202} y={250} s={1.15} press={press} label="" />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 2)} x={px(2)} y={PY - 6} w={PW} h={PH} rot={-1} bg="#DCE8FF" bg2="#7aa2e8" from="down" punch={punches[2]}>
          <Step n={3} title="TRADE" sub="Trust Wallet Agent Kit signs every order locally. Keys never leave the machine." subAt={b(s + 2, 2)}>
            <Robot x={110} y={330} s={0.85} mood="happy" visor={C.coralHi} fill="#9AA3B5" />
            <KeyShield x={280} y={270} s={0.95} glow={shield} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 3)} x={px(3)} y={PY + 8} w={PW} h={PH} rot={1.5} bg="#E9FFC9" bg2={C.volt} from="right" punch={punches[3]}>
          <Step n={4} title="ATTEST" sub={<>Outcome attested + <span style={code}>TradeJournal.record()</span>. Only the agent can write.</>} subAt={b(s + 3, 2)}>
            <JournalBook x={202} y={270} s={0.95} rows={rows} chip="+bps" />
          </Step>
        </ComicPanel>

        {[0, 1, 2].map((i) => (
          <InkArrow key={i} x1={px(i) + PW - 30} y1={PY + 110} x2={px(i + 1) + 40} y2={PY + 110} at={b(s + i + 1) - 4} dur={6} bend={-30} color={C.coralHi} width={6} />
        ))}
      </Pulse>

      <ComicText text="4 STEPS." from={b(k, 2)} x={960} y={620} size={170} rotate={-4} fill={C.volt} variant="onomatopoeia" echoColor={INK} exitAt={b(s) - 2} />

      <InkFrame inset={22} width={5} opacity={0.85} color={C.cream} />

      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Sfx name="impact" at={b(s + i)} volume={0.7} />
          <Sfx name="tick" at={b(s + i, 2)} volume={0.5} />
        </React.Fragment>
      ))}
      <Sfx name="impact" at={b(s + 1, 1)} volume={0.5} />
      <Sfx name="chime" at={b(s + 2, 2)} volume={0.35} />
      <Sfx name="tick" at={b(s + 3, 1)} volume={0.45} />
    </AbsoluteFill>
  );
};
