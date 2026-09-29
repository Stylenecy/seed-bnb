import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ComicPanel, Halftone, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S9 · STAT WALL (bars 46–48). A card every two beats; every value is from
 * VERIFY-BNB.md or the live runs:
 *   46 b0  11 chains per scan (ticks 3 → 11: the BNB three first)
 *   46 b2  10 MCP tools (tools/list over HTTP)
 *   47 b0  18 decimals — USDT/USDC/FDUSD on BSC, 100M reads as 100M
 *   47 b2  0 contracts · 0 tBNB — read-only
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 29, color: "#16161c", marginTop: 8, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#16161c", letterSpacing: "0.04em" }}>{children}</div>
);
const Big: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 190 }) => (
  <div style={{ ...inkTextStyle(size, "#fff"), fontFamily: F.sans, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{children}</div>
);

export const S9Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.stats; // 46

  const chains = steppedCount(frame, [b(k), b(k, 1)], [3, 11]);
  const pA = useBeatPunch([b(k), b(k, 1)], 0.04, 4);
  const pB = useBeatPunch([b(k, 2), b(k, 3)], 0.04, 4);
  const pC = useBeatPunch([b(k + 1), b(k + 1, 1)], 0.04, 4);
  const pD = useBeatPunch([b(k + 1, 2), b(k + 1, 3)], 0.04, 4);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(232,99,58,0.24)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color={C.gold} opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={110} w={820} h={410} rot={-2} bg="#FFF1BF" bg2="#F0B90B" from="left" punch={pA}>
          <div style={{ padding: "38px 46px" }}>
            <Head>CHAINS PER SCAN</Head>
            <Big>{chains}</Big>
            <Label>BSC 56 · opBNB 204 · BSC Testnet 97 first, + 8 EVM chains</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k, 2)} x={990} y={96} w={820} h={424} rot={2.2} bg="#DDF7F5" bg2="#46d6d0" from="right" punch={pB}>
          <div style={{ padding: "38px 46px" }}>
            <Head>MCP TOOLS</Head>
            <Big>10</Big>
            <Label>scan_chain + 9 more · stdio or HTTP POST /mcp</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={150} y={590} w={820} h={380} rot={1.6} bg="#FFE0D2" bg2="#e8633a" from="down" punch={pC}>
          <div style={{ padding: "36px 46px" }}>
            <Head>BSC STABLECOIN DECIMALS</Head>
            <Big size={170}>18</Big>
            <Label>USDT · USDC · FDUSD — 100M reads as 100M</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1, 2)} x={1030} y={600} w={780} h={370} rot={-1.8} bg="#E9E4D6" bg2="#9ba39f" from="down" punch={pD}>
          <div style={{ padding: "36px 46px" }}>
            <Head>CONTRACTS · tBNB SPENT</Head>
            <Big size={170}>0 · 0</Big>
            <Label>Read-only: no deploy, no keys, no txs</Label>
          </div>
        </ComicPanel>
      </Pulse>

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.75} />
      <Sfx name="tick" at={b(k, 1)} volume={0.7} />
      <Sfx name="impact" at={b(k, 2)} volume={0.75} />
      <Sfx name="impact" at={b(k + 1)} volume={0.75} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.75} />
    </AbsoluteFill>
  );
};
