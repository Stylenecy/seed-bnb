import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, inkTextStyle, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { PopBall } from "../art";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S7 · STAT WALL (bars 32–36) — DROP, the song's peak. A 3×2 "bingo card" of
 * stats from VERIFY-BNB.md (block timestamps for the 35 s), two cells per bar
 * (b0 + b2), counters tick on half-beats; a ball drops along the bottom on
 * every beat. Bar 35 (break): the card fills → gold line + "FULL HOUSE!".
 */
const CW = 520;
const CH = 300;
const XS = [150, 700, 1250];
const YS = [170, 530];

type Cell = { head: string; big: string; unit?: string; body: string; bg: string; bg2: string; fill: string };

export const S7Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.stats; // 32

  const at = [b(k), b(k, 2), b(k + 1), b(k + 1, 2), b(k + 2), b(k + 2, 2)];
  const tx = steppedCount(frame, [at[0]!, b(k, 0.5), b(k, 1), b(k, 1.5)], [3, 7, 10, CHAIN.smoke.txs]);
  const secs = steppedCount(frame, [at[1]!, b(k, 2.5), b(k, 3), b(k, 3.5)], [8, 17, 26, CHAIN.smoke.secs]);
  const prize = steppedCount(frame, [at[2]!, b(k + 1, 0.5), b(k + 1, 1)], [0.00033, 0.00066, 0.00099]);

  const cells: Cell[] = [
    { head: "ONE FULL GAME", big: String(tx), unit: "TXS", body: "create · 2 commits · 5 calls · claim · 2 reveals · settle · withdraw", bg: "#bfe0ff", bg2: "#3d8bff", fill: "#fff" },
    { head: "CREATE → SETTLE", big: String(secs), unit: "SEC", body: "block timestamps, arena #1 on BSC testnet", bg: "#ffc2cf", bg2: "#ff4d6d", fill: "#fff" },
    { head: "TIE → SPLIT POT", big: prize.toFixed(5), body: "WBNB to EACH winner (2 × 0.001 staked)", bg: "#d9ffc2", bg2: "#6FFF00", fill: C.neon },
    { head: "PROTOCOL FEE", big: "1%", body: `${CHAIN.smoke.fee} WBNB → treasury (100 bps)`, bg: "#fff1b8", bg2: "#F0B90B", fill: C.gold },
    { head: "TOTAL GAS", big: `~${CHAIN.smoke.gas}`, body: "tBNB gas, the whole live run, both players", bg: "#e2d0ff", bg2: "#8a5cc7", fill: "#fff" },
    { head: "FORGE TESTS", big: CHAIN.tests, body: "pass across 12 suites · v1.3.0, same as the Celo proxy", bg: "#ffd9b0", bg2: "#ff9f1c", fill: "#fff" },
  ];
  const punches = [0, 1, 2].map((i) => useBeatPunch(beatsIn(k + i, k + i + 1), 0.035, 4)); // eslint-disable-line react-hooks/rules-of-hooks

  const full = b(k + 3);
  const line = interpolate(frame, [full, full + 8], [0, 1], clamp);
  const drops = beatsIn(k, k + 3);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(111,255,0,0.2)" glowB="rgba(240,185,11,0.2)" glow="center" floor={0.3} />
      <Halftone opacity={0.06} gap={18} />
      <SpeedBurst cx={960} cy={540} from={0} count={24} inner={300} spread={900} color={C.gold} opacity={0.26} width={6} seed="stats" />

      <Pulse intensity={1.2} shake={1}>
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
            punch={punches[Math.floor(i / 2)]}
          >
            <div style={{ padding: "26px 30px" }}>
              <div style={{ fontFamily: F.comic, fontSize: 34, color: INK, letterSpacing: "0.04em" }}>{c.head}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 2 }}>
                <span style={{ ...inkTextStyle(c.big.length > 5 ? 96 : 124, c.fill), fontVariantNumeric: "tabular-nums" }}>{c.big}</span>
                {c.unit ? <span style={{ ...inkTextStyle(64, "#fff") }}>{c.unit}</span> : null}
              </div>
              <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 23, color: INK, marginTop: 4, lineHeight: 1.25 }}>{c.body}</div>
            </div>
          </ComicPanel>
        ))}

        {/* full-house line across the card on the break */}
        {frame >= full ? (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={120} y1={500} x2={120 + 1680 * line} y2={500} stroke={INK} strokeWidth={30} strokeLinecap="round" />
            <line x1={120} y1={500} x2={120 + 1680 * line} y2={500} stroke={C.gold} strokeWidth={16} strokeLinecap="round" />
          </svg>
        ) : null}
      </Pulse>

      {drops.map((t, i) => (
        <PopBall key={i} at={t} x={140 + i * 149} y={970} size={96} label={((i * 7) % 25) + 1} rot={(i % 3 - 1) * 10} drop={160} />
      ))}

      <ComicText text="FULL HOUSE!" from={full} x={960} y={500} size={150} rotate={-6} skewX={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} burst={C.neon} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor={C.neon} />

      {at.map((t, i) => (
        <Sfx key={`im${i}`} name="impact" at={t} volume={i % 2 ? 0.55 : 0.8} />
      ))}
      {[0.5, 1, 1.5, 2.5, 3, 3.5].map((x) => (
        <Sfx key={`t${x}`} name="tick" at={b(k, x)} volume={0.5} />
      ))}
      <Sfx name="tick" at={b(k + 1, 0.5)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="impact" at={full} volume={1} />
      <Sfx name="chime" at={full} volume={0.6} />
    </AbsoluteFill>
  );
};
