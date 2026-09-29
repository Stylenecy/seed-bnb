import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, shortHex, useSceneClock } from "../../../kit";
import type { CamKey } from "../../../kit";
import { CELO, C, F, SCREEN } from "../theme";
import { makeShot, RealLabel, Ring, ShotSwap } from "../shots";
import { BAR } from "../timeline";

/**
 * S3 · BATTLE-TESTED ON CELO (bars 10–14). The real app, wallet on Celo,
 * live mainnet reads (captured 2026-09-25) + the track record from README /
 * VERIFY-BNB.md, one fact per beat on the right:
 *   bar 10  resolved bounty feed (#261 at the top) — camera pushes onto it
 *   bar 11  "Receipts, not promises" live marketplace pulse
 *   bar 12  worker leaderboard: every row an ERC-8004 agent
 *   bar 13  "BATTLE-TESTED!" slam (b1)
 */
const SH = makeShot(70, 190, 1140);

type Fact = { at: number; big: string; small: string; color?: string };

export const S3Celo: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.celo; // 10

  const cam: CamKey[] = [
    { frame: 0, x: 960, y: 540, scale: 1 },
    { frame: b(k, 1), x: 960, y: 540, scale: 1 },
    SH.cam(b(k, 3), 820, 600, 1.35, 640, 520),
    SH.cam(b(k + 1), 960, 650, 1.0, 640, 560),
    SH.cam(b(k + 1, 2), 960, 650, 1.4, 640, 520),
    SH.cam(b(k + 2), 960, 560, 1.0, 640, 560),
    SH.cam(b(k + 2, 2), 960, 460, 1.35, 640, 480),
    SH.cam(b(k + 3), 900, 760, 1.3, 640, 560),
    SH.cam(b(k + 4), 900, 760, 1.34, 640, 560),
  ];

  const FACTS: Fact[] = [
    { at: b(k, 1), big: "LIVE", small: `ClaudelanceCoreV3 on Celo mainnet · ${shortHex(CELO.v3Proxy, 6, 4)} · verified`, color: C.celo },
    { at: b(k + 1), big: `${CELO.keeperScanned}`, small: "bounties scanned by the keeper · 0 failures", color: C.celo },
    { at: b(k + 1, 2), big: `${CELO.v2Resolved}/${CELO.v2Total}`, small: "v2 code bounties resolved on mainnet", color: C.clay },
    { at: b(k + 2), big: "ERC-8004", small: "every worker holds an on-chain identity", color: C.emerald },
    { at: b(k + 3), big: `${CELO.tests}`, small: "forge tests pass · 0 failed", color: C.claySoft },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(252,255,82,0.12)" glowB="rgba(228,116,68,0.18)" glow="left" floor={0.4} />
      <Halftone opacity={0.04} gap={20} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.4} shake={0} glow={false}>
          <AbsoluteFill>
            <ShotSwap
              X={SH.X}
              Y={SH.Y}
              W={SH.W}
              url="claudelance · Celo mainnet"
              glowColor="rgba(252,255,82,0.25)"
              shots={[
                { f: 0, src: SCREEN.celoBounties },
                { f: b(k + 1), src: SCREEN.celoPulse },
                { f: b(k + 2), src: SCREEN.celoWorkers },
              ]}
            />
            <Ring {...{ x: SH.pt(290, 515).x, y: SH.pt(290, 515).y, w: 1340 * SH.s, h: 84 * SH.s }} at={b(k, 3)} until={b(k + 1)} color={C.celo} />
            <Ring {...{ x: SH.pt(285, 560).x, y: SH.pt(285, 560).y, w: 1350 * SH.s, h: 175 * SH.s }} at={b(k + 1, 2)} until={b(k + 2)} color={C.celo} />
            <Ring {...{ x: SH.pt(805, 650).x, y: SH.pt(805, 650).y, w: 195 * SH.s, h: 560 * SH.s }} at={b(k + 3)} color={C.emerald} r={10} />
          </AbsoluteFill>
        </Pulse>
      </Camera>

      <RealLabel color={C.celo}>Real Claudelance app · live Celo mainnet reads</RealLabel>

      {/* right column */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, transparent 58%, rgba(17,15,13,0.92) 66%)" }} />
      <Pulse intensity={0.6} shake={0.15} glow={false}>
        <div style={{ position: "absolute", left: 1290, top: 110, width: 580 }}>
          <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", color: C.celo, ...fadeUp(frame, 0, 10, 20) }}>STEP 0 · THE TRACK RECORD</div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 70, lineHeight: 1.0, color: C.text, marginTop: 12, letterSpacing: "-0.03em", ...fadeUp(frame, 2, 12, 30) }}>
            Battle-tested on <span style={{ color: C.celo }}>Celo</span> mainnet.
          </div>
          <div style={{ marginTop: 26 }}>
            {FACTS.map((x) =>
              frame >= x.at ? (
                <div
                  key={x.big}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    padding: "12px 16px",
                    marginTop: 12,
                    borderRadius: 14,
                    border: `1.5px solid ${x.color}55`,
                    background: "rgba(255,255,255,0.035)",
                    ...fadeUp(frame, x.at, 8, 22),
                  }}
                >
                  <div style={{ minWidth: 170, whiteSpace: "nowrap", fontFamily: F.display, fontWeight: 700, fontSize: x.big.length > 6 ? 34 : 44, color: x.color, letterSpacing: "-0.02em" }}>{x.big}</div>
                  <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 22, lineHeight: 1.25, color: C.text }}>{x.small}</div>
                </div>
              ) : (
                <div key={x.big} style={{ height: 88 }} />
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
          letterSpacing: "0.08em",
          color: "rgba(239,236,231,0.55)",
          opacity: interpolate(frame, [b(k, 2), b(k, 2) + 8], [0, 1], clamp),
        }}
      >
        Protocol-operated end-to-end validation (README "About the numbers") · all verifiable on Celoscan
      </div>

      <ComicText text="BATTLE-TESTED!" from={b(k + 3, 1)} x={640} y={900} size={120} rotate={-6} skewX={-6} fill={C.celo} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.celo} />

      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.4} />
      <Sfx name="tick" at={b(k + 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.4} />
      <Sfx name="tick" at={b(k + 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 3)} volume={0.6} />
      <Sfx name="impact" at={b(k + 3, 1)} volume={0.85} />
    </AbsoluteFill>
  );
};
