import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, CoinDot, ComicPanel, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, useBeatPunch, useSceneClock, Vault } from "../../../kit";
import { NftCard, Shield, Stamp } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · SEASON + TRANSFER ORACLE (bars 15–17), whips in. VERIFY-BNB.md:
 *   15 b0 Season #1 created, pool 0.002 tBNB   b1 enroll(1, token 1)
 *      b2 settle(1,[1]) → 0.001 winner + 0.001 refund ("PAID!")   b3 balance 0, settled
 *   16 b0 transfer oracle panel: signs a proof for the owner   b1 chainId 56 → 400
 *      b2 non-owner `from` → 403   b3 "proof not submitted; full transfer proven on a fork"
 */
const Line: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = INK, size = 28 }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: size, color, lineHeight: 1.25 }}>{children}</div>
);

export const S6Season: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.season; // 15
  const pA = useBeatPunch(beatsIn(k, k + 1), 0.02, 5);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.02, 5);

  const hop = interpolate(frame, [b(k, 1), b(k, 1) + 10], [0, 1], clamp);
  const fly = interpolate(frame, [b(k, 2), b(k, 2) + 12], [0, 1], clamp);
  const pool = frame >= b(k, 3) ? "0" : frame >= b(k, 2) ? "0.001" : "0.002";

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(240,185,11,0.18)" glowB="rgba(167,139,250,0.16)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <Pulse intensity={1} shake={0.5}>
        {/* ---------------- SEASON ---------------- */}
        <ComicPanel at={b(k)} x={80} y={120} w={860} h={840} rot={-1.2} bg="#FFF0B8" bg2={C.gold} from="left" punch={pA}>
          <div style={{ position: "absolute", left: 34, top: 26 }}>
            <div style={{ fontFamily: F.comic, fontSize: 60, color: INK }}>SEASON #1</div>
            <Line size={26}>Season.createSeason · prize pool</Line>
          </div>
          <svg width={860} height={840} viewBox="0 0 860 840" style={{ position: "absolute", inset: 0 }}>
            <Vault x={250} y={400} s={1.3} label="POOL" dial={frame * 3} />
            {frame >= b(k, 1) ? <NftCard x={640 - (1 - hop) * 200} y={330 - Math.sin(hop * Math.PI) * 80} s={0.9} rot={6} /> : null}
            {fly > 0 && fly < 1 ? (
              <>
                <CoinDot cx={250 + fly * 150} cy={400 + fly * 250 - Math.sin(fly * Math.PI) * 140} r={34} label="BNB" rotate={fly * 360} />
                <CoinDot cx={250 + fly * 440} cy={400 + fly * 250 - Math.sin(fly * Math.PI) * 180} r={34} label="BNB" rotate={-fly * 360} />
              </>
            ) : null}
          </svg>
          <div style={{ position: "absolute", left: 90, top: 560, fontFamily: F.comic, fontSize: 64, color: INK }}>
            {pool} <span style={{ fontSize: 40 }}>tBNB left</span>
          </div>
          {frame >= b(k, 2) ? (
            <div style={{ position: "absolute", left: 34, right: 34, bottom: 30, display: "flex", gap: 20 }}>
              {[
                { t: "WINNER", v: "0.001 tBNB", s: "50% to the iNFT owner", c: C.emerald },
                { t: "REFUND", v: "0.001 tBNB", s: "rest back to the creator", c: C.cyan },
              ].map((x) => (
                <div key={x.t} style={{ flex: 1, background: "#fff", border: `4px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, padding: "12px 16px" }}>
                  <div style={{ fontFamily: F.comic, fontSize: 34, color: INK }}>{x.t}</div>
                  <div style={{ fontFamily: F.comic, fontSize: 52, color: x.c, WebkitTextStroke: `2px ${INK}` }}>{x.v}</div>
                  <Line size={22}>{x.s}</Line>
                </div>
              ))}
            </div>
          ) : null}
          {frame >= b(k, 3) ? (
            <div style={{ position: "absolute", right: 30, top: 40, padding: "8px 16px", background: INK, color: C.gold, fontFamily: F.mono, fontWeight: 700, fontSize: 24, transform: "rotate(2deg)" }}>
              balance 0 · settled = true
            </div>
          ) : null}
        </ComicPanel>

        {/* ---------------- TRANSFER ORACLE ---------------- */}
        <ComicPanel at={b(k + 1)} x={990} y={140} w={850} h={820} rot={1.4} bg="#E2D9FF" bg2={C.violet} from="right" punch={pB}>
          <div style={{ position: "absolute", left: 34, top: 26, right: 34 }}>
            <div style={{ fontFamily: F.comic, fontSize: 56, color: INK }}>TRANSFER ORACLE</div>
            <Line size={26}>ERC-7857 proof signer · live on the testnet contracts</Line>
          </div>
          <svg width={850} height={820} viewBox="0 0 850 820" style={{ position: "absolute", inset: 0 }}>
            <Shield x={170} y={330} s={1.1} fill={C.emerald} mark="check" label="SIGNED" />
            {frame >= b(k + 1, 1) ? <Shield x={170} y={560} s={0.8} fill={C.rose} mark="cross" /> : null}
          </svg>
          <div style={{ position: "absolute", left: 300, top: 250, right: 30 }}>
            <Line size={30}>POST /sign-transfer-proof</Line>
            <Line size={26} color="#2b2b2b">owner of token 1 → signature ✓</Line>
          </div>
          {[
            { at: b(k + 1, 1), code: "400", why: "wrong chain (chainId 56)", rot: -6, y: 410 },
            { at: b(k + 1, 2), code: "403", why: "`from` is not the owner", rot: 5, y: 560 },
          ].map((r) =>
            frame >= r.at ? (
              <div key={r.code} style={{ position: "absolute", left: 300, top: r.y, right: 30, display: "flex", alignItems: "center", gap: 18 }}>
                <svg width={210} height={110} viewBox="-105 -55 210 110" style={{ overflow: "visible", transform: `scale(${interpolate(frame, [r.at, r.at + 5], [1.8, 1], clamp)})` }}>
                  <Stamp x={0} y={0} rot={r.rot} text={r.code} color="#c81e3a" w={190} />
                </svg>
                <Line size={30}>{r.why}</Line>
              </div>
            ) : null,
          )}
          {frame >= b(k + 1, 3) ? (
            <div style={{ position: "absolute", left: 34, right: 34, bottom: 30, background: "#fff", border: `4px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, padding: "12px 16px" }}>
              <Line size={24}>The signed proof was not submitted on testnet (it would move token 1). The full transfer was proven on a BSC-testnet fork.</Line>
            </div>
          ) : null}
        </ComicPanel>
      </Pulse>

      <ComicText text="PAID!" from={b(k, 2)} x={560} y={330} size={110} rotate={-8} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 1)} />
      <ComicText text="DENIED!" from={b(k + 1, 2)} x={1500} y={130} size={100} rotate={7} fill={C.rose} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.8} />
      <Sfx name="tick" at={b(k, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k, 2)} volume={0.8} />
      <Sfx name="chime" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k, 3)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1)} volume={0.8} />
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.8} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
