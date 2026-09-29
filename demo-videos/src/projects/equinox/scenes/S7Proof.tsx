import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 28–32) — DROP. Copied verbatim from
 * contracts/deployments/bsc-testnet.json + VERIFY-BNB.md.
 *   bar 28–29  8 contracts, one row per beat; "DEPLOYED!" on 29 b2
 *   bar 30–31  8 smoke-flow txs, one per beat (price → vault → skim → crash → defend) + gas footer
 */
export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 28
  const txIn = frame >= b(k + 2);
  const lift = interpolate(frame, [b(k + 2) - 6, b(k + 2)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(240,185,11,0.22)" glowB="rgba(145,129,245,0.14)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={110} from={0} count={16} inner={260} spread={260} color="#F0B90B" opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 64, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={38} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", opacity: 1 - lift, transform: `translateY(${-lift * 80}px)` }}>
            <BscScanProof
              title="Deployed contracts · 8"
              subtitle="contracts/deployments/bsc-testnet.json · 2026-09-25"
              at={b(k)}
              width={1640}
              full
              rows={[
                { label: "EquinoxVaults", value: CHAIN.vaults, meta: "vaults + agent", at: b(k), kind: "address", hot: true },
                { label: "EquinoxRegistry", value: CHAIN.registry, meta: "assets + venues", at: b(k, 1), kind: "address" },
                { label: "PriceOracle", value: CHAIN.oracle, meta: "keeper prices", at: b(k, 2), kind: "address" },
                { label: "NativePool", value: CHAIN.poolDebt, meta: "debt lender", at: b(k, 3), kind: "address" },
                { label: "NativePool", value: CHAIN.poolColl, meta: "collateral venue", at: b(k + 1), kind: "address" },
                { label: "ShadowPool", value: CHAIN.shadow, meta: "shadow wallet", at: b(k + 1, 1), kind: "address", hot: true },
                { label: "tWBNB (mock)", value: CHAIN.tWBNB, meta: "collateral", at: b(k + 1, 2), kind: "address" },
                { label: "tUSDT (mock)", value: CHAIN.tUSDT, meta: "debt token", at: b(k + 1, 3), kind: "address" },
              ]}
            />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Smoke flow · vault #1"
              subtitle="VERIFY-BNB.md · all receipts status 1"
              at={b(k + 2)}
              width={1640}
              rows={[
                { label: "setPrice $700", value: CHAIN.tx.price700, meta: "keeper oracle", at: b(k + 2), kind: "tx" },
                { label: "openVault", value: CHAIN.tx.openVault, meta: "vault #1", at: b(k + 2, 1), kind: "tx" },
                { label: "deposit", value: CHAIN.tx.deposit, meta: "5 tWBNB", at: b(k + 2, 2), kind: "tx" },
                { label: "openAgent", value: CHAIN.tx.openAgent, meta: "LTV 40% · minHf 1.5", at: b(k + 2, 3), kind: "tx" },
                { label: "skimToReserve", value: CHAIN.tx.skim, meta: "1,400 tUSDT", at: b(k + 3), kind: "tx", hot: true },
                { label: "recordAction", value: CHAIN.tx.record, meta: "hash chain", at: b(k + 3, 1), kind: "tx" },
                { label: "setPrice $400", value: CHAIN.tx.crash, meta: "HF 1.14", at: b(k + 3, 2), kind: "tx" },
                { label: "defend", value: CHAIN.tx.defend, meta: "HF 1.50", at: b(k + 3, 3), kind: "tx", hot: true },
              ]}
            />
          </div>
        )}

        {frame >= b(k + 3, 3) ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", fontFamily: F.sans, fontSize: 32, color: C.text, ...fadeUp(frame, b(k + 3, 3), 8, 16) }}>
            Deploy + 14 smoke txs: <b style={{ color: "#F0B90B" }}>0.000997 tBNB</b> of gas in total
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k + 1, 2)} x={1560} y={960} size={110} rotate={-7} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2) - 4} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      {[0, 1, 3].map((i) => (
        <Sfx key={`d${i}`} name="tick" at={b(k + 1, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.45} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 2, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k + 3, 3)} volume={0.8} />
      <Sfx name="chime" at={b(k + 3, 3)} volume={0.55} />
    </AbsoluteFill>
  );
};
