import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { IdCard, Receipt } from "../art";
import { C, CHAIN, F, short } from "../theme";
import { BAR } from "../timeline";
import { Terminal } from "../ui";
import type { TermLine } from "../ui";

/**
 * S5 · THE LIVE RUNS (bars 28–32). VERIFY-BNB.md "Live smoke (both scripts PASS)"
 * on real BSC testnet, one step per bar:
 *   28 bnb_smoke_test.py registers ERC-8004 agent #1 (tx 0xa2fb…)      "REGISTERED!"
 *   29 reads back owner/URI/metadata, record_now → trade #1 pnl 150 bps (tx 0x74fe…)
 *   30 runtime_mirror_smoke.py: RiskManager → _enqueue_bnb_mirror → flush → trade #2 pnl 75 bps (tx 0xb50a…)
 *   31 (dip) "RECEIPTS." — both on-chain
 */
export const S5Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.smoke; // 28

  const L: TermLine[] = [
    { at: b(k), txt: "$ python scripts/bnb_smoke_test.py", col: C.gold, bold: true },
    { at: b(k, 1), txt: `connected · chain 97 · signer ${short(CHAIN.owner)}`, col: C.textMuted },
    { at: b(k, 2), txt: "IdentityRegistry.register(uri, metadata) → #1", col: C.text },
    { at: b(k, 3), txt: `  tx ${short(CHAIN.tx.register, 10, 6)}  status 1`, col: C.pos },
    { at: b(k + 1), txt: "ownerOf(1) ✓   tokenURI(1) ✓   getMetadata ✓", col: C.textMuted },
    { at: b(k + 1, 1), txt: "journal.record_now(pnl_bps=150)", col: C.text },
    { at: b(k + 1, 2), txt: `  tx ${short(CHAIN.tx.trade1, 10, 6)}  trade #1  +150 bps`, col: C.pos },
    { at: b(k + 2), txt: "$ python scripts/runtime_mirror_smoke.py", col: C.gold, bold: true },
    { at: b(k + 2, 1), txt: "RiskManager → _enqueue_bnb_mirror → flush", col: C.text },
    { at: b(k + 2, 2), txt: `  tx ${short(CHAIN.tx.trade2, 10, 6)}  trade #2  +75 bps`, col: C.pos },
    { at: b(k + 3), txt: "PASS · PASS", col: C.pos, bold: true },
  ];

  const pop = (t: number) => spring({ frame: frame - t, fps, config: { damping: 11, stiffness: 200, mass: 0.6 } });
  const pId = pop(b(k, 2));
  const pR1 = pop(b(k + 1, 2));
  const pR2 = pop(b(k + 2, 2));
  const punchAll = useBeatPunch(beatsIn(k, k + 3), 0.015, 5);
  const dip = interpolate(frame, [b(k + 3), b(k + 3) + 5], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(105,147,120,0.28)" glowB="rgba(240,185,11,0.14)" glow="left" floor={0.35} grid={0.5} />
      <Halftone opacity={0.035} gap={22} />

      <div style={{ position: "absolute", left: 90, top: 58, display: "flex", alignItems: "center", gap: 24 }}>
        <BnbBadge label="LIVE ON BSC TESTNET" at={0} size={30} live variant="dark" />
        <span style={{ fontFamily: F.mono, fontSize: 24, color: C.textMuted }}>both smoke scripts · real chain 97</span>
      </div>

      <Pulse intensity={0.55} shake={0.25} glow={false}>
        <div style={{ position: "absolute", left: 90, top: 150, transform: `scale(${punchAll})`, transformOrigin: "left top" }}>
          <Terminal title="BridgeAgent/bridgeagent · python 3.12 · BRIDGEAGENT_ENV_FILE=.env.bsc-testnet" lines={L} w={1060} minH={700} size={25} />
        </div>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {frame >= b(k, 2) ? <IdCard x={1500} y={interpolate(pId, [0, 1], [-160, 270])} s={1.25} rot={(1 - pId) * 30 - 4} shine={interpolate(frame, [b(k, 3), b(k + 1)], [0, 1], clamp)} /> : null}
          {frame >= b(k + 1, 2) ? <Receipt x={1370} y={interpolate(pR1, [0, 1], [1300, 640])} s={1.0} rot={-7} lines={["TRADE #1", "agent #1", short(CHAIN.tradeHash.t1, 8, 4)]} big="+150 bps" /> : null}
          {frame >= b(k + 2, 2) ? <Receipt x={1650} y={interpolate(pR2, [0, 1], [1300, 660])} s={1.0} rot={6} lines={["TRADE #2", "agent #1", short(CHAIN.tradeHash.t2, 8, 4)]} big="+75 bps" /> : null}
        </svg>
        {frame >= b(k + 2, 2) ? (
          <div style={{ position: "absolute", left: 1250, top: 860, width: 560, fontFamily: F.mono, fontSize: 19, lineHeight: 1.4, color: C.textMuted, textAlign: "center", opacity: interpolate(frame, [b(k + 2, 3), b(k + 2, 3) + 6], [0, 1], clamp) }}>
            trade #2 = a synthetic settled trade fed through the real RiskManager mirror path (venue client mocked)
          </div>
        ) : null}
      </Pulse>

      <ComicText text="REGISTERED!" from={b(k, 3)} x={1500} y={520} size={100} rotate={-6} fill={C.pos} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 2) - 2} />
      <ComicText text="+150 BPS!" from={b(k + 1, 3)} x={1520} y={432} size={88} rotate={5} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2, 3) - 2} />
      <ComicText text="MIRRORED!" from={b(k + 2, 3)} x={1520} y={432} size={88} rotate={-5} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />

      <AbsoluteFill style={{ background: "rgba(6,12,9,0.78)", opacity: dip }} />
      <SpeedBurst cx={960} cy={470} from={b(k + 3)} count={20} inner={240} spread={620} color={C.gold} opacity={0.45} width={7} seed="rcpt" fade />
      <ComicText text="RECEIPTS." from={b(k + 3)} x={960} y={460} size={250} rotate={-5} skewX={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} />
      <ComicText text="2 trades · on-chain · signed by agent #1" from={b(k + 3, 2)} x={960} y={700} size={70} rotate={-1.5} fill={C.mossSoft} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      {[0, 1, 2].map((bar) => [0, 1, 2, 3].map((bt) => <Sfx key={`${bar}${bt}`} name="tick" at={b(k + bar, bt)} volume={0.4} />))}
      <Sfx name="impact" at={b(k, 2)} volume={0.7} />
      <Sfx name="impact" at={b(k, 3)} volume={0.7} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      <Sfx name="chime" at={b(k + 1, 3)} volume={0.45} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.7} />
      <Sfx name="chime" at={b(k + 2, 3)} volume={0.45} />
      <Sfx name="impact" at={b(k + 3)} volume={0.9} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
