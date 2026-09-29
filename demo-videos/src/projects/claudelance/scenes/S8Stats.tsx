import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  clamp,
  ComicPanel,
  ComicText,
  Halftone,
  INK,
  inkTextStyle,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  steppedCount,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { ChainCoin } from "../art";
import { C, CELO, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S8 · STAT WALL (bars 32–36) — DROP. VERIFY-BNB.md numbers only.
 *   32 b0 11 txs, all status 1 (count ticks b0–b1) · 32 b2 agent #2474
 *   33 b0 98% to the worker · 33 b2 115 tests / gas
 *   34 b0 wall clears → Celo coin · b1 BNB coin · b2 link · b3 "ONE PROTOCOL. TWO CHAINS."
 *   35 subtitle + footnote
 */
const INKC = "#1a1512";
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 27, color: INKC, marginTop: 8, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: INKC, letterSpacing: "0.04em" }}>{children}</div>
);

export const S8Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b } = useSceneClock();
  const k = BAR.stats; // 32

  const txs = steppedCount(frame, [b(k), b(k, 0.5), b(k, 1)], [0, 6, CHAIN.smoke.txs]);
  const pct = steppedCount(frame, [b(k + 1), b(k + 1, 0.5), b(k + 1, 1)], [0, 50, 98]);
  const pA = useBeatPunch([b(k), b(k, 1)], 0.04, 4);
  const pB = useBeatPunch([b(k, 2), b(k, 3)], 0.04, 4);
  const pC = useBeatPunch([b(k + 1), b(k + 1, 1)], 0.04, 4);
  const pD = useBeatPunch([b(k + 1, 2), b(k + 1, 3)], 0.04, 4);

  const clear = interpolate(frame, [b(k + 2), b(k + 2) + 8], [0, 1], clamp);
  const coin = (at: number) => spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 190, mass: 0.7 } });
  const cL = coin(b(k + 2));
  const cR = coin(b(k + 2, 1));
  const link = interpolate(frame, [b(k + 2, 2), b(k + 2, 2) + 8], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(228,116,68,0.24)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color="#F0B90B" opacity={0.28} width={6} seed="stats" />

      {/* stat wall */}
      <AbsoluteFill style={{ opacity: 1 - clear, transform: `scale(${1 - 0.15 * clear})` }}>
        <Pulse intensity={1.2} shake={0.5}>
          <ComicPanel at={b(k)} x={100} y={120} w={900} h={400} rot={-2} bg="#F7CDB6" bg2="#e47444" from="left" punch={pA}>
            <div style={{ padding: "36px 46px" }}>
              <Head>BOUNTY LIFECYCLE ON BSC TESTNET</Head>
              <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 4 }}>
                <span style={{ ...inkTextStyle(170, "#fff"), fontVariantNumeric: "tabular-nums" }}>{txs}</span>
                <span style={{ ...inkTextStyle(80, "#fff") }}>TXS</span>
              </div>
              <Label>register → post → claim → submit → CI → pick → settle → withdraw → reputation. Every receipt status 1.</Label>
            </div>
          </ComicPanel>

          <ComicPanel at={b(k, 2)} x={1060} y={110} w={760} h={410} rot={2.2} bg="#D9F2E6" bg2="#34d399" from="right" punch={pB}>
            <div style={{ padding: "36px 46px" }}>
              <Head>ERC-8004 AGENT</Head>
              <div style={{ ...inkTextStyle(170, "#fff"), marginTop: 4 }}>#{CHAIN.agentId}</div>
              <Label>on the real IdentityRegistry 0x8004A818…BD9e, reputation written after payout</Label>
            </div>
          </ComicPanel>

          <ComicPanel at={b(k + 1)} x={160} y={590} w={820} h={370} rot={1.6} bg="#FFE9A8" bg2="#F0B90B" from="down" punch={pC}>
            <div style={{ padding: "34px 46px" }}>
              <Head>TO THE WORKER</Head>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
                <span style={{ ...inkTextStyle(150, "#fff"), fontVariantNumeric: "tabular-nums" }}>{pct}</span>
                <span style={{ ...inkTextStyle(90, "#fff") }}>%</span>
              </div>
              <Label>
                {CHAIN.smoke.toWorker} of {CHAIN.smoke.bounty} USDT to agent {CHAIN.agentId}, {CHAIN.smoke.fee} fee, stake back
              </Label>
            </div>
          </ComicPanel>

          <ComicPanel at={b(k + 1, 2)} x={1030} y={600} w={790} h={350} rot={-1.8} bg="#E4E0FF" bg2="#9a8cff" from="down" punch={pD}>
            <div style={{ padding: "34px 46px" }}>
              <Head>SHIPPED SAFE</Head>
              <div style={{ display: "flex", gap: 44, marginTop: 6 }}>
                <div>
                  <div style={{ ...inkTextStyle(110, "#fff") }}>{CELO.tests}</div>
                  <Label>forge tests, 0 failed</Label>
                </div>
                <div style={{ opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 4], [0, 1], clamp) }}>
                  <div style={{ ...inkTextStyle(110, "#fff") }}>~{CHAIN.smoke.gas}</div>
                  <Label>tBNB gas, whole run</Label>
                </div>
              </div>
            </div>
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      {/* one protocol, two chains */}
      {frame >= b(k + 2) ? (
        <Pulse intensity={1.1} shake={0.3}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
            <line x1={620} y1={440} x2={620 + 680 * link} y2={440} stroke={C.clay} strokeWidth={14} strokeDasharray="30 18" strokeLinecap="round" />
            <ChainCoin x={560} y={440} s={1.9 * cL} chain="celo" rot={(1 - cL) * -40} />
            {frame >= b(k + 2, 1) ? <ChainCoin x={1360} y={440} s={1.9 * cR} chain="bnb" rot={(1 - cR) * 40} /> : null}
            <text x={560} y={660} textAnchor="middle" fontFamily={F.comic} fontSize={54} fill={C.celo} stroke={INK} strokeWidth={8} paintOrder="stroke" opacity={cL}>
              CELO · LIVE
            </text>
            {frame >= b(k + 2, 1) ? (
              <text x={1360} y={660} textAnchor="middle" fontFamily={F.comic} fontSize={54} fill={C.gold} stroke={INK} strokeWidth={8} paintOrder="stroke" opacity={cR}>
                BNB CHAIN · NEW
              </text>
            ) : null}
          </svg>
        </Pulse>
      ) : null}
      <ComicText text="ONE PROTOCOL. TWO CHAINS." from={b(k + 2, 3)} x={960} y={180} size={104} rotate={-3} skewX={-5} fill="#fff" variant="onomatopoeia" echoColor={C.clay} />
      {frame >= b(k + 3) ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 770,
            textAlign: "center",
            fontFamily: F.display,
            fontWeight: 600,
            fontSize: 54,
            letterSpacing: "-0.02em",
            color: C.text,
            opacity: interpolate(frame, [b(k + 3), b(k + 3) + 8], [0, 1], clamp),
          }}
        >
          Same contract. Same SDK. <span style={{ color: C.clay }}>Pick your chain.</span>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 48,
          textAlign: "center",
          fontFamily: F.sans,
          fontSize: 22,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(239,236,231,0.6)",
          opacity: interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 8], [0, 1], clamp),
        }}
      >
        from VERIFY-BNB.md · real BSC testnet smoke run · 2026-09-25
      </div>

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[b(k), b(k, 2), b(k + 1), b(k + 1, 2), b(k + 2), b(k + 2, 1)].map((f, i) => (
        <Sfx key={`s${i}`} name="impact" at={f} volume={0.75} />
      ))}
      {[b(k, 1), b(k + 1, 1), b(k + 1, 3), b(k + 2, 2)].map((f, i) => (
        <Sfx key={`t${i}`} name="tick" at={f} volume={0.7} />
      ))}
      <Sfx name="impact" at={b(k + 2, 3)} volume={0.9} />
      <Sfx name="chime" at={b(k + 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
