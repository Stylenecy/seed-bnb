import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Robot, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { ChainLinks, FlexChart, IdCard, Ledger, Magnifier, Receipt } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 19–24). Slides in on bar 19 (title card + "4 STEPS."),
 * then one comic step per bar, slamming on the downbeat, detail on b2:
 *   20 REGISTER  IdentityRegistry.register() mints the agent an ERC-8004 NFT
 *   21 TRADE     strategies + risk layer run locally, non-custodial
 *   22 MIRROR    RiskManager queues each settled trade → TradeJournal.record(...)
 *   23 VERIFY    only ownerOf(agentId) may append; anyone can read
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
        <span style={{ width: 54, height: 54, borderRadius: 99, background: INK, color: C.gold, fontFamily: F.comic, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
        <span style={{ fontFamily: F.comic, fontSize: 44, color: INK, letterSpacing: "0.03em" }}>{title}</span>
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
  const k = BAR.how; // 19
  const s = k + 1; // 20

  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(s + i, s + i + 1), 0.025, 5)); // eslint-disable-line react-hooks/rules-of-hooks
  const title = interpolate(frame, [b(k), b(k) + 10], [0, 1], clamp);
  const shine = interpolate(frame, [b(s, 1), b(s, 3)], [0, 1], clamp);
  const chart = interpolate(frame, [b(s + 1), b(s + 1, 2)], [0.1, 1], clamp);
  const rec = interpolate(frame, [b(s + 2), b(s + 2, 1)], [0, 1], clamp);
  const rows = frame >= b(s + 3, 2) ? 2 : frame >= b(s + 3, 1) ? 1 : 0;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(105,147,120,0.26)" glowB="rgba(240,185,11,0.1)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 92, textAlign: "center", opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: "0.3em", color: C.moss }}>HOW IT WORKS</div>
        <div style={{ fontFamily: F.sans, fontWeight: 500, letterSpacing: "-0.02em", fontSize: 72, color: C.text, marginTop: 6 }}>
          The agent trades. <span style={{ fontFamily: F.serif, fontStyle: "italic", color: C.bone, fontSize: 84 }}>The chain keeps the receipts.</span>
        </div>
      </div>

      <Pulse intensity={1} shake={0.4}>
        <ComicPanel at={b(s)} x={px(0)} y={PY} w={PW} h={PH} rot={-1.4} bg="#D8F3E1" bg2="#699378" from="up" punch={punches[0]}>
          <Step n={1} title="REGISTER" sub={<>IdentityRegistry mints the agent an <b>ERC-8004</b> NFT.</>} subAt={b(s, 2)}>
            <IdCard x={202} y={290} s={1.05} rot={-4} shine={shine} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 1)} x={px(1)} y={PY + 14} w={PW} h={PH} rot={1.2} bg="#DCE2FF" bg2="#9aa8f0" from="down" punch={punches[1]}>
          <Step n={2} title="TRADE" sub="7 strategies + a risk layer, on your machine. Non-custodial." subAt={b(s + 1, 2)}>
            <FlexChart x={262} y={250} s={0.62} p={chart} label="CLOSED" />
            <Robot x={120} y={340} s={0.85} mood="happy" visor={C.pos} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 2)} x={px(2)} y={PY - 6} w={PW} h={PH} rot={-1} bg="#FFE9A8" bg2="#F0B90B" from="down" punch={punches[2]}>
          <Step n={3} title="MIRROR" sub={<>Each settled trade → <span style={code}>TradeJournal.record()</span></>} subAt={b(s + 2, 2)}>
            <Receipt x={140} y={interpolate(rec, [0, 1], [200, 280])} s={0.78} rot={-6} lines={["AGENT #1", "pnlBps", "closedAt"]} big="+bps" />
            <ChainLinks x={300} y={300} s={0.8} rot={-30} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 3)} x={px(3)} y={PY + 8} w={PW} h={PH} rot={1.5} bg="#C9F5E3" bg2="#34d399" from="right" punch={punches[3]}>
          <Step n={4} title="VERIFY" sub={<>Only <span style={code}>ownerOf(agentId)</span> can append. Anyone can read.</>} subAt={b(s + 3, 2)}>
            <Ledger x={190} y={270} s={0.95} rows={rows} />
            <Magnifier x={290} y={200} s={0.8} />
          </Step>
        </ComicPanel>

        {[0, 1, 2].map((i) => (
          <InkArrow key={i} x1={px(i) + PW - 30} y1={PY + 110} x2={px(i + 1) + 40} y2={PY + 110} at={b(s + i + 1) - 4} dur={6} bend={-30} color={C.gold} width={6} />
        ))}
      </Pulse>

      <ComicText text="4 STEPS." from={b(k, 2)} x={960} y={620} size={170} rotate={-4} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(s) - 2} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Sfx name="impact" at={b(s + i)} volume={0.7} />
          <Sfx name="tick" at={b(s + i, 2)} volume={0.5} />
        </React.Fragment>
      ))}
      <Sfx name="tick" at={b(s + 3, 1)} volume={0.45} />
    </AbsoluteFill>
  );
};
