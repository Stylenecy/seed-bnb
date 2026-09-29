import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, shortHex, steppedCount, useSceneClock } from "../../../kit";
import { C, CELO, F, SCREEN } from "../theme";
import { CropShot, RealLabel } from "../ui";
import { BAR } from "../timeline";

/**
 * S3 · CELO TRACK RECORD (bars 8–10). Slides in on the bar-8 downbeat.
 * Left: the real Claudelance app, whose $LANCE card reads the Celo hub.
 * Right: live Celo-mainnet reads of the LanceHub proxy (celo-reads.json),
 * one fact per beat, counters tick on beats:
 *   bar 8  b1 LIVE proxy · b2 supply (ticks b2–b3) · b3 pool
 *   bar 9  b0 NAV · b1 fee + Safe owner · b2 "LIVE ON CELO!"
 */
type Fact = { at: number; big: string; small: string; color: string };

export const S3Celo: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.celo; // 8

  const supply = steppedCount(frame, [b(k, 2), b(k, 2.5), b(k, 3)], [1900, 3800, CELO.supply]);
  const zoom = interpolate(frame, [b(k, 1), b(k + 2)], [1, 1.08], clamp);

  const FACTS: Fact[] = [
    { at: b(k, 1), big: "LIVE", small: `LanceHub proxy on Celo mainnet · ${shortHex(CELO.proxy, 6, 4)} · verified`, color: C.celo },
    { at: b(k, 2), big: supply.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: supply === CELO.supply ? 2 : 0 }), small: "$LANCE in circulation (totalSupply)", color: C.clay },
    { at: b(k, 3), big: `${CELO.pool}`, small: "CELO held in the shared pool (totalAssets)", color: C.celo },
    { at: b(k + 1), big: CELO.nav, small: "CELO per LANCE · NAV = pool ÷ supply", color: C.emerald },
    { at: b(k + 1, 1), big: "1%", small: "redeem fee, stays in the pool · owner is a Safe multisig", color: C.sky },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(252,255,82,0.12)" glowB="rgba(228,116,68,0.16)" glow="left" floor={0.4} />
      <Halftone opacity={0.04} gap={20} />

      <Pulse intensity={0.4} shake={0} glow={false}>
        <div style={{ position: "absolute", left: 70, top: 110 }}>
          <RealLabel color={C.celo}>Real Claudelance app · $LANCE card reads the Celo hub</RealLabel>
        </div>
        <div style={{ position: "absolute", left: 70, top: 190 }}>
          <CropShot src={SCREEN.lanceCard} cx={520} cy={930} cw={900} ch={270} scale={1.3} zoom={zoom} url="claudelance · /profile · $LANCE" glowColor="rgba(252,255,82,0.25)" />
        </div>
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 640,
            width: 1170,
            fontFamily: F.display,
            fontSize: 58,
            lineHeight: 1.08,
            color: C.text,
            ...fadeUp(frame, 4, 12, 26),
          }}
        >
          The hub of the <span style={{ color: C.clay }}>Claudelance</span> × <span style={{ color: C.neon }}>BingoChain</span> economy, live on{" "}
          <span style={{ color: C.celo }}>Celo mainnet</span>.
        </div>
      </Pulse>

      {/* right column: live reads */}
      <Pulse intensity={0.6} shake={0.1} glow={false}>
        <div style={{ position: "absolute", left: 1290, top: 96, width: 580 }}>
          <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", color: C.celo, ...fadeUp(frame, 0, 10, 20) }}>LIVE CELO READS</div>
          <div style={{ marginTop: 8 }}>
            {FACTS.map((x) =>
              frame >= x.at ? (
                <div
                  key={x.small}
                  style={{
                    padding: "12px 18px",
                    marginTop: 14,
                    borderRadius: 14,
                    border: `1.5px solid ${x.color}55`,
                    background: "rgba(255,255,255,0.035)",
                    ...fadeUp(frame, x.at, 8, 22),
                  }}
                >
                  <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 46, color: x.color, fontVariantNumeric: "tabular-nums" }}>{x.big}</div>
                  <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 21, lineHeight: 1.25, color: C.text, marginTop: 2 }}>{x.small}</div>
                </div>
              ) : (
                <div key={x.small} style={{ height: 124 }} />
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
          letterSpacing: "0.05em",
          color: "rgba(239,236,231,0.6)",
          opacity: interpolate(frame, [b(k, 2), b(k, 2) + 8], [0, 1], clamp),
        }}
      >
        Live eth_call reads of nav() · totalSupply() · totalAssets() on {shortHex(CELO.proxy, 6, 4)} · Celo block {CELO.block.toLocaleString("en-US")} · 2026-09-25
      </div>

      <ComicText text="LIVE ON CELO!" from={b(k + 1, 2)} x={640} y={900} size={110} rotate={-5} skewX={-6} fill={C.celo} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.celo} />

      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k, 2.5)} volume={0.45} />
      <Sfx name="tick" at={b(k, 3)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.85} />
    </AbsoluteFill>
  );
};
