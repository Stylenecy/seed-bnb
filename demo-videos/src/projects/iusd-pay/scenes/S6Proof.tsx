import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  BnbBadge,
  BscScanProof,
  clamp,
  ComicText,
  Halftone,
  INK,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  useSceneClock,
} from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · ON-CHAIN PROOF (bars 24–32) — DROP 3. Everything here is copied from
 * deployments/bsc-testnet.json + VERIFY-BNB.md ("Real BSC Testnet deploy").
 *   bar 24 b0   LIVE ON BSC TESTNET badge slams; contracts card lands
 *   bar 24 b1…  one contract row per beat (USDT, IPayPool, IPayGiftPool, relayer, treasury)
 *   bar 26 b0   "DEPLOYED!" stamp
 *   bar 27      BREAK — contracts card lifts away; "…and it ran live:"
 *   bar 28 b0   smoke-flow tx card; rows mint/approve/deposit on b1–b3
 *   bar 29 b0   relayer sponsorClaim row (hot) + "CLAIMED!"
 *   bar 30–31   annotation: relayer paid the gas, recipient paid none
 */
export const S6Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 24

  const lift = interpolate(frame, [b(k + 3), b(k + 3, 2)], [0, 1], clamp);
  const txIn = frame >= b(k + 4);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(240,185,11,0.22)" glowB="rgba(52,199,89,0.12)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={120} from={0} count={16} inner={260} spread={260} color="#F0B90B" opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 78, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={40} live variant="dark" />
        </div>

        {/* Contracts (bars 24–27) */}
        {!txIn ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 230,
              display: "flex",
              justifyContent: "center",
              transform: `translateY(${-lift * 120}px) scale(${1 - lift * 0.1})`,
              opacity: 1 - lift * 0.85,
            }}
          >
            <BscScanProof
              title="Deployed contracts"
              subtitle="deployments/bsc-testnet.json · 2026-09-25"
              at={b(k)}
              width={1560}
              full
              rows={[
                { label: "USDT (test)", value: CHAIN.token, meta: "MockERC20 · 18 dec", at: b(k, 1), kind: "address" },
                { label: "IPayPool", value: CHAIN.pool, meta: "feeBps 50 · cap 5", at: b(k, 2), kind: "address", hot: true },
                { label: "IPayGiftPool", value: CHAIN.giftPool, meta: "24 boxes", at: b(k, 3), kind: "address" },
                { label: "Relayer", value: CHAIN.relayer, meta: "sponsor on both", at: b(k + 1), kind: "address" },
                { label: "Treasury", value: CHAIN.treasury, meta: "fee receiver", at: b(k + 1, 1), kind: "address" },
              ]}
            />
          </div>
        ) : null}

        {frame >= b(k + 3, 1) && !txIn ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 860,
              textAlign: "center",
              fontFamily: F.display,
              fontStyle: "italic",
              fontSize: 60,
              color: C.text,
              opacity: interpolate(frame, [b(k + 3, 1), b(k + 3, 1) + 8], [0, 1], clamp),
            }}
          >
            …and it ran live.
          </div>
        ) : null}

        {/* Smoke-flow txs (bars 28–31) */}
        {txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Smoke flow · 10 USDT, auto-claimed"
              subtitle="VERIFY-BNB.md · real testnet txs"
              at={b(k + 4)}
              width={1560}
              rows={[
                { label: "mint 10 USDT", value: CHAIN.tx.mint.hash, meta: `${CHAIN.tx.mint.gas} gas`, at: b(k + 4, 1), kind: "tx" },
                { label: "approve", value: CHAIN.tx.approve.hash, meta: `${CHAIN.tx.approve.gas} gas`, at: b(k + 4, 2), kind: "tx" },
                { label: "deposit", value: CHAIN.tx.deposit.hash, meta: `${CHAIN.tx.deposit.gas} gas`, at: b(k + 4, 3), kind: "tx" },
                { label: "sponsorClaim", value: CHAIN.tx.claim.hash, meta: `${CHAIN.tx.claim.gas} gas`, at: b(k + 5), kind: "tx", hot: true },
              ]}
            />
          </div>
        ) : null}

        {frame >= b(k + 6) ? (
          <div
            style={{
              position: "absolute",
              left: 180,
              right: 180,
              top: 740,
              display: "flex",
              justifyContent: "center",
              gap: 28,
              fontFamily: F.sans,
              fontSize: 34,
              color: C.text,
            }}
          >
            {[
              { t: "Relayer paid the claim gas", c: "#F0B90B", at: b(k + 6) },
              { t: "Recipient's wallet: no gas", c: C.green, at: b(k + 6, 2) },
              { t: "Fee: 0.05 USDT → treasury", c: C.pink, at: b(k + 7) },
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

      <ComicText text="DEPLOYED!" from={b(k + 2)} x={1500} y={900} size={120} rotate={-7} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3)} />
      <ComicText text="CLAIMED!" from={b(k + 5)} x={960} y={950} size={120} rotate={-4} fill={C.green} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 6, 3)} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.6} />
      ))}
      <Sfx name="tick" at={b(k + 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 2)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 3, 1)} volume={0.4} />
      <Sfx name="impact" at={b(k + 4)} volume={0.7} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 4, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 5)} volume={0.8} />
      <Sfx name="chime" at={b(k + 5)} volume={0.6} />
      <Sfx name="tick" at={b(k + 6)} volume={0.5} />
      <Sfx name="tick" at={b(k + 6, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 7)} volume={0.5} />
    </AbsoluteFill>
  );
};
