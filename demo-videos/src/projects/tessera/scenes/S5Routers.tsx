import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BscScanProof, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { V3 } from "../data";
import { C, CHAIN } from "../theme";
import { BAR } from "../timeline";
import type { TermLine, TermMark } from "../ui";
import { ChainChip, ComicTerminal, RealTag, Stamp } from "../ui";

/**
 * S5 · ROUTERS (bars 32–36, phrase DROP on 32). REAL `tessera scan-chain` of the
 * PancakeSwap V3 SmartRouter (runs/tessera-pcs-678a.txt, verbatim):
 *   32 b0 command · b1 header · b2 BSC row · b3 opBNB row
 *   33 b0/b1 the other chains · b2 BSC Testnet row + summary
 *   33 b2 · 33 b3 · 34 b0  TYPE=Contract marked + stamped on 56 · 204 · 97 → "FLAGGED!"
 *   34 b2 → 35  explorer-style card: every address scanned live (rows on beats)
 *   35 b2  "3 BNB NETWORKS. 1 SCAN."
 */
export const S5Routers: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.routers; // 32

  const at = [b(k, 1), b(k, 1), b(k, 1), b(k, 1), b(k, 2), b(k, 3), b(k + 1), b(k + 1), b(k + 1), b(k + 1), b(k + 1, 1), b(k + 1, 1), b(k + 1, 1), b(k + 1, 1), b(k + 1, 2)];
  const lines: TermLine[] = [
    { t: `./tessera scan-chain ${CHAIN.pcsV3}`, at: 0, cmd: true, type: 12 },
    ...V3.map((t, i) => ({ t, at: at[i] ?? b(k + 1, 2), color: i === 2 || i === 3 ? C.boneDim : t.includes("✗") ? C.bad : undefined, weight: i === 4 || i === 5 || i === 14 ? 600 : undefined })),
  ];
  const tc = V3[2].indexOf("TYPE");
  const marks: TermMark[] = [
    { line: 5, at: b(k + 1, 2), c0: 2, c1: tc + 8, color: C.gold },
    { line: 6, at: b(k + 1, 3), c0: 2, c1: tc + 8, color: C.gold },
    { line: 15, at: b(k + 2), c0: 2, c1: tc + 8, color: C.gold },
  ];
  const swap = interpolate(frame, [b(k + 2, 2) - 5, b(k + 2, 2)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.2)" glowB="rgba(232,99,58,0.14)" glow="top" floor={0.4} grid={0.55} />
      <Halftone opacity={0.04} gap={20} />
      <SpeedBurst cx={960} cy={540} from={0} count={18} inner={420} spread={600} color={C.gold} opacity={0.25} width={5} seed="drop32" fade />

      <div style={{ position: "absolute", left: 92, top: 38 }}>
        <RealTag at={0} kind="real output" label="PancakeSwap V3 SmartRouter · is it a contract on every BNB network?" />
      </div>

      {swap < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - swap, transform: `translateY(${-swap * 80}px)` }}>
          <Pulse intensity={0.5} shake={0} glow={false}>
            <ComicTerminal at={0} x={80} y={120} w={1180} h={760} title="tessera scan-chain — PancakeSwap V3 SmartRouter" lines={lines} marks={marks} size={20} lh={1.42} from="left" />
            <div style={{ position: "absolute", left: 1330, top: 170, display: "flex", flexDirection: "column", gap: 150, alignItems: "flex-start" }}>
              <ChainChip at={b(k + 1, 2)} name="BNB Smart Chain" id={56} size={30} />
              <ChainChip at={b(k + 1, 3)} name="opBNB" id={204} size={30} />
              <ChainChip at={b(k + 2)} name="BSC Testnet" id={97} size={30} />
            </div>
            <Stamp at={b(k + 1, 2)} x={1560} y={270} text="CONTRACT" color={C.ember} size={46} rot={-7} />
            <Stamp at={b(k + 1, 3)} x={1560} y={490} text="CONTRACT" color={C.ember} size={46} rot={5} />
            <Stamp at={b(k + 2)} x={1560} y={710} text="CONTRACT" color={C.ember} size={46} rot={-4} />
          </Pulse>
          <ComicText text="FLAGGED!" from={b(k + 2)} x={680} y={960} size={130} rotate={-5} fill={C.gold} variant="onomatopoeia" echoColor={INK} />
        </AbsoluteFill>
      ) : null}

      {frame >= b(k + 2, 2) - 2 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
          <BscScanProof
            title="Scanned live · read-only · no contracts deployed"
            subtitle="rebuilt tessera binary · public RPCs · scripts/tessera/runs/*.txt"
            network="BNB Chain · 56 / 204 / 97"
            at={b(k + 2, 2)}
            width={1720}
            full
            accent={C.gold}
            rows={[
              { label: "PCS V3 Router", value: CHAIN.pcsV3, meta: "56 · 204 · 97", status: "Contract", at: b(k + 2, 2), kind: "address", hot: true },
              { label: "PCS V2 Router", value: CHAIN.pcsV2, meta: "56 · 97 (204: EOA dust)", status: "Contract", at: b(k + 2, 3), kind: "address" },
              { label: "PCS testnet router", value: CHAIN.pcsTestnet, meta: "97", status: "Contract", at: b(k + 3), kind: "address" },
              { label: "Binance hot wallet", value: CHAIN.hotWallet, meta: "7,198,702.73 BNB", status: "EOA", at: b(k + 3, 1), kind: "address", hot: true },
            ]}
          />
        </div>
      ) : null}

      <ComicText text="3 BNB NETWORKS. 1 SCAN." from={b(k + 3, 2)} x={960} y={860} size={110} rotate={-3} fill={C.gold} variant="onomatopoeia" echoColor={INK} stagger={1} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.7} />
      <Sfx name="impact" at={b(k + 2)} volume={0.9} />
      <Sfx name="whoosh" at={b(k + 2, 2)} volume={0.4} />
      <Sfx name="tick" at={b(k + 2, 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.75} />
    </AbsoluteFill>
  );
};
