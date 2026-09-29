import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Camera,
  clamp,
  ComicText,
  countUp,
  Cursor,
  EASE_INOUT,
  fadeUp,
  Halftone,
  INK,
  InkFrame,
  PremiumBg,
  Pulse,
  scrambleHex,
  Sfx,
  useSceneClock,
} from "../../../kit";
import { C, CHAIN, F, short } from "../theme";
import { BAR } from "../timeline";
import { AppWindow, Donut, GoldaMark, Tag } from "../ui";

/**
 * S4 · CONCEPT UI (bars 10–13). The repo has no frontend, so the vault UI is
 * drawn in code and labelled CONCEPT UI; the numbers it shows are the real
 * BSC-testnet smoke run (VERIFY-BNB.md "Live smoke").
 *   bar 10 b0  window zooms in · b1 cursor → amount · b2 "1000" typed · b3 click Deposit (approve row)
 *   bar 11 b0  DROP: totalAssets 0 → 1000, gVAULT 0 → 1000, donut fills USDT · "MINTED!" · deposit row
 *          b2  cursor → Redeem tab · b3 click
 *   bar 12 b0  "400" typed · b1 click Redeem · b2 totalAssets → 600, gVAULT → 600 · "REDEEMED!" · redeem row
 *          b3  PAXG-leg note
 */
const WX = 140;
const WY = 176;
const WW = 1640;
const WH = 830;
/** Screen origin of the window's content area (below the 76 px header). */
const OX = WX + 1.5;
const OY = WY + 1.5 + 77;
const RP = { x: 1030, y: 28, w: 580, h: 700 }; // right (action) panel, content coords

const panel: React.CSSProperties = {
  position: "absolute",
  borderRadius: 20,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const Stat: React.FC<{ k: string; v: string; unit: string; c?: string; hot?: number }> = ({ k, v, unit, c = C.text, hot = 0 }) => (
  <div style={{ flex: 1, padding: "18px 22px", borderRadius: 16, background: `rgba(217,174,74,${0.04 + hot * 0.14})`, border: `1px solid rgba(217,174,74,${0.15 + hot * 0.5})` }}>
    <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 17, letterSpacing: "0.12em", color: C.textMuted, textTransform: "uppercase" }}>{k}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
      <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 52, color: c, fontVariantNumeric: "tabular-nums" }}>{v}</span>
      <span style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 22, color: C.textMuted }}>{unit}</span>
    </div>
  </div>
);

const ActRow: React.FC<{ at: number; label: string; detail: string; hash: string; color: string }> = ({ at, label, detail, hash, color }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return <div style={{ height: 76, marginBottom: 10 }} />;
  const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  return (
    <div
      style={{
        height: 76,
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 16px",
        borderRadius: 14,
        background: `${color}14`,
        border: `1px solid ${color}66`,
        transform: `translateX(${(1 - p) * 50}px)`,
        opacity: interpolate(p, [0, 0.35], [0, 1], clamp),
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 99, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 21, color: C.text }}>{label}</div>
        <div style={{ fontFamily: F.sans, fontSize: 16, color: C.textMuted }}>{detail}</div>
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 17, color: "rgba(244,238,223,0.7)" }}>{scrambleHex(f, short(hash, 6, 4), at, 10)}</div>
    </div>
  );
};

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 10

  const tDeposit = b(k + 1);
  const tRedeem = b(k + 2, 2);
  const assets = frame < tRedeem ? countUp(frame, tDeposit, tDeposit + 14, 0, 1000) : countUp(frame, tRedeem, tRedeem + 12, 1000, 600);
  const shares = assets; // 1:1 on the testnet run (1000 → 1000 gVAULT, 400 redeemed → 400 USDT)
  const usdtFrac = interpolate(frame, [tDeposit, tDeposit + 14], [0, 1], { ...clamp, easing: EASE_INOUT });
  const redeemTab = frame >= b(k + 1, 3) + 8;
  const typed = (s: string, at: number) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((frame - at) / 2) + 1)));
  const amount = frame < b(k, 2) ? "" : frame < b(k + 1, 3) + 8 ? typed("1000", b(k, 2)) : frame < b(k + 2) ? "" : typed("400", b(k + 2));
  const hotA = interpolate(frame, [tDeposit, tDeposit + 4, tDeposit + 30], [0, 1, 0], clamp) + interpolate(frame, [tRedeem, tRedeem + 4, tRedeem + 30], [0, 1, 0], clamp);
  const btnPress = (at: number) => interpolate(frame, [at, at + 3, at + 9], [1, 0.94, 1], clamp);

  // Screen-space targets for the cursor.
  const rx = OX + RP.x;
  const ry = OY + RP.y;
  const cursorKeys = [
    { frame: b(k), x: 1500, y: 980 },
    { frame: b(k, 1), x: rx + 300, y: ry + 175 },
    { frame: b(k, 3) - 10, x: rx + 290, y: ry + 290, click: true, clickDelay: 10 },
    { frame: b(k + 1, 3) - 10, x: rx + 410, y: ry + 62, click: true, clickDelay: 10 },
    { frame: b(k + 2), x: rx + 300, y: ry + 175 },
    { frame: b(k + 2, 1) - 10, x: rx + 290, y: ry + 290, click: true, clickDelay: 10 },
    { frame: b(k + 2, 3), x: 1520, y: 990 },
  ];

  const camKeys = [
    { frame: 0, x: 960, y: 560, scale: 1 },
    { frame: b(k, 1), x: 960, y: 560, scale: 1 },
    { frame: b(k, 3), x: 1130, y: 500, scale: 1.12 },
    { frame: tDeposit, x: 760, y: 520, scale: 1.1 },
    { frame: b(k + 1, 2), x: 960, y: 560, scale: 1 },
    { frame: b(k + 2, 1), x: 1130, y: 500, scale: 1.1 },
    { frame: tRedeem, x: 760, y: 520, scale: 1.1 },
    { frame: b(k + 2, 3), x: 960, y: 560, scale: 1 },
  ];

  const usdtLabel = assets > 0.5 ? "100%" : "—";

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,174,74,0.2)" glowB="rgba(38,161,123,0.14)" glow="top" floor={0.3} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.45} shake={0} glow={false}>
        <Camera keyframes={camKeys} easing={EASE_INOUT}>
          <div style={{ position: "absolute", left: WX, top: WY }}>
            <AppWindow w={WW} h={WH} glow={0.3 + hotA * 0.4}>
              {/* Left: vault card */}
              <div style={{ ...panel, left: 28, top: 28, width: 970, height: 700, padding: "26px 30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <GoldaMark size={56} glow={false} />
                  <div>
                    <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 36, color: C.text }}>Golda Safe-Haven Vault</div>
                    <div style={{ fontFamily: F.mono, fontSize: 17, color: C.textMuted }}>share token gVAULT · ERC-4626 · {short(CHAIN.vault)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
                  <Stat k="Total assets" v={Math.round(assets).toLocaleString("en-US")} unit="USDT" hot={hotA} />
                  <Stat k="Your shares" v={Math.round(shares).toLocaleString("en-US")} unit="gVAULT" c={C.goldSoft} hot={hotA} />
                  <Stat k="Share price" v="1.00" unit="USDT" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 30 }}>
                  <Donut
                    size={330}
                    parts={[
                      { v: usdtFrac, color: C.usdt },
                      { v: 0, color: C.gold },
                    ]}
                    center={
                      <>
                        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 15, letterSpacing: "0.2em", color: C.textMuted }}>ALLOCATION</div>
                        <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 58, color: C.text }}>{usdtLabel}</div>
                        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 18, color: C.usdtSoft }}>USDT</div>
                      </>
                    }
                  />
                  <div style={{ flex: 1 }}>
                    {[
                      { c: C.usdt, n: "USDT (stable leg)", v: `${Math.round(assets).toLocaleString("en-US")} · ${usdtLabel}` },
                      { c: C.gold, n: "PAXG (gold leg)", v: "0 · 0%" },
                    ].map((r) => (
                      <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <span style={{ width: 18, height: 18, borderRadius: 5, background: r.c }} />
                        <span style={{ flex: 1, fontFamily: F.sans, fontWeight: 600, fontSize: 24, color: C.text }}>{r.n}</span>
                        <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 24, color: C.textMuted }}>{r.v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 18, fontFamily: F.sans, fontSize: 19, lineHeight: 1.4, color: C.textMuted, ...(frame >= b(k + 2, 3) ? {} : { opacity: 0.0 }) }}>
                      <span style={{ color: C.amber, fontWeight: 700 }}>Gold leg idle on testnet:</span> no PancakeSwap pool is set, so PAXG is valued at 0, and LI.FI does not serve chain 97.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: action panel */}
              <div style={{ ...panel, left: RP.x, top: RP.y, width: RP.w, height: RP.h, padding: "24px 26px" }}>
                <div style={{ display: "flex", gap: 10, padding: 6, borderRadius: 14, background: "rgba(0,0,0,0.35)" }}>
                  {["Deposit", "Redeem"].map((t, i) => {
                    const on = (i === 1) === redeemTab;
                    return (
                      <div
                        key={t}
                        style={{
                          flex: 1,
                          textAlign: "center",
                          padding: "12px 0",
                          borderRadius: 10,
                          background: on ? "rgba(217,174,74,0.18)" : "transparent",
                          border: on ? `1px solid ${C.gold}88` : "1px solid transparent",
                          fontFamily: F.sans,
                          fontWeight: 700,
                          fontSize: 22,
                          color: on ? C.goldSoft : C.textMuted,
                        }}
                      >
                        {t}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 22, fontFamily: F.sans, fontWeight: 600, fontSize: 17, letterSpacing: "0.12em", color: C.textMuted }}>
                  {redeemTab ? "SHARES TO REDEEM" : "AMOUNT"}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    height: 84,
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 20px",
                    gap: 12,
                  }}
                >
                  <span style={{ flex: 1, fontFamily: F.sans, fontWeight: 700, fontSize: 44, color: amount ? C.text : C.textDim }}>{amount || "0.0"}</span>
                  <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, color: redeemTab ? C.goldSoft : C.usdtSoft }}>{redeemTab ? "gVAULT" : "USDT"}</span>
                </div>
                <div
                  style={{
                    marginTop: 22,
                    height: 76,
                    borderRadius: 14,
                    background: `linear-gradient(100deg, ${C.goldDeep}, ${C.gold} 50%, ${C.goldSoft})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: F.sans,
                    fontWeight: 800,
                    fontSize: 26,
                    color: "#2a1f06",
                    transform: `scale(${btnPress(b(k, 3)) * btnPress(b(k + 2, 1))})`,
                  }}
                >
                  {redeemTab ? "Redeem pro-rata" : "Approve & deposit"}
                </div>
                <div style={{ marginTop: 26, fontFamily: F.sans, fontWeight: 600, fontSize: 17, letterSpacing: "0.12em", color: C.textMuted }}>ACTIVITY · BSC TESTNET</div>
                <div style={{ marginTop: 10 }}>
                  <ActRow at={b(k, 3)} label="approve 1000 USDT" detail="MockUSDT → vault" hash={CHAIN.tx.approve} color={C.textMuted} />
                  <ActRow at={tDeposit} label="deposit(1000)" detail="1000 gVAULT minted · totalAssets 1000" hash={CHAIN.tx.deposit} color={C.usdt} />
                  <ActRow at={tRedeem} label="redeem(400 shares)" detail="400 USDT back · 600 remain" hash={CHAIN.tx.redeem} color={C.gold} />
                </div>
              </div>
            </AppWindow>
          </div>
          <Cursor keyframes={cursorKeys} size={40} rippleColor={C.gold} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: 0, right: 0, top: 62, display: "flex", justifyContent: "center", gap: 18 }}>
        <Tag at={0} label="Concept UI" color={C.amber} />
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 24, color: C.textMuted, alignSelf: "center", ...fadeUp(frame, b(k, 1), 10, 10) }}>
          no frontend in the repo yet · numbers from the live testnet run
        </div>
      </div>

      <ComicText text="MINTED!" from={tDeposit} x={560} y={300} size={130} rotate={-8} fill={C.goldSoft} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 3)} />
      <ComicText text="REDEEMED!" from={tRedeem} x={600} y={300} size={120} rotate={-6} fill={C.usdtSoft} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.gold} />

      <Sfx name="tick" at={b(k, 2)} volume={0.4} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      <Sfx name="impact" at={tDeposit} volume={0.9} />
      <Sfx name="chime" at={tDeposit} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 2)} volume={0.4} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.6} />
      <Sfx name="impact" at={tRedeem} volume={0.85} />
      <Sfx name="tick" at={b(k + 2, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
