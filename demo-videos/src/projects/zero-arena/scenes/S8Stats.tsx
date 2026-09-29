import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, fadeUp, Halftone, INK, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S8 · STAT WALL (bars 19–21) — DROP. Every number from VERIFY-BNB.md.
 *   19 b0  9 smoke txs, status 1 (ticks 3 · 6 · 9 on b1–b3)
 *   19 b2  2 epochs committed, hash chain matched
 *   20 b0  0.002 tBNB pool → 0.001 winner + 0.001 refund
 *   20 b1  ≈0.00071 tBNB total gas (deploy + smoke)
 *   20 b2  tests footer · b3 honest caveat: 0G storage uploads skipped
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: "#1b1b1b", marginTop: 8, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#1b1b1b", letterSpacing: "0.04em" }}>{children}</div>
);

export const S8Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 19

  const txs = steppedCount(frame, [b(k), b(k, 1), b(k, 2), b(k, 3)], [0, 3, 6, 9]);
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.04, 4);
  const pB = useBeatPunch([b(k, 2), b(k, 3)], 0.04, 4);
  const pC = useBeatPunch(beatsIn(k + 1, k + 2), 0.04, 4);
  const pD = useBeatPunch([b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], 0.04, 4);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(52,211,153,0.22)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={500} from={0} count={24} inner={300} spread={900} color={C.gold} opacity={0.28} width={6} seed="zastats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={100} w={860} h={380} rot={-2} bg="#C9F7E4" bg2={C.emerald} from="left" punch={pA}>
          <div style={{ padding: "36px 46px" }}>
            <Head>SMOKE FLOW · REAL TESTNET</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(170, "#fff"), fontVariantNumeric: "tabular-nums" }}>{txs}/9</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: "#1b1b1b" }}>txs</span>
            </div>
            <Label>certify → mint → run → season → settle · all status 1</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k, 2)} x={1030} y={90} w={780} h={380} rot={2.2} bg="#CDEFFF" bg2={C.cyan} from="right" punch={pB}>
          <div style={{ padding: "36px 46px" }}>
            <Head>OPERATOR COMMITS</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(170, "#fff") }}>2</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: "#1b1b1b" }}>epochs</span>
            </div>
            <Label>hash chain recomputed = on-chain cumulativeHash</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={150} y={540} w={860} h={370} rot={1.6} bg="#FFF0B8" bg2={C.gold} from="down" punch={pC}>
          <div style={{ padding: "34px 46px" }}>
            <Head>SEASON #1 PRIZE POOL</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(140, "#fff") }}>0.002</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: "#1b1b1b" }}>tBNB</span>
            </div>
            <Label>settled: 0.001 winner + 0.001 refund · balance 0</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1, 1)} x={1070} y={550} w={740} h={360} rot={-1.8} bg="#E2D9FF" bg2={C.violet} from="down" punch={pD}>
          <div style={{ padding: "34px 46px" }}>
            <Head>TOTAL GAS · DEPLOY + SMOKE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(130, "#fff") }}>≈0.00071</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 48, color: "#1b1b1b" }}>tBNB</span>
            </div>
            <Label>at 0.1 gwei on BSC testnet</Label>
          </div>
        </ComicPanel>
      </Pulse>

      {frame >= b(k + 1, 2) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 104, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 28, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(250,250,250,0.75)", ...fadeUp(frame, b(k + 1, 2), 8, 12) }}>
          78/78 contract tests · 109 SDK tests · oracle rejects wrong chain (400) + non-owner (403)
        </div>
      ) : null}
      {frame >= b(k + 1, 3) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k + 1, 3), 8, 12) }}>
          <div style={{ padding: "8px 22px", borderRadius: 999, background: "rgba(40,28,6,0.92)", border: `1.5px solid ${C.amber}aa`, color: C.amber, fontFamily: F.sans, fontWeight: 700, fontSize: 24 }}>
            Honest note: 0G Storage uploads were skipped on testnet; storage roots are placeholders.
          </div>
        </div>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.75} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`a${i}`} name="tick" at={b(k, i)} volume={0.65} />
      ))}
      <Sfx name="impact" at={b(k, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1)} volume={0.75} />
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.7} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.55} />
    </AbsoluteFill>
  );
};
