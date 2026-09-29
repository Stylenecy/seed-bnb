import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Camera,
  clamp,
  CoinDot,
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
import { C, F, SCREEN } from "../theme";
import { BAR } from "../timeline";

/**
 * S4 · PRODUCT (bars 16–23) — the REAL Liber frontend (next build, chain 97,
 * MockUSDC 0x2116…cC97, real backend + throwaway Postgres), 430×932 @2x.
 *   16  DROP onboarding — cursor taps "Create New Wallet" on b3
 *   17  awaiting funding (backend 202) — zoom on "0.001 BNB"
 *   18  home — connected smoke wallet, 995 USDC read live
 *   19  (break) scan QRIS → Rp 45,000 ≈ 2.53 USDC live quote
 *   20  DROP profile: Kolo address + 5 USDC → tap "Top Up Kolo" on b3 ("TOPPED UP!")
 *   21  history — the Kolo top-up with its real tx hash
 *   22  on-chain result card (from VERIFY-BNB.md)
 */
const PHONE_W = 440;
const PHONE_X = 300;
const PHONE_Y = 80;
const BEZEL = Math.round(PHONE_W * 0.035);
const SCR_W = PHONE_W - BEZEL * 2 - 3;
const S = SCR_W / 860;
const OX = PHONE_X + 1.5 + BEZEL;
const OY = PHONE_Y + 1.5 + BEZEL;
const at = (sx: number, sy: number) => ({ x: OX + sx * S, y: OY + sy * S });

const P = {
  create: at(430, 884),
  bnb: at(430, 700),
  address: at(430, 1260),
  balance: at(220, 300),
  quote: at(240, 330),
  gopay: at(430, 564),
  kolo: at(380, 1120),
  topup: at(430, 1343),
  txRow: at(330, 600),
};

const camAt = (frame: number, pt: { x: number; y: number }, scale: number, sx = 600, sy = 540): CamKey => ({
  frame,
  x: pt.x + (960 - sx) / scale,
  y: pt.y + (540 - sy) / scale,
  scale,
});

const Ring: React.FC<{ pt: { x: number; y: number }; w: number; h: number; from: number; to: number; color: string }> = ({ pt, w, h, from, to, color }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: pt.x - w / 2,
        top: pt.y - h / 2,
        width: w,
        height: h,
        borderRadius: 12,
        border: `3px solid ${color}`,
        boxShadow: `0 0 24px ${color}`,
        transform: `scale(${interpolate(frame, [from, from + 6], [1.4, 1], clamp)})`,
        opacity: interpolate(frame, [from, from + 4], [0, 1], clamp),
      }}
    />
  );
};

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 16

  const SHOTS = [
    { bar: k, src: SCREEN.onboarding },
    { bar: k + 1, src: SCREEN.awaiting },
    { bar: k + 2, src: SCREEN.home },
    { bar: k + 3, src: SCREEN.quote },
    { bar: k + 4, src: SCREEN.topup },
    { bar: k + 5, src: SCREEN.history },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= b(s.bar)) shot = s;
  const swapFlash = SHOTS.slice(1).reduce(
    (m, s) => (frame >= b(s.bar) ? Math.max(m, interpolate(frame, [b(s.bar), b(s.bar) + 3], [0.55, 0], clamp)) : m),
    0,
  );

  const center = { x: 960, y: 540 };
  const cam: CamKey[] = [
    { frame: 0, ...center, scale: 1 },
    { frame: b(k, 2), ...center, scale: 1 },
    camAt(b(k, 3), P.create, 1.15, 600, 600),
    { frame: b(k + 1), ...center, scale: 1 },
    camAt(b(k + 1, 1), P.bnb, 1.45, 560, 480),
    camAt(b(k + 1, 3), P.address, 1.35, 560, 560),
    camAt(b(k + 2), P.balance, 1.4, 540, 440),
    camAt(b(k + 2, 3), P.balance, 1.45, 540, 440),
    { frame: b(k + 3), ...center, scale: 1 },
    camAt(b(k + 3, 1), P.quote, 1.5, 600, 440),
    camAt(b(k + 3, 3), P.gopay, 1.35, 600, 540),
    camAt(b(k + 4), P.kolo, 1.35, 560, 500),
    camAt(b(k + 4, 2), P.topup, 1.4, 560, 560),
    camAt(b(k + 4, 3), P.topup, 1.4, 560, 560),
    { frame: b(k + 5), ...center, scale: 1 },
    camAt(b(k + 5, 1), P.txRow, 1.5, 600, 540),
    camAt(b(k + 5, 3), P.txRow, 1.5, 600, 540),
    { frame: b(k + 6), ...center, scale: 1 },
  ];

  const cursor: CursorKey[] = [
    { frame: 0, x: 900, y: 760 },
    { frame: b(k, 2) - 4, x: P.create.x + 30, y: P.create.y + 6, click: true, clickDelay: b(k, 3) - (b(k, 2) - 4) },
    { frame: b(k + 1, 1), x: P.bnb.x + 140, y: P.bnb.y + 30 },
    { frame: b(k + 2, 1), x: P.balance.x + 160, y: P.balance.y + 60 },
    { frame: b(k + 3, 2) - 4, x: P.gopay.x, y: P.gopay.y, click: true, clickDelay: b(k + 3, 3) - (b(k + 3, 2) - 4) },
    { frame: b(k + 4, 1), x: P.topup.x, y: P.topup.y, click: true, clickDelay: b(k + 4, 3) - b(k + 4, 1) },
    { frame: b(k + 5, 1), x: P.txRow.x + 40, y: P.txRow.y + 30 },
  ];

  const COPY: { from: number; to: number; kicker: string; head: React.ReactNode; sub?: string }[] = [
    { from: b(k), to: b(k + 1), kicker: "01 · Onboard", head: <>One tap, <i style={{ color: C.bright }}>your keys</i></>, sub: "An EVM keypair is made and kept on the device. The server never sees it." },
    { from: b(k + 1), to: b(k + 2), kicker: "02 · Activate", head: <>Send <i style={{ color: "#F0B90B" }}>0.001 BNB</i> for gas</>, sub: "Until the wallet has gas, the backend answers 202 awaiting_funding." },
    { from: b(k + 2), to: b(k + 3), kicker: "03 · Balance", head: <><i style={{ color: C.bright }}>995 USDC</i>, read live</>, sub: "The smoke-test wallet. balanceOf on the testnet MockUSDC." },
    { from: b(k + 3), to: b(k + 4), kicker: "04 · Scan", head: <>Rp 45,000 ≈ <i style={{ color: C.gold }}>2.53 USDC</i></>, sub: "Scan the QRIS and get a live quote, valid for 30 s." },
    { from: b(k + 4), to: b(k + 5), kicker: "05 · Top up Kolo", head: <>5 USDC <i style={{ color: C.bright }}>to your card</i></>, sub: "One BEP-20 transfer, signed on the device. No trustline, no memo." },
    { from: b(k + 5), to: b(k + 6), kicker: "06 · History", head: <>Every top-up <i style={{ color: C.gold }}>links to BscScan</i></>, sub: "Scans and top-ups are logged by the backend." },
  ];
  const resultAt = b(k + 6);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(47,217,138,0.18)" glowB="rgba(231,163,58,0.16)" glow="left" floor={0.4} />
      <Halftone opacity={0.04} gap={20} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.5} shake={0} glow={false}>
          <AbsoluteFill>
            <div style={{ position: "absolute", left: PHONE_X, top: PHONE_Y }}>
              <PhoneFrame src={shot.src} width={PHONE_W} glow={0.55} glowColor="rgba(47,217,138,0.35)">
                <AbsoluteFill style={{ background: "#fff", opacity: swapFlash }} />
              </PhoneFrame>
            </div>
            <Ring pt={P.bnb} w={330} h={50} from={b(k + 1, 1)} to={b(k + 1, 3)} color="#F0B90B" />
            <Ring pt={at(215, 295)} w={160} h={70} from={b(k + 2, 1)} to={b(k + 3)} color={C.bright} />
            <Ring pt={at(160, 370)} w={120} h={36} from={b(k + 3, 1)} to={b(k + 3, 3)} color={C.gold} />
            <Ring pt={at(335, 655)} w={170} h={34} from={b(k + 5, 1)} to={b(k + 6)} color={C.bright} />

            {frame >= b(k + 4, 3) && frame < b(k + 5)
              ? (() => {
                  const t = interpolate(frame, [b(k + 4, 3), b(k + 5)], [0, 1], clamp);
                  return (
                    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                      <CoinDot cx={P.topup.x + t * 700} cy={P.topup.y - Math.sin(t * Math.PI) * 300} r={34 - t * 8} label="5" rotate={t * 360} opacity={1 - t * 0.3} />
                    </svg>
                  );
                })()
              : null}

            <Cursor keyframes={cursor} size={38} hideAfter={b(k + 6)} />
          </AbsoluteFill>
        </Pulse>
      </Camera>

      <div style={{ position: "absolute", left: 1080, top: 150, fontFamily: F.sans, fontWeight: 700, fontSize: 20, letterSpacing: "0.2em", color: C.dim, opacity: frame < resultAt ? 1 : 0 }}>
        REAL APP · BSC TESTNET BUILD
      </div>
      {COPY.map((c, i) =>
        frame >= c.from && frame < c.to ? (
          <div key={i} style={{ position: "absolute", left: 1080, top: 330, width: 760, ...fadeUp(frame, c.from, 10, 30) }}>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold }}>{c.kicker}</div>
            <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 84, lineHeight: 1.02, color: C.text, marginTop: 14, letterSpacing: "-0.01em" }}>{c.head}</div>
            {c.sub ? <div style={{ fontFamily: F.sans, fontSize: 30, color: C.dim, marginTop: 20, lineHeight: 1.35 }}>{c.sub}</div> : null}
          </div>
        ) : null,
      )}

      <ComicText text="202!" from={b(k + 1, 2)} x={1380} y={770} size={120} rotate={-6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2) - 4} />
      <ComicText text="995!" from={b(k + 2, 1)} x={1380} y={770} size={130} rotate={5} fill={C.bright} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 4} />
      <ComicText text="BEEP!" from={b(k + 3)} x={1400} y={770} size={120} rotate={-5} fill="#fff" variant="onomatopoeia" echoColor={C.rose} exitAt={b(k + 4) - 4} />
      <SpeedBurst cx={1400} cy={560} from={b(k + 4, 3)} count={16} inner={120} spread={360} color={C.bright} opacity={0.55} seed="topup" fade />
      <ComicText text="TOPPED UP!" from={b(k + 4, 3)} x={1420} y={800} size={120} rotate={-7} skewX={-6} fill={C.gold} variant="onomatopoeia" echoColor={C.emerald} exitAt={b(k + 5) + 8} />

      <ComicText text="ON-CHAIN!" from={b(k + 6, 2)} x={1460} y={800} size={120} rotate={-5} fill={C.bright} variant="onomatopoeia" echoColor={INK} />
      {frame >= resultAt ? (
        <div style={{ position: "absolute", left: 1060, top: 280, width: 790, ...fadeUp(frame, resultAt, 10, 40) }}>
          <Glass radius={26} glow={0.5} glowColor="rgba(47,217,138,0.35)" fill="rgba(8,20,16,0.88)" innerStyle={{ padding: "30px 36px" }}>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 20, letterSpacing: "0.22em", color: C.bright }}>ON-CHAIN RESULT · BSC TESTNET</div>
            <div style={{ fontFamily: F.display, fontSize: 56, color: C.text, marginTop: 12, whiteSpace: "nowrap" }}>
              5 USDC <span style={{ color: C.bright, fontStyle: "italic" }}>→ Kolo address</span>
            </div>
            {[
              <>ERC-20 <span style={{ fontFamily: F.mono, color: C.text }}>transfer</span> · status 1</>,
              <>balances after: <span style={{ color: C.text }}>995 / 5</span></>,
              <>tx <span style={{ fontFamily: F.mono, color: C.text }}>0xe0a9a6b7…06b4</span></>,
            ].map((line, i) => (
              <div key={i} style={{ fontFamily: F.sans, fontSize: 30, color: C.dim, marginTop: i === 0 ? 18 : 8, ...fadeUp(frame, resultAt + 4 + i * 4, 10, 12) }}>
                <span style={{ color: C.bright }}>✓ </span>
                {line}
              </div>
            ))}
            <div style={{ fontFamily: F.sans, fontSize: 20, color: "rgba(238,243,238,0.4)", marginTop: 16 }}>
              smoke run sent with cast · 0x…dEaD stands in for the Kolo address
            </div>
          </Glass>
        </div>
      ) : null}

      <Sfx name="tick" at={b(k, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.45} />
      <Sfx name="chime" at={b(k + 2, 1)} volume={0.55} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.45} />
      <Sfx name="tick" at={b(k + 3, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 4)} volume={0.45} />
      <Sfx name="tick" at={b(k + 4, 3)} volume={0.7} />
      <Sfx name="impact" at={b(k + 4, 3)} volume={0.8} />
      <Sfx name="whoosh" at={b(k + 5)} volume={0.45} />
      <Sfx name="tick" at={b(k + 5, 1)} volume={0.6} />
      <Sfx name="chime" at={b(k + 6)} volume={0.6} />
      <Sfx name="impact" at={b(k + 6, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
