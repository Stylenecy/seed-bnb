import React from "react";
import { AbsoluteFill } from "remotion";
import { useCurrentFrame } from "remotion";
import { ComicPanel, ComicText, Halftone, INK, inkTextStyle, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { C, CELO, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · STAT WALL (bars 17–19). DROP: hard cut. Numbers from VERIFY-BNB.md
 * (BSC testnet smoke flow + forge test), Bingo-chain VERIFY-BNB.md (min stake)
 * and the live Celo reads. One cell per beat of bar 17 + b0/b1 of bar 18;
 * bar 18 b2 "ONE SHARED POOL!".
 */
const CW = 520;
const CH = 300;
const XS = [150, 700, 1250];
const YS = [150, 510];

type Cell = { head: string; big: string; unit?: string; body: string; bg: string; bg2: string; fill: string };

export const S7Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 17

  const at = [b(k), b(k, 1), b(k, 2), b(k, 3), b(k + 1), b(k + 1, 1)];
  const nav = steppedCount(frame, [at[1]!, b(k, 1.5)], [0.001, 0.001167]);

  const cells: Cell[] = [
    { head: "DEPOSIT", big: "~1", unit: "LANCE", body: `for ${CHAIN.smoke.deposit} WBNB, minted at NAV ${CHAIN.smoke.navBefore}`, bg: "#fff1b8", bg2: C.gold, fill: C.gold },
    { head: "FUNDPOOL", big: nav.toFixed(nav === 0.001 ? 3 : 6), body: `NAV after ${CHAIN.smoke.fund} WBNB in (was ${CHAIN.smoke.navBefore})`, bg: "#ffd9c4", bg2: C.clay, fill: "#fff" },
    { head: "REDEEM", big: CHAIN.smoke.redeemOut, body: `WBNB for ${CHAIN.smoke.redeemLance} LANCE, after the 1% fee`, bg: "#cfe8ff", bg2: "#3d8bff", fill: "#fff" },
    { head: "BINGO ON BSC", big: String(CHAIN.smoke.bingoMin), unit: "LANCE", body: "min arena stake · allowToken(LANCE) on BingoChain", bg: "#dcffc4", bg2: "#4fb80a", fill: C.neon },
    { head: "FORGE TESTS", big: CHAIN.tests, body: "pass: NAV math, fee, seed, pause, upgrade guards", bg: "#e2d0ff", bg2: "#8a5cc7", fill: "#fff" },
    { head: "CHAINS", big: "2", body: `Celo mainnet (${CELO.supply.toLocaleString("en-US")} LANCE live) + BSC testnet`, bg: "#fffbb0", bg2: "#d4d600", fill: C.celo },
  ];
  const punches = [useBeatPunch(beatsIn(k, k + 1), 0.03, 4), useBeatPunch(beatsIn(k + 1, k + 2), 0.03, 4)];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(228,116,68,0.2)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color={C.gold} opacity={0.24} width={6} seed="stats" />

      <Pulse intensity={1.1} shake={0.8}>
        {cells.map((c, i) => (
          <ComicPanel
            key={c.head}
            at={at[i]!}
            x={XS[i % 3]!}
            y={YS[Math.floor(i / 3)]! + (i % 2 ? 14 : 0)}
            w={CW}
            h={CH}
            rot={[-1.6, 1.2, -0.8, 1.4, -1.2, 1.0][i]}
            bg={c.bg}
            bg2={c.bg2}
            from={(["left", "up", "right", "left", "down", "right"] as const)[i]}
            punch={punches[i < 4 ? 0 : 1]}
          >
            <div style={{ padding: "24px 30px" }}>
              <div style={{ fontFamily: F.comic, fontSize: 34, color: INK, letterSpacing: "0.04em" }}>{c.head}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 2 }}>
                <span style={{ ...inkTextStyle(c.big.length > 6 ? 90 : 118, c.fill), fontVariantNumeric: "tabular-nums" }}>{c.big}</span>
                {c.unit ? <span style={{ ...inkTextStyle(58, "#fff") }}>{c.unit}</span> : null}
              </div>
              <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 23, color: INK, marginTop: 4, lineHeight: 1.25 }}>{c.body}</div>
            </div>
          </ComicPanel>
        ))}
      </Pulse>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", fontFamily: F.sans, fontSize: 21, letterSpacing: "0.05em", color: "rgba(239,236,231,0.6)" }}>
        Real on-chain results · BSC testnet smoke flow + live Celo reads · test amounts, not an offer
      </div>

      <ComicText text="ONE SHARED POOL!" from={b(k + 1, 2)} x={960} y={470} size={150} rotate={-5} skewX={-6} fill={C.clay} variant="onomatopoeia" echoColor={INK} burst={C.gold} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor={C.clay} />

      {at.map((t, i) => (
        <Sfx key={`im${i}`} name="impact" at={t} volume={i % 2 ? 0.55 : 0.8} />
      ))}
      <Sfx name="tick" at={b(k, 1.5)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={1} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.55} />
    </AbsoluteFill>
  );
};
