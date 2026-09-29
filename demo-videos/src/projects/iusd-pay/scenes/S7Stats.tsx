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
 * S7 · STAT WALL (bars 32–36) — DROP 4, the track's peak. One comic card per
 * bar, counters TICK on the beats (every value is from VERIFY-BNB.md):
 *   bar 32  10 → 9.95 USDT   (ticks b1–b3)
 *   bar 33  ~16 s to auto-claim (ticks b1–b3)
 *   bar 34  0 gas held by the recipient
 *   bar 35  BREAK — 24 gift boxes (b0) · 18/18 forge tests (b2)
 */
const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "#1b1b1b" }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color, marginTop: 10, lineHeight: 1.25 }}>{children}</div>
);

export const S7Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 32

  const usdt = steppedCount(frame, [b(k), b(k, 1), b(k, 2), b(k, 3)], [10, 9.98, 9.96, 9.95]);
  const secs = steppedCount(frame, [b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], [0, 5, 11, 16]);
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.04, 4);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.04, 4);
  const pC = useBeatPunch(beatsIn(k + 2, k + 3), 0.04, 4);
  const pD = useBeatPunch([b(k + 3), b(k + 3, 2)], 0.04, 4);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(232,69,126,0.22)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color="#F0B90B" opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={130} w={900} h={400} rot={-2} bg="#FFE27A" bg2="#F7B955" from="left" punch={pA}>
          <div style={{ padding: "40px 46px" }}>
            <div style={{ fontFamily: F.comic, fontSize: 40, color: "#1b1b1b", letterSpacing: "0.04em" }}>SENT → RECEIVED</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(170, "#fff"), fontVariantNumeric: "tabular-nums" }}>10</span>
              <span style={{ ...inkTextStyle(110, C.pink) }}>→</span>
              <span style={{ ...inkTextStyle(170, C.green), fontVariantNumeric: "tabular-nums" }}>{usdt.toFixed(2)}</span>
            </div>
            <Label>USDT · live on BSC testnet, 0.5% fee</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={1070} y={110} w={740} h={400} rot={2.2} bg="#A6F1FF" bg2="#4FC7DB" from="right" punch={pB}>
          <div style={{ padding: "40px 46px" }}>
            <div style={{ fontFamily: F.comic, fontSize: 40, color: "#1b1b1b", letterSpacing: "0.04em" }}>DEPOSIT → AUTO-CLAIM</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(170, "#fff") }}>~{secs}</span>
              <span style={{ ...inkTextStyle(110, "#fff") }}>s</span>
            </div>
            <Label>for the relayer to call sponsorClaim</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 2)} x={170} y={590} w={800} h={360} rot={1.6} bg="#A8EC8E" bg2="#5DBB63" from="down" punch={pC}>
          <div style={{ padding: "38px 46px" }}>
            <div style={{ fontFamily: F.comic, fontSize: 40, color: "#1b1b1b", letterSpacing: "0.04em" }}>RECIPIENT GAS</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(170, "#fff") }}>0</span>
              <span style={{ ...inkTextStyle(100, "#fff") }}>BNB</span>
            </div>
            <Label>the receiving wallet held no gas at all</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 3)} x={1030} y={600} w={780} h={340} rot={-1.8} bg="#FFB3C7" bg2="#F2789B" from="down" punch={pD}>
          <div style={{ padding: "36px 46px", display: "flex", gap: 50 }}>
            <div>
              <div style={{ ...inkTextStyle(150, "#fff") }}>24</div>
              <Label>gift boxes on-chain</Label>
            </div>
            <div style={{ opacity: interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 4], [0, 1], clamp), transform: `scale(${interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 6], [0.6, 1], clamp)})` }}>
              <div style={{ ...inkTextStyle(150, "#fff") }}>18/18</div>
              <Label>forge tests pass</Label>
            </div>
          </div>
        </ComicPanel>
      </Pulse>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 52,
          textAlign: "center",
          fontFamily: F.sans,
          fontSize: 24,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(232,232,227,0.6)",
          opacity: interpolate(frame, [b(k + 3, 1), b(k + 3, 1) + 8], [0, 1], clamp),
        }}
      >
        from the live BSC testnet smoke run · 2026-09-25
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
