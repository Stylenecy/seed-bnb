import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 28–32), DROP. Verbatim from VERIFY-BNB.md ("Real BSC
 * Testnet deploy (2026-09-25)"), deployment block 132984157.
 *   28 b0  LIVE ON BSC TESTNET + contracts card; rows on b1 b2 b3
 *   29 b0  row 4 · b1 row 5 · b2 "DEPLOYED!"
 *   30 b0  smoke-flow card; rows b1 b2 b3
 *   31 b0 (break)  PaydayTriggered (hot) · b1 claim · b2/b3 pills
 */
export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 28
  const second = frame >= b(k + 2);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(124,58,237,0.16)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={120} from={0} count={16} inner={260} spread={260} color="#F0B90B" opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 64, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={40} live variant="dark" />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", justifyContent: "center" }}>
          {!second ? (
            <BscScanProof
              title="Flowroll · 12 contracts deployed"
              subtitle={`script/Deploy.s.sol · deployment block ${CHAIN.deploymentBlock} · VERIFY-BNB.md`}
              at={b(k)}
              width={1600}
              rows={[
                { label: "PayrollManager", value: CHAIN.payrollManager, meta: "groups · cycles", at: b(k, 1), kind: "address", hot: true },
                { label: "PayVault", value: CHAIN.payVault, meta: "claimable salary", at: b(k, 2), kind: "address" },
                { label: "FlowrollCredit", value: CHAIN.credit, meta: "advances · 1.5%", at: b(k, 3), kind: "address" },
                { label: "YieldRouter", value: CHAIN.yieldRouter, meta: "agent rebalances", at: b(k + 1), kind: "address" },
                { label: "FlowrollZapper", value: CHAIN.zapper, meta: "mWBNB → USDC", at: b(k + 1, 1), kind: "address" },
              ]}
            />
          ) : (
            <BscScanProof
              title="Flowroll · live smoke flow"
              subtitle="employer → employee → agent · all receipts status 1"
              at={b(k + 2)}
              width={1600}
              rows={[
                { label: "depositPayroll(1)", value: CHAIN.tx.deposit, meta: "8,000 USDC", at: b(k + 2, 1), kind: "tx" },
                { label: "requestSalary(1000)", value: CHAIN.tx.advance, meta: "985 net", at: b(k + 2, 2), kind: "tx" },
                { label: "Rebalanced", value: CHAIN.tx.rebalanced, meta: "agent", at: b(k + 2, 3), kind: "tx" },
                { label: "PaydayTriggered", value: CHAIN.tx.payday, meta: "agent · cycle #1", at: b(k + 3), kind: "tx", hot: true },
                { label: "claim(4000)", value: CHAIN.tx.claim, meta: "4,000 USDC", at: b(k + 3, 1), kind: "tx" },
              ]}
            />
          )}
        </div>

        {frame >= b(k + 3, 2) ? (
          <div style={{ position: "absolute", left: 120, right: 120, top: 900, display: "flex", justifyContent: "center", gap: 26, fontFamily: F.sans, fontSize: 30, whiteSpace: "nowrap", color: C.text }}>
            {[
              { t: `Total gas burned: ${CHAIN.gasBurned}`, c: "#F0B90B", at: b(k + 3, 2) },
              { t: "Payday fix holds on the live chain", c: C.emerald, at: b(k + 3, 3) },
            ].map((x) =>
              frame >= x.at ? (
                <div
                  key={x.t}
                  style={{
                    padding: "14px 22px",
                    borderRadius: 14,
                    border: `1.5px solid ${x.c}88`,
                    background: "rgba(255,255,255,0.04)",
                    opacity: interpolate(frame, [x.at, x.at + 6], [0, 1], clamp),
                    transform: `translateY(${interpolate(frame, [x.at, x.at + 8], [20, 0], clamp)}px)`,
                  }}
                >
                  <span style={{ color: x.c, fontWeight: 800 }}>●</span> {x.t}
                </div>
              ) : null,
            )}
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k + 1, 2)} x={1540} y={960} size={100} rotate={-6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="PAID!" from={b(k + 3)} x={1640} y={130} size={120} rotate={7} fill={C.amber} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.85} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      <Sfx name="tick" at={b(k + 1)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.5} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 2, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 3)} volume={0.8} />
      <Sfx name="chime" at={b(k + 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.55} />
    </AbsoluteFill>
  );
};
