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
 * S8 · STAT WALL (bars 32–36). Hard cut on the bar-32 DROP, the track's
 * peak. One panel per bar; counters tick on beats. Every
 * value is from VERIFY-BNB.md (live BSC-testnet run, 2026-09-25).
 *   32  8,000 USDC payroll · 2 employees · 300 s cycle
 *   33  1,000 → 985 advance · flat 1.5% fee
 *   34  4,000 claimed · advance repaid, debt 0
 *   35  (break) 265/265 tests · 12 contracts · ~0.0025 tBNB gas
 */
const INKC = "#0A0F1C";
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: INKC, marginTop: 10, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: INKC, letterSpacing: "0.04em" }}>{children}</div>
);

export const S8Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 32

  const payroll = steppedCount(frame, [b(k), b(k, 1), b(k, 2), b(k, 3)], [0, 3000, 5000, 8000]);
  const claimed = steppedCount(frame, [b(k + 2), b(k + 2, 1), b(k + 2, 2)], [0, 2000, 4000]);
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.04, 4);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.04, 4);
  const pC = useBeatPunch(beatsIn(k + 2, k + 3), 0.04, 4);
  const pD = useBeatPunch(beatsIn(k + 3, k + 4), 0.04, 4);
  const show = (at: number) => ({
    opacity: interpolate(frame, [at, at + 4], [0, 1], clamp),
    transform: `scale(${interpolate(frame, [at, at + 6], [0.6, 1], clamp)})`,
  });

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(124,58,237,0.24)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color="#F0B90B" opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.1} shake={0.6}>
        <ComicPanel at={b(k)} x={110} y={110} w={880} h={420} rot={-2} bg="#DCCFFF" bg2={C.violet} from="left" punch={pA}>
          <div style={{ padding: "40px 46px" }}>
            <Head>PAYROLL DEPOSITED</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(160, "#fff"), fontVariantNumeric: "tabular-nums" }}>{payroll.toLocaleString("en-US")}</span>
              <span style={{ ...inkTextStyle(80, "#fff") }}>USDC</span>
            </div>
            <div style={{ ...show(b(k, 2)), transformOrigin: "left center" }}>
              <Label>2 employees (5,000 + 3,000) · 300 s cycle</Label>
            </div>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={1050} y={96} w={760} h={420} rot={2.2} bg="#FFE9A8" bg2="#F0B90B" from="right" punch={pB}>
          <div style={{ padding: "40px 46px" }}>
            <Head>SALARY ADVANCE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(130, "#fff") }}>1,000</span>
              <span style={{ ...inkTextStyle(90, "#fff"), ...show(b(k + 1, 1)) }}>→</span>
              <span style={{ ...inkTextStyle(130, C.emerald), ...show(b(k + 1, 2)) }}>985</span>
            </div>
            <Label>flat 1.5% fee · no interest</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 2)} x={170} y={590} w={800} h={370} rot={1.6} bg="#B8F5D6" bg2={C.emerald} from="down" punch={pC}>
          <div style={{ padding: "38px 46px" }}>
            <Head>CLAIMED AT PAYDAY</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(150, "#fff"), fontVariantNumeric: "tabular-nums" }}>{claimed.toLocaleString("en-US")}</span>
              <span style={{ ...inkTextStyle(80, "#fff") }}>USDC</span>
            </div>
            <div style={{ ...show(b(k + 2, 3)), transformOrigin: "left center" }}>
              <Label>advance repaid automatically · debt 0</Label>
            </div>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 3)} x={1030} y={600} w={780} h={350} rot={-1.8} bg="#C9F2EC" bg2={C.teal} from="down" punch={pD}>
          <div style={{ padding: "34px 40px" }}>
            <Head>VERIFIED</Head>
            <div style={{ display: "flex", gap: 40, marginTop: 6 }}>
              {[
                { v: "265/265", l: "forge tests", at: b(k + 3) },
                { v: "12", l: "contracts", at: b(k + 3, 1) },
                { v: CHAIN.gasBurned.replace(" tBNB", ""), l: "tBNB gas, all in", at: b(k + 3, 2) },
              ].map((x) => (
                <div key={x.l} style={show(x.at)}>
                  <div style={{ ...inkTextStyle(x.v.length > 6 ? 72 : 96, "#fff") }}>{x.v}</div>
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
          bottom: 42,
          textAlign: "center",
          fontFamily: F.sans,
          fontSize: 24,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.faint,
          opacity: interpolate(frame, [b(k + 3, 1), b(k + 3, 1) + 8], [0, 1], clamp),
        }}
      >
        from VERIFY-BNB.md · live BSC testnet run · 2026-09-25
      </div>

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`s${i}`} name="impact" at={b(k + i)} volume={0.7} />
      ))}
      {[1, 2, 3].map((i) => (
        <Sfx key={`p${i}`} name="tick" at={b(k, i)} volume={0.65} />
      ))}
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.65} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.65} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.65} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.65} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.65} />
    </AbsoluteFill>
  );
};
