import React from "react";
import { AbsoluteFill } from "remotion";
import { ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import { AGENT, AGENT_CMD } from "../data";
import { C } from "../theme";
import { BAR } from "../timeline";
import type { TermLine, TermMark } from "../ui";
import { ComicTerminal, PaperTag, RealTag, Stamp } from "../ui";

/**
 * S4 · RUN (bars 12–16, DROP on 12). The REAL agent, re-run read-only in PAPER
 * mode against live Binance Web3 BSC data (runs/agent-paper-run.log, verbatim):
 *   12 b0 command · b1 start/PAPER/WARN · b2 cycle 1 + news · b3 Binance enrichment (76 live quotes, marked)
 *   13 b0 signal overview · b1 plan · b2 PAPER trade AAVE $60.38 ("PAPER BUY!") · b3 cycle 1 done
 *   14 b0 STG · b1 NXPC + risk 3/3 · b2 cycle 3 + "nothing to execute" · b3 cycles 4–5
 *   15 (break) b0 cycles 6–8 · b1 stop · b2 summary stamp
 */
const col = (line: string, needle: string) => line.indexOf(needle);
const COLOR = { info: C.text, warn: C.gold, brain: C.cyan, trade: C.neon } as const;

export const S4Run: React.FC = () => {
  const { b } = useSceneClock();
  const k = BAR.run; // 12

  const at = [
    b(k, 1), b(k, 1), b(k, 1), b(k, 2), b(k, 2), b(k, 3),
    b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 3),
    b(k + 2), b(k + 2), b(k + 2, 1), b(k + 2, 1), b(k + 2, 2), b(k + 2, 2), b(k + 2, 3), b(k + 2, 3),
    b(k + 3), b(k + 3), b(k + 3), b(k + 3, 1),
  ];
  const lines: TermLine[] = [
    { t: AGENT_CMD, at: 0, cmd: true, type: 12 },
    ...AGENT.map((l, i) => ({ t: l.t, at: at[i] ?? b(k + 3, 1), color: COLOR[l.kind], weight: l.kind === "trade" ? 700 : undefined })),
  ];
  const L = (i: number) => i + 1;
  const enrich = AGENT[5]!.t;
  const aave = AGENT[8]!.t;
  const risk = AGENT[13]!.t;
  const c8 = AGENT[20]!.t;
  const marks: TermMark[] = [
    { line: L(0), at: b(k, 1) + 4, c0: col(AGENT[0]!.t, '"mode"'), c1: col(AGENT[0]!.t, '"bridgeMode"') - 1, color: C.gold },
    { line: L(5), at: b(k, 3) + 3, c0: col(enrich, '"liveQuotes"'), c1: col(enrich, '"fullScan"') - 1, color: C.neon },
    { line: L(8), at: b(k + 1, 2) + 3, c0: 0, c1: aave.length, color: C.neon },
    { line: L(13), at: b(k + 2, 1) + 3, c0: col(risk, '"positionCount"'), c1: risk.length, color: C.cyan },
    { line: L(20), at: b(k + 3) + 3, c0: col(c8, '"cycle":8'), c1: col(c8, '"cycle":8') + 9, color: C.gold },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(14,203,129,0.16)" glowB="rgba(240,185,11,0.1)" glow="top" floor={0.3} grid={0.45} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 92, top: 38 }}>
        <RealTag at={0} kind="real output" label="neural-alpha agent · live Binance Web3 BSC data · 2026-09-25 UTC" />
      </div>
      <div style={{ position: "absolute", right: 92, top: 42 }}>
        <PaperTag at={0} size={19} />
      </div>

      <Pulse intensity={0.4} shake={0} glow={false}>
        <ComicTerminal at={0} x={70} y={112} w={1780} h={900} title="neural-alpha — paper run, 8 cycles" lines={lines} marks={marks} size={19.5} lh={1.4} prompt="~/neural-alpha $" />
      </Pulse>

      <Stamp at={b(k, 3) + 2} x={1590} y={330} text="76 LIVE BSC QUOTES + OHLCV" color={C.neon} size={34} rot={5} />
      <ComicText text="PAPER BUY!" from={b(k + 1, 2)} x={1500} y={560} size={140} rotate={-7} skewX={-6} fill={C.neon} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2, 1) - 1} />
      <Stamp at={b(k + 2, 1) + 2} x={1620} y={640} text="3 / 3 SLOTS · RISK OK" color={C.cyan} size={34} rot={-4} />
      <Stamp at={b(k + 3, 2)} x={1350} y={960} text="8 CYCLES · 3 PAPER BUYS · 0 REAL TXS" color={C.gold} size={44} rot={-3} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      {[1, 2, 3].map((i) => (
        <Sfx key={`a${i}`} name="tick" at={b(k, i)} volume={0.45} />
      ))}
      <Sfx name="impact" at={b(k, 3) + 2} volume={0.5} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.9} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.45} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k + 2, i)} volume={0.45} />
      ))}
      <Sfx name="tick" at={b(k + 3)} volume={0.45} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.75} />
    </AbsoluteFill>
  );
};
