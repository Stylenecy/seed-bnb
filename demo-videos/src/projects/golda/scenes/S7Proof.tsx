import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · ON-CHAIN PROOF (bars 19–22), real BSC testnet (chain 97). Copied from
 * VERIFY-BNB.md + Contracts/broadcast/DeployGolda.s.sol/97/run-latest.json.
 *   bar 19–20  contracts + deploy txs, one row per beat · "DEPLOYED!" on 20 b2
 *   bar 21     DROP: the live smoke txs (approve · deposit · redeem) · b3 gas footer
 */
export const S7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 19
  const txIn = frame >= b(k + 2);
  const lift = interpolate(frame, [b(k + 2) - 6, b(k + 2)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(217,174,74,0.14)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={110} from={0} count={16} inner={260} spread={260} color="#F0B90B" opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 64, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={38} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", opacity: 1 - lift, transform: `translateY(${-lift * 80}px)` }}>
            <BscScanProof
              title="Deployed · DeployGolda.s.sol · 7 txs"
              subtitle="chainId 97 · 2026-09-25 · all receipts status 1"
              at={b(k)}
              width={1640}
              rows={[
                { label: "GoldaVault (gVAULT)", value: CHAIN.vault, meta: "ERC-4626 vault", at: b(k), kind: "address", hot: true },
                { label: "MockUSDT", value: CHAIN.usdt, meta: "stable leg", at: b(k, 1), kind: "address" },
                { label: "MockPAXG", value: CHAIN.paxg, meta: "gold leg", at: b(k, 2), kind: "address" },
                { label: "create GoldaVault", value: CHAIN.deploy.vault, meta: "2,596,031 gas", at: b(k, 3), kind: "tx" },
                { label: "setAllowedSelector", value: CHAIN.deploy.sel1, meta: "LI.FI whitelist", at: b(k + 1), kind: "tx" },
                { label: "setAllowedSelector", value: CHAIN.deploy.sel2, meta: "LI.FI whitelist", at: b(k + 1, 1), kind: "tx" },
              ]}
            />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Live smoke · deposit + redeem"
              subtitle="VERIFY-BNB.md · real BSC testnet · status 1"
              at={b(k + 2)}
              width={1640}
              rows={[
                { label: "approve", value: CHAIN.tx.approve, meta: "1000 USDT", at: b(k + 2), kind: "tx" },
                { label: "deposit(1000)", value: CHAIN.tx.deposit, meta: "→ 1000 gVAULT", at: b(k + 2, 1), kind: "tx", hot: true },
                { label: "redeem(400)", value: CHAIN.tx.redeem, meta: "→ 400 USDT · 600 left", at: b(k + 2, 2), kind: "tx", hot: true },
              ]}
            />
          </div>
        )}

        {frame >= b(k + 2, 3) ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontFamily: F.sans, fontSize: 32, color: C.text, ...fadeUp(frame, b(k + 2, 3), 8, 16) }}>
            Deploy <b style={{ color: "#F0B90B" }}>0.000397 tBNB</b> · smoke ≈ <b style={{ color: "#F0B90B" }}>0.000022 tBNB</b> · at 0.1 gwei
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k + 1, 2)} x={1560} y={960} size={110} rotate={-7} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2) - 4} />
      <ComicText text="LIVE!" from={b(k + 2, 1)} x={1640} y={170} size={110} rotate={8} fill={C.goldSoft} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      <Sfx name="tick" at={b(k + 1)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k + 2)} volume={0.8} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.6} />
      <Sfx name="chime" at={b(k + 2, 3)} volume={0.55} />
    </AbsoluteFill>
  );
};
