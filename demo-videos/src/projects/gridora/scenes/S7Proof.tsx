import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { AGENT, C, F, MAINNET, TESTNET } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 28–32, DROP). Verbatim from contracts/broadcast/Deploy.s.sol/{97,56}
 * and the receipts (all status 1), re-read with cast on 2026-09-26.
 *   28      BSC testnet: 3 contracts + the agent wallet, one row per beat; "DEPLOYED!" on b3
 *   29–30   7 txs: 3 deploys + register · commit · record · attest; 30 b2 "ALL STATUS 1!"
 *   31      (break) the same three contracts on BSC MAINNET, with the ERC-8004 #140004 registration
 */
const fmt = (n: number) => n.toLocaleString("en-US");

export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 28
  const phase = frame >= b(k + 3) ? 2 : frame >= b(k + 1) ? 1 : 0;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(217,119,87,0.2)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={100} from={0} count={16} inner={260} spread={260} color={C.gold} opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center" }}>
          {phase < 2 ? <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={38} live variant="dark" /> : <BnbBadge key="main" label="ALSO LIVE ON BSC MAINNET" at={b(k + 3)} size={38} live variant="gold" />}
        </div>

        {phase === 0 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Gridora · BSC testnet deploy"
              subtitle={`script/Deploy.s.sol · chainId guard 97 · block ${fmt(TESTNET.deployBlock)}`}
              at={b(k)}
              width={1640}
              full
              accent={C.gold}
              rows={[
                { label: "IdentityRegistry", value: TESTNET.identity, meta: "ERC-8004 · soulbound", at: b(k), kind: "address", hot: true },
                { label: "TradeJournal", value: TESTNET.journal, meta: "append-only", at: b(k, 1), kind: "address", hot: true },
                { label: "StrategyLedger", value: TESTNET.ledger, meta: "commit → attest", at: b(k, 2), kind: "address", hot: true },
                { label: "agent wallet", value: AGENT, meta: "ownerOf(1)", at: b(k, 3), kind: "address" },
              ]}
            />
          </div>
        ) : phase === 1 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="7 txs · deploy → register → commit → record → attest"
              subtitle="receipts re-read from bsc-testnet.publicnode.com · all status 1"
              at={b(k + 1)}
              width={1640}
              accent={C.gold}
              rows={[
                { label: "deploy Identity", value: TESTNET.tx.deployIdentity, meta: `${fmt(TESTNET.gas.deployIdentity)} gas`, at: b(k + 1), kind: "tx" },
                { label: "deploy Journal", value: TESTNET.tx.deployJournal, meta: `${fmt(TESTNET.gas.deployJournal)} gas`, at: b(k + 1, 1), kind: "tx" },
                { label: "deploy Ledger", value: TESTNET.tx.deployLedger, meta: `${fmt(TESTNET.gas.deployLedger)} gas`, at: b(k + 1, 2), kind: "tx" },
                { label: "register #1", value: TESTNET.tx.register, meta: `${fmt(TESTNET.gas.register)} gas`, at: b(k + 1, 3), kind: "tx", hot: true },
                { label: "commit", value: TESTNET.tx.commit, meta: `${fmt(TESTNET.gas.commit)} gas`, at: b(k + 2), kind: "tx", hot: true },
                { label: "record +85 bps", value: TESTNET.tx.record, meta: `${fmt(TESTNET.gas.record)} gas`, at: b(k + 2, 1), kind: "tx", hot: true },
                { label: "attest", value: TESTNET.tx.attest, meta: `${fmt(TESTNET.gas.attest)} gas`, at: b(k + 2, 2), kind: "tx", hot: true },
              ]}
            />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="The same three contracts on BSC mainnet"
              subtitle={`deploy block ${fmt(MAINNET.deployBlock)} · live reads: totalAgents 1 · totalTrades ${MAINNET.totalTrades}`}
              at={b(k + 3)}
              width={1640}
              full
              accent={C.gold}
              network="BSC Mainnet · chainId 56"
              rows={[
                { label: "IdentityRegistry", value: MAINNET.identity, meta: "agent #1", at: b(k + 3), kind: "address", hot: true },
                { label: "TradeJournal", value: MAINNET.journal, meta: `${MAINNET.totalTrades} trades`, at: b(k + 3), kind: "address", hot: true },
                { label: "StrategyLedger", value: MAINNET.ledger, meta: "commit → attest", at: b(k + 3, 1), kind: "address", hot: true },
                { label: `ERC-8004 #${MAINNET.erc8004Id}`, value: MAINNET.erc8004Tx, meta: "ERC-8004 registry", at: b(k + 3, 2), kind: "tx" },
              ]}
            />
          </div>
        )}

        {phase === 1 && frame >= b(k + 2, 3) ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", ...fadeUp(frame, b(k + 2, 3), 6, 14) }}>
            <div style={{ fontFamily: F.sans, fontSize: 32, color: C.text }}>
              Deploy: <b style={{ color: C.gold }}>{TESTNET.deployTbnb} tBNB</b> · the 4 agent txs: <b style={{ color: C.gold }}>{TESTNET.agentTbnb} tBNB</b>
            </div>
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k, 3)} x={1560} y={900} size={110} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1) - 3} />
      <ComicText text="ALL STATUS 1!" from={b(k + 2, 2)} x={1560} y={900} size={80} rotate={6} fill={C.volt} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 3} />
      <ComicText text="MAINNET TOO!" from={b(k + 3, 3)} x={1560} y={900} size={100} rotate={-6} fill={C.coralHi} variant="onomatopoeia" echoColor={INK} />
      {phase === 2 ? <AbsoluteFill style={{ background: "#fff", opacity: interpolate(frame, [b(k + 3), b(k + 3) + 4], [0.18, 0], clamp), pointerEvents: "none" }} /> : null}

      <InkFrame inset={22} width={4} opacity={0.6} color={C.cream} innerColor={C.gold} />

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="tick" at={b(k, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.45} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 1, i)} volume={0.55} />
      ))}
      <Sfx name="tick" at={b(k + 2)} volume={0.55} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.7} />
      <Sfx name="chime" at={b(k + 2, 3)} volume={0.4} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.5} />
      <Sfx name="chime" at={b(k + 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3, 3)} volume={0.7} />
    </AbsoluteFill>
  );
};
