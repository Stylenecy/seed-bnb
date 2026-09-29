import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ComicPanel, fadeUp, Glass, Halftone, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S8 · STAT WALL (bars 22–25). All from VERIFY-BNB.md; fork numbers tagged FORK.
 *   bar 22 b0  1,000 gVAULT minted (testnet)     b2  400 redeemed → 600 left (testnet)
 *   bar 23 b0  DROP: 1.277 WBNB for 1,000 USDT (fork)   b2  778.97 TWAP (fork)
 *   bar 24 b0  honest "not yet" strip: no PAXG liquidity on BSC · no agent/FE in repo · b2 24/24 tests
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 27, color: "#1b1b1b", marginTop: 6, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode; fork?: boolean }> = ({ children, fork }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
    <span style={{ fontFamily: F.comic, fontSize: 36, color: "#1b1b1b", letterSpacing: "0.04em" }}>{children}</span>
    <span
      style={{
        fontFamily: F.sans,
        fontWeight: 800,
        fontSize: 16,
        letterSpacing: "0.14em",
        padding: "4px 10px",
        borderRadius: 6,
        background: "#1b1b1b",
        color: fork ? C.fork : "#F0B90B",
      }}
    >
      {fork ? "BSC MAINNET FORK" : "BSC TESTNET · LIVE"}
    </span>
  </div>
);

export const S8Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 22

  const minted = steppedCount(frame, [b(k), b(k) + 3, b(k) + 6, b(k) + 9], [0, 250, 600, 1000]);
  const left = steppedCount(frame, [b(k, 2), b(k, 3)], [1000, 600]);
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.04, 4);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.04, 4);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,174,74,0.24)" glowB="rgba(38,161,123,0.14)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={440} from={b(k + 1)} count={24} inner={300} spread={900} color={C.gold} opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.1} shake={0.8}>
        <ComicPanel at={b(k)} x={100} y={90} w={840} h={320} rot={-1.8} bg="#FFE9A8" bg2={C.gold} from="left" punch={pA}>
          <div style={{ padding: "30px 40px" }}>
            <Head>SHARES MINTED</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(140, "#fff"), fontVariantNumeric: "tabular-nums" }}>{minted.toLocaleString("en-US")}</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 50, color: "#1b1b1b" }}>gVAULT</span>
            </div>
            <Label>for a 1,000 USDT deposit</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k, 2)} x={990} y={80} w={830} h={320} rot={2} bg="#BFF0DC" bg2={C.usdt} from="right" punch={pA}>
          <div style={{ padding: "30px 40px" }}>
            <Head>PRO-RATA REDEEM</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(140, "#fff"), fontVariantNumeric: "tabular-nums" }}>{left}</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 44, color: "#1b1b1b" }}>totalAssets</span>
            </div>
            <Label>400 shares out → 400 USDT back</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={130} y={450} w={820} h={320} rot={1.5} bg="#FFF1B8" bg2="#F0B90B" from="down" punch={pB}>
          <div style={{ padding: "30px 40px" }}>
            <Head fork>LI.FI REBALANCE</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(140, "#fff") }}>1.277</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 50, color: "#1b1b1b" }}>WBNB</span>
            </div>
            <Label>for 1,000 USDT, real li.quest calldata</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1, 2)} x={1000} y={460} w={820} h={320} rot={-1.6} bg="#D6ECFF" bg2={C.fork} from="down" punch={pB}>
          <div style={{ padding: "30px 40px" }}>
            <Head fork>PANCAKESWAP V3 TWAP</Head>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
              <span style={{ ...inkTextStyle(140, "#fff") }}>778.97</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 40, color: "#1b1b1b" }}>USDT/WBNB</span>
            </div>
            <Label>getTwapPrice() on a real pool, 300 s window</Label>
          </div>
        </ComicPanel>
      </Pulse>

      {frame >= b(k + 2) ? (
        <div style={{ position: "absolute", left: 100, width: 1720, top: 822, ...fadeUp(frame, b(k + 2), 8, 20) }}>
          <Glass radius={22} glow={0.25} glowColor="rgba(255,181,71,0.35)" fill="rgba(24,18,8,0.94)" innerStyle={{ padding: "20px 30px", display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ fontFamily: F.comic, fontSize: 42, color: C.amber, whiteSpace: "nowrap" }}>NOT YET</div>
            <div style={{ flex: 1, fontFamily: F.sans, fontSize: 25, lineHeight: 1.4, color: C.text }}>
              No PAXG liquidity on BSC, so gold does not trade on mainnet today. The agent backend and frontend are not in the repo yet, and the contracts are not verified on BscScan.
            </div>
            {frame >= b(k + 2, 2) ? (
              <div style={{ textAlign: "center", ...fadeUp(frame, b(k + 2, 2), 6, 10) }}>
                <div style={{ ...inkTextStyle(64, C.goldSoft) }}>24/24</div>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 18, color: C.textMuted, whiteSpace: "nowrap" }}>forge tests</div>
              </div>
            ) : null}
          </Glass>
        </div>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.75} />
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k, 2)} volume={0.7} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1)} volume={0.85} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k + 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
