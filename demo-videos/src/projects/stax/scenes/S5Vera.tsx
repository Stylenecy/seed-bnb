import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import {
  BnbMark,
  Camera,
  clamp,
  ComicText,
  fadeUp,
  Glass,
  Halftone,
  INK,
  InkFrame,
  PhoneFrame,
  PremiumBg,
  Pulse,
  scrambleHex,
  Sfx,
  shortHex,
  SpeedBurst,
  useSceneClock,
} from "../../../kit";
import type { CamKey } from "../../../kit";
import { C, CHAIN, F, SCREEN, VERA } from "../theme";
import { BAR } from "../timeline";

/**
 * S5 · VERA (bars 13–15) — DROP. The agent behind the plans has an identity:
 *   bar 13 b0  hard cut: real Vera screen (camera onto "Verified agent") + identity card
 *   bar 13 b1–b3  card rows resolve (agentId 97:2473, registry, owner)
 *   bar 13 b2  "VERIFIED!"
 *   bar 14 b0  register tx row · b2 "every plan signed by this key → InferenceVerifier"
 */
const PHONE_W = 440;
const PHONE_X = 250;
const PHONE_Y = 80;
const BEZEL = Math.round(PHONE_W * 0.035);
const S = (PHONE_W - BEZEL * 2 - 3) / 860;
const badge = { x: PHONE_X + 1.5 + BEZEL + 430 * S, y: PHONE_Y + 1.5 + BEZEL + 484 * S };

export const S5Vera: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.vera; // 13

  const cam: CamKey[] = [
    { frame: 0, x: 960, y: 540, scale: 1 },
    { frame: b(k, 1), x: badge.x + (960 - 470) / 1.35, y: badge.y + (540 - 420) / 1.35, scale: 1.35 },
    { frame: b(k + 1, 3), x: badge.x + (960 - 470) / 1.4, y: badge.y + (540 - 420) / 1.4, scale: 1.4 },
  ];

  const rows: { label: string; value: string; at: number; mono?: boolean; hot?: boolean }[] = [
    { label: "Agent ID", value: CHAIN.erc8004.agentId, at: b(k, 1), hot: true },
    { label: "Registry", value: shortHex(CHAIN.erc8004.registry, 12, 8), at: b(k, 2), mono: true },
    { label: "Owner / signer", value: shortHex(CHAIN.erc8004.owner, 12, 8), at: b(k, 3), mono: true },
    { label: "Register tx", value: shortHex(CHAIN.erc8004.registerTx, 14, 8), at: b(k + 1), mono: true },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(108,192,156,0.26)" glowB="rgba(240,185,11,0.14)" glow="center" floor={0.45} />
      <Halftone opacity={0.04} gap={20} />
      <SpeedBurst cx={1260} cy={300} from={0} count={20} inner={160} spread={560} color={C.sage} opacity={0.3} width={6} seed="vera" fade />

      <Camera keyframes={cam}>
        <Pulse intensity={0.5} shake={0} glow={false}>
          <AbsoluteFill>
            <div style={{ position: "absolute", left: PHONE_X, top: PHONE_Y }}>
              <PhoneFrame src={SCREEN.vera} width={PHONE_W} glow={0.6} glowColor="rgba(108,192,156,0.45)" />
            </div>
            {frame >= b(k, 2) ? (
              <div
                style={{
                  position: "absolute",
                  left: badge.x - 100,
                  top: badge.y - 22,
                  width: 200,
                  height: 44,
                  borderRadius: 999,
                  border: `3px solid ${C.sage}`,
                  boxShadow: `0 0 26px ${C.sage}`,
                  transform: `scale(${interpolate(frame, [b(k, 2), b(k, 2) + 6], [1.5, 1], clamp)})`,
                }}
              />
            ) : null}
          </AbsoluteFill>
        </Pulse>
      </Camera>

      <div style={{ position: "absolute", left: 60, top: 50, fontFamily: F.sans, fontWeight: 700, fontSize: 20, letterSpacing: "0.14em", color: C.sageLight, textTransform: "uppercase", padding: "8px 16px", borderRadius: 999, border: `1.5px solid ${C.sage}88`, background: "rgba(12,15,18,0.7)" }}>
        ● Real Stax app · Vera screen
      </div>

      <Pulse intensity={0.7} shake={0.2} glow={false}>
        <div style={{ position: "absolute", left: 930, top: 150, width: 900, ...fadeUp(frame, 0, 10, 40) }}>
          <Glass radius={28} glow={0.5} glowColor="rgba(108,192,156,0.4)" fill="rgba(16,20,22,0.88)" innerStyle={{ padding: "34px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <Img src={VERA} style={{ width: 96, height: 96, transform: `translateY(${Math.sin(frame / 8) * 4}px)` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 20, letterSpacing: "0.2em", color: C.sage }}>ERC-8004 IDENTITY · BSC TESTNET</div>
                <div style={{ fontFamily: F.display, fontSize: 64, color: C.text, lineHeight: 1.05 }}>
                  Vera, <i style={{ color: C.sageLight }}>a verified agent</i>
                </div>
              </div>
              <BnbMark size={52} />
            </div>
            <div style={{ marginTop: 22 }}>
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
                      border: `1px solid ${r.hot ? C.sage + "cc" : "rgba(255,255,255,0.1)"}`,
                      background: r.hot ? "rgba(108,192,156,0.12)" : "rgba(255,255,255,0.03)",
                      ...fadeUp(frame, r.at, 8, 20),
                    }}
                  >
                    <div style={{ width: 240, fontFamily: F.sans, fontWeight: 700, fontSize: 26, color: r.hot ? C.sageLight : C.text }}>{r.label}</div>
                    <div style={{ flex: 1, fontFamily: F.mono, fontSize: r.hot ? 40 : 26, fontWeight: r.hot ? 700 : 500, color: r.hot ? C.sageLight : C.textDim }}>
                      {r.mono ? scrambleHex(frame, r.value, r.at, 12) : r.value}
                    </div>
                  </div>
                ) : (
                  <div key={r.label} style={{ height: 78 }} />
                ),
              )}
            </div>
          </Glass>
        </div>

        {frame >= b(k + 1, 2) ? (
          <div style={{ position: "absolute", left: 930, top: 790, width: 900, fontFamily: F.sans, fontSize: 32, lineHeight: 1.35, color: C.text, ...fadeUp(frame, b(k + 1, 2), 10, 20) }}>
            Every plan is <b style={{ color: C.sageLight }}>EIP-712 signed</b> by this key, and <span style={{ fontFamily: F.mono, color: C.terracotta }}>InferenceVerifier</span> only trusts that signer.
          </div>
        ) : null}
      </Pulse>

      <ComicText text="VERIFIED!" from={b(k, 2)} x={700} y={900} size={130} rotate={-7} fill={C.sageLight} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 2)} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={C.sage} />

      <Sfx name="impact" at={0} volume={0.9} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1)} volume={0.6} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
