import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ComicPanel, ComicText, Halftone, INK, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S10 · STAT WALL (bars 32–36, DROP on 32). A card every two beats; every value
 * is from VERIFY-BNB.md or the live runs in scripts/neural-alpha/runs/:
 *   32 b0 8 cycles (ticks 1 → 8)  · 32 b2 76 live BSC quotes + OHLCV
 *   33 b0 3 paper buys            · 33 b2 4 real swaps found
 *   34 b0 88/88 BEP-20 verified   · 34 b2 24/24 Narrative-Alpha tests
 *   35 (break) "ZERO REAL TRADES."
 */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 25, color: "#16161c", marginTop: 6, lineHeight: 1.25 }}>{children}</div>
);
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.comic, fontSize: 36, color: "#16161c", letterSpacing: "0.04em" }}>{children}</div>
);
const Big: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 150 }) => (
  <div style={{ ...inkTextStyle(size, "#fff"), fontFamily: F.sans, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{children}</div>
);

const CW = 540;
const CH = 380;
const XS = [90, 690, 1290];
const YS = [120, 560];

export const S10Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.stats; // 32

  const cycles = steppedCount(frame, [b(k), b(k, 1)], [1, 8]);
  const hits = [b(k), b(k, 2), b(k + 1), b(k + 1, 2), b(k + 2), b(k + 2, 2)];
  const punches = hits.map((h) => useBeatPunch([h, h + 1], 0.04, 4)); // eslint-disable-line react-hooks/rules-of-hooks

  const CARDS = [
    { head: "PAPER CYCLES", big: String(cycles), label: "Agent re-run in paper mode against live BSC market data", bg: "#D9F7EA", bg2: "#0ecb81" },
    { head: "LIVE BSC QUOTES", big: "76", label: "+ 76 OHLCV series per full scan · Binance Web3", bg: "#DCEFFC", bg2: "#1e9ff2" },
    { head: "PAPER BUYS", big: "3", label: "AAVE $60.38 · STG $28.05 · NXPC $28.05", bg: "#FFF1BF", bg2: "#F0B90B" },
    { head: "REAL SWAPS FOUND", big: "4", label: "Trade-history scanner vs. a real BSC wallet", bg: "#FFE9C2", bg2: "#F0B90B" },
    { head: "BEP-20 VERIFIED", big: "88/88", label: "15 wrong addresses fixed or removed", bg: "#D9F7EA", bg2: "#0ecb81" },
    { head: "NARRATIVE-ALPHA TESTS", big: "24/24", label: "pytest, fixture pipeline end-to-end", bg: "#DCEFFC", bg2: "#1e9ff2" },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(14,203,129,0.22)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color={C.neon} opacity={0.25} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
        {CARDS.map((c, i) => (
          <ComicPanel
            key={c.head}
            at={hits[i]!}
            x={XS[i % 3]!}
            y={YS[Math.floor(i / 3)]! + (i % 2 ? 14 : 0)}
            w={CW}
            h={CH}
            rot={[-2, 1.6, -1.2, 1.8, -1.5, 2][i]}
            bg={c.bg}
            bg2={c.bg2}
            from={i < 3 ? "up" : "down"}
            punch={punches[i]}
          >
            <div style={{ padding: "30px 38px" }}>
              <Head>{c.head}</Head>
              <Big size={c.big.length > 3 ? 120 : 150}>{c.big}</Big>
              <Label>{c.label}</Label>
            </div>
          </ComicPanel>
        ))}
      </Pulse>

      <ComicText text="ZERO REAL TRADES." from={b(k + 3)} x={960} y={520} size={150} rotate={-5} skewX={-5} fill={C.gold} variant="onomatopoeia" echoColor={INK} burst={C.danger} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {hits.map((h, i) => (
        <Sfx key={i} name="impact" at={h} volume={0.7} />
      ))}
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 3)} volume={0.9} />
    </AbsoluteFill>
  );
};
