import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, BscScanProof, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CELO, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · ON-CHAIN PROOF (bars 15–17). Hard cut. Every value is copied from
 * contracts/deployments/bsc-testnet.json + VERIFY-BNB.md ("Real BSC Testnet
 * deploy") and Bingo-chain/VERIFY-BNB.md (allowToken LANCE).
 *   bar 15  LIVE ON BSC TESTNET + deployed contracts, rows b1–b3 · "DEPLOYED!" b3
 *   bar 16  the smoke flow: approve b0 · deposit b1 · fundPool b2 · redeem b3 · Bingo allowToken b3.5
 */
export const S6Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 15
  const T = CHAIN.tx;
  const txIn = frame >= b(k + 1);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(228,116,68,0.12)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={110} from={0} count={16} inner={260} spread={260} color={C.gold} opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.5} shake={0.2} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={40} live variant="dark" />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center" }}>
          {!txIn ? (
            <BscScanProof
              title="LanceHub on BNB Chain · deployed contracts"
              subtitle="contracts/deployments/bsc-testnet.json · deploy block 132,984,102 · 2026-09-25"
              at={b(k)}
              width={1600}
              full
              rows={[
                { label: "LanceHub proxy", value: CHAIN.proxy, meta: "$LANCE · ERC-4626", at: b(k, 1), kind: "address", hot: true },
                { label: "Implementation", value: CHAIN.impl, meta: "UUPS", at: b(k, 2), kind: "address" },
                { label: "Pool asset", value: CHAIN.wbnb, meta: "WBNB (canonical)", at: b(k, 3), kind: "address" },
              ]}
            />
          ) : (
            <BscScanProof
              title="Smoke flow · real BSC testnet txs"
              subtitle="VERIFY-BNB.md · run with cast · every receipt status 1"
              at={b(k + 1)}
              width={1600}
              rows={[
                { label: "approve", value: T.approve, meta: "hub · 0.002 WBNB", at: b(k + 1), kind: "tx" },
                { label: "deposit", value: T.deposit, meta: "0.001 WBNB → ~1 LANCE", at: b(k + 1, 1), kind: "tx", hot: true },
                { label: "fundPool", value: T.fundPool, meta: "NAV 0.001 → 0.001167", at: b(k + 1, 2), kind: "tx", hot: true },
                { label: "redeem", value: T.redeem, meta: "0.5 LANCE → 0.0005775 WBNB", at: b(k + 1, 3), kind: "tx", hot: true },
                { label: "allowToken", value: T.allowLance, meta: "BingoChain · LANCE min 10", at: b(k + 1, 3.5), kind: "tx" },
              ]}
            />
          )}
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center", alignItems: "center", gap: 34 }}>
            {[
              { chain: "CELO MAINNET", addr: CELO.proxy, note: "live · verified on Celoscan", color: C.celo, at: b(k, 1.5) },
              { chain: "BSC TESTNET", addr: CHAIN.proxy, note: "new · WBNB-backed pool", color: C.gold, at: b(k, 2.5) },
            ].map((x, i) => (
              <React.Fragment key={x.chain}>
                {i === 1 ? (
                  <div style={{ fontFamily: F.comic, fontSize: 40, color: C.text, opacity: frame >= x.at ? 1 : 0, textAlign: "center", lineHeight: 1 }}>
                    SAME
                    <br />
                    SOURCE
                  </div>
                ) : null}
                <div
                  style={{
                    width: 640,
                    padding: "20px 26px",
                    borderRadius: 10,
                    background: "#15110f",
                    border: `4px solid ${INK}`,
                    boxShadow: `8px 8px 0 ${INK}, 0 0 0 2px ${x.color} inset`,
                    opacity: interpolate(frame, [x.at, x.at + 5], [0, 1], clamp),
                    transform: `scale(${interpolate(frame, [x.at, x.at + 7], [0.7, 1], clamp)}) rotate(${i ? 1 : -1}deg)`,
                  }}
                >
                  <div style={{ fontFamily: F.comic, fontSize: 36, color: x.color, letterSpacing: "0.05em" }}>{x.chain}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 22, color: C.text, marginTop: 4 }}>{x.addr}</div>
                  <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 20, color: C.textDim, marginTop: 6 }}>LanceHub proxy · {x.note}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        ) : null}

        {txIn ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 930,
              textAlign: "center",
              fontFamily: F.sans,
              fontWeight: 600,
              fontSize: 24,
              color: C.textDim,
              opacity: interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 8], [0, 1], clamp),
            }}
          >
            Owner {CHAIN.owner.slice(0, 6)}…{CHAIN.owner.slice(-4)} (group wallet) · contracts not yet verified on BscScan · testnet only
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k, 3)} x={1560} y={900} size={110} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1) - 2} />
      <ComicText text="CONFIRMED!" from={b(k + 1, 3)} x={1580} y={130} size={90} rotate={7} skewX={5} fill={C.emerald} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.gold} />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 1.5, 2, 2.5, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      {[1, 2, 3, 3.5].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 1, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.6} />
    </AbsoluteFill>
  );
};
