import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, ComicPanel, ComicText, fadeUp, Glass, Halftone, INK, InkFrame, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import type { CamKey } from "../../../kit";
import { Hanko, InkNight, KatanaSlash, SlashSplit, TokenCoin } from "../art";
import { C, CHAIN, F, SCREEN, short } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Ring, Shot } from "../ui";

/**
 * S5 · GATES (bars 52–55) — hard cut. READ-ONLY checks against LIVE BSC
 * mainnet data (chain 56) through the real dashboard → Go daemon → GoPlus /
 * DexScreener. Nothing is written. VERIFY-BNB.md: "gates on CAKE correctly
 * FAILs gate 1 (mintable). gates on ARIA PASSes gates 1-3, 6 and 7 (79.6k holders)".
 *   52  CAKE   b1 gate 1 ✗ · b2 "mint authority not revoked" · b3 katana CUT!
 *   53  ARIA   b1 gates 1–3 ✓ · b2 gates 6–7 ✓ · b3 PASS seal
 *   54  duel   b0 CAKE panel · b1 sliced · b2 ARIA panel · b3 "SURVIVOR."
 */
const W = 1440;
const FX = (1920 - W) / 2;
const FY = 150;
const BAR_H = Math.round(W * 0.032);
const K = (W - 3) / 1920;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });
const CENTER = { x: 960, y: 560 };
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey => ({ frame, x: pt.x, y: pt.y, scale });

export const S5Gates: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.gates; // 52
  const duel = frame >= b(k + 2);
  const aria = frame >= b(k + 1);

  const cam: CamKey[] = [key(0, at(730, 520), 1.15)];
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 8) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  move(b(k, 1), at(760, 548), 1.75);
  move(b(k, 2), at(900, 548), 1.9);
  cut(b(k + 1), at(730, 560), 1.15);
  move(b(k + 1, 1), at(730, 620), 1.45);
  move(b(k + 1, 2), at(730, 900), 1.45);
  move(b(k + 1, 3), at(730, 700), 1.2);

  const pL = useBeatPunch([b(k + 2), b(k + 2, 1)], 0.04, 4);
  const pR = useBeatPunch([b(k + 2, 2), b(k + 2, 3)], 0.04, 4);
  const swap = aria ? interpolate(frame, [b(k + 1), b(k + 1) + 3], [0.35, 0], clamp) : 0;

  return (
    <AbsoluteFill>
      <InkNight glow={1.1} />
      <Halftone opacity={0.035} gap={22} color={C.crimson} />

      {!duel ? (
        <Pulse intensity={0.35} shake={0} glow={false}>
          <Camera keyframes={cam}>
            <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
              <Shot src={aria ? SCREEN.aria : SCREEN.cake} w={W} url="localhost:3271/dashboard · Gates">
                {!aria ? (
                  <>
                    <Ring x={314} y={519} w={832} h={58} at={b(k, 1)} color={C.rose} label="GATE 1 · CONTRACT SAFETY · FAIL" />
                    <Ring x={890} y={536} w={206} h={24} at={b(k, 2)} color={C.rose} label="MINT AUTHORITY NOT REVOKED" below />
                  </>
                ) : (
                  <>
                    <Ring x={314} y={519} w={832} h={194} at={b(k + 1, 1)} until={b(k + 1, 2)} color={C.green} label="GATES 1–3 · PASS" />
                    <Ring x={314} y={859} w={832} h={126} at={b(k + 1, 2)} color={C.green} label="GATES 6–7 · PASS" />
                  </>
                )}
              </Shot>
              <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swap, borderRadius: 18 }} />
            </div>
          </Camera>
        </Pulse>
      ) : (
        <Pulse intensity={1.1} shake={0.6}>
          <SpeedBurst cx={960} cy={540} from={b(k + 2)} count={22} inner={260} spread={760} color={C.gold} opacity={0.3} width={6} seed="duel" />
          <ComicPanel at={b(k + 2)} x={150} y={200} w={760} h={640} rot={-2} bg="#ffe1d6" bg2={C.crimson} from="left" punch={pL}>
            <div style={{ position: "absolute", left: 30, top: 24, fontFamily: F.comic, fontSize: 48, color: INK }}>CAKE · {short(CHAIN.cake)}</div>
            <div style={{ position: "absolute", left: 180, top: 110 }}>
              <SlashSplit at={b(k + 2, 1)} w={400} h={400} angle={-32} gap={60}>
                <svg width={400} height={400}>
                  <TokenCoin x={200} y={200} r={170} label="CAKE" fill="#d8b98c" />
                </svg>
              </SlashSplit>
            </div>
            <div style={{ position: "absolute", left: 30, right: 30, bottom: 26, background: "#fffdf6", border: `4px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, padding: "10px 16px", fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: INK }}>
              Gate 1 FAIL: mintable. Pipeline stops.
            </div>
          </ComicPanel>
          <ComicPanel at={b(k + 2, 2)} x={1010} y={190} w={760} h={640} rot={1.8} bg="#e9f2e6" bg2={C.green} from="right" punch={pR}>
            <div style={{ position: "absolute", left: 30, top: 24, fontFamily: F.comic, fontSize: 48, color: INK }}>ARIA · {short(CHAIN.aria)}</div>
            <svg width={760} height={640} style={{ position: "absolute", inset: 0 }}>
              <circle cx={380} cy={310} r={200} fill="none" stroke={C.gold} strokeWidth={10} strokeDasharray="18 16" opacity={0.9} transform={`rotate(${frame * 1.5} 380 310)`} />
              <TokenCoin x={380} y={310} r={170} label="ARIA" fill={C.gold} />
            </svg>
            <div style={{ position: "absolute", left: 30, right: 30, bottom: 26, background: "#fffdf6", border: `4px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, padding: "10px 16px", fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: INK }}>
              Gates 1–3, 6, 7 PASS · 79.6k holders
            </div>
          </ComicPanel>
        </Pulse>
      )}

      <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 24px 8px 8px", borderRadius: 999, background: "rgba(8,6,4,0.92)" }}>
          <RealTag at={0} size={22} label="Read-only live BSC check · chain 56" />
          <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textMuted }}>{duel ? "Go engine · no writes" : aria ? "token ARIA" : "token CAKE"}</div>
        </div>
      </div>

      {!duel ? (
        <div key={aria ? "a" : "c"} style={{ position: "absolute", left: 0, right: 0, bottom: 52, display: "flex", justifyContent: "center", ...fadeUp(frame, (aria ? b(k + 1) : 0) + 2, 10, 20) }}>
          <Glass radius={18} glow={0.3} glowColor={aria ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)"} fill="rgba(12,9,6,0.94)" innerStyle={{ padding: "14px 30px" }}>
            <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: C.text }}>
              {aria ? "ARIA: clears gates 1–3, 6 and 7 on live BSC data (social flagged WARN)" : "CAKE: mint authority not revoked, so it is cut at gate 1"}
            </div>
          </Glass>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 26, color: C.textMuted, ...fadeUp(frame, b(k + 2, 3), 8, 12) }}>
          GoPlus + DexScreener data via the MUSASHI Go engine · read-only, nothing written
        </div>
      )}

      <KatanaSlash at={b(k, 3)} x1={-60} y1={980} x2={1980} y2={240} seed="cake" />
      <ComicText text="CUT!" from={b(k, 3)} x={1500} y={300} size={200} rotate={-9} fill={C.rose} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1)} />
      {aria && !duel ? <Hanko x={1500} y={840} text="PASS" at={b(k + 1, 3)} size={140} rot={-10} color={C.green} /> : null}
      <KatanaSlash at={b(k + 2, 1)} x1={200} y1={860} x2={960} y2={180} width={20} seed="duelcut" hold={8} />
      <ComicText text="SURVIVOR." from={b(k + 2, 3)} x={1390} y={905} size={100} rotate={-5} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color={C.washi} />

      <Sfx name="tick" at={b(k, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k, 3)} volume={0.9} />
      <Sfx name="whoosh" at={b(k, 3)} volume={0.5} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.35} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.7} />
      <Sfx name="impact" at={b(k + 2)} volume={0.75} />
      <Sfx name="impact" at={b(k + 2, 1)} volume={0.85} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.7} />
      <Sfx name="chime" at={b(k + 2, 3)} volume={0.55} />
    </AbsoluteFill>
  );
};
