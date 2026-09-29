import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, fadeUp, Halftone, INK, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S9 · STAT WALL (bars 40–44, phrase downbeat). A card every two beats; every
 * value is from VERIFY-BNB.md / the receipts:
 *   40 b0 agent #1 (ERC-8004)            40 b2 2 trades on-chain (+150 · +75 bps)
 *   41 b0 13/13 forge tests               41 b2 0.000258 tBNB (0.000206 deploy + 0.000052 agent)
 *   42    the honest note: what was and wasn't exercised
 *   43    "RECEIPTS > SCREENSHOTS."
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 29, color: "#10180f", marginTop: 8, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#10180f", letterSpacing: "0.04em" }}>{children}</div>
);

export const S9Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.stats; // 40

  const trades = steppedCount(frame, [b(k, 2), b(k, 3)], [1, 2]);
  const tests = steppedCount(frame, [b(k + 1), b(k + 1, 1)], [9, 13]);
  const pA = useBeatPunch([b(k), b(k, 1)], 0.04, 4);
  const pB = useBeatPunch([b(k, 2), b(k, 3)], 0.04, 4);
  const pC = useBeatPunch([b(k + 1), b(k + 1, 1)], 0.04, 4);
  const pD = useBeatPunch([b(k + 1, 2), b(k + 1, 3)], 0.04, 4);
  const dim = interpolate(frame, [b(k + 2), b(k + 2) + 5], [0, 1], clamp);
  const last = frame >= b(k + 3);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(105,147,120,0.3)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color={C.gold} opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={120} w={820} h={400} rot={-2} bg="#D8F3E1" bg2="#699378" from="left" punch={pA}>
          <div style={{ padding: "40px 46px" }}>
            <Head>ON-CHAIN IDENTITY</Head>
            <div style={{ ...inkTextStyle(190, "#fff"), fontFamily: F.sans, fontWeight: 900, marginTop: 4 }}>#{CHAIN.agentId}</div>
            <Label>ERC-8004 agent NFT on the IdentityRegistry</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k, 2)} x={990} y={100} w={820} h={420} rot={2.2} bg="#FFE9A8" bg2="#F0B90B" from="right" punch={pB}>
          <div style={{ padding: "40px 46px" }}>
            <Head>TRADES IN THE JOURNAL</Head>
            <div style={{ ...inkTextStyle(190, "#fff"), fontFamily: F.sans, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{trades}</div>
            <Label>pnlBps +{CHAIN.pnl.t1} (smoke) · +{CHAIN.pnl.t2} (runtime mirror)</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={150} y={590} w={820} h={370} rot={1.6} bg="#DCE2FF" bg2="#9aa8f0" from="down" punch={pC}>
          <div style={{ padding: "38px 46px" }}>
            <Head>FORGE TESTS</Head>
            <div style={{ ...inkTextStyle(170, "#fff"), fontFamily: F.sans, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{tests}/{CHAIN.forge}</div>
            <Label>IdentityRegistry + TradeJournal</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1, 2)} x={1030} y={600} w={780} h={360} rot={-1.8} bg="#C9F5E3" bg2="#34d399" from="down" punch={pD}>
          <div style={{ padding: "36px 46px" }}>
            <Head>GAS · EVERYTHING ABOVE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(100, "#fff"), fontFamily: F.sans, fontWeight: 900 }}>0.000258</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 44, color: "#10180f" }}>tBNB</span>
            </div>
            <Label>deploy {CHAIN.deployTbnb} + agent txs {CHAIN.agentTbnb}</Label>
          </div>
        </ComicPanel>
      </Pulse>

      <AbsoluteFill style={{ background: "rgba(6,12,9,0.86)", opacity: dim }} />
      {frame >= b(k + 2) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: last ? 110 : 230, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k + 2), 8, 20) }}>
          <div style={{ width: 1360, padding: "30px 44px", background: "#f4efe4", border: `6px solid ${INK}`, boxShadow: `10px 10px 0 ${INK}`, transform: "rotate(-1deg)" }}>
            <div style={{ fontFamily: F.comic, fontSize: 52, color: INK, letterSpacing: "0.04em" }}>THE HONEST PART</div>
            <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 34, lineHeight: 1.4, color: INK, marginTop: 8 }}>
              <span style={{ color: "#15803d" }}>✓ Tested live:</span> the identity + journal layer on real BSC testnet.
            </div>
            {frame >= b(k + 2, 2) ? (
              <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 34, lineHeight: 1.4, color: INK, ...fadeUp(frame, b(k + 2, 2), 6, 10) }}>
                <span style={{ color: "#b45309" }}>○ Not yet:</span> live perps trading on the venue (needs a venue agent wallet).
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <ComicText text="RECEIPTS > SCREENSHOTS." from={b(k + 3)} x={960} y={720} size={150} rotate={-4} skewX={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} stagger={1} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.75} />
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k, 2)} volume={0.75} />
      <Sfx name="tick" at={b(k, 3)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1)} volume={0.75} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.75} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.45} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3)} volume={0.9} />
    </AbsoluteFill>
  );
};
