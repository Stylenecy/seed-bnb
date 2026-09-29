import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  clamp,
  ComicPanel,
  Halftone,
  inkTextStyle,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  steppedCount,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · STAT WALL (bars 19–21) — DROP. A comic card every 2 beats, counters
 * tick on beats (values from VERIFY-BNB.md, real testnet smoke run):
 *   bar 19 b0  $20 → AAPLx + TSLAx         (count ticks b0–b1)
 *   bar 19 b2  0.25% fee → treasury ($0.05)
 *   bar 20 b0  risk ceiling 7000: 9500 reverted
 *   bar 20 b2  live pool prices + 368k gas
 */
const INKC = "#141a17";
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: INKC, marginTop: 8, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: INKC, letterSpacing: "0.04em" }}>{children}</div>
);

export const S7Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.stats; // 19

  const usd = steppedCount(frame, [b(k), b(k, 0.5), b(k, 1)], [0, 12, 20]);
  const risk = steppedCount(frame, [b(k + 1), b(k + 1, 0.5), b(k + 1, 1)], [0, 7000, 9500]);
  const pA = useBeatPunch([b(k), b(k, 1)], 0.04, 4);
  const pB = useBeatPunch([b(k, 2), b(k, 3)], 0.04, 4);
  const pC = useBeatPunch([b(k + 1), b(k + 1, 1)], 0.04, 4);
  const pD = useBeatPunch([b(k + 1, 2), b(k + 1, 3)], 0.04, 4);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(108,192,156,0.24)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color="#F0B90B" opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={0.8}>
        <ComicPanel at={b(k)} x={100} y={120} w={940} h={410} rot={-2} bg="#BFE8D2" bg2="#6cc09c" from="left" punch={pA}>
          <div style={{ padding: "36px 46px" }}>
            <Head>ONE SENTENCE → TWO STOCKS</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 6 }}>
              <span style={{ ...inkTextStyle(160, "#fff"), fontVariantNumeric: "tabular-nums" }}>${usd}</span>
              <span style={{ ...inkTextStyle(90, C.terracotta) }}>→</span>
              <span style={{ ...inkTextStyle(80, "#fff") }}>AAPLx</span>
              <span style={{ ...inkTextStyle(80, "#fff") }}>+ TSLAx</span>
            </div>
            <Label>{CHAIN.smoke.aaplOut} AAPLx + {CHAIN.smoke.tslaOut} TSLAx, one investWithAI tx</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k, 2)} x={1090} y={110} w={730} h={410} rot={2.2} bg="#FFE9A8" bg2="#F0B90B" from="right" punch={pB}>
          <div style={{ padding: "36px 46px" }}>
            <Head>FEE TO TREASURY</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 6 }}>
              <span style={{ ...inkTextStyle(160, "#fff") }}>0.25</span>
              <span style={{ ...inkTextStyle(100, "#fff") }}>%</span>
            </div>
            <Label>$0.05 of $20 → treasury, $19.95 invested</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={160} y={590} w={820} h={370} rot={1.6} bg="#F7C3AE" bg2="#ec8d6c" from="down" punch={pC}>
          <div style={{ padding: "34px 46px" }}>
            <Head>RISK CEILING, ON-CHAIN</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(140, "#fff"), fontVariantNumeric: "tabular-nums" }}>{risk}</span>
              <span style={{ ...inkTextStyle(64, "#fff") }}>&gt; 7000</span>
            </div>
            <Label>
              {frame >= b(k + 1, 1) ? "→ RiskCeilingBreached, the tx reverts" : "a plan scored above the max…"}
            </Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1, 2)} x={1030} y={600} w={790} h={350} rot={-1.8} bg="#D8E6F2" bg2="#9fb4d8" from="down" punch={pD}>
          <div style={{ padding: "34px 46px" }}>
            <Head>LIVE POOL PRICES</Head>
            <div style={{ display: "flex", gap: 40, marginTop: 6 }}>
              <div>
                <div style={{ ...inkTextStyle(96, "#fff") }}>${CHAIN.prices.aapl}</div>
                <Label>AAPL</Label>
              </div>
              <div style={{ opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 4], [0, 1], clamp) }}>
                <div style={{ ...inkTextStyle(96, "#fff") }}>${CHAIN.prices.tsla}</div>
                <Label>TSLA</Label>
              </div>
            </div>
          </div>
        </ComicPanel>
      </Pulse>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 48,
          textAlign: "center",
          fontFamily: F.sans,
          fontSize: 24,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(238,242,240,0.6)",
          opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 8], [0, 1], clamp),
        }}
      >
        from the live BSC testnet smoke run · 2026-09-25 · prices read by /api/prices from pool slot0
      </div>

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[b(k), b(k, 2), b(k + 1), b(k + 1, 2)].map((f, i) => (
        <Sfx key={`s${i}`} name="impact" at={f} volume={0.75} />
      ))}
      {[b(k, 1), b(k + 1, 1), b(k + 1, 3)].map((f, i) => (
        <Sfx key={`t${i}`} name="tick" at={f} volume={0.7} />
      ))}
    </AbsoluteFill>
  );
};
