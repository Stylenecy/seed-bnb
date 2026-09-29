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
 * S7 · STAT WALL (bars 40–43) — lands on the music splice into the track's
 * outro. One comic card per bar, counters tick on the beats. Every value is
 * from the live UI-driven BSC-testnet run (2026-09-27) + VERIFY-BNB.md test runs:
 *   bar 40  0.04 tBNB → 2,400 MUSD (ticks b1–b3)
 *   bar 41  ICR 136% → 140% defended (ticks b1–b3)
 *   bar 42  0.04 tBNB returned on close · b2: 33/33 forge + 12/12 agent tests
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 29, color: "#1b1712", marginTop: 10, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#1b1712", letterSpacing: "0.04em" }}>{children}</div>
);

export const S7Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 40

  const musd = steppedCount(frame, [b(k), b(k, 1), b(k, 2), b(k, 3)], [0, 800, 1600, 2400]);
  const icr = steppedCount(frame, [b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], [136, 137, 139, 140]);
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.04, 4);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.04, 4);
  const pC = useBeatPunch([b(k + 2), b(k + 2, 1)], 0.04, 4);
  const pD = useBeatPunch([b(k + 2, 2), b(k + 2, 3)], 0.04, 4);

  return (
    <AbsoluteFill>
      <PremiumBg base="#110e0b" glowA="rgba(199,122,58,0.26)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} color={C.amberHi} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color="#F0B90B" opacity={0.26} width={6} seed="stats" />

      <Pulse intensity={1.1} shake={0.8}>
        <ComicPanel at={b(k)} x={110} y={120} w={920} h={410} rot={-2} bg="#FFE9A8" bg2="#F0B90B" from="left" punch={pA}>
          <div style={{ padding: "38px 46px" }}>
            <Head>COLLATERAL → BORROWED</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(120, "#fff") }}>0.04</span>
              <span style={{ ...inkTextStyle(80, C.amber) }}>→</span>
              <span style={{ ...inkTextStyle(150, C.successHi), fontVariantNumeric: "tabular-nums" }}>{Math.round(musd).toLocaleString("en-US")}</span>
            </div>
            <Label>tBNB in → MUSD debt · ICR 200% · real BSC testnet</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={1080} y={100} w={730} h={410} rot={2.2} bg="#DDEBCF" bg2="#A9C98F" from="right" punch={pB}>
          <div style={{ padding: "38px 46px" }}>
            <Head>DEFENDED ICR</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(160, "#fff"), fontVariantNumeric: "tabular-nums" }}>{Math.round(icr)}%</span>
            </div>
            <Label>from 136% after the price fell $132k → $90k</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 2)} x={170} y={590} w={820} h={370} rot={1.6} bg="#F7E9CB" bg2="#E8C99A" from="down" punch={pC}>
          <div style={{ padding: "36px 46px" }}>
            <Head>BNB RETURNED ON CLOSE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(160, "#fff") }}>0.04</span>
              <span style={{ ...inkTextStyle(96, "#F0B90B") }}>tBNB</span>
            </div>
            <Label>all of it — never sold along the way</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 2, 2)} x={1040} y={600} w={770} h={350} rot={-1.8} bg="#F4D5C0" bg2="#E8A07A" from="down" punch={pD}>
          <div style={{ padding: "34px 46px", display: "flex", gap: 46 }}>
            <div>
              <div style={{ ...inkTextStyle(130, "#fff") }}>33/33</div>
              <Label>forge tests</Label>
            </div>
            <div>
              <div style={{ ...inkTextStyle(130, "#fff") }}>12/12</div>
              <Label>keeper agent tests</Label>
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
          color: "rgba(244,237,226,0.62)",
          opacity: interpolate(frame, [b(k + 2, 3), b(k + 2, 3) + 8], [0, 1], clamp),
        }}
      >
        from the live BSC testnet run · 2026-09-27 · driven through the UI · ~0.00012 tBNB gas
      </div>

      <InkFrame inset={22} width={5} opacity={0.85} color={C.cream} />

      {[0, 1, 2].map((i) => (
        <Sfx key={`s${i}`} name="impact" at={b(k + i)} volume={0.75} />
      ))}
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.6} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`a${i}`} name="tick" at={b(k, i)} volume={0.7} />
      ))}
      {[1, 2, 3].map((i) => (
        <Sfx key={`b${i}`} name="tick" at={b(k + 1, i)} volume={0.7} />
      ))}
    </AbsoluteFill>
  );
};
