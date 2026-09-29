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
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · STAT WALL (bars 32–36) — DROP (the track's peak). One card per bar,
 * counters tick on the beats. Every value is from VERIFY-BNB.md.
 *   32  0 trustlines · 0.001 BNB to activate
 *   33  995 USDC read by /balance (ticks b1–b3)
 *   34  202 → 201 activation gate
 *   35  BREAK — tests: 42/42 backend (b0) · 29/29 frontend (b1) · 3/3 forge (b2)
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: "#101e1a", marginTop: 10, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#101e1a", letterSpacing: "0.04em" }}>{children}</div>
);

export const S7Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 32

  const bal = steppedCount(frame, [b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], [0, 300, 700, 995]);
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.04, 4);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.04, 4);
  const pC = useBeatPunch(beatsIn(k + 2, k + 3), 0.04, 4);
  const pD = useBeatPunch([b(k + 3), b(k + 3, 1), b(k + 3, 2)], 0.04, 4);
  const show = (at: number) => ({
    opacity: interpolate(frame, [at, at + 4], [0, 1], clamp),
    transform: `scale(${interpolate(frame, [at, at + 6], [0.6, 1], clamp)})`,
  });

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(47,217,138,0.22)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color="#F0B90B" opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={120} w={900} h={410} rot={-2} bg="#FFE9A8" bg2="#F0B90B" from="left" punch={pA}>
          <div style={{ padding: "40px 46px" }}>
            <Head>TO ACTIVATE A WALLET</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(160, "#fff") }}>0.001</span>
              <span style={{ ...inkTextStyle(100, "#fff") }}>BNB</span>
            </div>
            <div style={{ ...show(b(k, 2)), transformOrigin: "left center" }}>
              <Label>for gas · and 0 trustlines (USDC is a BEP-20)</Label>
            </div>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={1070} y={100} w={740} h={410} rot={2.2} bg="#B8F5D6" bg2={C.bright} from="right" punch={pB}>
          <div style={{ padding: "40px 46px" }}>
            <Head>GET /BALANCE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(170, "#fff"), fontVariantNumeric: "tabular-nums" }}>{bal}</span>
              <span style={{ ...inkTextStyle(90, "#fff") }}>USDC</span>
            </div>
            <Label>read from the MockUSDC contract</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 2)} x={170} y={590} w={800} h={360} rot={1.6} bg="#FFD0C4" bg2="#E88A6F" from="down" punch={pC}>
          <div style={{ padding: "38px 46px" }}>
            <Head>THE ACTIVATION GATE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(150, "#F0B90B") }}>202</span>
              <span style={{ ...inkTextStyle(100, "#fff"), ...show(b(k + 2, 1)) }}>→</span>
              <span style={{ ...inkTextStyle(150, C.bright), ...show(b(k + 2, 2)) }}>201</span>
            </div>
            <Label>awaiting_funding until the wallet holds gas</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 3)} x={1030} y={600} w={780} h={340} rot={-1.8} bg="#C9DCFF" bg2="#7EA6F2" from="down" punch={pD}>
          <div style={{ padding: "34px 40px" }}>
            <Head>TESTS PASS</Head>
            <div style={{ display: "flex", gap: 36, marginTop: 6 }}>
              {[
                { v: "42/42", l: "backend", at: b(k + 3) },
                { v: "29/29", l: "frontend", at: b(k + 3, 1) },
                { v: "3/3", l: "forge", at: b(k + 3, 2) },
              ].map((x) => (
                <div key={x.l} style={show(x.at)}>
                  <div style={{ ...inkTextStyle(100, "#fff") }}>{x.v}</div>
                  <Label>{x.l}</Label>
                </div>
              ))}
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
          color: "rgba(238,243,238,0.6)",
          opacity: interpolate(frame, [b(k + 3, 1), b(k + 3, 1) + 8], [0, 1], clamp),
        }}
      >
        from VERIFY-BNB.md · live BSC testnet run · 2026-09-25
      </div>

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`s${i}`} name="impact" at={b(k + i)} volume={0.75} />
      ))}
      {[1, 2, 3].map((i) => (
        <Sfx key={`b${i}`} name="tick" at={b(k + 1, i)} volume={0.7} />
      ))}
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.7} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.7} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.7} />
    </AbsoluteFill>
  );
};
