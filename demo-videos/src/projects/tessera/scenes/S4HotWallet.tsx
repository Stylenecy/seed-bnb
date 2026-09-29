import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import { HOT } from "../data";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";
import type { TermLine, TermMark } from "../ui";
import { ComicTerminal, RealTag, Stamp } from "../ui";

/**
 * S4 · HOT WALLET (bars 28–32). The REAL output of the rebuilt `tessera` binary
 * (scripts/tessera/runs/tessera-hotwallet.txt, verbatim), printed on beats:
 *   28 b0 command types · b1 "Scanning…" · b2 header · b3 BSC row
 *   29    opBNB · ETH/Base · OP/Arbitrum · Mantle/Scroll (one pair per beat)
 *   30 b0 Linea/zkSync · b1 BSC Testnet · b2 BSC USDC/USDT columns marked + "WHALE!" · b3 BNB rows marked
 *   31    (dip) summary on b0/b1 · b2 "Scan: 10549ms" marked
 */
const col = (line: string, needle: string) => line.indexOf(needle);

export const S4HotWallet: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.hot; // 28

  const at = [
    b(k, 1), b(k, 1), b(k, 2), b(k, 2), b(k, 3),
    b(k + 1), b(k + 1, 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 2), b(k + 1, 3), b(k + 1, 3),
    b(k + 2), b(k + 2), b(k + 2, 1),
    b(k + 3), b(k + 3), b(k + 3), b(k + 3), b(k + 3, 1), b(k + 3, 1),
  ];
  const lines: TermLine[] = [
    { t: `./tessera scan-chain ${CHAIN.hotWallet}`, at: 0, cmd: true, type: 13 },
    ...HOT.map((t, i) => ({
      t,
      at: at[i] ?? b(k + 3, 1),
      color: i === 2 || i === 3 ? C.boneDim : t.includes("✗") ? C.bad : i >= 16 ? C.bone : undefined,
      weight: i === 4 || i === 5 || i === 14 ? 600 : undefined,
    })),
  ];
  const bsc = HOT[4];
  const L = (i: number) => i + 1; // HOT index → terminal line index
  const marks: TermMark[] = [
    { line: L(4), at: b(k + 2, 2), c0: col(bsc, "$100000000"), c1: col(bsc, "$100000003") + 10, color: C.gold },
    { line: L(4), at: b(k + 2, 3), c0: 2, c1: 17, color: C.gold },
    { line: L(5), at: b(k + 2, 3), c0: 2, c1: 7, color: C.gold },
    { line: L(14), at: b(k + 2, 3), c0: 2, c1: 23, color: C.gold },
    { line: L(20), at: b(k + 3, 2), c0: col(HOT[20], "Scan:"), c1: HOT[20].length, color: C.signal },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.16)" glowB="rgba(70,214,208,0.12)" glow="top" floor={0.3} grid={0.45} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 92, top: 38 }}>
        <RealTag at={0} kind="real output" label="rebuilt tessera binary · live mainnet RPCs · read-only · 2026-09-26" />
      </div>

      <Pulse intensity={0.4} shake={0} glow={false}>
        <ComicTerminal at={0} x={92} y={112} w={1736} h={890} title="tessera scan-chain — Binance hot wallet" lines={lines} marks={marks} size={23}>
          {frame >= b(k + 1, 3) ? (
            <div style={{ position: "absolute", left: 1530, top: 18 + 32.66 * 12 + 4, fontFamily: F.mono, fontSize: 17, color: C.bad, ...fadeUp(frame, b(k + 1, 3), 6, 8) }}>
              ← RPC error this run, shown as-is
            </div>
          ) : null}
        </ComicTerminal>
      </Pulse>

      <Stamp at={b(k + 2, 3)} x={1590} y={250} text="100M USDT + 100M USDC" color={C.gold} size={40} rot={6} />
      <Stamp at={b(k + 3)} x={1640} y={775} text="18 DECIMALS · CORRECT" color={C.good} size={32} rot={-4} />
      <Stamp at={b(k + 3, 2)} x={1480} y={985} text="1 COMMAND · 11 CHAINS · 10.5 s" color={C.signal} size={44} rot={-3} />
      <ComicText text="WHALE!" from={b(k + 2, 2)} x={1570} y={560} size={170} rotate={-8} skewX={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3, 2) - 1} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      {[2, 3].map((i) => (
        <Sfx key={`a${i}`} name="tick" at={b(k, i)} volume={0.45} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`r${i}`} name="tick" at={b(k + 1, i)} volume={0.45} />
      ))}
      <Sfx name="tick" at={b(k + 2)} volume={0.45} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.85} />
      <Sfx name="impact" at={b(k + 2, 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 3)} volume={0.5} />
      <Sfx name="chime" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
