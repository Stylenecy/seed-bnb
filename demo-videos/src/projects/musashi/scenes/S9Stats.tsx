import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ComicPanel, fadeUp, Halftone, InkFrame, inkTextStyle, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { InkNight } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S9 · STAT WALL (bars 62–64). Every number from VERIFY-BNB.md.
 *   62 b0  1 strike, 1 win, 0 losses          b2  +2,500 bps outcome (ticks b2 · b3)
 *   63 b0  0.000834 tBNB total gas            b1  48/48 forge tests · 10/10 frontend
 *   63 b2  footer                             b3  honest note: 0G Storage skipped
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: "#1b1b1b", marginTop: 8, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#1b1b1b", letterSpacing: "0.04em" }}>{children}</div>
);

export const S9Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 62

  const bps = steppedCount(frame, [b(k, 2), b(k, 3)], [1250, 2500]);
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.04, 4);
  const pB = useBeatPunch([b(k, 2), b(k, 3)], 0.04, 4);
  const pC = useBeatPunch(beatsIn(k + 1, k + 2), 0.04, 4);
  const pD = useBeatPunch([b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], 0.04, 4);

  return (
    <AbsoluteFill>
      <InkNight glow={1.2} />
      <Halftone opacity={0.06} gap={18} color={C.amber} />
      <SpeedBurst cx={960} cy={500} from={0} count={24} inner={300} spread={900} color={C.gold} opacity={0.25} width={6} seed="mstats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={100} w={860} h={380} rot={-2} bg="#fde7c2" bg2={C.amber} from="left" punch={pA}>
          <div style={{ padding: "36px 46px" }}>
            <Head>AGENT #0 · ON-CHAIN RECORD</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(170, "#fff") }}>1</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: "#1b1b1b" }}>strike · 1 win</span>
            </div>
            <Label>0 losses · read back from ConvictionLog.reputation()</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k, 2)} x={1030} y={90} w={780} h={380} rot={2.2} bg="#e9f2e6" bg2={C.green} from="right" punch={pB}>
          <div style={{ padding: "36px 46px" }}>
            <Head>RECORDED OUTCOME</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(150, "#fff"), fontVariantNumeric: "tabular-nums" }}>+{bps.toLocaleString("en-US")}</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: "#1b1b1b" }}>bps</span>
            </div>
            <Label>recordOutcome(0, +2500) · the dashboard shows +25.0%</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={150} y={540} w={860} h={370} rot={1.6} bg="#FFF0B8" bg2={C.gold} from="down" punch={pC}>
          <div style={{ padding: "34px 46px" }}>
            <Head>TOTAL GAS · DEPLOY + SMOKE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(112, "#fff") }}>0.000834</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: "#1b1b1b" }}>tBNB</span>
            </div>
            <Label>4 creates + link + oracle + 3 smoke txs, at 0.1 gwei</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1, 1)} x={1070} y={550} w={740} h={360} rot={-1.8} bg="#ffe1d6" bg2={C.crimson} from="down" punch={pD}>
          <div style={{ padding: "34px 46px" }}>
            <Head>CONTRACT TESTS</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(150, "#fff") }}>48/48</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 48, color: "#1b1b1b" }}>forge</span>
            </div>
            <Label>+ frontend 10/10 · Go engine build, vet, test pass</Label>
          </div>
        </ComicPanel>
      </Pulse>

      {frame >= b(k + 1, 2) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 104, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 28, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(241,245,249,0.75)", ...fadeUp(frame, b(k + 1, 2), 8, 12) }}>
          CAKE cut at gate 1 · ARIA passes gates 1–3, 6, 7 · read-only live BSC checks
        </div>
      ) : null}
      {frame >= b(k + 1, 3) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k + 1, 3), 8, 12) }}>
          <div style={{ padding: "8px 22px", borderRadius: 999, background: "rgba(40,28,6,0.92)", border: `1.5px solid ${C.amberHi}aa`, color: C.amberHi, fontFamily: F.sans, fontWeight: 700, fontSize: 24 }}>
            Honest note: 0G Storage writes were skipped; agent 0 points at a placeholder storage root.
          </div>
        </div>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.85} color={C.washi} />

      <Sfx name="impact" at={b(k)} volume={0.75} />
      <Sfx name="tick" at={b(k, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k, 2)} volume={0.7} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1)} volume={0.75} />
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.7} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.55} />
    </AbsoluteFill>
  );
};
