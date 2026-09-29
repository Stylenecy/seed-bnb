import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 34–38). Verbatim from README.md / VERIFY-BNB.md;
 * receipts re-read from BSC testnet (all status 1, gasUsed below).
 *   34      2 contracts + agent wallet (one row per beat), "DEPLOYED!" on b3
 *   35–36   5 txs: 2 deploys, register, trade #1, trade #2 — one per beat; 36 b2 "ALL STATUS 1!"
 *   37      gas footer + honest note (not BscScan-verified yet)
 */
const fmt = (n: number) => n.toLocaleString("en-US");

export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 34
  const txIn = frame >= b(k + 1);
  const lift = interpolate(frame, [b(k + 1) - 6, b(k + 1)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(105,147,120,0.2)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={100} from={0} count={16} inner={260} spread={260} color={C.gold} opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 56, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={38} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", opacity: 1 - lift, transform: `translateY(${-lift * 80}px)` }}>
            <BscScanProof
              title="BridgeAgent · deployed 2026-09-25"
              subtitle="contracts/script/Deploy.s.sol · blocks 132984734 / 132984739"
              at={b(k)}
              width={1640}
              full
              accent={C.gold}
              rows={[
                { label: "IdentityRegistry", value: CHAIN.registry, meta: "ERC-8004 · agent NFT", at: b(k), kind: "address", hot: true },
                { label: "TradeJournal", value: CHAIN.journal, meta: "append-only trades", at: b(k, 1), kind: "address", hot: true },
                { label: "agent wallet", value: CHAIN.owner, meta: "ownerOf(1)", at: b(k, 2), kind: "address" },
              ]}
            />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="5 txs · deploy → register → 2 journal writes"
              subtitle="receipts re-read from bsc-testnet-rpc.publicnode.com · all status 1"
              at={b(k + 1)}
              width={1640}
              accent={C.gold}
              rows={[
                { label: "deploy Registry", value: CHAIN.tx.deployRegistry, meta: `${fmt(CHAIN.gas.deployRegistry)} gas`, at: b(k + 1), kind: "tx" },
                { label: "deploy Journal", value: CHAIN.tx.deployJournal, meta: `${fmt(CHAIN.gas.deployJournal)} gas`, at: b(k + 1, 1), kind: "tx" },
                { label: "register #1", value: CHAIN.tx.register, meta: `${fmt(CHAIN.gas.register)} gas`, at: b(k + 1, 2), kind: "tx", hot: true },
                { label: "trade #1 · +150", value: CHAIN.tx.trade1, meta: `${fmt(CHAIN.gas.trade1)} gas`, at: b(k + 1, 3), kind: "tx", hot: true },
                { label: "trade #2 · +75", value: CHAIN.tx.trade2, meta: `${fmt(CHAIN.gas.trade2)} gas`, at: b(k + 2), kind: "tx", hot: true },
              ]}
            />
          </div>
        )}

        {frame >= b(k + 3) ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, textAlign: "center", ...fadeUp(frame, b(k + 3), 8, 16) }}>
            <div style={{ fontFamily: F.sans, fontSize: 34, color: C.text }}>
              Deploy: <b style={{ color: C.gold }}>{CHAIN.deployTbnb} tBNB</b> · register + 2 journal writes: <b style={{ color: C.gold }}>{CHAIN.agentTbnb} tBNB</b>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textMuted, marginTop: 10, ...fadeUp(frame, b(k + 3, 2), 8, 10) }}>
              source not yet verified on BscScan (no API key) · bytecode + receipts are live
            </div>
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k, 3)} x={1560} y={900} size={110} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1) - 3} />
      <ComicText text="ALL STATUS 1!" from={b(k + 2, 2)} x={1580} y={140} size={80} rotate={6} fill={C.pos} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="tick" at={b(k, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.45} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 1, i)} volume={0.55} />
      ))}
      <Sfx name="tick" at={b(k + 2)} volume={0.55} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.7} />
      <Sfx name="chime" at={b(k + 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
