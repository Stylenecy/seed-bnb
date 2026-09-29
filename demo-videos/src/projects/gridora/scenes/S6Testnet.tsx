import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Glass, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { HashSeal, JournalBook, SoulCard } from "../art";
import { AGENT, C, F, short, TESTNET } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · THE TESTNET RUN (bars 24–28, DROP). The four agent txs the Gridora wallet sent to
 * its BSC-testnet contracts (found by nonce bisection, calldata decoded with cast; all status 1):
 *   24 register("ipfs://gridora-agent.json", agent) → agent #1 (soulbound)        "MINTED!"
 *   25 StrategyLedger.commit(instanceId, configHash)                               "COMMITTED!"
 *   26 TradeJournal.record(1, tradeHash, +85 bps, closedAt)                        "+85 BPS!"
 *   27 (break) StrategyLedger.attest(instanceId, outcomeHash) → isAttested = true  "CAN'T BACKDATE."
 */
const fmt = (n: number) => n.toLocaleString("en-US");

type Row = { bar: number; fn: string; args: string; tx: string; block: number; gas: number; out: string; col: string };

export const S6Testnet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.testnet; // 24

  const ROWS: Row[] = [
    { bar: k, fn: "IdentityRegistry.register", args: `"${TESTNET.uri}", ${short(AGENT)}`, tx: TESTNET.tx.register, block: TESTNET.block.register, gas: TESTNET.gas.register, out: "→ agentId 1", col: C.coralHi },
    { bar: k + 1, fn: "StrategyLedger.commit", args: `${short(TESTNET.instanceId, 8, 4)}, ${short(TESTNET.configHash, 8, 4)}`, tx: TESTNET.tx.commit, block: TESTNET.block.commit, gas: TESTNET.gas.commit, out: "→ config pinned", col: C.gold },
    { bar: k + 2, fn: "TradeJournal.record", args: `1, ${short(TESTNET.tradeHash, 8, 4)}, +${TESTNET.pnlBps}, closedAt`, tx: TESTNET.tx.record, block: TESTNET.block.record, gas: TESTNET.gas.record, out: "→ totalTrades 1", col: C.volt },
    { bar: k + 3, fn: "StrategyLedger.attest", args: `${short(TESTNET.instanceId, 8, 4)}, ${short(TESTNET.outcomeHash, 8, 4)}`, tx: TESTNET.tx.attest, block: TESTNET.block.attest, gas: TESTNET.gas.attest, out: "→ isAttested = true", col: C.posHi },
  ];

  const pop = (t: number) => spring({ frame: frame - t, fps, config: { damping: 11, stiffness: 200, mass: 0.6 } });
  const pCard = pop(b(k, 1));
  const press = interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 6], [0, 1], clamp);
  const pBook = pop(b(k + 2, 1));
  const punchAll = useBeatPunch(beatsIn(k, k + 3), 0.012, 5);
  const dip = interpolate(frame, [b(k + 3), b(k + 3) + 5], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,119,87,0.26)" glowB="rgba(240,185,11,0.14)" glow="left" floor={0.35} grid={0.5} />
      <Halftone opacity={0.035} gap={22} />

      <div style={{ position: "absolute", left: 90, top: 58, display: "flex", alignItems: "center", gap: 24 }}>
        <BnbBadge label="LIVE ON BSC TESTNET" at={0} size={30} live variant="dark" />
        <span style={{ fontFamily: F.mono, fontSize: 24, color: C.textMuted }}>the agent wallet {short(AGENT)} · 4 txs · all status 1</span>
      </div>

      <Pulse intensity={0.55} shake={0.25} glow={false}>
        <div style={{ position: "absolute", left: 90, top: 150, width: 1080, display: "flex", flexDirection: "column", gap: 20, transform: `scale(${punchAll})`, transformOrigin: "left top" }}>
          {ROWS.map((r) => {
            const t = b(r.bar);
            if (frame < t) return null;
            const p = spring({ frame: frame - t, fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
            const outOn = frame >= b(r.bar, 2);
            return (
              <div key={r.fn} style={{ transform: `translateX(${(1 - p) * -80}px)`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
                <Glass radius={20} glow={0.25} glowColor={`${r.col}55`} fill="rgba(14,12,11,0.95)" innerStyle={{ padding: "20px 28px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                    <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: r.col }}>{r.fn}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 22, color: C.textMuted }}>({r.args})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 10, fontFamily: F.mono, fontSize: 20, color: C.textDim, whiteSpace: "nowrap" }}>
                    <span>tx <span style={{ color: C.text }}>{short(r.tx, 8, 4)}</span></span>
                    <span>block {fmt(r.block)}</span>
                    <span>{fmt(r.gas)} gas</span>
                    <span style={{ padding: "2px 12px", borderRadius: 8, background: "rgba(163,230,53,0.14)", color: C.posHi, fontWeight: 700 }}>status 1</span>
                    {outOn ? <span style={{ marginLeft: "auto", color: r.col, fontWeight: 700, fontSize: 23 }}>{r.out}</span> : null}
                  </div>
                </Glass>
              </div>
            );
          })}
        </div>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {frame >= b(k, 1) ? <SoulCard x={1530} y={interpolate(pCard, [0, 1], [-160, 290])} s={1.15} rot={(1 - pCard) * 30 - 4} /> : null}
          {frame >= b(k + 1, 1) ? <HashSeal x={1330} y={660} s={1.0} press={press} label="" /> : null}
          {frame >= b(k + 2, 1) ? <JournalBook x={1680} y={interpolate(pBook, [0, 1], [1300, 700])} s={0.9} rot={4} rows={1} chip={`+${TESTNET.pnlBps}`} /> : null}
        </svg>
      </Pulse>

      <ComicText text="MINTED!" from={b(k, 2)} x={1540} y={500} size={96} rotate={-6} fill={C.coralHi} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 2) - 2} />
      <ComicText text="COMMITTED!" from={b(k + 1, 2)} x={1500} y={880} size={90} rotate={5} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2, 2) - 2} />
      <ComicText text={`+${TESTNET.pnlBps} BPS!`} from={b(k + 2, 2)} x={1580} y={500} size={96} rotate={-5} fill={C.volt} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />

      <AbsoluteFill style={{ background: "rgba(12,9,7,0.8)", opacity: dip }} />
      {frame >= b(k + 3) ? (
        <AbsoluteFill>
          <SpeedBurst cx={960} cy={420} from={b(k + 3)} count={20} inner={240} spread={620} color={C.gold} opacity={0.45} width={7} seed="att" fade />
          <ComicText text="ATTESTED." from={b(k + 3)} x={960} y={400} size={240} rotate={-5} skewX={-6} fill={C.volt} variant="onomatopoeia" echoColor={INK} />
          <ComicText text="commit before the trade · attest after · can't be backdated" from={b(k + 3, 1)} x={960} y={640} size={62} rotate={-1.5} fill={C.cream} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", fontFamily: F.mono, fontSize: 30, color: C.textMuted, opacity: interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 6], [0, 1], clamp) }}>
            commit block <b style={{ color: C.gold }}>{fmt(TESTNET.block.commit)}</b> {"<"} record <b style={{ color: C.volt }}>{fmt(TESTNET.block.record)}</b> {"<"} attest <b style={{ color: C.posHi }}>{fmt(TESTNET.block.attest)}</b>
          </div>
        </AbsoluteFill>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.6} color={C.cream} innerColor={C.gold} />

      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Sfx name="impact" at={b(k + i)} volume={0.7} />
          <Sfx name="tick" at={b(k + i, 1)} volume={0.45} />
          <Sfx name="chime" at={b(k + i, 2)} volume={0.4} />
          <Sfx name="tick" at={b(k + i, 3)} volume={0.35} />
        </React.Fragment>
      ))}
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 3)} volume={0.9} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
