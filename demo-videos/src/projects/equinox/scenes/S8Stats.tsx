import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, Halftone, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S8 · STAT WALL (bars 32–36) — DROP, the track's peak. One comic card per
 * bar; values tick on beats. All from VERIFY-BNB.md.
 *   bar 32  HF 2.00 → 1.14 → 1.50 (b1, b2, b3)
 *   bar 33  1,400 tUSDT borrowed by the agent (40% of $3,500)
 *   bar 34  0.000997 tBNB for deploy + 14 txs
 *   bar 35  BREAK — 15/15 unit tests (b0) · 3/3 Venus fork tests (b2)
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: "#1b1b1b", marginTop: 10, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#1b1b1b", letterSpacing: "0.04em" }}>{children}</div>
);

export const S8Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 32

  const hfSteps = [b(k), b(k, 1), b(k, 2), b(k, 3)];
  const hf = steppedCount(frame, hfSteps, [2.0, 2.0, 1.14, 1.5]);
  const hfCol = frame >= b(k, 3) ? C.lime : frame >= b(k, 2) ? C.rose : "#fff";
  const borrowed = steppedCount(frame, [b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], [0, 500, 1000, 1400]);
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.04, 4);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.04, 4);
  const pC = useBeatPunch(beatsIn(k + 2, k + 3), 0.04, 4);
  const pD = useBeatPunch([b(k + 3), b(k + 3, 2)], 0.04, 4);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(145,129,245,0.24)" glowB="rgba(228,243,61,0.14)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color="#F0B90B" opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={130} w={900} h={400} rot={-2} bg="#D9D2FF" bg2="#9181f5" from="left" punch={pA}>
          <div style={{ padding: "40px 46px" }}>
            <Head>HEALTH FACTOR · LIVE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(180, hfCol), fontVariantNumeric: "tabular-nums" }}>{hf.toFixed(2)}</span>
            </div>
            <Label>skim 2.00 → crash 1.14 → defend 1.50 (exactly minHf)</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={1070} y={110} w={740} h={400} rot={2.2} bg="#B8CCFF" bg2="#407aff" from="right" punch={pB}>
          <div style={{ padding: "40px 46px" }}>
            <Head>AGENT BORROWED</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(170, "#fff"), fontVariantNumeric: "tabular-nums" }}>{borrowed.toLocaleString("en-US")}</span>
              <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 60, color: "#1b1b1b" }}>tUSDT</span>
            </div>
            <Label>40% target LTV against 5 tWBNB at $700</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 2)} x={170} y={590} w={800} h={360} rot={1.6} bg="#F4FBB0" bg2="#e4f33d" from="down" punch={pC}>
          <div style={{ padding: "38px 46px" }}>
            <Head>TOTAL GAS · DEPLOY + 14 TXS</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(140, "#fff") }}>0.000997</span>
              <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 60, color: "#1b1b1b" }}>tBNB</span>
            </div>
            <Label>at 0.1 gwei on BSC testnet</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 3)} x={1030} y={600} w={780} h={340} rot={-1.8} bg="#A8F5DD" bg2="#16d9a8" from="down" punch={pD}>
          <div style={{ padding: "36px 46px", display: "flex", gap: 50 }}>
            <div>
              <div style={{ ...inkTextStyle(150, "#fff") }}>15/15</div>
              <Label>unit tests pass</Label>
            </div>
            <div style={{ opacity: interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 4], [0, 1], clamp), transform: `scale(${interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 6], [0.6, 1], clamp)})` }}>
              <div style={{ ...inkTextStyle(150, "#fff") }}>3/3</div>
              <Label>Venus fork tests</Label>
            </div>
          </div>
        </ComicPanel>
      </Pulse>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 50,
          textAlign: "center",
          fontFamily: F.sans,
          fontSize: 24,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(237,237,235,0.6)",
          opacity: interpolate(frame, [b(k + 3, 1), b(k + 3, 1) + 8], [0, 1], clamp),
        }}
      >
        live BSC testnet run · 2026-09-25 · fork tests on a BSC mainnet fork
      </div>

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`s${i}`} name="impact" at={b(k + i)} volume={0.75} />
      ))}
      {[1, 2, 3].map((i) => (
        <Sfx key={`a${i}`} name="tick" at={b(k, i)} volume={0.7} />
      ))}
      {[1, 2, 3].map((i) => (
        <Sfx key={`b${i}`} name="tick" at={b(k + 1, i)} volume={0.7} />
      ))}
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.7} />
    </AbsoluteFill>
  );
};
