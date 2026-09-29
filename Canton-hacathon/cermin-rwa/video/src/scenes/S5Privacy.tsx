import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere, Sfx } from "../lib/ui";
import { Pulse } from "../lib/Pulse";
import { ComicText } from "../lib/ComicText";
import { COLORS } from "../lib/tokens";
import { FONT_DISPLAY, FONT_SANS } from "../lib/fonts";
import { comicImg } from "../lib/assets";
import { barB, beatB } from "../lib/beat";

/**
 * S5 · CONTROL — "the pool can't touch it" (BNB Chain version). On BNB Chain all
 * contract state is public, so the claim is about CONTROL, not privacy: the
 * pool is the loan's counterparty, but CerminRWA gives it no function that
 * touches your Shadow Vault, Guard Policy or rescues (its only calls are
 * createOffer / withdrawOffer / lastResortDefault). Split-panel comparison:
 *
 *   LEFT  `s3-vault`  — you + your guardian filling the chest → "WHAT YOU CONTROL"
 *   RIGHT `p1-blind`  — the banker at empty frames            → "WHAT THE POOL CAN TOUCH"
 *
 * Then the RIGHT panel takes over full-bleed and the pool's reach resolves to
 * 0/0/0 — enforced by the contract, not by a promise.
 *
 * Window barB(22)→barB(27) (5 bars). Local grid (S = barB(22)):
 *   bars 22–24  0→113   split panels; tags + beat-popped sublabels
 *   bar 24→25   113→160 left panel exits, right panel expands to full-bleed
 *   bars 25–26  169→282 banker full-bleed; 0/0/0 scramble → settle on bar 26
 *                       (chime); "Enforced by CerminRWA on BNB Chain."; closing slam
 */
const S = barB(22);
const b = (k: number): number => barB(k) - S;
/** kth beat into the scene (bar 22 = part-B beat 88). */
const beat = (n: number): number => beatB(88 + n) - S;

const clampBoth = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** A single scrambling zero: cycles digits (terracotta), settles to 0 (sage). */
const ScrambleZero: React.FC<{ idx: number; label: string; settleAt: number }> = ({
  idx,
  label,
  settleAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const settled = frame >= settleAt;
  const digit = settled ? "0" : String(Math.floor(random(`z${idx}-${Math.floor(frame / 3)}`) * 10));
  const pop = spring({ frame: frame - settleAt, fps, config: { damping: 12, stiffness: 170 } });
  const color = settled ? COLORS.sage : COLORS.terracotta;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          fontSize: 118,
          color,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${settled ? 0.9 + pop * 0.1 : 1})`,
          lineHeight: 1,
          textShadow: "0 6px 30px rgba(5,7,10,0.7)",
        }}
      >
        {digit}
      </div>
      <div style={{ fontFamily: FONT_SANS, fontWeight: 500, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.muted }}>
        {label}
      </div>
    </div>
  );
};

/** A small beat-popped sublabel with a gold bullet. */
const Sublabel: React.FC<{ text: string; at: number; color?: string; exitAt: number }> = ({
  text,
  at,
  color = COLORS.muted,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 200, stiffness: 130, mass: 0.6 } });
  const op = interpolate(frame, [exitAt, exitAt + 12], [1, 0], clampBoth) * p;
  if (op <= 0.001) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: op, transform: `translateY(${(1 - p) * 14}px)` }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.gold, flexShrink: 0 }} />
      <span style={{ fontFamily: FONT_SANS, fontWeight: 500, fontSize: 28, color }}>{text}</span>
    </div>
  );
};

export const S5Privacy: React.FC = () => {
  const frame = useCurrentFrame();

  // --- panel geometry ---
  const kenL = interpolate(frame, [0, 113], [1.06, 1.13], clampBoth);
  const kenR = interpolate(frame, [0, 160], [1.06, 1.16], clampBoth);

  // Left panel slides out + fades at the takeover.
  const leftX = interpolate(frame, [113, 150], [0, -1010], clampBoth);
  const leftOp = interpolate(frame, [113, 150], [1, 0], clampBoth);
  const dividerOp = interpolate(frame, [113, 138], [1, 0], clampBoth);

  // Right panel expands from its half to full-bleed.
  const rightLeft = interpolate(frame, [113, 160], [960, 0], clampBoth);
  const rightW = interpolate(frame, [113, 160], [960, 1920], clampBoth);
  const scrimOp = interpolate(frame, [120, 168], [0.34, 0.68], clampBoth);

  const tagExit = 116;

  // --- full-bleed payoff ---
  const settleAt = b(26); // 225 — zeros settle on their bar
  const zerosOp = interpolate(frame, [160, 182], [0, 1], clampBoth);
  const verifiedOp = interpolate(frame, [settleAt + 22, settleAt + 44], [0, 1], clampBoth);

  return (
    <Atmosphere>
      <Pulse sceneStart={S} intensity={0.5} shake={0.3} glow={false}>
        {/* RIGHT panel (banker) — expands to full-bleed. Rendered first so the
            left panel + divider sit above it during the split. */}
        <div style={{ position: "absolute", top: 0, left: rightLeft, width: rightW, height: 1080, overflow: "hidden" }}>
          <Img src={comicImg("p1-blind")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kenR})` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(10,12,16,${scrimOp * 0.7}) 0%, rgba(10,12,16,${scrimOp}) 100%)` }} />
        </div>

        {/* LEFT panel (vault) — exits at the takeover. */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 960, height: 1080, overflow: "hidden", opacity: leftOp, transform: `translateX(${leftX}px)` }}>
          <Img src={comicImg("s3-vault")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kenL})` }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,12,16,0.20) 0%, rgba(10,12,16,0.52) 100%)" }} />
        </div>

        {/* Ink divider */}
        <div style={{ position: "absolute", top: 0, left: 950, width: 12, height: 1080, opacity: dividerOp, background: COLORS.app, boxShadow: `inset 0 0 0 1px ${COLORS.hairlineStrong}` }}>
          <div style={{ position: "absolute", top: 0, left: 5, width: 2, height: "100%", background: COLORS.hairlineStrong }} />
        </div>

        {/* Split-phase tags */}
        <ComicText text={"What you control"} from={6} x={480} y={172} size={58} rotate={-3} fill={COLORS.goldSoft} exitAt={tagExit} />
        <ComicText text={"What the pool\ncan touch"} from={20} x={1440} y={186} size={54} rotate={3} fill={COLORS.text} exitAt={tagExit} />

        {/* Left sublabels — one per beat */}
        <div style={{ position: "absolute", left: 120, top: 780, display: "flex", flexDirection: "column", gap: 20 }}>
          <Sublabel text="Your vault" at={beat(1)} color={COLORS.text} exitAt={tagExit} />
          <Sublabel text="Your policy" at={beat(2)} color={COLORS.text} exitAt={tagExit} />
          <Sublabel text="Every rescue" at={beat(3)} color={COLORS.text} exitAt={tagExit} />
        </div>

        {/* Right sublabel */}
        <div style={{ position: "absolute", left: 1030, top: 830 }}>
          <Sublabel text="The loan it's owed. Nothing else." at={beat(4)} color={COLORS.muted} exitAt={tagExit} />
        </div>

        {/* Full-bleed payoff: the pool's view resolves to 0/0/0 */}
        <AbsoluteFill style={{ opacity: zerosOp, alignItems: "center", paddingTop: 300 }}>
          <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 24, letterSpacing: "0.28em", textTransform: "uppercase", color: COLORS.faint, marginBottom: 30 }}>
            Pool functions that touch your…
          </div>
          <div style={{ display: "flex", gap: 120 }}>
            <ScrambleZero idx={0} label="vault" settleAt={settleAt} />
            <ScrambleZero idx={1} label="rescues" settleAt={settleAt + 12} />
            <ScrambleZero idx={2} label="policy" settleAt={settleAt + 24} />
          </div>
          <div style={{ opacity: verifiedOp, marginTop: 34, display: "flex", alignItems: "center", gap: 12, fontFamily: FONT_SANS, fontWeight: 500, fontSize: 26, color: COLORS.sage }}>
            <span style={{ width: 11, height: 11, borderRadius: 999, background: COLORS.sage }} />
            Enforced by the CerminRWA contract on BNB Chain.
          </div>
        </AbsoluteFill>

        {/* Closing slam */}
        <ComicText text={"The pool can't touch it.\nThe contract says so."} from={settleAt + 15} x={960} y={862} size={74} rotate={-2} fill={COLORS.goldSoft} />
      </Pulse>

      {/* whoosh on the hard-cut in; chime as the zeros settle to 0/0/0. */}
      <Sfx type="whoosh" at={0} volume={0.35} />
      <Sfx type="whoosh" at={120} volume={0.32} />
      <Sfx type="chime" at={settleAt} volume={0.45} />
    </Atmosphere>
  );
};
