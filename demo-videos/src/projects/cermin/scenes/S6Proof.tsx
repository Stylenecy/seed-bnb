import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  BnbBadge,
  BnbMark,
  BscScanProof,
  clamp,
  ComicText,
  fadeUp,
  Glass,
  Halftone,
  INK,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  useSceneClock,
} from "../../../kit";
import { C, CHAIN, F, short } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · ON-CHAIN PROOF (bars 35–40). All values copied from
 * contracts/deployments/bsc-testnet.json + VERIFY-BNB.md.
 *   bar 35 b0   LIVE ON BSC TESTNET badge; contracts card; rows b1 … bar 36 b3
 *   bar 37 b0   live UI-run tx card (2026-09-27); one tx per beat through bar 38 b3
 *   bar 39      (soft bar) the price-feed truth: mock on testnet, Chainlink adapter verified
 */
export const S6Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 35

  const txIn = frame >= b(k + 2);
  const oracleIn = frame >= b(k + 4);
  const lift = interpolate(frame, [b(k + 2) - 6, b(k + 2)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base="#110e0b" glowA="rgba(240,185,11,0.22)" glowB="rgba(199,122,58,0.14)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.03} gap={22} color={C.amberHi} />
      <SpeedBurst cx={960} cy={110} from={0} count={16} inner={260} spread={260} color="#F0B90B" opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={40} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", opacity: 1 - lift, transform: `translateY(${-lift * 80}px)` }}>
            <BscScanProof
              title="Deployed contracts"
              subtitle="contracts/deployments/bsc-testnet.json · deploy block 132,984,106"
              at={b(k)}
              width={1580}
              full
              rows={[
                { label: "CerminFactory", value: CHAIN.factory, meta: "clones vaults", at: b(k, 1), kind: "address", hot: true },
                { label: "CerminVault impl", value: CHAIN.vaultImpl, meta: "logic unchanged", at: b(k, 2), kind: "address" },
                { label: "MockPriceFeed", value: CHAIN.priceFeed, meta: "testnet mock", at: b(k, 3), kind: "address" },
                { label: "MockMUSD", value: CHAIN.musd, meta: "CDP debt token", at: b(k + 1), kind: "address" },
                { label: "TroveManager", value: CHAIN.troveManager, meta: "mock CDP", at: b(k + 1, 1), kind: "address" },
                { label: "BorrowerOps", value: CHAIN.borrowerOps, meta: "mock CDP", at: b(k + 1, 2), kind: "address" },
                { label: "SavingsVault", value: CHAIN.savingsVault, meta: "sMUSD", at: b(k + 1, 3), kind: "address" },
              ]}
            />
          </div>
        ) : null}

        {txIn && !oracleIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Live run · open → skim → defend → withdraw → close"
              subtitle={`real BSC testnet · driven through the UI · every receipt status 1 · earlier cast smoke run (vault ${short(CHAIN.smokeVault, 6, 4)}) also verified`}
              at={b(k + 2)}
              width={1580}
              rows={[
                { label: "createVault · UI", value: CHAIN.tx.open, meta: "+0.04 tBNB", at: b(k + 2), kind: "tx", hot: true },
                { label: "mock setPrice", value: CHAIN.tx.priceUp, meta: "$132k", at: b(k + 2, 1), kind: "tx" },
                { label: "skim · keeper", value: CHAIN.tx.skim, meta: "debt 2,640", at: b(k + 2, 2), kind: "tx", hot: true },
                { label: "mock setPrice", value: CHAIN.tx.priceDown, meta: "$90k", at: b(k + 2, 3), kind: "tx" },
                { label: "defend · UI", value: CHAIN.tx.defend, meta: "ICR 140%", at: b(k + 3), kind: "tx", hot: true },
                { label: "withdraw · UI", value: CHAIN.tx.withdraw, meta: "100 MUSD", at: b(k + 3, 1), kind: "tx" },
                { label: "close · UI", value: CHAIN.tx.close, meta: "0.04 tBNB back", at: b(k + 3, 2), kind: "tx", hot: true },
                { label: "smoke close", value: CHAIN.smokeTx.close, meta: "09-25 cast run", at: b(k + 3, 3), kind: "tx" },
              ]}
            />
          </div>
        ) : null}

        {oracleIn ? (
          <div style={{ position: "absolute", left: 150, right: 150, top: 200, display: "flex", gap: 40 }}>
            {[
              {
                at: b(k + 4),
                tag: "ON TESTNET",
                title: "MockPriceFeed",
                addr: CHAIN.priceFeed,
                lines: ["Owner-settable price that drove the skim & defend demo", "Faucet-sized 0.04 tBNB clears the 2,000 MUSD minimum"],
                color: C.amberHi,
              },
              {
                at: b(k + 4, 1),
                tag: "VERIFIED",
                title: "Chainlink BNB / USD",
                addr: CHAIN.chainlinkMainnet,
                lines: ["Adapter proven on a BSC mainnet fork vs the live feed", "fetchPrice() = $779.30 · stale price → revert"],
                color: "#34C759",
              },
            ].map((c) => (
              <div key={c.title} style={{ flex: 1, ...fadeUp(frame, c.at, 10, 40) }}>
                <Glass radius={26} glow={0.4} glowColor="rgba(240,185,11,0.3)" fill="rgba(20,16,12,0.88)" innerStyle={{ padding: "34px 38px", minHeight: 440 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <BnbMark size={44} />
                    <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 20, letterSpacing: "0.2em", color: c.color }}>{c.tag}</span>
                  </div>
                  <div style={{ fontFamily: F.display, fontSize: 62, color: C.text, marginTop: 18 }}>{c.title}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 26, color: C.textDim, marginTop: 8 }}>{short(c.addr, 10, 8)}</div>
                  {c.lines.map((l, i) => (
                    <div key={i} style={{ fontFamily: F.sans, fontSize: 28, color: C.text, marginTop: i === 0 ? 26 : 10, lineHeight: 1.3 }}>
                      <span style={{ color: c.color }}>✓ </span>
                      {l}
                    </div>
                  ))}
                </Glass>
              </div>
            ))}
          </div>
        ) : null}
        {oracleIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: F.display, fontStyle: "italic", fontSize: 44, color: C.text, ...fadeUp(frame, b(k + 4, 2), 10, 16) }}>
            Native BNB collateral · no bridge, no wrapped asset
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k + 1, 3)} x={1560} y={960} size={110} rotate={-7} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2) - 2} />
      <ComicText text="8 / 8 SUCCESS!" from={b(k + 3, 3)} x={1500} y={990} size={96} rotate={-5} fill="#34C759" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 4) - 2} />
      <ComicText text="VERIFIED!" from={b(k + 4, 2)} x={960} y={920} size={120} rotate={-4} fill="#34C759" variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color={C.cream} innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.8} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`d${i}`} name="tick" at={b(k + 1, i)} volume={0.55} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 2, i)} volume={0.55} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`u${i}`} name="tick" at={b(k + 3, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 4)} volume={0.7} />
      <Sfx name="chime" at={b(k + 4, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
