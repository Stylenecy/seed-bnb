import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 17–19) — DROP. Verbatim from
 * contracts/deployments/97*.json + VERIFY-BNB.md ("Smoke flow on the real testnet").
 *   bar 17  5 contracts, one per beat; "DEPLOYED!" on b3
 *   bar 18  9 smoke txs, one every half beat (+ gas), all status 1
 */
export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 17
  const txIn = frame >= b(k + 1);
  const lift = interpolate(frame, [b(k + 1) - 6, b(k + 1)], [0, 1], clamp);
  const h = (i: number) => b(k + 1, i * 0.5);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(240,185,11,0.22)" glowB="rgba(52,211,153,0.14)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={100} from={0} count={16} inner={260} spread={260} color={C.gold} opacity={0.45} width={5} seed="zalive" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={36} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 160, display: "flex", justifyContent: "center", opacity: 1 - lift, transform: `translateY(${-lift * 80}px)` }}>
            <BscScanProof
              title="Deployed contracts · 5"
              subtitle="contracts/deployments/97.json + 97-paper-engine.json · 2026-09-25"
              at={b(k)}
              width={1640}
              full
              rows={[
                { label: "AgentCertificate", value: CHAIN.cert, meta: "runHash + metrics", at: b(k), kind: "address", hot: true },
                { label: "ZeroArenaINFT", value: CHAIN.inft, meta: "ERC-7857 iNFT", at: b(k, 1), kind: "address" },
                { label: "ReencryptionOracle", value: CHAIN.oracle, meta: "transfer proofs", at: b(k, 1.5), kind: "address" },
                { label: "LiveCertificate", value: CHAIN.live, meta: "epoch hash chain", at: b(k, 2), kind: "address", hot: true },
                { label: "Season", value: CHAIN.season, meta: "prize + settle", at: b(k, 2.5), kind: "address" },
              ]}
            />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Smoke flow · token 1 · season 1"
              subtitle="VERIFY-BNB.md · every receipt status 1"
              at={b(k + 1)}
              width={1640}
              rows={[
                { label: "submit (cert 1)", value: CHAIN.tx.submit, meta: "148,030 gas", at: h(0), kind: "tx" },
                { label: "mint (token 1)", value: CHAIN.tx.mint, meta: "165,520 gas", at: h(1), kind: "tx", hot: true },
                { label: "start run", value: CHAIN.tx.start, meta: "101,040 gas", at: h(2), kind: "tx" },
                { label: "authorizeUpdater", value: CHAIN.tx.authorize, meta: "51,846 gas", at: h(3), kind: "tx" },
                { label: "update · epoch 0", value: CHAIN.tx.epoch0, meta: "67,041 gas", at: h(4), kind: "tx", hot: true },
                { label: "createSeason", value: CHAIN.tx.createSeason, meta: "0.002 tBNB pool", at: h(5), kind: "tx" },
                { label: "enroll(1, 1)", value: CHAIN.tx.enroll, meta: "160,283 gas", at: h(6), kind: "tx" },
                { label: "update · epoch 1", value: CHAIN.tx.epoch1, meta: "49,977 gas", at: h(7), kind: "tx", hot: true },
                { label: "settle(1, [1])", value: CHAIN.tx.settle, meta: "via backend", at: b(k + 1, 3.5), kind: "tx", hot: true },
              ]}
            />
          </div>
        )}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k, 3)} x={1560} y={980} size={100} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1) - 4} />
      {frame >= b(k, 3) && !txIn ? (
        <div style={{ position: "absolute", left: 140, bottom: 60, fontFamily: F.sans, fontSize: 28, color: C.textMuted, ...fadeUp(frame, b(k, 3), 8, 12) }}>
          Deploy: 6,126,472 gas ≈ 0.000613 tBNB · BscScan source verification pending
        </div>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.gold} />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 1.5, 2, 2.5].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.45} />
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={h(i)} volume={0.5} />
      ))}
      <Sfx name="impact" at={b(k + 1, 3.5)} volume={0.7} />
    </AbsoluteFill>
  );
};
