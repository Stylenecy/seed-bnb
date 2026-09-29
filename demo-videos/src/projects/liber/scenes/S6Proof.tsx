import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · ON-CHAIN PROOF (bars 28–32) — DROP. Copied from
 * contracts/deployments/bsc-testnet.json + VERIFY-BNB.md ("Real BSC Testnet deploy").
 *   28 b0  LIVE ON BSC TESTNET badge + card; b1 MockUSDC, b2 deployer, b3 deploy tx
 *   29 b0  faucet() tx (+1000 USDC)                          "MINTED!"
 *   30 b0  transfer 5 USDC → stand-in Kolo address (hot)     "SENT!"
 *   31     BREAK — pills: balances 995 / 5 · gas · mainnet USDC
 */
export const S6Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 28

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(240,185,11,0.22)" glowB="rgba(47,217,138,0.14)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={120} from={0} count={16} inner={260} spread={260} color="#F0B90B" opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={40} live variant="dark" />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center" }}>
          <BscScanProof
            title="Liber · MockUSDC + smoke flow"
            subtitle="contracts/deployments/bsc-testnet.json · VERIFY-BNB.md · 2026-09-25"
            at={b(k)}
            width={1600}
            rows={[
              { label: "MockUSDC", value: CHAIN.mockUsdc, meta: "18 dec · open faucet()", at: b(k, 1), kind: "address", hot: true },
              { label: "Deployer", value: CHAIN.deployer, meta: "smoke wallet", at: b(k, 2), kind: "address" },
              { label: "deploy", value: CHAIN.tx.deploy, meta: "forge script", at: b(k, 3), kind: "tx" },
              { label: "faucet()", value: CHAIN.tx.faucet, meta: "+1000 USDC", at: b(k + 1), kind: "tx" },
              { label: "transfer 5 USDC", value: CHAIN.tx.transfer, meta: "→ 0x…dEaD (Kolo)", at: b(k + 2), kind: "tx", hot: true },
            ]}
          />
        </div>

        {frame >= b(k + 3) ? (
          <div style={{ position: "absolute", left: 120, right: 120, top: 790, display: "flex", justifyContent: "center", gap: 26, fontFamily: F.sans, fontSize: 30, whiteSpace: "nowrap", color: C.text }}>
            {[
              { t: "Balances after: 995 / 5", c: C.bright, at: b(k + 3) },
              { t: `Gas, deploy + smoke: ${CHAIN.gasSpent}`, c: "#F0B90B", at: b(k + 3, 1) },
              { t: "Mainnet: Binance-Peg USDC, no deploy", c: C.gold, at: b(k + 3, 2) },
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

      <ComicText text="DEPLOYED!" from={b(k, 3)} x={1500} y={930} size={110} rotate={-6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="MINTED!" from={b(k + 1, 1)} x={1560} y={130} size={96} rotate={8} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="SENT!" from={b(k + 2, 1)} x={1580} y={130} size={120} rotate={-7} fill={C.bright} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3, 2)} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 2)} volume={0.75} />
      <Sfx name="chime" at={b(k + 2, 1)} volume={0.55} />
      {[0, 1, 2].map((i) => (
        <Sfx key={`p${i}`} name="tick" at={b(k + 3, i)} volume={0.5} />
      ))}
    </AbsoluteFill>
  );
};
