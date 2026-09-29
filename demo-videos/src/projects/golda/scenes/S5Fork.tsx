import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ComicText, countUp, fadeUp, Glass, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";
import { Tag } from "../ui";

/**
 * S5 · MAINNET FORK (bars 13–17) — VERIFY-BNB.md, anvil fork of BSC mainnet
 * (chain 56), real USDT + real LI.FI Diamond + real PancakeSwap V3. Labelled
 * FORK everywhere: no real-network writes.
 *   bar 13 b0  card 1: a real li.quest/v1/quote (USDT → WBNB, fromAddress = vault) · b2 selector 0x5fd9ae2e · b3 "whitelisted"
 *   bar 14 b0  card 2: approveForRebalance (b1) → executeRebalance (b2) → 1,000 USDT becomes 1.277 WBNB · "SWAPPED!"
 *   bar 15 b0  SPLICE / drop: card 3: getTwapPrice() on PCS V3 USDT/WBNB 0.01% = 778.97 · b2 observe() compatible
 *   bar 16 b0  the honest bit: why WBNB? PAXG on BSC has 50 total supply and no pool · b2 "NO POOL. YET."
 */
const CW = 540;
const CX = [110, 690, 1270];
const CY = 290;

const Card: React.FC<{ at: number; i: number; tag: string; title: string; color?: string; children: React.ReactNode }> = ({ at, i, tag, title, color = C.fork, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: CX[i], top: CY, width: CW, transform: `translateY(${(1 - p) * 80}px) scale(${0.9 + 0.1 * p})`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <Glass radius={26} glow={0.3} glowColor={`${color}55`} fill="rgba(12,13,16,0.9)" innerStyle={{ padding: "26px 30px", height: 440 }}>
        <div style={{ fontFamily: F.mono, fontSize: 17, letterSpacing: "0.14em", color }}>{tag}</div>
        <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 32, color: C.text, marginTop: 8, lineHeight: 1.15 }}>{title}</div>
        <div style={{ marginTop: 18 }}>{children}</div>
      </Glass>
    </div>
  );
};

const Line: React.FC<{ k: string; v: string; c?: string; at?: number }> = ({ k, v, c = C.text, at = 0 }) => {
  const f = useCurrentFrame();
  if (f < at) return <div style={{ height: 49 }} />;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.07)", ...fadeUp(f, at, 6, 10) }}>
      <span style={{ fontFamily: F.sans, fontSize: 21, color: C.textMuted }}>{k}</span>
      <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 23, color: c }}>{v}</span>
    </div>
  );
};

export const S5Fork: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.fork; // 13

  const wbnb = countUp(frame, b(k + 1, 2), b(k + 1, 3), 0, 1.277);
  const usdtLeft = countUp(frame, b(k + 1, 2), b(k + 1, 3), 1000, 0);
  const twap = countUp(frame, b(k + 2), b(k + 2) + 12, 0, 778.97);
  const selHot = frame >= b(k, 2);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(124,200,255,0.16)" glowB="rgba(217,174,74,0.14)" glow="top" floor={0.3} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />
      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 66, display: "flex", justifyContent: "center" }}>
          <Tag at={0} label="BSC mainnet fork · anvil · not a live deploy" color={C.fork} dashed size={24} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: F.display, fontSize: 64, color: C.text, ...fadeUp(frame, 0, 10, 20) }}>
          Real LI.FI. Real PancakeSwap. <i style={{ color: C.fork }}>On a mainnet fork.</i>
        </div>

        <Card at={b(k)} i={0} tag="LI.QUEST/V1/QUOTE · LIVE API" title="A real quote, fromAddress = the vault">
          <div style={{ fontFamily: F.mono, fontSize: 19, lineHeight: 1.55, color: C.textMuted, background: "rgba(0,0,0,0.35)", borderRadius: 12, padding: "12px 16px" }}>
            <div>fromChain <span style={{ color: C.text }}>56</span></div>
            <div>fromToken <span style={{ color: C.usdtSoft }}>USDT</span> → toToken <span style={{ color: C.wbnb }}>WBNB</span></div>
            <div>fromAmount <span style={{ color: C.text }}>1,000 USDT</span></div>
          </div>
          <div style={{ marginTop: 18, fontFamily: F.sans, fontSize: 20, color: C.textMuted }}>calldata selector</div>
          <div
            style={{
              marginTop: 6,
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: 12,
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 40,
              color: selHot ? C.goldSoft : C.textDim,
              border: `1.5px solid ${selHot ? C.gold : "rgba(255,255,255,0.1)"}`,
              background: selHot ? "rgba(217,174,74,0.12)" : "transparent",
              transform: `scale(${interpolate(frame, [b(k, 2), b(k, 2) + 6], [1.25, 1], clamp)})`,
              transformOrigin: "left center",
            }}
          >
            {CHAIN.fork.selLive}
          </div>
          {frame >= b(k, 3) ? (
            <div style={{ marginTop: 12, fontFamily: F.sans, fontWeight: 700, fontSize: 21, color: "#34C759", ...fadeUp(frame, b(k, 3), 6, 8) }}>✓ on the vault's selector whitelist</div>
          ) : null}
        </Card>

        <Card at={b(k + 1)} i={1} tag="EXECUTEREBALANCE · REAL LI.FI DIAMOND" title="The vault swaps through LI.FI">
          <Line k="approveForRebalance" v="USDT → Diamond" at={b(k + 1, 1)} />
          <Line k="executeRebalance" v="status 1" c="#34C759" at={b(k + 1, 2)} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22 }}>
            <div>
              <div style={{ fontFamily: F.sans, fontSize: 18, color: C.textMuted }}>USDT out</div>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 44, color: C.usdtSoft, fontVariantNumeric: "tabular-nums" }}>{Math.round(usdtLeft).toLocaleString("en-US")}</div>
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 44, color: C.textDim }}>→</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.sans, fontSize: 18, color: C.textMuted }}>WBNB in vault</div>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 44, color: C.wbnb, fontVariantNumeric: "tabular-nums" }}>{wbnb.toFixed(3)}</div>
            </div>
          </div>
        </Card>

        <Card at={b(k + 2)} i={2} tag="GETTWAPPRICE() · PANCAKESWAP V3" title="TWAP read off a real pool" color={C.gold}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 70, color: C.goldSoft, fontVariantNumeric: "tabular-nums" }}>{twap.toFixed(2)}</span>
            <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 24, color: C.textMuted }}>USDT / WBNB</span>
          </div>
          <Line k="pool" v={`USDT/WBNB 0.01% · ${CHAIN.fork.pcsPool}`} at={b(k + 2, 1)} />
          <Line k="observe() interface" v="compatible ✓" c="#34C759" at={b(k + 2, 2)} />
          <Line k="window" v="300 s TWAP" at={b(k + 2, 3)} />
        </Card>

        {/* bar 16: the honest bit */}
        {frame >= b(k + 3) ? (
          <div style={{ position: "absolute", left: 110, width: 1700, top: 790, ...fadeUp(frame, b(k + 3), 8, 20) }}>
            <Glass radius={22} glow={0.25} glowColor="rgba(255,181,71,0.35)" fill="rgba(24,18,8,0.92)" innerStyle={{ padding: "22px 30px", display: "flex", alignItems: "center", gap: 26 }}>
              <div style={{ fontFamily: F.comic, fontSize: 44, color: C.amber, whiteSpace: "nowrap" }}>WHY WBNB?</div>
              <div style={{ fontFamily: F.sans, fontSize: 26, lineHeight: 1.35, color: C.text }}>
                WBNB stood in for gold. Binance-Peg <b>PAXG</b> exists on BSC, but its total supply is only{" "}
                <b style={{ color: C.goldSoft }}>50 PAXG</b>, and there is <b style={{ color: C.rose }}>no pool</b> for it (vs USDT, USDC, WBNB or BUSD) on PancakeSwap V2/V3 or Uniswap V3.
              </div>
            </Glass>
          </div>
        ) : null}
      </Pulse>

      <SpeedBurst cx={CX[1]! + CW / 2} cy={CY + 300} from={b(k + 1, 3)} count={20} inner={200} spread={500} color={C.wbnb} opacity={0.45} width={7} seed="swap" fade />
      <ComicText text="SWAPPED!" from={b(k + 1, 3)} x={CX[1]! + CW / 2} y={CY - 10} size={100} rotate={-6} fill={C.wbnb} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2, 2)} />
      <ComicText text="TWAP ✓" from={b(k + 2, 1)} x={CX[2]! + CW / 2 + 120} y={CY - 10} size={90} rotate={7} fill={C.goldSoft} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3, 2)} />
      <ComicText text="NO POOL. YET." from={b(k + 3, 2)} x={1500} y={740} size={92} rotate={-5} fill={C.amber} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.8} />
      <Sfx name="tick" at={b(k, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.9} />
      <Sfx name="impact" at={b(k + 2)} volume={0.8} />
      <Sfx name="chime" at={b(k + 2, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 2, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3)} volume={0.6} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.8} />
    </AbsoluteFill>
  );
};
