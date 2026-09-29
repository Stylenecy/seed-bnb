import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ComicText, countUp, fadeUp, Glass, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · VENUS FORK TEST (bars 26–28). VERIFY-BNB.md "VenusAdapter fork test
 * (BSC mainnet)": test/VenusFork.t.sol, 3/3, against a live RPC + a local
 * anvil BSC-mainnet fork. Labelled FORK TEST (not a live deployment).
 *   bar 26 b0  header + card 1 (vUSDT mint → accrue → redeem; 1,000 → 1,000.0137 ticks b1–b2)
 *   bar 26 b2  card 2 (vault round trip through vBTC)
 *   bar 27 b0  card 3 (Chainlink refresh)       b2 "3/3 PASS" stamp
 */
const Card: React.FC<{ at: number; x: number; title: string; tag: string; children: React.ReactNode }> = ({ at, x, title, tag, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: x, top: 330, width: 540, transform: `translateY(${(1 - p) * 80}px) scale(${0.9 + 0.1 * p})`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <Glass radius={26} glow={0.3} glowColor="rgba(255,196,107,0.35)" fill="rgba(14,14,16,0.88)" innerStyle={{ padding: "28px 32px", height: 470 }}>
        <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.14em", color: C.amber }}>{tag}</div>
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: C.text, marginTop: 10, lineHeight: 1.15 }}>{title}</div>
        <div style={{ marginTop: 22 }}>{children}</div>
      </Glass>
    </div>
  );
};

const Line: React.FC<{ k: string; v: string; c?: string }> = ({ k, v, c = C.text }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
    <span style={{ fontFamily: F.sans, fontSize: 22, color: C.textMuted }}>{k}</span>
    <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 26, color: c }}>{v}</span>
  </div>
);

export const S6Fork: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.fork; // 26
  const usdt = countUp(frame, b(k, 1), b(k, 2), 1000, 1000.0137);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(255,196,107,0.16)" glowB="rgba(145,129,245,0.14)" glow="top" floor={0.3} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />
      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              padding: "12px 26px",
              borderRadius: 999,
              border: `2px dashed ${C.amber}`,
              color: C.amber,
              fontFamily: F.sans,
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: "0.18em",
              background: "rgba(255,196,107,0.08)",
            }}
          >
            FORK TEST · BSC MAINNET FORK · NOT A LIVE DEPLOY
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", fontFamily: F.display, fontSize: 66, color: C.text, ...fadeUp(frame, 0, 10, 20) }}>
          Venus adapter, tested against <i style={{ color: C.lime }}>live Venus</i>
        </div>

        <Card at={b(k)} x={120} tag="VUSDT · ADAPTER DIRECT" title="Mint → ~1 day of accrual → redeem">
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 58, color: C.emerald, fontVariantNumeric: "tabular-nums", marginBottom: 12 }}>{usdt.toFixed(4)}</div>
          <Line k="deposited" v="1,000 USDT" />
          <Line k="came back" v="1,000.0137 USDT" c={C.emerald} />
          <Line k="NotVaults guard" v="OK" />
        </Card>
        <Card at={b(k, 2)} x={690} tag="VBTC · FULL VAULT ROUND TRIP" title="Vault → Venus vBTC → skim → exit">
          <Line k="collateral" v="1 BTCB" />
          <Line k="entered into Venus" v="0.5 BTCB" />
          <Line k="skimmed at HF 2.0" v="33,711 USDT" c={C.violetSoft} />
          <Line k="idle BTCB after exit" v="≥ 1e18" c={C.emerald} />
        </Card>
        <Card at={b(k + 1)} x={1260} tag="CHAINLINK · REAL FEEDS" title="refreshFromChainlink on a mainnet fork">
          <Line k="BNB / USD" v="$778.69" c={C.lime} />
          <Line k="USDT / USD" v="$0.9996" />
          <Line k="BTC / USD" v="refresh OK" />
        </Card>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, textAlign: "center", fontFamily: F.mono, fontSize: 22, color: C.textMuted, ...fadeUp(frame, b(k + 1, 1), 8, 10) }}>
          contracts/test/VenusFork.t.sol · live RPC + local anvil fork of BSC mainnet
        </div>
      </Pulse>

      <ComicText text="3/3 PASS!" from={b(k + 1, 2)} x={1500} y={905} size={96} rotate={-6} fill={C.amber} variant="onomatopoeia" echoColor={INK} />
      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.7} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.8} />
    </AbsoluteFill>
  );
};
