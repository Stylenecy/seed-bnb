import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 49–53). Verbatim from contracts/deployments/
 * bsc-testnet.json + VERIFY-BNB.md (receipts re-checked: all status 1).
 *   49      contract, agent, deploy tx (one row per beat); "DEPLOYED!" on b3
 *   50–51   the 8 live txs, one per beat
 *   52      gas footer (b0) + "ALL STATUS 1" (b2)
 */
export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 49
  const txIn = frame >= b(k + 1);
  const lift = interpolate(frame, [b(k + 1) - 6, b(k + 1)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(154,168,240,0.16)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={100} from={0} count={16} inner={260} spread={260} color={C.gold} opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 56, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={38} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", justifyContent: "center", opacity: 1 - lift, transform: `translateY(${-lift * 80}px)` }}>
            <BscScanProof
              title="MacroGuard · deployed 2026-09-25"
              subtitle="contracts/deployments/bsc-testnet.json · maxDrawdownBps 2000"
              at={b(k)}
              width={1640}
              full
              accent={C.gold}
              rows={[
                { label: "MacroGuard", value: CHAIN.guard, meta: "risk guard", at: b(k), kind: "address", hot: true },
                { label: "agent()", value: CHAIN.agent, meta: "deployer = agent", at: b(k, 1), kind: "address" },
                { label: "deploy", value: CHAIN.tx.deploy, meta: `${CHAIN.gas.deploy.toLocaleString("en-US")} gas`, at: b(k, 2), kind: "tx" },
              ]}
            />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, right: 0, top: 160, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Live flow · 6 cast txs + 2 from the Python engine"
              subtitle="VERIFY-BNB.md · all receipts status 1"
              at={b(k + 1)}
              width={1640}
              accent={C.gold}
              rows={[
                { label: "setRegime(RiskOff)", value: CHAIN.tx.riskOff, meta: "Long vetoed", at: b(k + 1), kind: "tx" },
                { label: "recordDecision −5%", value: CHAIN.tx.dd5, meta: "no halt", at: b(k + 1, 1), kind: "tx" },
                { label: "recordDecision −25%", value: CHAIN.tx.dd25, meta: "Halted", at: b(k + 1, 2), kind: "tx", hot: true },
                { label: "resume()", value: CHAIN.tx.resume, meta: "halted false", at: b(k + 1, 3), kind: "tx" },
                { label: "setRegime(Neutral)", value: CHAIN.tx.neutral, meta: "Long allowed", at: b(k + 2), kind: "tx" },
                { label: "setRegime(RiskOn)", value: CHAIN.tx.castRiskOn, meta: "forced via cast", at: b(k + 2, 1), kind: "tx" },
                { label: "engine setRegime", value: CHAIN.tx.engineRestore, meta: "auto-restored", at: b(k + 2, 2), kind: "tx", hot: true },
                { label: "engine recordDecision", value: CHAIN.tx.engineRecord, meta: "count 2 → 3", at: b(k + 2, 3), kind: "tx", hot: true },
              ]}
            />
          </div>
        )}

        {frame >= b(k + 3) ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", fontFamily: F.sans, fontSize: 32, color: C.text, ...fadeUp(frame, b(k + 3), 8, 16) }}>
            Deploy + 8 txs: <b style={{ color: C.gold }}>{CHAIN.totalGas} tBNB</b> of gas at 0.1 gwei · non-agent call reverts <span style={{ fontFamily: F.mono, color: C.amber }}>NotAgent()</span>
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k, 3)} x={1560} y={940} size={110} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1) - 3} />
      <ComicText text="ALL STATUS 1!" from={b(k + 3, 2)} x={1580} y={130} size={80} rotate={6} fill={C.green} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="tick" at={b(k, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.45} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 1, i)} volume={0.55} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`u${i}`} name="tick" at={b(k + 2, i)} volume={0.55} />
      ))}
      <Sfx name="chime" at={b(k + 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.7} />
    </AbsoluteFill>
  );
};
