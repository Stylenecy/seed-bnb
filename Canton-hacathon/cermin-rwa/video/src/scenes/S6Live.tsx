import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere, Sfx } from "../lib/ui";
import { Pulse } from "../lib/Pulse";
import { Halftone, InkFrame, SpeedBurst, inkTextStyle } from "../lib/comicFx";
import { COLORS, RADIUS } from "../lib/tokens";
import { FONT_DISPLAY, FONT_SANS } from "../lib/fonts";
import { barC } from "../lib/beat";
import { BnbMark } from "../lib/BnbMark";

/**
 * S6 · LIVE ON BSC TESTNET — the on-chain proof wall (BNB Chain version), drawn in the comic house style
 * (halftone ink page + thick comic frame; the LIVE badge is a rough-edged
 * starburst SEAL with radiating speed-lines; each stat is a comic CARD with an
 * ink outline + hard offset shadow + a slight tilt, slammed onto its bar). The
 * one-per-bar timing is kept: badge on the hard cut (bar 33), one card per bar
 * (bars 34–37), caption on bar 37; the rescue card counts the loan down from
 * 6,000.00 to the real on-chain 5,241.38.
 */
const S = barC(33);
const b = (k: number): number => barC(k) - S;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#0a0c10";

/* --------------------------------------------------- rough starburst seal --- */

/** A wide, rough-edged comic starburst — the seal behind the LIVE badge. */
const Starburst: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  spikes?: number;
  inner?: number;
  scale?: number;
}> = ({ cx, cy, rx, ry, spikes = 22, inner = 0.82, scale = 1 }) => {
  const pts: string[] = [];
  const n = spikes * 2;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    const base = i % 2 === 0 ? 1 : inner;
    const jit = 1 + (random(`star-${i}`) - 0.5) * 0.08;
    const rr = base * jit * scale;
    pts.push(`${(cx + Math.cos(ang) * rx * rr).toFixed(1)},${(cy + Math.sin(ang) * ry * rr).toFixed(1)}`);
  }
  return (
    <polygon
      points={pts.join(" ")}
      fill={COLORS.sunken}
      stroke={COLORS.text}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  );
};

/* ------------------------------------------------------------- comic card --- */

const ComicCard: React.FC<{
  landAt: number;
  left: number;
  top: number;
  w: number;
  h: number;
  rot: number;
  children: React.ReactNode;
}> = ({ landAt, left, top, w, h, rot, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - landAt, fps, config: { damping: 15, stiffness: 130, mass: 0.8 } });
  const op = interpolate(p, [0, 0.3], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        opacity: op,
        transform: `translateY(${(1 - p) * 30}px) scale(${0.94 + p * 0.06}) rotate(${rot}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      {/* Hard offset "ink" shadow — an offset outlined ghost behind the card so
          the drop reads on the dark comic page. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "translate(11px, 13px)",
          background: COLORS.app,
          border: `4px solid ${COLORS.text}`,
          borderRadius: RADIUS + 2,
          opacity: 0.22,
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: COLORS.raised,
          border: `4px solid ${COLORS.text}`,
          borderRadius: RADIUS + 2,
          boxShadow: "0 20px 40px -24px rgba(0,0,0,0.6)",
          padding: "26px 30px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = COLORS.gold }) => (
  <div style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 18, letterSpacing: "0.2em", textTransform: "uppercase", color }}>
    {children}
  </div>
);

const Line: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 37, color: COLORS.text, marginTop: 12, lineHeight: 1.12 }}>
    {children}
  </div>
);

const Mono: React.FC<{ children: React.ReactNode; size: number; color?: string }> = ({ children, size, color = COLORS.goldSoft }) => (
  <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: size, color, marginTop: 10, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
    {children}
  </div>
);

export const S6Live: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeP = spring({ frame, fps, config: { damping: 13, stiffness: 130, mass: 0.7 } });
  const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(frame / 7));
  // The seal "lands" its energy on the first stat pop (bar 34) with a scale bump.
  const drop = interpolate(frame, [b(34), b(34) + 6, b(34) + 20], [1, 1.06, 1], clamp);
  const rescuedV = interpolate(frame, [b(34), b(34) + 45], [6000, 5241.38], clamp);
  const rescued = rescuedV.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const capOp = interpolate(frame, [b(37) + 8, b(37) + 32], [0, 1], clamp);

  const BADGE_CX = 960;
  const BADGE_CY = 180;
  const SEAL_W = 820;
  const SEAL_H = 250;

  return (
    <Atmosphere>
      {/* Comic page: halftone newsprint + a thick ink panel border. */}
      <Halftone opacity={0.06} gap={18} />
      <InkFrame inset={28} width={5} radius={24} opacity={0.85} />

      {/* Short speed-lines radiating from the LIVE seal on its pop. */}
      <SpeedBurst cx={BADGE_CX} cy={BADGE_CY} from={0} count={10} inner={SEAL_W / 2 - 30} spread={116} width={5} opacity={0.42} seed="s6seal" />

      <Pulse sceneStart={S} intensity={0.9} shake={0.55}>
        <AbsoluteFill>
          {/* LIVE badge — a rough starburst SEAL with the sage pulse-dot kept. */}
          <div style={{ position: "absolute", left: BADGE_CX, top: BADGE_CY, width: 0, height: 0 }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: SEAL_W,
                height: SEAL_H,
                transform: `translate(-50%, -50%) scale(${(0.7 + badgeP * 0.3) * drop})`,
                opacity: badgeP,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={SEAL_W} height={SEAL_H} viewBox={`0 0 ${SEAL_W} ${SEAL_H}`} style={{ position: "absolute", inset: 0 }}>
                <Starburst cx={SEAL_W / 2} cy={SEAL_H / 2} rx={378} ry={110} spikes={24} inner={0.84} />
              </svg>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 16, whiteSpace: "nowrap" }}>
                <span style={{ position: "relative", width: 18, height: 18 }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: COLORS.sage, opacity: 0.35 * pulse, transform: `scale(${1 + pulse})` }} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: COLORS.sage, border: `2px solid ${INK}` }} />
                </span>
                <BnbMark size={42} />
                <span style={{ fontFamily: FONT_SANS, fontWeight: 800, fontSize: 30, letterSpacing: "0.13em", textTransform: "uppercase", color: COLORS.sage }}>
                  Live on BSC Testnet
                </span>
              </div>
            </div>
          </div>

          {/* Proof cards — a loose comic-page layout (not a rigid grid), each
              tilted a touch, slamming in one per bar (34–37). Every number,
              address and tx hash is real BSC testnet (chainId 97, every receipt
              status 1): the NEW hashes are the txs of the take recorded for
              this video (user "maya", 0x07dB…C2bE, 2026-09-27); the earlier
              VERIFY-BNB.md smoke-run hashes ride along as a second proof. */}
          <ComicCard landAt={b(34)} left={150} top={340} w={780} h={268} rot={-2.4}>
            <Kicker>Guard rescue · <span style={{ textTransform: "none", letterSpacing: "0.04em" }}>tx 0xc139c19b…1bb0</span></Kicker>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 8 }}>
              <span style={{ ...inkTextStyle(92, COLORS.gold), fontVariantNumeric: "tabular-nums" }}>{rescued}</span>
              <span style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, color: COLORS.text }}>@ 145.0%</span>
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 22, color: COLORS.muted, marginTop: 10 }}>6,000 mUSD loan · 758.62 repaid from the Shadow Vault</div>
            <Mono size={17} color={COLORS.faint}>price → $0.76 tx 0x889c52ff…049f · earlier rescue 0x22f39dad…eaf5</Mono>
          </ComicCard>

          <ComicCard landAt={b(35)} left={1000} top={296} w={760} h={226} rot={2}>
            <Kicker>Solidity · BSC testnet (chain 97)</Kicker>
            <Line>CerminRWA</Line>
            <Mono size={25}>0x8651515462D17b6f4E7AEDe854E4C872C9eB64F2</Mono>
            <Mono size={18} color={COLORS.faint}>mUST 0x3cf6…3fC4 · mUSD 0x11a4…Ef50 · feed 0x76B6…177E</Mono>
          </ComicCard>

          <ComicCard landAt={b(36)} left={200} top={648} w={760} h={220} rot={2.4}>
            <Kicker color={COLORS.sage}>Coupon sweep · <span style={{ textTransform: "none", letterSpacing: "0.04em" }}>tx 0x1a654cbf…473e</span></Kicker>
            <Line>112.50 swept → 5,128.88 @ 148.18%</Line>
            <Mono size={17} color={COLORS.faint}>payCoupon 0x674db91f…5040 · earlier sweep 0x51259d1b…71bc</Mono>
          </ComicCard>

          <ComicCard landAt={b(37)} left={992} top={648} w={760} h={220} rot={-2}>
            <Kicker>Guard Agent · <span style={{ textTransform: "none", letterSpacing: "0.04em" }}>0x5be38f07…0130</span></Kicker>
            <Line>11 txs in this take · all status 1</Line>
            <Mono size={17} color={COLORS.faint}>borrow 0xd9dc058a… 0x1038af25… 0x74da2868… 0xce9e66a7…</Mono>
          </ComicCard>
        </AbsoluteFill>
      </Pulse>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 68 }}>
        <div style={{ opacity: capOp, fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 52, color: COLORS.text }}>
          Not a mockup. Real BSC testnet transactions.
        </div>
      </AbsoluteFill>

      {/* whoosh on entry; click per stat card (bars 34–37); chime on the first. */}
      <Sfx type="whoosh" at={0} volume={0.4} />
      <Sfx type="click" at={b(34)} volume={0.4} />
      <Sfx type="click" at={b(35)} volume={0.4} />
      <Sfx type="click" at={b(36)} volume={0.4} />
      <Sfx type="click" at={b(37)} volume={0.4} />
      <Sfx type="chime" at={b(34)} volume={0.45} />
    </Atmosphere>
  );
};
