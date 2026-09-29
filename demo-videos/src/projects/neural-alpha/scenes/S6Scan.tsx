import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BscScanProof, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { SCAN, SCAN_CMD } from "../data";
import { C, CHAIN, F, short } from "../theme";
import { BAR } from "../timeline";
import type { TermLine, TermMark } from "../ui";
import { ComicTerminal, RealTag, Stamp } from "../ui";

/**
 * S6 · SCANNER (bars 20–24, DROP on 20). The project's own BSC-RPC trade-history
 * scanner, pointed read-only at a real mainnet trader (not ours):
 *   20 b0 call types · b1 scan line · b2 header · b3 swap 1
 *   21 b0..b2 swaps 2–4 · b2 ETH price marked · b3 "4 REAL SWAPS!"
 *   22 b0 → 23  explorer card: the 4 tx hashes (receipts status 1), rows on beats
 *   23 (break) b2 "READ-ONLY." caption
 */
export const S6Scan: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.scan; // 20

  const at = [b(k, 1), b(k, 2), b(k, 3), b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 2)];
  const lines: TermLine[] = [
    { t: SCAN_CMD, at: 0, cmd: true, type: 12 },
    ...SCAN.map((t, i) => ({ t, at: at[i] ?? b(k + 1, 2), color: i === 1 ? C.text2 : i === 0 ? C.cyan : i === 6 ? C.neon : C.text, weight: i === 6 ? 700 : undefined })),
  ];
  const eth = SCAN[4]!;
  const marks: TermMark[] = [
    { line: 1, at: b(k, 1) + 3, c0: SCAN[0]!.indexOf('"swaps"'), c1: SCAN[0]!.indexOf('"swaps"') + 9, color: C.neon },
    { line: 5, at: b(k + 1, 2) + 2, c0: eth.indexOf("2694"), c1: eth.length, color: C.gold },
    { line: 7, at: b(k + 1, 3), c0: 0, c1: 7, color: C.neon },
  ];
  const swap = interpolate(frame, [b(k + 2) - 5, b(k + 2)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(240,185,11,0.18)" glowB="rgba(14,203,129,0.14)" glow="top" floor={0.4} grid={0.55} />
      <Halftone opacity={0.04} gap={20} />
      <SpeedBurst cx={960} cy={540} from={0} count={18} inner={420} spread={600} color={C.gold} opacity={0.25} width={5} seed="drop20" fade />

      <div style={{ position: "absolute", left: 92, top: 38 }}>
        <RealTag at={0} kind="real output" label="bsc-rpc-trade-history.ts · bsc-dataseed · last 5,000 blocks · read-only" />
      </div>

      {swap < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - swap, transform: `translateY(${-swap * 80}px)` }}>
          <Pulse intensity={0.5} shake={0} glow={false}>
            <ComicTerminal at={0} x={80} y={130} w={1760} h={560} title="fetchRpcRecentTradeHistory — real BSC wallet" lines={lines} marks={marks} size={22} lh={1.45} from="left" prompt=">" tab="SCANNER" tabColor={C.gold} />
          </Pulse>
          <Stamp at={b(k + 1, 2) + 2} x={1560} y={800} text="ETH ≈ $2,695 — CORRECT" color={C.gold} size={46} rot={-5} />
          <ComicText text="4 REAL SWAPS!" from={b(k + 1, 3)} x={640} y={840} size={130} rotate={-5} fill={C.neon} variant="onomatopoeia" echoColor={INK} />
        </AbsoluteFill>
      ) : null}

      {frame >= b(k + 2) - 2 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center" }}>
          <BscScanProof
            title="Found by the agent's scanner · verified receipts (status 1)"
            subtitle={`wallet ${CHAIN.trader} · not ours · blocks 123,999,085 → 123,999,203`}
            network="BSC Mainnet · chainId 56"
            at={b(k + 2)}
            width={1760}
            full
            accent={C.gold}
            rows={CHAIN.swaps.map((s, i) => ({
              label: s.pair,
              value: s.hash,
              meta: s.amt,
              status: "Success",
              kind: "tx" as const,
              at: b(k + 2, i),
              hot: i === 2,
            }))}
          />
        </div>
      ) : null}

      {frame >= b(k + 3, 1) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 32, color: C.text2, ...fadeUp(frame, b(k + 3, 1), 8, 14) }}>
          Imports on-chain trade history for the dashboard — {short(CHAIN.trader, 8, 4)} is a public trader used as a test target.
        </div>
      ) : null}
      <ComicText text="READ-ONLY." from={b(k + 3, 2)} x={960} y={860} size={120} rotate={-3} fill={C.gold} variant="onomatopoeia" echoColor={INK} stagger={1} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.45} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.9} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.4} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k + 2, i)} volume={0.5} />
      ))}
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.7} />
    </AbsoluteFill>
  );
};
