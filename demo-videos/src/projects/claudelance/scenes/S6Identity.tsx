import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BnbMark,
  clamp,
  ComicText,
  fadeUp,
  Glass,
  Halftone,
  INK,
  InkFrame,
  PremiumBg,
  Pulse,
  Robot,
  scrambleHex,
  Sfx,
  shortHex,
  SpeedBurst,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { IdCard } from "../art";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · IDENTITY (bars 24–26). The worker registered on the REAL ERC-8004
 * IdentityRegistry on BSC testnet → agentId 2474 (VERIFY-BNB.md smoke table).
 *   24 b0 robot + ID card slam · b1 agentId row · b2 registry row + "REGISTERED!" · b3 worker
 *   25 b0 register tx · b1 attestReputation tx · b2 "REP +1" · b3 footnote
 */
export const S6Identity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.identity; // 24

  const card = spring({ frame: frame - b(k), fps, config: { damping: 11, stiffness: 180, mass: 0.7 } });
  const p = useBeatPunch(beatsIn(k, k + 2), 0.03, 5);

  const rows: { label: string; value: string; at: number; mono?: boolean; hot?: boolean }[] = [
    { label: "Agent ID", value: `${CHAIN.agentId}`, at: b(k, 1), hot: true },
    { label: "IdentityRegistry", value: shortHex(CHAIN.identity, 12, 8), at: b(k, 2), mono: true },
    { label: "Worker wallet", value: shortHex(CHAIN.worker, 12, 8), at: b(k, 3), mono: true },
    { label: "register() tx", value: shortHex(CHAIN.tx.register, 14, 8), at: b(k + 1), mono: true },
    { label: "Reputation tx", value: shortHex(CHAIN.tx.reputation, 14, 8), at: b(k + 1, 1), mono: true },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(52,211,153,0.18)" glowB="rgba(240,185,11,0.16)" glow="center" floor={0.45} />
      <Halftone opacity={0.05} gap={20} />
      <SpeedBurst cx={420} cy={520} from={0} count={22} inner={200} spread={560} color={C.gold} opacity={0.35} width={6} seed="id" fade />

      <Pulse intensity={0.9} shake={0.3}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <g opacity={interpolate(card, [0, 0.2], [0, 1], clamp)} transform={`translate(0 ${(1 - card) * 200})`}>
            <Robot x={300} y={640} s={1.8 * p} fill="#9AA3B5" visor="#5EF0FF" />
            <IdCard x={500} y={400} s={1.55 * p} rot={-6 + (1 - card) * -20} id={`#${CHAIN.agentId}`} />
          </g>
        </svg>
      </Pulse>

      <Pulse intensity={0.6} shake={0.15} glow={false}>
        <div style={{ position: "absolute", left: 880, top: 130, width: 960, ...fadeUp(frame, 0, 10, 40) }}>
          <Glass radius={28} glow={0.5} glowColor="rgba(52,211,153,0.35)" fill="rgba(25,22,21,0.9)" innerStyle={{ padding: "32px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 20, letterSpacing: "0.2em", color: C.emerald }}>ERC-8004 IDENTITY · BSC TESTNET</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 60, color: C.text, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
                  An agent with a <span style={{ color: C.emerald }}>real on-chain ID</span>
                </div>
              </div>
              <BnbMark size={54} />
            </div>
            <div style={{ marginTop: 18 }}>
              {rows.map((r) =>
                frame >= r.at ? (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: 68,
                      marginTop: 10,
                      padding: "0 20px",
                      borderRadius: 14,
                      border: `1px solid ${r.hot ? C.emerald + "cc" : "rgba(255,255,255,0.1)"}`,
                      background: r.hot ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.03)",
                      ...fadeUp(frame, r.at, 8, 20),
                    }}
                  >
                    <div style={{ width: 280, fontFamily: F.sans, fontWeight: 700, fontSize: 26, color: r.hot ? C.emerald : C.text }}>{r.label}</div>
                    <div style={{ flex: 1, fontFamily: F.mono, fontSize: r.hot ? 44 : 26, fontWeight: r.hot ? 700 : 500, color: r.hot ? C.emerald : C.textDim }}>
                      {r.mono ? scrambleHex(frame, r.value, r.at, 12) : r.value}
                    </div>
                    {r.label.endsWith("tx") ? (
                      <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 18, color: C.emerald, border: `1px solid ${C.emerald}88`, borderRadius: 999, padding: "5px 12px" }}>Success</div>
                    ) : null}
                  </div>
                ) : (
                  <div key={r.label} style={{ height: 78 }} />
                ),
              )}
            </div>
          </Glass>
        </div>

        {frame >= b(k + 1, 2) ? (
          <div style={{ position: "absolute", left: 880, top: 850, width: 960, fontFamily: F.sans, fontSize: 30, lineHeight: 1.35, color: C.text, ...fadeUp(frame, b(k + 1, 2), 10, 20) }}>
            After payout, <span style={{ fontFamily: F.mono, color: C.clay }}>attestReputation</span> wrote <b style={{ color: C.emerald }}>giveFeedback</b> to the real ReputationRegistry. Reputation that travels.
          </div>
        ) : null}
      </Pulse>

      <ComicText text="REGISTERED!" from={b(k, 2)} x={440} y={900} size={116} rotate={-7} fill={C.emerald} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 2)} />
      <ComicText text="REP +1!" from={b(k + 1, 2)} x={440} y={900} size={140} rotate={6} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.emerald} />

      <Sfx name="impact" at={0} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
