import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BnbBadge,
  BnbMark,
  BscScanProof,
  clamp,
  ComicText,
  Glass,
  GLASS,
  Halftone,
  INK,
  InkFrame,
  PremiumBg,
  Pulse,
  scrambleHex,
  Sfx,
  shortHex,
  SpeedBurst,
  SUCCESS,
  useSceneClock,
} from "../../../kit";
import { BallSvg } from "../art";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · ON-CHAIN PROOF (bars 28–32). Every value is copied from
 * contracts/deployments/bsc-testnet.json + VERIFY-BNB.md ("Real BSC Testnet deploy").
 *   bar 28      LIVE ON BSC TESTNET badge + deployed contracts (rows b1–b3)
 *   bar 29–30   the full 2-player WBNB game: 13 txs landing on half-beats
 *   bar 31      BREAK: "SETTLED!" + receipts all status 1 + 1% fee → treasury
 */
type Tx = { label: string; hash: string; ball?: number; hot?: boolean; at: number };

const TxRow: React.FC<{ tx: Tx }> = ({ tx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < tx.at) return <div style={{ height: 62, marginTop: 8 }} />;
  const p = spring({ frame: f - tx.at, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  return (
    <div
      style={{
        height: 62,
        marginTop: 8,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 14px",
        borderRadius: 12,
        background: tx.hot ? "rgba(111,255,0,0.1)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${tx.hot ? C.neon + "aa" : GLASS.line}`,
        boxShadow: tx.hot ? "0 0 26px rgba(111,255,0,0.25)" : undefined,
        transform: `translateX(${(1 - p) * 50}px)`,
        opacity: interpolate(p, [0, 0.35], [0, 1], clamp),
      }}
    >
      <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {tx.ball ? (
          <svg width={44} height={44} viewBox="-60 -60 124 124">
            <BallSvg x={0} y={0} label={tx.ball} />
          </svg>
        ) : (
          <BnbMark size={30} />
        )}
      </div>
      <div style={{ width: 232, fontFamily: F.sans, fontWeight: 700, fontSize: 24, color: tx.hot ? C.neon : GLASS.txt, whiteSpace: "nowrap" }}>{tx.label}</div>
      <div style={{ flex: 1, fontFamily: F.mono, fontSize: 22, color: GLASS.txtMid }}>{scrambleHex(f, shortHex(tx.hash, 12, 8), tx.at, 10)}</div>
      <div
        style={{
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: "0.08em",
          color: SUCCESS,
          background: "rgba(52,199,89,0.12)",
          border: "1px solid rgba(52,199,89,0.4)",
          borderRadius: 8,
          padding: "5px 10px",
        }}
      >
        ✓ STATUS 1
      </div>
    </div>
  );
};

export const S6Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b } = useSceneClock();
  const k = BAR.proof; // 28

  const txIn = frame >= b(k + 1);
  const T = CHAIN.tx;
  const txs: Tx[] = [
    { label: "createArena", hash: T.create, at: b(k + 1) },
    { label: "commitBoard P1", hash: T.commit1, at: b(k + 1, 1) },
    { label: "commitBoard P2", hash: T.commit2, at: b(k + 1, 1.5) },
    ...T.calls.map((h, i) => ({ label: `callNumber(${i + 1})`, hash: h, ball: i + 1, at: b(k + 1, 2 + i * 0.5) })),
    { label: "claimBingo", hash: T.claim, at: b(k + 2, 1), hot: true },
    { label: "revealBoard P1", hash: T.reveal1, at: b(k + 2, 1.5) },
    { label: "revealBoard P2", hash: T.reveal2, at: b(k + 2, 2) },
    { label: "settle", hash: T.settle, at: b(k + 2, 2.5), hot: true },
    { label: "withdraw(WBNB)", hash: T.withdraw, at: b(k + 2, 3) },
  ];
  const card = spring({ frame: frame - b(k + 1), fps, config: { damping: 16, stiffness: 150, mass: 0.8 } });

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(240,185,11,0.22)" glowB="rgba(111,255,0,0.12)" glow="top" floor={0.45} grid={0.6} />
      <Halftone opacity={0.035} gap={22} />
      <SpeedBurst cx={960} cy={110} from={0} count={16} inner={260} spread={260} color={C.gold} opacity={0.45} width={5} seed="live" />

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={40} live variant="dark" />
        </div>

        {!txIn ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center" }}>
            <BscScanProof
              title="Deployed contracts"
              subtitle="contracts/deployments/bsc-testnet.json · 2026-09-25"
              at={b(k)}
              width={1560}
              full
              rows={[
                { label: "BingoChain proxy", value: CHAIN.proxy, meta: `block ${CHAIN.deployBlock.toLocaleString("en-US")}`, at: b(k, 1), kind: "address", hot: true },
                { label: "Implementation", value: CHAIN.impl, meta: "version() 1.3.0", at: b(k, 2), kind: "address" },
                { label: "WBNB (allowed)", value: CHAIN.wbnb, meta: "min 0.001", at: b(k, 3), kind: "address" },
                { label: "$LANCE (allowed)", value: CHAIN.lance, meta: "min 10", at: b(k, 3.5), kind: "address" },
              ]}
            />
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              left: 120,
              top: 180,
              width: 1680,
              transform: `translateY(${(1 - card) * 60}px) scale(${0.95 + 0.05 * card})`,
              opacity: interpolate(card, [0, 0.3], [0, 1], clamp),
            }}
          >
            <Glass radius={26} glow={0.35} glowColor="rgba(111,255,0,0.3)" fill="rgba(8,12,34,0.88)">
              <div style={{ padding: "20px 30px 14px", display: "flex", alignItems: "center", gap: 18, borderBottom: `1px solid ${GLASS.line}` }}>
                <BnbMark size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 30, color: GLASS.txt }}>Arena #1 · a full 2-player WBNB game, live</div>
                  <div style={{ fontFamily: F.mono, fontSize: 17, color: GLASS.txtDim, marginTop: 4 }}>VERIFY-BNB.md · real BSC-testnet txs · stake 0.001 WBNB each</div>
                </div>
                <div style={{ fontFamily: F.display, fontSize: 44, color: C.neon }}>{txs.filter((t) => frame >= t.at).length}/13 TXS</div>
              </div>
              <div style={{ padding: "4px 20px 18px", display: "flex", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  {txs.slice(0, 7).map((t) => (
                    <TxRow key={t.label} tx={t} />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  {txs.slice(7).map((t) => (
                    <TxRow key={t.label} tx={t} />
                  ))}
                </div>
              </div>
            </Glass>
          </div>
        )}

        {frame >= b(k + 3) ? (
          <div style={{ position: "absolute", left: 120, right: 120, top: 850, display: "flex", justifyContent: "center", gap: 26, fontFamily: F.sans, fontWeight: 600, fontSize: 32, color: C.text }}>
            {[
              { t: "13 receipts · every one status 1", c: SUCCESS, at: b(k + 3, 1) },
              { t: `1% fee: ${CHAIN.smoke.fee} WBNB → treasury`, c: C.gold, at: b(k + 3, 2) },
              { t: "withdraw paid out WBNB", c: C.neon, at: b(k + 3, 3) },
            ].map((x) =>
              frame >= x.at ? (
                <div
                  key={x.t}
                  style={{
                    padding: "14px 22px",
                    borderRadius: 14,
                    border: `1.5px solid ${x.c}88`,
                    background: "rgba(1,8,40,0.85)",
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

      <ComicText text="DEPLOYED!" from={b(k, 3)} x={1560} y={900} size={110} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1) - 2} />
      {frame >= b(k + 3) ? <AbsoluteFill style={{ background: "rgba(1,8,40,0.4)", opacity: interpolate(frame, [b(k + 3), b(k + 3) + 5], [0, 1], clamp) }} /> : null}
      <ComicText text="SETTLED!" from={b(k + 3)} x={960} y={470} size={230} rotate={-4} skewX={-5} fill={C.neon} variant="onomatopoeia" echoColor={INK} burst={C.gold} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.gold} />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      {[1, 2, 3, 3.5].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      {txs.slice(1).map((t) => (
        <Sfx key={t.label} name="tick" at={t.at} volume={t.hot ? 0.75 : 0.5} />
      ))}
      <Sfx name="impact" at={b(k + 3)} volume={0.9} />
      <Sfx name="chime" at={b(k + 3)} volume={0.55} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
