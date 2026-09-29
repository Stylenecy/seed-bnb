import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BnbBadge,
  clamp,
  ComicText,
  fadeUp,
  Glass,
  Halftone,
  INK,
  InkFrame,
  PremiumBg,
  Pulse,
  Robot,
  Sfx,
  SpeedBurst,
  steppedCount,
  useSceneClock,
} from "../../../kit";
import { PaydayClock } from "../art";
import { C, CHAIN, F, short } from "../theme";
import { BAR } from "../timeline";

/**
 * S5 · THE LIVE RUN (bars 21–26). The real BSC-testnet smoke flow from
 * VERIFY-BNB.md, one actor per bar, every line a real tx (all status 1):
 *   21  employer   createGroup("Testnet Team", 300 s) b0 · addEmployee 5,000 b1 · 3,000 b2 · depositPayroll 8,000 b3
 *   22  employee   zap 0.01 mWBNB → 100 USDC b0 · requestSalary(1000) → 985 net b2 ("ADVANCE!")
 *   23  agent      BREAK bar: Rebalanced (idle → yield) b0 · BufferAdjusted ×4 b1 · MovedToReserve b2 · clock runs out
 *   24  DROP       "PAYDAY!" slam on the downbeat, PaydayTriggered 0x6038a7e3… · b2 balances 5,000 − 1,000 = 4,000 / 3,000
 *   25  claim      PayVault.claim(4000) b0 ("CLAIMED!") · b2 wallet 985 + 2,000 + 4,000 = 6,985
 */
const NODES = ["Group", "Deposit", "Zap", "Advance", "Agent", "Payday", "Claim"];

type Line = { at: number; call: React.ReactNode; value: React.ReactNode; tx?: string; color?: string };

const LineRow: React.FC<{ l: Line }> = ({ l }) => {
  const frame = useCurrentFrame();
  if (frame < l.at) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 18, ...fadeUp(frame, l.at, 8, 16) }}>
      <span style={{ color: l.color ?? C.emerald, fontSize: 30, fontWeight: 800 }}>✓</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.mono, fontSize: 28, color: C.text, whiteSpace: "nowrap" }}>{l.call}</div>
        {l.tx ? <div style={{ fontFamily: F.mono, fontSize: 19, color: C.faint, marginTop: 4 }}>tx {short(l.tx, 10, 8)} · status 1</div> : null}
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, color: l.color ?? C.tealLite, whiteSpace: "nowrap" }}>{l.value}</div>
    </div>
  );
};

const Card: React.FC<{ who: string; whoColor: string; addr: string; children: React.ReactNode; right: React.ReactNode; at: number }> = ({ who, whoColor, addr, children, right, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 190, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 150, top: 300, width: 1620, transform: `translateY(${(1 - p) * 50}px) scale(${0.95 + 0.05 * p})`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <Glass radius={28} glow={0.45} glowColor={`${whoColor}66`} fill="rgba(10,15,28,0.9)" innerStyle={{ padding: "30px 40px", height: 560, boxSizing: "border-box", display: "flex", gap: 40 }}>
        <div style={{ flex: 1.25 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", color: whoColor }}>{who}</span>
            <span style={{ fontFamily: F.mono, fontSize: 20, color: C.faint }}>{short(addr)}</span>
          </div>
          {children}
        </div>
        <div style={{ flex: 1, borderLeft: `1px solid ${C.line}`, paddingLeft: 40, display: "flex", flexDirection: "column", justifyContent: "center" }}>{right}</div>
      </Glass>
    </div>
  );
};

const Big: React.FC<{ at: number; kicker: string; value: React.ReactNode; unit?: string; sub?: React.ReactNode; color?: string }> = ({ at, kicker, value, unit = "USDC", sub, color = C.text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 230, mass: 0.6 } });
  return (
    <div style={{ transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: "left center", opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", textTransform: "uppercase", color: C.dim }}>{kicker}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 6 }}>
        <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 140, letterSpacing: "-0.04em", color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 40, color: C.dim }}>{unit}</span>
      </div>
      {sub ? <div style={{ fontFamily: F.sans, fontSize: 28, color: C.dim, marginTop: 14, lineHeight: 1.35 }}>{sub}</div> : null}
    </div>
  );
};

export const S5Live: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.live; // 21

  const reach = [b(k), b(k, 3), b(k + 1), b(k + 1, 2), b(k + 2), b(k + 3), b(k + 4)];
  let active = 0;
  reach.forEach((r, i) => {
    if (frame >= r) active = i;
  });
  const lineFill = interpolate(frame, reach, reach.map((_, i) => i / (reach.length - 1)), clamp);

  const deposit = steppedCount(frame, [b(k, 3), b(k, 3) + 3, b(k, 3) + 6, b(k, 3) + 9], [0, 3000, 6000, 8000]);
  const net = steppedCount(frame, [b(k + 1, 2), b(k + 1, 2) + 3, b(k + 1, 2) + 6], [0, 500, 985]);
  const clock = interpolate(frame, [b(k + 2), b(k + 3)], [0.15, 1], clamp);
  const bar = frame < b(k + 1) ? 0 : frame < b(k + 2) ? 1 : frame < b(k + 3) ? 2 : frame < b(k + 4) ? 3 : 4;
  const paydaySlam = frame >= b(k + 3) && frame < b(k + 3, 2);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA={bar === 3 ? "rgba(245,158,11,0.3)" : "rgba(124,58,237,0.2)"} glowB="rgba(20,184,166,0.16)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.035} gap={22} />

      <div style={{ position: "absolute", left: 80, top: 56, display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 52, color: C.text, letterSpacing: "-0.02em" }}>The live run</div>
        <BnbBadge label="LIVE ON BSC TESTNET" at={0} size={26} live variant="dark" />
      </div>
      <div style={{ position: "absolute", right: 80, top: 70, fontFamily: F.mono, fontSize: 20, color: C.faint, textAlign: "right" }}>
        VERIFY-BNB.md · 2026-09-25 · every receipt status 1
      </div>

      {/* step strip */}
      <div style={{ position: "absolute", left: 180, right: 180, top: 170, height: 90 }}>
        <div style={{ position: "absolute", left: 30, right: 30, top: 28, height: 6, borderRadius: 6, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", left: 30, top: 28, height: 6, borderRadius: 6, width: `calc((100% - 60px) * ${lineFill})`, background: `linear-gradient(90deg, ${C.violetLite}, ${C.tealLite})`, boxShadow: "0 0 16px rgba(45,212,191,0.6)" }} />
        {NODES.map((n, i) => {
          const on = frame >= reach[i]!;
          const cur = i === active;
          const pop = on ? interpolate(frame, [reach[i]!, reach[i]! + 6], [1.5, 1], clamp) : 1;
          const col = n === "Payday" ? C.amber : C.tealLite;
          return (
            <div key={n} style={{ position: "absolute", left: `calc(30px + (100% - 60px) * ${i / (NODES.length - 1)} - 60px)`, width: 120, top: 0, textAlign: "center" }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  margin: "0 auto",
                  borderRadius: 999,
                  background: on ? col : "#1a2336",
                  border: `4px solid ${on ? INK : "rgba(255,255,255,0.18)"}`,
                  boxShadow: cur ? `0 0 30px ${col}` : "none",
                  transform: `scale(${pop * (cur ? 1.1 : 1)})`,
                  fontFamily: F.comic,
                  fontSize: 30,
                  color: on ? INK : C.faint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, marginTop: 8, color: on ? C.text : C.faint, letterSpacing: "0.06em", textTransform: "uppercase" }}>{n}</div>
            </div>
          );
        })}
      </div>

      <Pulse intensity={0.55} shake={0.2} glow={false}>
        {bar === 0 ? (
          <Card who="Employer" whoColor={C.violetLite} addr={CHAIN.employer} at={b(k)}
            right={<Big at={b(k, 3)} kicker="depositPayroll(1)" value={deposit.toLocaleString("en-US")} sub={<>funds cycle #1 in one call<br /><span style={{ fontFamily: F.mono, fontSize: 20, color: C.faint }}>tx {short(CHAIN.tx.deposit, 10, 8)}</span></>} color={C.text} />}
          >
            <LineRow l={{ at: b(k), call: <>createGroup(<span style={{ color: C.gold }}>"Testnet Team"</span>, <span style={{ color: C.gold }}>300 s</span>)</>, value: "group #1", tx: CHAIN.tx.createGroup, color: C.violetLite }} />
            <LineRow l={{ at: b(k, 1), call: <>addEmployee(<span style={{ color: C.faint }}>0x7e13…D5C0</span>)</>, value: "5,000 USDC", tx: CHAIN.tx.addEmployeeA }} />
            <LineRow l={{ at: b(k, 2), call: <>addEmployee(<span style={{ color: C.faint }}>0xA694…46A5</span>)</>, value: "3,000 USDC", tx: CHAIN.tx.addEmployeeB }} />
          </Card>
        ) : null}

        {bar === 1 ? (
          <Card who="Employee" whoColor={C.tealLite} addr={CHAIN.employee} at={b(k + 1)}
            right={<Big at={b(k + 1, 2)} kicker="received in wallet" value={net} color={C.emerald} sub={<>requestSalary(1000) − 1.5% fee = 985<br />debt recorded: <b style={{ color: C.gold }}>1,000</b></>} />}
          >
            <LineRow l={{ at: b(k + 1), call: <>Zapper.zap(<span style={{ color: C.gold }}>0.01 mWBNB</span>)</>, value: "100 USDC", tx: CHAIN.tx.zap, color: C.gold }} />
            <div style={{ fontFamily: F.sans, fontSize: 24, color: C.faint, marginTop: 8, marginLeft: 48, ...fadeUp(frame, b(k + 1, 1), 8, 10) }}>onboarding zapper: plus 0.01 tBNB for gas, ready to transact</div>
            <LineRow l={{ at: b(k + 1, 2), call: <>FlowrollCredit.requestSalary(<span style={{ color: C.gold }}>1000</span>)</>, value: "985 net", tx: CHAIN.tx.advance }} />
          </Card>
        ) : null}

        {bar === 2 ? (
          <Card who="Rebalance agent" whoColor={C.emerald} addr={CHAIN.agent} at={b(k + 2)}
            right={
              <svg width={560} height={420} viewBox="0 0 560 420">
                <Robot x={150} y={250} s={1.3} fill="#9AA3B5" visor={C.tealLite} flame={0.5 + 0.5 * Math.sin(frame / 3)} />
                <PaydayClock x={410} y={200} s={1.2} t={clock} label="PAYDAY IN…" />
              </svg>
            }
          >
            <LineRow l={{ at: b(k + 2), call: <>Rebalanced · idle funds → yield</>, value: "found via eth_getLogs", tx: CHAIN.tx.rebalanced }} />
            <LineRow l={{ at: b(k + 2, 1), call: <>BufferAdjusted ×4</>, value: "payday buffer", tx: CHAIN.tx.buffer }} />
            <LineRow l={{ at: b(k + 2, 2), call: <>MovedToReserve</>, value: "secured base" }} />
            <div style={{ fontFamily: F.sans, fontSize: 24, color: C.faint, marginTop: 22, marginLeft: 48, ...fadeUp(frame, b(k + 2, 3), 8, 10) }}>one agentRebalance tx per 30 s tick</div>
          </Card>
        ) : null}

        {bar === 3 ? (
          <Card who="PayVault · after payday" whoColor={C.amber} addr={CHAIN.payVault} at={b(k + 3, 2)}
            right={<Big at={b(k + 3, 3)} kicker="employee 0x7e13 can claim" value="4,000" color={C.emerald} sub={<>advance repaid automatically<br />getEmployeeDebt = <b style={{ color: C.emerald }}>0</b></>} />}
          >
            <LineRow l={{ at: b(k + 3, 2), call: <>PaydayTriggered · agent</>, value: "cycle #1 paid", tx: CHAIN.tx.payday, color: C.amber }} />
            <LineRow l={{ at: b(k + 3, 2) + 4, call: <>0x7e13: 5,000 − 1,000 advance</>, value: "4,000 USDC" }} />
            <LineRow l={{ at: b(k + 3, 3), call: <>0xA694: salary</>, value: "3,000 USDC" }} />
          </Card>
        ) : null}

        {bar === 4 ? (
          <Card who="Employee" whoColor={C.tealLite} addr={CHAIN.employee} at={b(k + 4)}
            right={<Big at={b(k + 4, 2)} kicker="wallet after claim" value="6,985" color={C.emerald} sub={<>985 advance + 2,000 faucet + 4,000 salary</>} />}
          >
            <LineRow l={{ at: b(k + 4), call: <>PayVault.claim(<span style={{ color: C.gold }}>4000</span>)</>, value: "4,000 USDC", tx: CHAIN.tx.claim }} />
            <LineRow l={{ at: b(k + 4, 1), call: <>getEmployeeDebt()</>, value: "0" }} />
            <div style={{ fontFamily: F.sans, fontSize: 24, color: C.faint, marginTop: 22, marginLeft: 48, ...fadeUp(frame, b(k + 4, 3), 8, 10) }}>the payday fix from the fork run holds on the live chain</div>
          </Card>
        ) : null}
      </Pulse>

      {paydaySlam ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 55%, rgba(7,10,18,0.85), rgba(7,10,18,0.5))" }} /> : null}
      <SpeedBurst cx={960} cy={560} from={b(k + 3)} count={26} inner={260} spread={760} color={C.amber} opacity={0.7} width={9} seed="payday" fade />
      {frame < b(k + 3, 2) ? <ComicText text="PAYDAY!" from={b(k + 3)} x={960} y={520} size={300} rotate={-6} skewX={-8} tiltX={8} fill={C.gold} variant="onomatopoeia" echoColor={C.violet} /> : null}
      {frame < b(k + 3, 2) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", fontFamily: F.mono, fontSize: 34, color: C.text, ...fadeUp(frame, b(k + 3, 1), 6, 12) }}>
          PaydayTriggered · tx <span style={{ color: C.gold }}>{short(CHAIN.tx.payday, 10, 8)}</span>
        </div>
      ) : null}

      <ComicText text="ADVANCE!" from={b(k + 1, 2)} x={1560} y={900} size={96} rotate={-6} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2) - 2} />
      <ComicText text="CLAIMED!" from={b(k + 4)} x={1540} y={930} size={110} rotate={-5} fill={C.emerald} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor={bar === 3 ? C.amber : undefined} />

      <Sfx name="impact" at={b(k)} volume={0.6} />
      {[1, 2].map((i) => (
        <Sfx key={`e${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k, 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.7} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`a${i}`} name="tick" at={b(k + 2, i)} volume={0.4} />
      ))}
      <Sfx name="impact" at={b(k + 3)} volume={1} />
      <Sfx name="chime" at={b(k + 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k + 3, 3)} volume={0.55} />
      <Sfx name="impact" at={b(k + 4)} volume={0.7} />
      <Sfx name="chime" at={b(k + 4, 2)} volume={0.55} />
    </AbsoluteFill>
  );
};
