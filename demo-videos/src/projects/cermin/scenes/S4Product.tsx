import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BrowserFrame,
  Camera,
  clamp,
  ComicText,
  Cursor,
  fadeUp,
  Glass,
  Halftone,
  INK,
  PhoneFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  useSceneClock,
} from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, CHAIN, F, SCREEN, short } from "../theme";
import { BAR } from "../timeline";
import { Copy, RealTag, TxChip } from "../ui";

/**
 * S4 · PRODUCT (bars 16–24) — the REAL Cermin frontend (next build with
 * .env.bsc-testnet, next start :3195), captured headless. Landing + connect
 * on desktop, the 5-step onboarding on mobile (430×932 @2x). Per bar:
 *   16 landing                         17 connect modal (cursor on b2)
 *   18 deposit: tap 0.07 b1, Continue b3   19 goal: tap Forever Allowance b1, Continue b3
 *   20 risk: tap Balanced b1, Continue b3  21 preview: zoom on $1,575 b1, Create vault b3
 *   22 confirm: tap Sign on b2            23 the LIVE testnet createVault result (live.mjs run)
 */
const BROWSER_W = 1000;
const BX = 70;
const BY = 200;
const BAR_H = Math.round(BROWSER_W * 0.032);
const bAt = (sx: number, sy: number) => ({ x: BX + 1.5 + (sx * (BROWSER_W - 3)) / 1920, y: BY + 1.5 + BAR_H + (sy * (BROWSER_W - 3)) / 1920 });

const PHONE_W = 440;
const PHONE_X = 520;
const PHONE_Y = 70;
const BEZEL = Math.round(PHONE_W * 0.035);
const SCR_W = PHONE_W - BEZEL * 2 - 3;
const S = SCR_W / 860;
const pAt = (sx: number, sy: number) => ({ x: PHONE_X + 1.5 + BEZEL + sx * S, y: PHONE_Y + 1.5 + BEZEL + sy * S });

const P = {
  metamask: bAt(700, 538),
  chip007: pAt(160, 1064),
  cont1: pAt(430, 1500),
  forever: pAt(430, 790),
  cont2: pAt(430, 1329),
  balanced: pAt(430, 1045),
  cont3: pAt(430, 1547),
  spendable: pAt(250, 1040),
  create: pAt(430, 1565),
  sign: pAt(430, 1143),
};

const camAt = (frame: number, pt: { x: number; y: number }, scale: number, sx = 600, sy = 540): CamKey => ({
  frame,
  x: pt.x + (960 - sx) / scale,
  y: pt.y + (540 - sy) / scale,
  scale,
});

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b } = useSceneClock();
  const k = BAR.product; // 16

  // Which phone screen is showing (swaps on the beats the taps land on).
  const PHONE: { at: number; src: string }[] = [
    { at: b(k + 2), src: staticFile("cermin/m/03-onb-deposit-empty.png") },
    { at: b(k + 2, 1), src: SCREEN.deposit },
    { at: b(k + 3), src: staticFile("cermin/m/05-onb-goal-empty.png") },
    { at: b(k + 3, 1), src: SCREEN.goal },
    { at: b(k + 4), src: staticFile("cermin/m/07-onb-risk-empty.png") },
    { at: b(k + 4, 1), src: SCREEN.risk },
    { at: b(k + 5), src: SCREEN.preview },
    { at: b(k + 6), src: SCREEN.confirm },
  ];
  let phoneSrc = PHONE[0]!.src;
  for (const s of PHONE) if (frame >= s.at) phoneSrc = s.src;
  const swapFlash = [b(k + 3), b(k + 4), b(k + 5), b(k + 6)].reduce(
    (m, at) => (frame >= at ? Math.max(m, interpolate(frame, [at, at + 3], [0.5, 0], clamp)) : m),
    0,
  );

  const phoneIn = spring({ frame: frame - b(k + 2), fps, config: { damping: 14, stiffness: 150, mass: 0.8 } });
  const browserOut = interpolate(frame, [b(k + 2) - 4, b(k + 2) + 4], [1, 0], clamp);
  const showPhone = frame >= b(k + 2) - 2;
  const browserSrc = frame < b(k + 1) ? SCREEN.landing : SCREEN.modal;

  const center = { x: 960, y: 540 };
  const cam: CamKey[] = [
    { frame: 0, ...center, scale: 1 },
    { frame: b(k, 3), x: 980, y: 540, scale: 1.04 },
    { frame: b(k + 1), ...center, scale: 1 },
    camAt(b(k + 1, 2), P.metamask, 1.12, 620, 560),
    { frame: b(k + 2), ...center, scale: 1 },
    { frame: b(k + 5), ...center, scale: 1 },
    camAt(b(k + 5, 1), P.spendable, 1.45, 560, 520),
    camAt(b(k + 5, 2), P.spendable, 1.45, 560, 520),
    { frame: b(k + 5, 3), ...center, scale: 1 },
    { frame: b(k + 6, 1), ...center, scale: 1 },
    camAt(b(k + 6, 2), P.sign, 1.2, 600, 600),
    { frame: b(k + 7), ...center, scale: 1 },
  ];

  const cursor: CursorKey[] = [
    { frame: 0, x: 780, y: 900 },
    { frame: b(k, 2), x: bAt(960, 488).x, y: bAt(960, 488).y },
    { frame: b(k + 1, 1), x: P.metamask.x + 30, y: P.metamask.y - 4 },
    { frame: b(k + 2) - 2, x: P.chip007.x + 60, y: P.chip007.y + 60 },
    { frame: b(k + 2, 1) - 5, x: P.chip007.x, y: P.chip007.y, click: true, clickDelay: 5 },
    { frame: b(k + 2, 3) - 5, x: P.cont1.x, y: P.cont1.y, click: true, clickDelay: 5 },
    { frame: b(k + 3, 1) - 5, x: P.forever.x, y: P.forever.y, click: true, clickDelay: 5 },
    { frame: b(k + 3, 3) - 5, x: P.cont2.x, y: P.cont2.y, click: true, clickDelay: 5 },
    { frame: b(k + 4, 1) - 5, x: P.balanced.x, y: P.balanced.y, click: true, clickDelay: 5 },
    { frame: b(k + 4, 3) - 5, x: P.cont3.x, y: P.cont3.y, click: true, clickDelay: 5 },
    { frame: b(k + 5, 1), x: P.spendable.x + 80, y: P.spendable.y + 40 },
    { frame: b(k + 5, 3) - 5, x: P.create.x, y: P.create.y, click: true, clickDelay: 5 },
    { frame: b(k + 6, 2) - 5, x: P.sign.x, y: P.sign.y, click: true, clickDelay: 5 },
  ];

  const COPY: { from: number; to: number; kicker: string; head: React.ReactNode; sub?: React.ReactNode }[] = [
    { from: b(k), to: b(k + 1), kicker: "01 · The app", head: <>Your BNB stays <i style={{ color: C.amberHi }}>whole</i>.</>, sub: "The real Cermin frontend, running against BSC testnet." },
    { from: b(k + 1), to: b(k + 2), kicker: "02 · Connect", head: <>Any <i style={{ color: "#F0B90B" }}>BNB Chain</i> wallet</>, sub: "RainbowKit · BNB Smart Chain Testnet · chainId 97" },
    { from: b(k + 2), to: b(k + 3), kicker: "03 · Deposit", head: <>Vault <i style={{ color: "#F0B90B" }}>0.07 BNB</i></>, sub: "≈ $6,300 at the testnet feed's $90,000/BNB (a mock price)." },
    { from: b(k + 3), to: b(k + 4), kicker: "04 · Goal", head: <>A forever <i style={{ color: C.amberHi }}>allowance</i></>, sub: "Or spend now, reclaim later. Same vault underneath." },
    { from: b(k + 4), to: b(k + 5), kicker: "05 · Strategy", head: <><i style={{ color: C.amberHi }}>Balanced</i> · 50% LTV</>, sub: "~30% drop tolerance before defense kicks in." },
    { from: b(k + 5), to: b(k + 6), kicker: "06 · Preview", head: <><i style={{ color: C.successHi }}>$1,575</i> to spend today</>, sub: "3,150 MUSD borrowed. Half goes to the sMUSD savings vault." },
    { from: b(k + 6), to: b(k + 7), kicker: "07 · Sign", head: <>One transaction. <i style={{ color: "#F0B90B" }}>Done.</i></>, sub: "createVault opens the CDP position and borrows in one call." },
  ];

  const resultAt = b(k + 7);

  return (
    <AbsoluteFill>
      <PremiumBg base="#110e0b" glowA="rgba(199,122,58,0.2)" glowB="rgba(240,185,11,0.14)" glow="left" floor={0.4} />
      <Halftone opacity={0.04} gap={20} color={C.amberHi} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.5} shake={0} glow={false}>
          <AbsoluteFill>
            {browserOut > 0 ? (
              <div style={{ position: "absolute", left: BX, top: BY, opacity: browserOut, transform: `translateY(${(1 - browserOut) * -40}px)` }}>
                <BrowserFrame src={browserSrc} width={BROWSER_W} aspect={1200 / 1920} url="localhost:3195 · Cermin" glow={0.45} glowColor="rgba(199,122,58,0.4)" />
              </div>
            ) : null}
            {showPhone ? (
              <div style={{ position: "absolute", left: PHONE_X, top: PHONE_Y, transform: `translateY(${(1 - phoneIn) * 700}px) rotate(${(1 - phoneIn) * 6}deg)` }}>
                <PhoneFrame src={phoneSrc} width={PHONE_W} glow={0.55} glowColor="rgba(240,185,11,0.3)">
                  <AbsoluteFill style={{ background: "#fff", opacity: swapFlash }} />
                </PhoneFrame>
              </div>
            ) : null}
            {/* spendable highlight on the preview (bar 21) */}
            {frame >= b(k + 5, 1) && frame < b(k + 6) ? (
              <div
                style={{
                  position: "absolute",
                  left: pAt(92, 945).x,
                  top: pAt(92, 945).y,
                  width: 330 * S,
                  height: 200 * S,
                  borderRadius: 12,
                  border: `3px solid ${C.successHi}`,
                  boxShadow: `0 0 24px ${C.successHi}`,
                  transform: `scale(${interpolate(frame, [b(k + 5, 1), b(k + 5, 1) + 6], [1.4, 1], clamp)})`,
                }}
              />
            ) : null}
            <Cursor keyframes={cursor} size={38} hideAfter={b(k + 7)} />
          </AbsoluteFill>
        </Pulse>
      </Camera>

      <div style={{ position: "absolute", left: 1120, top: 236 }}>
        <RealTag>{frame < b(k + 2) ? "REAL APP · next start · BSC testnet addresses" : "REAL APP · mobile onboarding · live testnet reads"}</RealTag>
      </div>

      {COPY.map((c, i) =>
        frame >= c.from && frame < c.to ? (
          <div key={i} style={{ position: "absolute", left: 1120, top: 330, width: 730, ...fadeUp(frame, c.from, 10, 30) }}>
            <Copy kicker={c.kicker} head={c.head} sub={c.sub} />
          </div>
        ) : null,
      )}

      <ComicText text="TAP!" from={b(k + 2, 1)} x={1000} y={640} size={92} rotate={-8} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />
      <ComicText text="SIGN ONCE!" from={b(k + 6, 2)} x={1420} y={800} size={104} rotate={-5} fill="#F0B90B" variant="onomatopoeia" echoColor={C.amber} exitAt={b(k + 7) - 2} />

      {/* Bar 23: the LIVE BSC-testnet result of this call, signed through the UI (2026-09-27). */}
      {frame >= resultAt ? (
        <div style={{ position: "absolute", left: 1060, top: 250, width: 800, ...fadeUp(frame, resultAt, 10, 40) }}>
          <Glass radius={26} glow={0.5} glowColor="rgba(240,185,11,0.35)" fill="rgba(20,16,12,0.9)" innerStyle={{ padding: "30px 36px" }}>
            <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 20, letterSpacing: "0.22em", color: "#F0B90B" }}>ON-CHAIN RESULT · REAL BSC TESTNET</div>
            <div style={{ fontFamily: F.display, fontSize: 60, color: C.text, marginTop: 12, whiteSpace: "nowrap" }}>
              0.04 tBNB → <span style={{ color: C.successHi }}>2,400 MUSD</span>
            </div>
            {[
              <>ICR 200% · 1,200 spendable / 1,200 in the vault</>,
              <>collateral is native BNB (msg.value)</>,
              <>vault <span style={{ fontFamily: F.mono, color: C.text }}>{short(CHAIN.liveVault, 6, 4)}</span> from CerminFactory</>,
            ].map((line, i) => (
              <div key={i} style={{ fontFamily: F.sans, fontSize: 28, color: C.textDim, marginTop: i === 0 ? 18 : 8, ...fadeUp(frame, resultAt + 4 + i * 4, 10, 12) }}>
                <span style={{ color: C.successHi }}>✓ </span>
                {line}
              </div>
            ))}
          </Glass>
          <div style={{ marginTop: 22 }}>
            <TxChip label="createVault" hash={CHAIN.tx.open} at={b(k + 7, 1)} />
          </div>
        </div>
      ) : null}
      <SpeedBurst cx={1460} cy={860} from={b(k + 7, 2)} count={14} inner={110} spread={300} color="#F0B90B" opacity={0.5} seed="open" fade />
      <ComicText text="OPENED!" from={b(k + 7, 2)} x={1460} y={880} size={130} rotate={-6} fill="#F0B90B" variant="onomatopoeia" echoColor={C.amber} />

      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.5} />
      {[2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <Sfx name="tick" at={b(k + i, 1)} volume={0.7} />
          <Sfx name="tick" at={b(k + i, 3)} volume={0.6} />
        </React.Fragment>
      ))}
      <Sfx name="impact" at={b(k + 5, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 5, 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 6, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k + 6, 2)} volume={0.6} />
      <Sfx name="chime" at={b(k + 7)} volume={0.6} />
      <Sfx name="impact" at={b(k + 7, 2)} volume={0.7} />
    </AbsoluteFill>
  );
};
