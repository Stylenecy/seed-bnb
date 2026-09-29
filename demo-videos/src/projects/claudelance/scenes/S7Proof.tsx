import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 26–32). Values from contracts/deployments/bsc-testnet.json
 * + VERIFY-BNB.md ("Real BSC Testnet deploy", every receipt status 1).
 *   26–27  contracts card, a row per beat · 27 b2 "DEPLOYED!" · card lifts away on 27 b3
 *   28–31  the live bounty lifecycle, a tx per 2 beats; chips: CI gate revert, split, balance
 *   31 b2  "PAID!"
 */
export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 26
  const txIn = frame >= b(k + 2);
  const lift = interpolate(frame, [b(k + 1, 3), b(k + 2)], [0, 1], clamp);

  const chips = [
    { t: "attestCI from a non-relayer → reverts", c: C.neg, at: b(k + 3, 3) },
    { t: `${CHAIN.smoke.toWorker} USDT → worker · ${CHAIN.smoke.fee} fee → treasury`, c: C.gold, at: b(k + 4, 3) },
    { t: `worker USDT ${CHAIN.smoke.before} → ${CHAIN.smoke.after}`, c: C.emerald, at: b(k + 5, 1) },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(228,116,68,0.14)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={100} from={0} count={16} inner={260} spread={260} color="#F0B90B" opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.2} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 56, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={38} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", transform: `translateY(${-lift * 120}px) scale(${1 - lift * 0.1})`, opacity: 1 - lift * 0.85 }}>
            <BscScanProof
              title="Deployed contracts"
              subtitle={`contracts/deployments/bsc-testnet.json · 2026-09-25 · proxy block ${CHAIN.deployBlock}`}
              at={b(k)}
              width={1620}
              full
              rows={[
                { label: "CoreV3 proxy", value: CHAIN.proxy, meta: "version 3.1.0", at: b(k, 1), kind: "address", hot: true },
                { label: "Implementation", value: CHAIN.impl, meta: "UUPS", at: b(k, 2), kind: "address" },
                { label: "USDT (mock)", value: CHAIN.usdt, meta: "18 dec · min 0.5", at: b(k, 3), kind: "address" },
                { label: "WBNB (canonical)", value: CHAIN.wbnb, meta: "min 0.001", at: b(k + 1), kind: "address" },
                { label: "USDC (mock)", value: CHAIN.usdc, meta: "18 dec · min 0.5", at: b(k + 1, 1), kind: "address" },
              ]}
            />
          </div>
        ) : null}

        {txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Bounty #1 · the full lifecycle, on real testnet"
              subtitle={`VERIFY-BNB.md · ${CHAIN.smoke.bounty} USDT bounty, CI required · worker = agent ${CHAIN.agentId}`}
              at={b(k + 2)}
              width={1620}
              rows={[
                { label: "postBounty", value: CHAIN.tx.post, meta: "1 USDT escrowed", at: b(k + 2, 1), kind: "tx" },
                { label: "claimSlot", value: CHAIN.tx.claim, meta: "0.1 USDT stake", at: b(k + 2, 3), kind: "tx" },
                { label: "submitDeliverable", value: CHAIN.tx.submit, meta: "deliverable on-chain", at: b(k + 3, 1), kind: "tx" },
                { label: "attestCI (relayer)", value: CHAIN.tx.attestCI, meta: "CI passed", at: b(k + 3, 2), kind: "tx" },
                { label: "pickWinner", value: CHAIN.tx.pickWinner, meta: "0.98 / 0.02", at: b(k + 4, 1), kind: "tx", hot: true },
                { label: "settleStake", value: CHAIN.tx.settle, meta: "stake returned", at: b(k + 4, 2), kind: "tx" },
                { label: "withdrawEarnings", value: CHAIN.tx.withdraw, meta: "→ worker wallet", at: b(k + 5), kind: "tx", hot: true },
              ]}
            />
          </div>
        ) : null}

        {txIn ? (
          <div style={{ position: "absolute", left: 60, right: 60, top: 868, display: "flex", justifyContent: "center", gap: 18, fontFamily: F.mono, fontSize: 24, color: C.text }}>
            {chips.map((x) =>
              frame >= x.at ? (
                <div
                  key={x.t}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 14,
                    border: `1.5px solid ${x.c}aa`,
                    background: "rgba(17,15,13,0.85)",
                    whiteSpace: "nowrap",
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

      <ComicText text="DEPLOYED!" from={b(k + 1, 2)} x={1540} y={900} size={120} rotate={-7} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="PAID!" from={b(k + 5, 2)} x={290} y={100} size={130} rotate={-8} fill={C.emerald} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.6} />
      ))}
      {[0, 1].map((i) => (
        <Sfx key={`d${i}`} name="tick" at={b(k + 1, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.75} />
      {[
        b(k + 2, 1),
        b(k + 2, 3),
        b(k + 3, 1),
        b(k + 3, 2),
        b(k + 4, 1),
        b(k + 4, 2),
        b(k + 5),
      ].map((f, i) => (
        <Sfx key={`t${i}`} name="tick" at={f} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 3, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 5, 2)} volume={0.9} />
      <Sfx name="chime" at={b(k + 5, 2)} volume={0.55} />
    </AbsoluteFill>
  );
};
