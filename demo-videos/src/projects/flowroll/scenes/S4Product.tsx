import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, ComicText, Cursor, fadeUp, Glass, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN, SHOT_W } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Ring, Shot } from "../ui";

/**
 * S4 · PRODUCT (bars 16–21). DROP: hard cut. The REAL Flowroll
 * frontend (next build with .env.bsc-testnet, next start :3280). A read-only
 * injected wallet reports the real smoke-run employer / employee, so every
 * number is a live BSC-testnet read. One screen per bar, camera moves on beats:
 *   16 landing: hero (b1) → "Get Started" clicked on b3
 *   17 Create Payroll Group: name (b1) → 5-minute cycle (b2) → Initialize (b3)
 *   18 group #1 "Testnet Team": 8K payroll (b1) → 5,000 / 3,000 (b2) → DISBURSED (b3)
 *   19 (break) Credit Hub (employee): 1.5% flat fee (b1) → active debt 0.00 (b2) → wallet 6,985 (b3)
 *   20 Liquidity Hub: wallet 6,985 (b1) → claim routing (b2) → pull back (b3)
 */
const W = 1300;
const FX = (1920 - W) / 2;
const FY = 76;
const BAR_H = Math.round(W * 0.032);
const K = (W - 3) / SHOT_W;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });

const P = {
  hero: at(420, 560),
  cta: at(206, 830),
  name: at(960, 538),
  cycle: at(875, 652),
  init: at(1082, 855),
  payroll: at(807, 400),
  team: at(960, 960),
  disbursed: at(1500, 400),
  fee: at(1420, 650),
  debt: at(1540, 320),
  wallet: at(735, 320),
  claimWallet: at(1490, 155),
  engine: at(630, 520),
};
const CENTER = { x: 960, y: 520 };
const SH = BAR_H + (W - 3) * (1200 / 1920);
/** Keep the zoomed view inside the browser frame (no empty canvas at the edges). */
const fit = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey =>
  scale <= 1.001
    ? { frame, x: pt.x, y: pt.y, scale }
    : { frame, x: fit(pt.x, FX + 960 / scale, FX + W - 960 / scale), y: fit(pt.y, FY + 540 / scale, FY + SH - 540 / scale), scale };

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 16

  const SHOTS = [
    { f: 0, src: SCREEN.landing, url: "localhost:3280/", tag: "Flowroll · landing", cap: <>“Payroll that pays for itself.”</> },
    { f: b(k + 1), src: SCREEN.createGroup, url: "localhost:3280/employer", tag: "Employer · create group", cap: <>Name the team, pick the cycle. The smoke run used <b style={{ color: C.gold }}>300 s</b>.</> },
    { f: b(k + 2), src: SCREEN.group, url: "localhost:3280/employer/groups/1", tag: "Employer · group #1", cap: <>Testnet Team: <b style={{ color: C.tealLite }}>5,000 + 3,000 USDC</b>, payday reached, disbursed.</> },
    { f: b(k + 3), src: SCREEN.creditHub, url: "localhost:3280/employee/credit-hub", tag: "Employee · Credit Hub", cap: <>Advance at a flat <b style={{ color: C.gold }}>1.5%</b>. Debt settles itself at payday: <b style={{ color: C.emerald }}>0.00</b>.</> },
    { f: b(k + 4), src: SCREEN.claim, url: "localhost:3280/claim", tag: "Employee · Liquidity Hub", cap: <>Wallet <b style={{ color: C.emerald }}>6,985 USDC</b> = 985 advance + 2,000 faucet + 4,000 salary.</> },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= s.f) shot = s;
  const swapFlash = SHOTS.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.4, 0], clamp)) : m), 0);

  const cam: CamKey[] = [key(0, P.hero, 1.4)];
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 7) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  move(b(k, 1), P.hero, 1.5, 12);
  move(b(k, 2), P.cta, 1.7);
  cut(b(k + 1), CENTER, 1);
  move(b(k + 1, 1), P.name, 1.9);
  move(b(k + 1, 2), P.cycle, 2.0);
  move(b(k + 1, 3), P.init, 1.9);
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), P.payroll, 1.8);
  move(b(k + 2, 2), P.team, 1.45);
  move(b(k + 2, 3), P.disbursed, 1.6);
  cut(b(k + 3), CENTER, 1);
  move(b(k + 3, 1), P.fee, 1.75);
  move(b(k + 3, 2), P.debt, 1.8);
  move(b(k + 3, 3), P.wallet, 1.8);
  cut(b(k + 4), CENTER, 1);
  move(b(k + 4, 1), P.claimWallet, 1.9);
  move(b(k + 4, 2), P.engine, 1.4);
  move(b(k + 4, 3), CENTER, 1, 10);

  const cursor: CursorKey[] = [
    { frame: 0, x: P.cta.x + 220, y: P.cta.y + 90 },
    { frame: b(k, 3) - 6, x: P.cta.x, y: P.cta.y, click: true, clickDelay: 6 },
    { frame: b(k + 1, 1) - 4, x: P.name.x + 40, y: P.name.y + 8 },
    { frame: b(k + 1, 3) - 6, x: P.init.x, y: P.init.y, click: true, clickDelay: 6 },
    { frame: b(k + 2, 2) - 4, x: at(1500, 935).x, y: at(1500, 935).y },
    { frame: b(k + 3, 1) - 4, x: at(1560, 650).x, y: at(1560, 650).y },
    { frame: b(k + 4, 2) - 4, x: at(760, 990).x, y: at(760, 990).y },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(124,58,237,0.24)" glowB="rgba(20,184,166,0.12)" glow="top" floor={0.3} grid={0.4} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url={shot.url}>
              <Ring x={1435} y={650} w={560} h={120} k={K} from={b(k + 3, 1)} to={b(k + 3, 2)} color={C.gold} />
              <Ring x={1535} y={318} w={360} h={130} k={K} from={b(k + 3, 2)} to={b(k + 3, 3)} color={C.emerald} />
              <Ring x={735} y={318} w={360} h={130} k={K} from={b(k + 3, 3)} to={b(k + 4)} color={C.emerald} />
              <Ring x={1490} y={155} w={420} h={120} k={K} from={b(k + 4, 1)} to={b(k + 4, 2)} color={C.emerald} />
              <Ring x={1638} y={238} w={160} h={50} k={K} from={b(k + 2, 3)} to={b(k + 3)} color={C.emerald} />
              <Ring x={1500} y={985} w={260} h={220} k={K} from={b(k + 2, 2)} to={b(k + 2, 3)} color={C.tealLite} />
            </Shot>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} rippleColor={C.violetLite} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: 60, top: 40 }}>
        <RealTag at={0} label={`${shot.tag} · live BSC-testnet reads`} />
      </div>

      <div key={shot.f} style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", ...fadeUp(frame, shot.f, 8, 18) }}>
        <Glass radius={18} glow={0.3} glowColor="rgba(124,58,237,0.35)" fill="rgba(10,15,28,0.95)" innerStyle={{ padding: "16px 30px" }}>
          <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 34, color: C.text, whiteSpace: "nowrap" }}>{shot.cap}</div>
        </Glass>
      </div>

      <ComicText text="LET'S GO!" from={b(k, 3)} x={1560} y={250} size={96} rotate={-6} fill={C.gold} variant="onomatopoeia" echoColor={C.violet} exitAt={b(k + 1) - 2} />
      <ComicText text="DISBURSED!" from={b(k + 2, 3)} x={1500} y={250} size={100} rotate={-6} fill={C.emerald} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />
      <ComicText text="DEBT: 0!" from={b(k + 3, 2)} x={1540} y={800} size={100} rotate={5} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 4) - 2} />
      <ComicText text="6,985!" from={b(k + 4, 1)} x={1400} y={760} size={120} rotate={-5} fill={C.emerald} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 5) - 4} />

      <InkFrame inset={22} width={4} opacity={0.55} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      {[1, 2, 3, 4].map((i) => (
        <Sfx key={`w${i}`} name="whoosh" at={b(k + i)} volume={0.35} />
      ))}
      {[1, 2].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k + 1, i)} volume={0.45} />
      ))}
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.45} />
      <Sfx name="impact" at={b(k + 2, 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.45} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.6} />
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.5} />
    </AbsoluteFill>
  );
};
