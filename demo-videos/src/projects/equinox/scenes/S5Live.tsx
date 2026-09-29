import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BnbBadge,
  clamp,
  ComicText,
  EASE_OUT,
  fadeUp,
  Glass,
  Halftone,
  INK,
  InkFrame,
  PremiumBg,
  Pulse,
  scrambleHex,
  Sfx,
  SpeedBurst,
  useSceneClock,
} from "../../../kit";
import { C, CHAIN, F, hfColor, short } from "../theme";
import { BAR } from "../timeline";
import { HfGauge } from "../ui";

/**
 * S5 · THE LIVE RUN (bars 19–26) — every number is from VERIFY-BNB.md
 * ("Smoke flow", real BSC testnet, vault 1). HF = 5 tWBNB × price × 80% / 1,400.
 *   bar 19  BREAK — slide in: "LIVE RUN!" + LIVE ON BSC TESTNET
 *   bar 20  DROP — openVault (b0) · deposit 5 tWBNB (b2)
 *   bar 21  openAgent targetLtv 40% minHf 1.5 (b0) · skimToReserve 1,400 tUSDT → HF 2.00 (b2)
 *   bar 22  recordAction hash chain (b0)
 *   bar 23  BREAK — keeper price crash $700 → $400, HF 1.14 ("CRASH!")
 *   bar 24  DROP — permissionless defend(1) → HF exactly 1.50 ("DEFENDED!")
 *   bar 25  healthFactorPriced bps 20000 → 11428 → 15000 on b0/b1/b2
 */
type Row = { at: number; label: string; detail: string; hash: string; tone?: string };

const TxRow: React.FC<Row> = ({ at, label, detail, hash, tone }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return <div style={{ height: 78, marginBottom: 12 }} />;
  const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  const hot = !!tone;
  return (
    <div
      style={{
        height: 78,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 20px",
        borderRadius: 16,
        background: hot ? `${tone}18` : "rgba(255,255,255,0.035)",
        border: `1.5px solid ${hot ? tone + "aa" : "rgba(255,255,255,0.09)"}`,
        boxShadow: hot ? `0 0 30px ${tone}33` : undefined,
        transform: `translateX(${(1 - p) * 70}px)`,
        opacity: interpolate(p, [0, 0.35], [0, 1], clamp),
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 25, color: hot ? tone : C.text, whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ fontFamily: F.sans, fontSize: 19, color: C.textMuted, marginTop: 2, whiteSpace: "nowrap" }}>{detail}</div>
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 21, color: "rgba(238,240,242,0.7)" }}>{scrambleHex(f, short(hash, 8, 6), at, 10)}</div>
      <div
        style={{
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "0.1em",
          color: "#34C759",
          background: "rgba(52,199,89,0.12)",
          border: "1px solid rgba(52,199,89,0.4)",
          borderRadius: 8,
          padding: "5px 10px",
        }}
      >
        ✓ STATUS 1
      </div>
    </div>
  );
};

export const S5Live: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.live; // 19

  const tSkim = b(k + 2, 2);
  const tCrash = b(k + 4);
  const tDefend = b(k + 5);

  // Keeper price (tWBNB, USD) and the HF it implies.
  const price = frame < tCrash ? 700 : interpolate(frame, [tCrash, tCrash + 8], [700, 400], { ...clamp, easing: EASE_OUT });
  const hfPriced = (price * 5 * 0.8) / 1400;
  const hf: number | null =
    frame < tSkim ? null : frame < tDefend ? hfPriced : interpolate(frame, [tDefend, tDefend + 8], [400 * 4 / 1400, 1.5], { ...clamp, easing: EASE_OUT });
  const debt = frame < tSkim ? 0 : interpolate(frame, [tSkim, tSkim + 8], [0, 1400], clamp);
  const deposited = frame >= b(k + 1, 2);

  // Crash: red wash + shake across bar 23; defend: lime ring on bar 24.
  const red = frame >= tCrash && frame < tDefend ? interpolate(frame, [tCrash, tCrash + 3, tDefend], [0, 0.34, 0.12], clamp) : 0;
  const shakeAmp = frame >= tCrash && frame < tDefend ? 14 * Math.exp(-((frame - tCrash) % Math.round((tDefend - tCrash) / 4)) / 4) : 0;
  const sx = (random(`sx${frame}`) - 0.5) * 2 * shakeAmp;
  const sy = (random(`sy${frame}`) - 0.5) * 2 * shakeAmp;
  const ring = frame >= tDefend ? interpolate(frame, [tDefend, tDefend + 20], [0, 1], clamp) : 0;
  const gaugeIn = spring({ frame: frame - b(k + 1), fps: 30, config: { damping: 14, stiffness: 150, mass: 0.8 } });

  const rows: Row[] = [
    { at: b(k + 1), label: "openVault(tWBNB, tUSDT)", detail: "vault #1 created", hash: CHAIN.tx.openVault },
    { at: b(k + 1, 2), label: "deposit(1, 5 tWBNB)", detail: "collateral in · $3,500 at $700", hash: CHAIN.tx.deposit },
    { at: b(k + 2), label: "openAgent(1, …)", detail: "target LTV 40% · minHf 1.50", hash: CHAIN.tx.openAgent },
    { at: tSkim, label: "skimToReserve(1)", detail: "agent borrowed 1,400 tUSDT · HF 2.00", hash: CHAIN.tx.skim, tone: C.violetSoft },
    { at: b(k + 3), label: "recordAction(…)", detail: "agent action → on-chain hash chain", hash: CHAIN.tx.record },
    { at: tCrash, label: "setPrice(tWBNB, $400)", detail: "price crash $700 → $400 · HF 1.14", hash: CHAIN.tx.crash, tone: C.rose },
    { at: tDefend, label: "defend(1)", detail: "permissionless · buffer repays debt → HF 1.50", hash: CHAIN.tx.defend, tone: C.lime },
  ];

  const bps = [
    { at: b(k + 6), v: "20000", c: C.emerald, t: "after skim" },
    { at: b(k + 6, 1), v: "11428", c: C.rose, t: "after crash" },
    { at: b(k + 6, 2), v: "15000", c: C.lime, t: "after defend" },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(145,129,245,0.2)" glowB="rgba(240,185,11,0.12)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.035} gap={22} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 30% 55%, rgba(255,60,80,${red}), rgba(255,60,80,${red * 0.4}))` }} />

      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        <Pulse intensity={0.6} shake={0.3} glow={false}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 60, display: "flex", justifyContent: "center", gap: 22, alignItems: "center" }}>
            <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={34} live variant="dark" />
            <div style={{ fontFamily: F.mono, fontSize: 24, color: C.textMuted, ...fadeUp(frame, b(k, 2), 10, 12) }}>chainId 97 · vault #1 · every row a real tx</div>
          </div>

          {/* Left: the health factor + position */}
          {frame >= b(k + 1) ? (
            <div
              style={{
                position: "absolute",
                left: 100,
                top: 170,
                width: 720,
                transform: `translateY(${(1 - gaugeIn) * 60}px)`,
                opacity: interpolate(gaugeIn, [0, 0.3], [0, 1], clamp),
              }}
            >
              <Glass radius={28} glow={0.3 + ring * 0.5} glowColor={hf === null ? "rgba(22,217,168,0.4)" : `${hfColor(hf)}88`} fill="rgba(14,14,16,0.86)" innerStyle={{ padding: "26px 34px 30px" }}>
                <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
                  <HfGauge hf={hf} size={440} />
                  {ring > 0 && ring < 1 ? (
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 440 * (0.8 + ring * 0.6),
                        height: 440 * (0.8 + ring * 0.6),
                        transform: "translate(-50%, -50%)",
                        borderRadius: 999,
                        border: `6px solid ${C.lime}`,
                        opacity: 1 - ring,
                      }}
                    />
                  ) : null}
                </div>
                {[
                  { k: "Collateral", v: deposited ? "5 tWBNB" : "—", c: C.text },
                  { k: "tWBNB price (keeper oracle)", v: `$${Math.round(price)}`, c: frame >= tCrash ? C.rose : C.text },
                  { k: "Borrowed by agent", v: `${Math.round(debt).toLocaleString("en-US")} tUSDT`, c: debt > 0 ? C.violetSoft : C.textMuted },
                ].map((r) => (
                  <div key={r.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "13px 4px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <span style={{ fontFamily: F.sans, fontSize: 25, color: C.textMuted }}>{r.k}</span>
                    <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 32, color: r.c, fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
                  </div>
                ))}
              </Glass>
            </div>
          ) : null}

          {/* Right: the tx log */}
          <div style={{ position: "absolute", left: 880, top: 170, width: 940 }}>
            {rows.map((r) => (
              <TxRow key={r.label} {...r} />
            ))}
          </div>

          {/* bar 25: the contract's own HF readout */}
          {frame >= b(k + 6) ? (
            <div style={{ position: "absolute", left: 880, top: 800, width: 940, ...fadeUp(frame, b(k + 6), 8, 14) }}>
              <div style={{ fontFamily: F.mono, fontSize: 21, color: C.textMuted, marginBottom: 10 }}>healthFactorPriced(1) · bps</div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {bps.map((x, i) =>
                  frame >= x.at ? (
                    <React.Fragment key={x.v}>
                      {i > 0 ? <span style={{ fontFamily: F.sans, fontSize: 34, color: C.textDim }}>→</span> : null}
                      <div style={{ padding: "10px 18px", borderRadius: 14, border: `1.5px solid ${x.c}99`, background: `${x.c}14`, transform: `scale(${interpolate(frame, [x.at, x.at + 6], [1.3, 1], clamp)})` }}>
                        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 36, color: x.c }}>{x.v}</div>
                        <div style={{ fontFamily: F.sans, fontSize: 16, color: C.textMuted }}>{x.t}</div>
                      </div>
                    </React.Fragment>
                  ) : null,
                )}
              </div>
              {frame >= b(k + 6, 3) ? (
                <div style={{ marginTop: 14, fontFamily: F.display, fontStyle: "italic", fontSize: 32, color: C.lime, ...fadeUp(frame, b(k + 6, 3), 8, 10) }}>
                  Exactly minHf. No keeper, no admin, no permission.
                </div>
              ) : null}
            </div>
          ) : null}
        </Pulse>
      </AbsoluteFill>

      {/* Bar 19 — title card on the break */}
      <ComicText text="LIVE RUN!" from={b(k)} x={960} y={560} size={230} rotate={-6} skewX={-6} fill={C.lime} variant="onomatopoeia" echoColor={C.violet} exitAt={b(k + 1) - 8} />

      <SpeedBurst cx={460} cy={420} from={tCrash} count={22} inner={240} spread={700} color={C.rose} opacity={0.55} width={8} seed="crash" fade />
      <ComicText text="CRASH!" from={tCrash} x={470} y={250} size={150} rotate={-10} fill={C.rose} variant="onomatopoeia" echoColor={INK} exitAt={tDefend - 2} />
      <SpeedBurst cx={460} cy={420} from={tDefend} count={24} inner={240} spread={760} color={C.lime} opacity={0.5} width={8} seed="defend" fade />
      <ComicText text="DEFENDED!" from={tDefend} x={470} y={250} size={140} rotate={-6} fill={C.lime} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 6, 2)} />
      <ComicText text="SKIM!" from={tSkim} x={690} y={200} size={90} rotate={8} fill={C.violetSoft} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3)} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.8} />
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2)} volume={0.6} />
      <Sfx name="impact" at={tSkim} volume={0.6} />
      <Sfx name="tick" at={b(k + 3)} volume={0.6} />
      <Sfx name="impact" at={tCrash} volume={1} />
      <Sfx name="tick" at={b(k + 4, 1)} volume={0.4} />
      <Sfx name="tick" at={b(k + 4, 2)} volume={0.4} />
      <Sfx name="tick" at={b(k + 4, 3)} volume={0.4} />
      <Sfx name="impact" at={tDefend} volume={0.9} />
      <Sfx name="chime" at={tDefend} volume={0.7} />
      {[0, 1, 2].map((i) => (
        <Sfx key={`bp${i}`} name="tick" at={b(k + 6, i)} volume={0.55} />
      ))}
    </AbsoluteFill>
  );
};
