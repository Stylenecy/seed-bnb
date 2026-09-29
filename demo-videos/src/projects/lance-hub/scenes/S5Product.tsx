import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbMark, clamp, ComicText, Cursor, Glass, GLASS, Halftone, INK, InkFrame, PremiumBg, Pulse, scrambleHex, Sfx, shortHex, SUCCESS, useSceneClock } from "../../../kit";
import { HubMark } from "../art";
import { C, CHAIN, F, SCREEN } from "../theme";
import { cropPt, CropShot, RealLabel } from "../ui";
import { BAR } from "../timeline";

/**
 * S5 · IN THE ECOSYSTEM (bars 13–15). DROP: punch-in on the bar-13 downbeat.
 * Left: the REAL BINGOChain web app built for BSC testnet (/create), where
 * LANCE is a settlement token (ring b1) with a 10 LANCE stake (ring b2).
 * Right: a DRAWN hub console (LanceHub has no frontend of its own) replaying
 * the real BSC-testnet deposit: 0.001 WBNB → ~1 LANCE at NAV 0.001.
 *   bar 13  b1 ring LANCE · b2 ring stake · b3 console slides in
 *   bar 14  b0 amount types · b1 cursor clicks Deposit · b2 tx row resolves · b3 "MINTED!"
 */
const SHOT = { cx: 700, cy: 225, cw: 530, ch: 485, scale: 1.4 };
const SX = 70;
const SY = 190;
const pt = cropPt(SHOT.cx, SHOT.cy, SHOT.scale);

const Ring: React.FC<{ x1: number; y1: number; x2: number; y2: number; at: number; color: string }> = ({ x1, y1, x2, y2, at, color }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const a = pt(x1, y1);
  const z = pt(x2, y2);
  return (
    <div
      style={{
        position: "absolute",
        left: a.x - 8,
        top: a.y - 8,
        width: z.x - a.x + 16,
        height: z.y - a.y + 16,
        borderRadius: 16,
        border: `4px solid ${color}`,
        boxShadow: `0 0 26px ${color}`,
        transform: `scale(${interpolate(f, [at, at + 6], [1.25, 1], clamp)})`,
        opacity: interpolate(f, [at, at + 4], [0, 1], clamp),
      }}
    />
  );
};

export const S5Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b } = useSceneClock();
  const k = BAR.product; // 13

  const cIn = spring({ frame: frame - b(k, 3), fps, config: { damping: 16, stiffness: 150, mass: 0.8 } });
  const typed = "0.001".slice(0, Math.floor(interpolate(frame, [b(k + 1), b(k + 1, 0.7)], [0, 5], clamp)));
  const clicked = frame >= b(k + 1, 1);
  const done = frame >= b(k + 1, 2);
  const lance = interpolate(frame, [b(k + 1, 1), b(k + 1, 2)], [2, 3], clamp);

  // console geometry (screen px)
  const CX = 1010;
  const CY = 190;
  const btn = { x: CX + 440, y: CY + 520 };

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(111,255,0,0.14)" glowB="rgba(228,116,68,0.2)" glow="center" floor={0.4} />
      <Halftone opacity={0.035} gap={22} />

      <Pulse intensity={0.4} shake={0} glow={false}>
        <div style={{ position: "absolute", left: SX, top: 110 }}>
          <RealLabel color={C.neon}>Real BINGOChain app · BSC testnet build</RealLabel>
        </div>
        <div style={{ position: "absolute", left: SX, top: SY }}>
          <CropShot src={SCREEN.bingoCreate} {...SHOT} url="bingochain · /create · chain 97" glowColor="rgba(111,255,0,0.3)">
            <Ring x1={740} y1={408} x2={880} y2={453} at={b(k, 1)} color={C.clay} />
            <Ring x1={740} y1={513} x2={1180} y2={565} at={b(k, 2)} color={C.gold} />
          </CropShot>
        </div>

        {/* drawn hub console */}
        <div style={{ position: "absolute", left: CX, top: 110, opacity: interpolate(cIn, [0, 0.3], [0, 1], clamp) }}>
          <RealLabel color={C.clayLight}>Drawn UI · values from the real BSC testnet deposit</RealLabel>
        </div>
        <div
          style={{
            position: "absolute",
            left: CX,
            top: CY,
            width: 840,
            transform: `translateX(${(1 - cIn) * 120}px)`,
            opacity: interpolate(cIn, [0, 0.3], [0, 1], clamp),
          }}
        >
          <Glass radius={26} glow={0.4} glowColor="rgba(228,116,68,0.35)" fill="rgba(20,16,14,0.92)">
            <div style={{ padding: "24px 30px", display: "flex", alignItems: "center", gap: 18, borderBottom: `1px solid ${GLASS.line}` }}>
              <HubMark size={56} spin={frame * 1.5} glow="rgba(228,116,68,0.2)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.brand, fontWeight: 700, fontSize: 34, color: C.text }}>LanceHub · $LANCE</div>
                <div style={{ fontFamily: F.mono, fontSize: 17, color: C.textDim }}>{shortHex(CHAIN.proxy, 8, 6)} · pool asset WBNB</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontWeight: 700, fontSize: 16, letterSpacing: "0.1em", color: C.gold, border: `1px solid ${C.gold}66`, borderRadius: 999, padding: "8px 14px" }}>
                <BnbMark size={18} /> BSC TESTNET
              </div>
            </div>
            <div style={{ padding: "22px 30px 28px" }}>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { l: "NAV", v: `${CHAIN.smoke.navBefore} WBNB` },
                  { l: "Your $LANCE", v: lance.toFixed(3) },
                  { l: "Redeem fee", v: "1%" },
                ].map((x) => (
                  <div key={x.l} style={{ flex: 1, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${GLASS.line}`, padding: "12px 16px" }}>
                    <div style={{ fontFamily: F.sans, fontSize: 17, color: C.textDim }}>{x.l}</div>
                    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: x.l === "Your $LANCE" && clicked ? C.clay : C.text }}>{x.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                {["Deposit", "Redeem"].map((t, i) => (
                  <div key={t} style={{ padding: "8px 20px", borderRadius: 999, fontFamily: F.sans, fontWeight: 700, fontSize: 20, background: i === 0 ? C.clay : "transparent", color: i === 0 ? INK : C.textDim, border: `1px solid ${i === 0 ? C.clay : GLASS.line}` }}>
                    {t}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, height: 70, borderRadius: 14, border: `1.5px solid ${frame >= b(k + 1) && !clicked ? C.clay : GLASS.line}`, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: F.mono, fontSize: 32, color: C.text }}>
                {typed}
                {frame >= b(k + 1) && !clicked && Math.floor(frame / 8) % 2 === 0 ? <span style={{ color: C.clay }}>|</span> : null}
                <span style={{ marginLeft: "auto", fontFamily: F.sans, fontWeight: 700, fontSize: 22, color: C.textDim }}>WBNB</span>
              </div>
              <div style={{ marginTop: 12, fontFamily: F.sans, fontSize: 21, color: C.textDim }}>
                You receive ≈ <span style={{ color: C.text, fontFamily: F.mono }}>{typed ? "1.000" : "0"}</span> LANCE at the current NAV
              </div>
              <div
                style={{
                  marginTop: 18,
                  height: 68,
                  borderRadius: 14,
                  background: C.clay,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: F.sans,
                  fontWeight: 800,
                  fontSize: 26,
                  color: INK,
                  transform: `scale(${clicked ? interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 3, b(k + 1, 1) + 8], [1, 0.96, 1], clamp) : 1})`,
                }}
              >
                Deposit WBNB
              </div>
              <div style={{ height: 70, marginTop: 16 }}>
                {done ? (
                  <div style={{ height: 64, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", borderRadius: 12, background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.4)" }}>
                    <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 21, color: C.text }}>deposit</div>
                    <div style={{ flex: 1, fontFamily: F.mono, fontSize: 19, color: GLASS.txtMid }}>{scrambleHex(frame, shortHex(CHAIN.tx.deposit, 12, 8), b(k + 1, 2), 10)}</div>
                    <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 15, letterSpacing: "0.08em", color: SUCCESS }}>✓ STATUS 1</div>
                  </div>
                ) : null}
              </div>
            </div>
          </Glass>
        </div>
      </Pulse>

      <Cursor
        hideBefore={b(k, 3)}
        keyframes={[
          { frame: b(k, 3), x: 1780, y: 980 },
          { frame: b(k + 1), x: CX + 300, y: CY + 360 },
          { frame: b(k + 1, 1) - 8, x: btn.x, y: btn.y, click: true },
        ]}
        rippleColor={C.clay}
      />

      <ComicText text="STAKE IN $LANCE" from={b(k, 3)} x={450} y={975} size={78} rotate={-4} fill={C.neon} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 3)} />
      <ComicText text="MINTED!" from={b(k + 1, 3)} x={1500} y={960} size={120} rotate={-6} skewX={-6} fill={C.clay} variant="onomatopoeia" echoColor={INK} burst={C.gold} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.neon} />

      <Sfx name="impact" at={b(k)} volume={0.8} />
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k, 2)} volume={0.6} />
      <Sfx name="whoosh" at={b(k, 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.7} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.85} />
    </AbsoluteFill>
  );
};
