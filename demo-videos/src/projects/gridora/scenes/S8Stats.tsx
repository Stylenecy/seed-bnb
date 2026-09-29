import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, fadeUp, Halftone, INK, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, CHECKS, F, MAINNET } from "../theme";
import { BAR } from "../timeline";

/**
 * S8 · STAT WALL (bars 32–36, DROP — the track's peak). A card every two beats:
 *   32 b0 38 trades journaled on mainnet (22 green · +1,877 bps, from the real Recorded logs)
 *   32 b2 130/130 backend tests        33 b0 20/20 forge tests        33 b2 49/49 BSC token addresses
 *   34    the honest part: what is proven vs what needs TWAK credentials
 *   35    (break) "THE TAPE DOESN'T LIE." — the site's own headline
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: "#1a120e", marginTop: 8, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 40, color: "#1a120e", letterSpacing: "0.04em" }}>{children}</div>
);
const big = (size: number): React.CSSProperties => ({ ...inkTextStyle(size, "#fff"), fontFamily: F.display, fontWeight: 800, fontVariantNumeric: "tabular-nums", marginTop: 4 });

export const S8Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.stats; // 32

  const trades = steppedCount(frame, [b(k), b(k, 1)], [22, MAINNET.totalTrades]);
  const pytest = steppedCount(frame, [b(k, 2), b(k, 3)], [96, CHECKS.pytest]);
  const forge = steppedCount(frame, [b(k + 1), b(k + 1, 1)], [13, CHECKS.forge]);
  const tokens = steppedCount(frame, [b(k + 1, 2), b(k + 1, 3)], [30, CHECKS.tokens]);
  const pA = useBeatPunch([b(k), b(k, 1)], 0.04, 4);
  const pB = useBeatPunch([b(k, 2), b(k, 3)], 0.04, 4);
  const pC = useBeatPunch([b(k + 1), b(k + 1, 1)], 0.04, 4);
  const pD = useBeatPunch([b(k + 1, 2), b(k + 1, 3)], 0.04, 4);
  const dim = interpolate(frame, [b(k + 2), b(k + 2) + 5], [0, 1], clamp);
  const last = frame >= b(k + 3);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,119,87,0.3)" glowB="rgba(159,255,0,0.12)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color={C.coralHi} opacity={0.28} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
        <ComicPanel at={b(k)} x={110} y={110} w={830} h={410} rot={-2} bg="#E9FFC9" bg2={C.volt} from="left" punch={pA}>
          <div style={{ padding: "38px 46px" }}>
            <Head>TRADES JOURNALED · BSC MAINNET</Head>
            <div style={big(180)}>{trades}</div>
            <Label>22 closed green · +1,877 bps net · agent #1 on the TradeJournal</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k, 2)} x={990} y={100} w={820} h={420} rot={2.2} bg={C.cream} bg2={C.coralHi} from="right" punch={pB}>
          <div style={{ padding: "38px 46px" }}>
            <Head>BACKEND TESTS</Head>
            <div style={big(170)}>
              {pytest}/{CHECKS.pytest}
            </div>
            <Label>pytest, offline · grid math, safety, TWAK adapter, control API</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={150} y={590} w={820} h={370} rot={1.6} bg="#FFE9A8" bg2={C.gold} from="down" punch={pC}>
          <div style={{ padding: "36px 46px" }}>
            <Head>FORGE TESTS</Head>
            <div style={big(160)}>
              {forge}/{CHECKS.forge}
            </div>
            <Label>IdentityRegistry 8 · TradeJournal 5 · StrategyLedger 7</Label>
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1, 2)} x={1030} y={600} w={780} h={360} rot={-1.8} bg="#DCE8FF" bg2="#7aa2e8" from="down" punch={pD}>
          <div style={{ padding: "36px 46px" }}>
            <Head>BSC TOKEN ADDRESSES</Head>
            <div style={big(160)}>
              {tokens}/{CHECKS.tokens}
            </div>
            <Label>code on BSC mainnet, every decimals() matches</Label>
          </div>
        </ComicPanel>
      </Pulse>

      <AbsoluteFill style={{ background: "rgba(12,9,7,0.88)", opacity: dim }} />
      {frame >= b(k + 2) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: last ? 90 : 220, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k + 2), 8, 20) }}>
          <div style={{ width: 1400, padding: "30px 44px", background: "#f4efe4", border: `6px solid ${INK}`, boxShadow: `10px 10px 0 ${INK}`, transform: "rotate(-1deg)" }}>
            <div style={{ fontFamily: F.comic, fontSize: 52, color: INK, letterSpacing: "0.04em" }}>THE HONEST PART</div>
            <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 32, lineHeight: 1.4, color: INK, marginTop: 8 }}>
              <span style={{ color: C.pos }}>✓ Proven on-chain:</span> identity, journal and commit → attest on BSC testnet, plus 38 journaled mainnet trades.
            </div>
            {frame >= b(k + 2, 2) ? (
              <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 32, lineHeight: 1.4, color: INK, ...fadeUp(frame, b(k + 2, 2), 6, 10) }}>
                <span style={{ color: "#b45309" }}>○ Not shown live here:</span> new trades. Live mode needs Trust Wallet Agent Kit credentials and a funded wallet.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <ComicText text="THE TAPE DOESN'T LIE." from={b(k + 3)} x={960} y={700} size={150} rotate={-4} skewX={-6} fill={C.volt} variant="onomatopoeia" echoColor={INK} stagger={1} />

      <InkFrame inset={22} width={5} opacity={0.85} color={C.cream} />

      <Sfx name="impact" at={b(k)} volume={0.75} />
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k, 2)} volume={0.75} />
      <Sfx name="tick" at={b(k, 3)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1)} volume={0.75} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.75} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.45} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3)} volume={0.9} />
    </AbsoluteFill>
  );
};
