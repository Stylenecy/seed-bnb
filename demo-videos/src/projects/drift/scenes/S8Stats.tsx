import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S8 · STAT WALL (bars 53–56). A card every two beats, numbers tick on beats.
 * Every value is from VERIFY-BNB.md (and re-read live from the contract):
 *   53 b0  7/7 forge tests              53 b2  20% max drawdown (maxDrawdownBps 2000)
 *   54 b0  deploy + 8 txs = 0.0000688 tBNB   54 b2  decisionCount 3 (ticks 1 → 2 → 3)
 *   55     (dip bar) "AGENT-ONLY." — any other caller reverts NotAgent()
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 29, color: "#16161c", marginTop: 8, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#16161c", letterSpacing: "0.04em" }}>{children}</div>
);

export const S8Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 53

  const tests = steppedCount(frame, [b(k), b(k, 1)], [5, 7]);
  const dec = steppedCount(frame, [b(k + 1, 2), b(k + 1, 3), b(k + 2)], [1, 2, 3]);
  const pA = useBeatPunch([b(k), b(k, 1)], 0.04, 4);
  const pB = useBeatPunch([b(k, 2), b(k, 3)], 0.04, 4);
  const pC = useBeatPunch([b(k + 1), b(k + 1, 1)], 0.04, 4);
  const pD = useBeatPunch([b(k + 1, 2), b(k + 1, 3), b(k + 2)], 0.04, 4);
  const dim = interpolate(frame, [b(k + 2), b(k + 2) + 5], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(154,168,240,0.26)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color={C.gold} opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={120} w={820} h={400} rot={-2} bg="#DCE2FF" bg2="#9aa8f0" from="left" punch={pA}>
          <div style={{ padding: "40px 46px" }}>
            <Head>FORGE TESTS</Head>
            <div style={{ ...inkTextStyle(190, "#fff"), fontFamily: F.sans, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{tests}/7</div>
            <Label>MacroGuard unit tests pass</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k, 2)} x={990} y={100} w={820} h={420} rot={2.2} bg="#FFC2C2" bg2="#f87171" from="right" punch={pB}>
          <div style={{ padding: "40px 46px" }}>
            <Head>HARD DRAWDOWN STOP</Head>
            <div style={{ ...inkTextStyle(190, "#fff"), fontFamily: F.sans, fontWeight: 900, marginTop: 4 }}>20%</div>
            <Label>maxDrawdownBps 2000 · −25% → Halted</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={150} y={590} w={820} h={370} rot={1.6} bg="#FFE9A8" bg2="#F0B90B" from="down" punch={pC}>
          <div style={{ padding: "38px 46px" }}>
            <Head>GAS · DEPLOY + 8 TXS</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(130, "#fff"), fontFamily: F.sans, fontWeight: 900 }}>{CHAIN.totalGas}</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 56, color: "#16161c" }}>tBNB</span>
            </div>
            <Label>recordDecision ≈ 33k gas per tick</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1, 2)} x={1030} y={600} w={780} h={360} rot={-1.8} bg="#C9F5E3" bg2="#34d399" from="down" punch={pD}>
          <div style={{ padding: "36px 46px" }}>
            <Head>DECISIONS ON-CHAIN</Head>
            <div style={{ ...inkTextStyle(170, "#fff"), fontFamily: F.sans, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{dec}</div>
            <Label>decisionCount() · the last one sent by the engine</Label>
          </div>
        </ComicPanel>
      </Pulse>

      <AbsoluteFill style={{ background: "rgba(8,9,11,0.8)", opacity: dim }} />
      <ComicText text="AGENT-ONLY." from={b(k + 2)} x={960} y={500} size={210} rotate={-5} skewX={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} />
      {frame >= b(k + 2, 2) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "16px 30px", background: "#f4efe4", border: `5px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`, transform: `rotate(-1.5deg) scale(${interpolate(frame, [b(k + 2, 2), b(k + 2, 2) + 5], [1.3, 1], clamp)})`, fontFamily: F.mono, fontWeight: 700, fontSize: 44, color: INK }}>
            any other caller → reverts <span style={{ color: "#b45309" }}>NotAgent()</span>
          </div>
        </div>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.75} />
      <Sfx name="tick" at={b(k, 1)} volume={0.7} />
      <Sfx name="impact" at={b(k, 2)} volume={0.75} />
      <Sfx name="impact" at={b(k + 1)} volume={0.75} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.75} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.7} />
      <Sfx name="impact" at={b(k + 2)} volume={0.9} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
