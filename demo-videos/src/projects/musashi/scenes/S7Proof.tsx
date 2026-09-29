import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { Hanko, InkNight } from "../art";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 58–60) — hard cut. Verbatim from
 * deployments/bsc-testnet.json + VERIFY-BNB.md ("Real BSC Testnet deploy").
 *   58  4 contracts (2 proxies + 2 impls), one per beat · b3 DEPLOYED! + deploy footer
 *   59  the 3 smoke txs on b0 · b1 · b2 · b3 reputation() seal
 */
export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 58
  const txIn = frame >= b(k + 1);
  const lift = interpolate(frame, [b(k + 1) - 6, b(k + 1)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <InkNight glow={0.9} />
      <Halftone opacity={0.035} gap={22} color={C.amber} />
      <SpeedBurst cx={960} cy={100} from={0} count={16} inner={260} spread={260} color={C.gold} opacity={0.45} width={5} seed="mproof" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={36} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", opacity: 1 - lift, transform: `translateY(${-lift * 80}px)` }}>
            <BscScanProof
              title="Deployed contracts · UUPS proxies"
              subtitle="deployments/bsc-testnet.json · 2026-09-25 · block 132,984,099"
              at={b(k)}
              width={1640}
              full
              rows={[
                { label: "ConvictionLog", value: CHAIN.convictionLog, meta: "proxy · strikes", at: b(k), kind: "address", hot: true },
                { label: "MusashiINFT", value: CHAIN.inft, meta: "proxy · ERC-7857", at: b(k, 1), kind: "address", hot: true },
                { label: "CL impl", value: CHAIN.convictionLogImpl, meta: "implementation", at: b(k, 2), kind: "address" },
                { label: "INFT impl", value: CHAIN.inftImpl, meta: "implementation", at: b(k, 2.5), kind: "address" },
              ]}
            />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Smoke flow · agent 0 · strike 0"
              subtitle="VERIFY-BNB.md · every receipt status 1"
              at={b(k + 1)}
              width={1640}
              rows={[
                { label: "mint · agent 0", value: CHAIN.tx.mint, meta: `${CHAIN.gas.mint} gas`, at: b(k + 1), kind: "tx" },
                { label: "logStrike · conv 4", value: CHAIN.tx.strike, meta: `${CHAIN.gas.strike} gas`, at: b(k + 1, 1), kind: "tx", hot: true },
                { label: "recordOutcome", value: CHAIN.tx.outcome, meta: `+2500 bps · ${CHAIN.gas.outcome} gas`, at: b(k + 1, 2), kind: "tx", hot: true },
              ]}
            />
          </div>
        )}
      </Pulse>

      {frame >= b(k, 3) && !txIn ? (
        <div style={{ position: "absolute", left: 140, bottom: 70, fontFamily: F.sans, fontSize: 28, color: C.textMuted, ...fadeUp(frame, b(k, 3), 8, 12) }}>
          Deployer = oracle = owner {CHAIN.deployer.slice(0, 10)}… · inft() linked · BscScan source verification pending
        </div>
      ) : null}
      {frame >= b(k + 1, 3) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k + 1, 3), 8, 12) }}>
          <div style={{ padding: "12px 28px", borderRadius: 14, background: "rgba(8,6,4,0.94)", border: `2px solid ${C.green}`, fontFamily: F.mono, fontSize: 30, color: C.text }}>
            ConvictionLog.reputation() → <b style={{ color: C.green }}>1 strike · 1 filled · 1 win · 0 losses · +2500 bps</b>
          </div>
        </div>
      ) : null}

      <ComicText text="DEPLOYED!" from={b(k, 3)} x={1580} y={990} size={96} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1) - 4} />
      <Hanko x={1650} y={130} text="STATUS 1" at={b(k + 1, 3)} size={80} rot={8} color={C.crimson} />

      <InkFrame inset={22} width={4} opacity={0.6} color={C.washi} innerColor={C.gold} />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 2.5].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.7} />
    </AbsoluteFill>
  );
};
