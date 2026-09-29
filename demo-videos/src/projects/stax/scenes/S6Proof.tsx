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
 * S6 · ON-CHAIN PROOF (bars 15–19). All values from
 * contracts/deployments/bsc-testnet.json + VERIFY-BNB.md ("Real BSC Testnet deploy").
 *   bar 15 b0   LIVE ON BSC TESTNET + contracts card; rows on b1,b2,b3
 *   bar 16 b0–b2 more rows (pools, treasury) · b3 "DEPLOYED!"
 *   bar 17 b0   DROP: the $20 smoke flow card; rows b1–b3 (fee, approve, investWithAI)
 *   bar 18 b0   swap outputs vs minOut · b2 risk-gate revert · b3 "BLOCKED!"
 */
export const S6Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.proof; // 15
  const txIn = frame >= b(k + 2);
  const lift = interpolate(frame, [b(k + 1, 3), b(k + 2)], [0, 1], clamp);

  const chips = [
    { t: `+${CHAIN.smoke.aaplOut} AAPLx  (min ${CHAIN.smoke.aaplMin})`, c: C.sage, at: b(k + 3) },
    { t: `+${CHAIN.smoke.tslaOut} TSLAx  (min ${CHAIN.smoke.tslaMin})`, c: C.terracotta, at: b(k + 3, 1) },
    { t: `risk ${CHAIN.smoke.riskTried} > max ${CHAIN.smoke.riskMax} → reverted`, c: C.neg, at: b(k + 3, 2) },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(108,192,156,0.14)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={120} from={0} count={16} inner={260} spread={260} color="#F0B90B" opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={40} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", transform: `translateY(${-lift * 120}px) scale(${1 - lift * 0.1})`, opacity: 1 - lift * 0.85 }}>
            <BscScanProof
              title="Deployed contracts"
              subtitle="contracts/deployments/bsc-testnet.json · 2026-09-25"
              at={b(k)}
              width={1620}
              full
              rows={[
                { label: "StaxExecutor", value: CHAIN.executor, meta: "investWithAI", at: b(k, 1), kind: "address", hot: true },
                { label: "InferenceVerifier", value: CHAIN.verifier, meta: "risk gate", at: b(k, 2), kind: "address" },
                { label: "Mock AAPLx", value: CHAIN.aaplx, meta: "pool @ $230", at: b(k, 3), kind: "address" },
                { label: "Mock TSLAx", value: CHAIN.tslax, meta: "pool @ $250", at: b(k + 1), kind: "address" },
                { label: "PCS V3 router", value: CHAIN.router, meta: "SwapRouter", at: b(k + 1, 1), kind: "address" },
                { label: "Treasury", value: CHAIN.treasury, meta: "fee receiver", at: b(k + 1, 2), kind: "address" },
              ]}
            />
          </div>
        ) : null}

        {txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Smoke flow · $20 invested by AI, on real testnet"
              subtitle="VERIFY-BNB.md · allocation AAPL 50 / TSLA 40 / NVDA 10"
              at={b(k + 2)}
              width={1620}
              rows={[
                { label: "fee → treasury", value: CHAIN.tx.fee, meta: `${CHAIN.smoke.fee} USDC`, at: b(k + 2, 1), kind: "tx" },
                { label: "approve", value: CHAIN.tx.approve, meta: `${CHAIN.smoke.net} USDC`, at: b(k + 2, 2), kind: "tx" },
                { label: "investWithAI", value: CHAIN.tx.invest, meta: `2 legs · ${CHAIN.smoke.gas} gas`, at: b(k + 2, 3), kind: "tx", hot: true },
              ]}
            />
          </div>
        ) : null}

        {frame >= b(k + 3) ? (
          <div style={{ position: "absolute", left: 120, right: 120, top: 640, display: "flex", justifyContent: "center", gap: 20, fontFamily: F.mono, fontSize: 25, color: C.text }}>
            {chips.map((x) =>
              frame >= x.at ? (
                <div
                  key={x.t}
                  style={{
                    padding: "14px 20px",
                    borderRadius: 14,
                    border: `1.5px solid ${x.c}aa`,
                    background: "rgba(255,255,255,0.04)",
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
        {frame >= b(k + 3, 1) ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 750, textAlign: "center", fontFamily: F.display, fontStyle: "italic", fontSize: 44, color: C.textDim, opacity: interpolate(frame, [b(k + 3, 1), b(k + 3, 1) + 8], [0, 1], clamp) }}>
            Every leg at or above minOut. Unsupported NVDA skipped, weights re-normalized.
          </div>
        ) : null}
      </Pulse>

      <ComicText text="DEPLOYED!" from={b(k + 1, 3)} x={1540} y={950} size={120} rotate={-7} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="INVESTED!" from={b(k + 2, 3)} x={420} y={930} size={120} rotate={-5} fill={C.sageLight} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3, 3)} />
      <ComicText text="BLOCKED!" from={b(k + 3, 3)} x={1500} y={930} size={130} rotate={6} fill={C.neg} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.6} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`d${i}`} name="tick" at={b(k + 1, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.7} />
      {[1, 2].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 2, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 2, 3)} volume={0.8} />
      <Sfx name="chime" at={b(k + 2, 3)} volume={0.55} />
      <Sfx name="tick" at={b(k + 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3, 3)} volume={0.8} />
    </AbsoluteFill>
  );
};
