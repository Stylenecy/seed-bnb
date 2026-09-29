import React from "react";
import { AbsoluteFill } from "remotion";
import { ComicPanel, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { V1 } from "../data";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import type { TermLine } from "../ui";
import { ComicTerminal, RealTag, Stamp } from "../ui";

/**
 * S8 · HONEST LIMIT (bars 44–46). BscScan's V1 API is gone (runs/tessera-bscscan-v1.txt:
 * HTTP/2 301 → docs.etherscan.io/v2-migration), so explorer enrichment is empty.
 *   44 b0 curl types · b1 the 301 prints · b2 "301! V1 IS GONE."
 *   45 b0 what stays empty · b1 what still works (RPC) · b2 the fix · b3 stamp
 */
const Card: React.FC<{ head: string; color: string; children: React.ReactNode }> = ({ head, color, children }) => (
  <div style={{ padding: "30px 34px" }}>
    <div style={{ fontFamily: F.comic, fontSize: 44, color: INK, letterSpacing: "0.03em" }}>
      <span style={{ background: color, padding: "0 10px", border: `3px solid ${INK}` }}>{head}</span>
    </div>
    <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 29, lineHeight: 1.3, color: INK, marginTop: 18 }}>{children}</div>
  </div>
);
const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 24, background: "rgba(8,9,11,0.08)", padding: "0 4px" }}>{children}</span>;

export const S8Limit: React.FC = () => {
  const { b, beatsIn } = useSceneClock();
  const k = BAR.limit; // 44
  const punch = useBeatPunch(beatsIn(k + 1, k + 2), 0.02, 5);

  const lines: TermLine[] = [
    { t: `curl -si "https://api.bscscan.com/api?module=account&action=txlist&address=0xF977…aceC"`, at: 0, cmd: true, type: 12 },
    ...V1.map((t) => ({ t, at: b(k, 1), color: t.startsWith("HTTP") ? C.bad : C.boneDim, weight: t.startsWith("HTTP") ? 700 : undefined })),
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(239,93,93,0.16)" glowB="rgba(232,178,58,0.12)" glow="top" floor={0.3} grid={0.45} />
      <Halftone opacity={0.05} gap={18} />

      <div style={{ position: "absolute", left: 92, top: 38 }}>
        <RealTag at={0} kind="honest limit" color={C.warn} label="BscScan explorer API · checked live 2026-09-26" />
      </div>

      <Pulse intensity={0.7} shake={0.3}>
        <ComicTerminal at={0} x={80} y={112} w={1250} h={330} title="the old explorer endpoint" tab="LIMIT" tabColor={C.warn} lines={lines} marks={[{ line: 1, at: b(k, 1) + 3, color: C.bad }]} size={19} prompt="$" rot={-0.8} />

        <ComicPanel at={b(k + 1)} x={90} y={520} w={560} h={430} rot={-1.4} bg="#FFD6D6" bg2="#ef5d5d" from="up" punch={punch}>
          <Card head="STAYS EMPTY" color="#ffffff">
            <Code>contractVerified</Code>, <Code>recentTxCount</Code>, <Code>tokenTransfers</Code> read false / 0 on every Etherscan-family chain. Scans still succeed.
          </Card>
        </ComicPanel>
        <ComicPanel at={b(k + 1, 1)} x={680} y={540} w={560} h={410} rot={1.1} bg="#DDF7F5" bg2="#46d6d0" from="down">
          <Card head="STILL LIVE" color="#ffffff">
            Balances, tx counts, EOA vs Contract and USDT / USDC / FDUSD all come straight from public RPCs.
          </Card>
        </ComicPanel>
        <ComicPanel at={b(k + 1, 2)} x={1270} y={515} w={560} h={435} rot={-0.9} bg="#FFF1BF" bg2="#F0B90B" from="right">
          <Card head="THE FIX" color="#ffffff">
            Move to Etherscan API V2 (<Code>chainid=56|97</Code>) with an <Code>ETHERSCAN_API_KEY</Code>. Optional, not yet wired.
          </Card>
        </ComicPanel>
      </Pulse>

      <ComicText text="301! V1 IS GONE." from={b(k, 2)} x={1600} y={290} size={96} rotate={7} skewX={6} fill={C.bad} variant="onomatopoeia" echoColor={INK} />
      <Stamp at={b(k + 1, 3)} x={960} y={995} text="EXPLORER DATA NEEDS AN ETHERSCAN V2 KEY" color={C.warn} size={42} rot={-2} />

      <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k, 2)} volume={0.9} />
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.6} />
    </AbsoluteFill>
  );
};
