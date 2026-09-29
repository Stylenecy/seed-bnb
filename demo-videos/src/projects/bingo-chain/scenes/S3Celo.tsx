import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, shortHex, steppedCount, useSceneClock } from "../../../kit";
import type { CamKey } from "../../../kit";
import { PopBall } from "../art";
import { makeShot, RealLabel, Ring, ShotSwap } from "../shots";
import { C, CELO, F, SCREEN } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · BATTLE-TESTED ON CELO (bars 15–19). Slides in on the bar-15 break.
 * Left: the live production app on Celo mainnet (hero → a settled 3-player
 * LANCE arena read straight from the chain). Right: live mainnet reads from
 * the proxy (celo-reads.json), one fact per beat, counters tick on beats:
 *   bar 15 b1  LIVE on Celo mainnet
 *   bar 16     479 arenas (ticks b0–b3) · b2 458 settled
 *   bar 17     8,996 numbers called · b2 1,438 seats
 *   bar 18 b1  "BATTLE-TESTED!"
 */
const SH = makeShot(70, 190, 1140);
const n = (v: number) => v.toLocaleString("en-US");

type Fact = { at: number; big: string; small: string; color?: string };

export const S3Celo: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.celo; // 15

  const cam: CamKey[] = [
    { frame: 0, x: 960, y: 540, scale: 1 },
    { frame: b(k, 1), x: 960, y: 540, scale: 1 },
    SH.cam(b(k, 3), 560, 520, 1.3, 640, 540),
    SH.cam(b(k + 1, 3), 560, 520, 1.36, 640, 540),
    SH.cam(b(k + 2), 900, 240, 1.0, 640, 480),
    SH.cam(b(k + 2, 2), 800, 250, 1.45, 640, 480),
    SH.cam(b(k + 3, 2), 800, 250, 1.5, 640, 480),
    SH.cam(b(k + 4), 960, 540, 1.0, 640, 560),
  ];

  const arenas = steppedCount(frame, [b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], [120, 240, 360, CELO.arenas]);
  const called = steppedCount(frame, [b(k + 2), b(k + 2, 1)], [4500, CELO.numbersCalled]);

  const FACTS: Fact[] = [
    { at: b(k, 1), big: "LIVE", small: `BingoChain proxy on Celo mainnet · ${shortHex(CELO.proxy, 6, 4)} · v${CELO.version}`, color: C.celo },
    { at: b(k + 1), big: n(arenas), small: "arenas created on mainnet", color: C.celo },
    { at: b(k + 1, 2), big: n(CELO.settled), small: "games settled on-chain, winners verified", color: C.neon },
    { at: b(k + 2), big: n(called), small: "numbers called, every one an on-chain tx", color: C.ballO },
    { at: b(k + 2, 2), big: n(CELO.seats), small: "player seats filled", color: C.playing },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(252,255,82,0.12)" glowB="rgba(111,255,0,0.14)" glow="left" floor={0.4} />
      <Halftone opacity={0.04} gap={20} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.4} shake={0} glow={false}>
          <AbsoluteFill>
            <ShotSwap
              X={SH.X}
              Y={SH.Y}
              W={SH.W}
              url="bingochain.vercel.app · Celo mainnet"
              glowColor="rgba(252,255,82,0.25)"
              shots={[
                { f: 0, src: SCREEN.celoHome },
                { f: b(k + 2), src: SCREEN.celoArena },
              ]}
            />
            <Ring x={SH.pt(580, 230).x} y={SH.pt(580, 230).y} w={800 * SH.s} h={330 * SH.s} at={b(k + 2, 2)} until={b(k + 4)} color={C.celo} />
          </AbsoluteFill>
        </Pulse>
      </Camera>

      <RealLabel color={C.celo}>Real BINGOChain app · live Celo mainnet</RealLabel>

      {/* right column */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, transparent 58%, rgba(1,8,40,0.94) 66%)" }} />
      <Pulse intensity={0.6} shake={0.15} glow={false}>
        <div style={{ position: "absolute", left: 1290, top: 104, width: 580 }}>
          <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", color: C.celo, ...fadeUp(frame, 0, 10, 20) }}>THE TRACK RECORD</div>
          <div style={{ fontFamily: F.display, fontSize: 76, lineHeight: 1.0, color: C.text, marginTop: 12, letterSpacing: "0.01em", ...fadeUp(frame, 2, 12, 30) }}>
            BATTLE-TESTED ON <span style={{ color: C.celo }}>CELO</span> MAINNET
          </div>
          <div style={{ marginTop: 22 }}>
            {FACTS.map((x) =>
              frame >= x.at ? (
                <div
                  key={x.small}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    padding: "10px 16px",
                    marginTop: 12,
                    borderRadius: 14,
                    border: `1.5px solid ${x.color}55`,
                    background: "rgba(255,255,255,0.035)",
                    ...fadeUp(frame, x.at, 8, 22),
                  }}
                >
                  <div style={{ minWidth: 168, whiteSpace: "nowrap", fontFamily: F.display, fontSize: 50, color: x.color, fontVariantNumeric: "tabular-nums" }}>{x.big}</div>
                  <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 22, lineHeight: 1.25, color: C.text }}>{x.small}</div>
                </div>
              ) : (
                <div key={x.small} style={{ height: 88 }} />
              ),
            )}
          </div>
        </div>
      </Pulse>

      <div
        style={{
          position: "absolute",
          left: 70,
          right: 60,
          bottom: 46,
          fontFamily: F.sans,
          fontSize: 20,
          letterSpacing: "0.06em",
          color: "rgba(239,244,255,0.6)",
          opacity: interpolate(frame, [b(k, 2), b(k, 2) + 8], [0, 1], clamp),
        }}
      >
        Live reads of getArena() on the Celo proxy · block {n(CELO.block)} · 2026-09-25 · all verifiable on Celoscan
      </div>

      {/* balls tumbling out on bar 18 */}
      {[14, 3, 22, 9].map((v, i) => (
        <PopBall key={v} at={b(k + 3, i)} x={[150, 280, 1330, 1470][i]!} y={[860, 950, 950, 900][i]!} size={120} label={v} rot={(i - 1.5) * 10} />
      ))}
      <ComicText text="BATTLE-TESTED!" from={b(k + 3, 1)} x={820} y={860} size={120} rotate={-6} skewX={-6} fill={C.celo} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.celo} />

      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`a${i}`} name="tick" at={b(k + 1, i)} volume={0.55} />
      ))}
      <Sfx name="whoosh" at={b(k + 2)} volume={0.4} />
      <Sfx name="tick" at={b(k + 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3, 1)} volume={0.85} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
