import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ComicText, Glass, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, steppedCount, useSceneClock } from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import { Pill } from "../ui";

/**
 * S4 · THE GRID AT WORK (bars 16–20, DROP). A code-drawn illustration of the engine's
 * real mechanics (README "Strategy"): BUY rungs below mid, SELL rungs above; a filled BUY
 * arms a SELL one level up, a filled SELL arms a BUY one level down; a SELL that closes a
 * BUY banks one spread. The price lands on a rung on EVERY beat of bars 16–18, so every
 * beat is a fill. Bar 19 (break): price breaks the band → circuit breaker → "FLAT!".
 * Labelled on screen as an illustration — no live fills are claimed.
 */
type Side = "BUY" | "SELL" | null;
const RUNGS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
/** Rung the price sits on at each beat of bars 16, 17, 18 (12 beats), from mid. */
const SEQ = [0, -1, -2, -1, 0, 1, 0, -1, 0, 1, 2, 1];

type Fill = { beat: number; rung: number; side: "BUY" | "SELL"; closes: boolean };
const simulate = () => {
  const book = new Map<number, Side>(RUNGS.map((r) => [r, r < 0 ? "BUY" : r > 0 ? "SELL" : null]));
  const bought = new Set<number>();
  const fills: Fill[] = [];
  const snapshots: Map<number, Side>[] = [new Map(book)];
  for (let i = 1; i < SEQ.length; i++) {
    const r = SEQ[i]!;
    const down = r < SEQ[i - 1]!;
    const o = book.get(r);
    if (down && o === "BUY") {
      book.set(r, null);
      book.set(r + 1, "SELL");
      bought.add(r);
      fills.push({ beat: i, rung: r, side: "BUY", closes: false });
    } else if (!down && o === "SELL") {
      book.set(r, null);
      book.set(r - 1, "BUY");
      const closes = bought.has(r - 1);
      if (closes) bought.delete(r - 1);
      fills.push({ beat: i, rung: r, side: "SELL", closes });
    }
    snapshots.push(new Map(book));
  }
  return { fills, snapshots };
};
const SIM = simulate();

// board geometry (inside the glass card)
const BW = 1320;
const BH = 640;
const X0 = 70;
const X1 = 1130;
const MIDY = BH / 2 + 10;
const STEP = 62;
const yOf = (lvl: number) => MIDY - lvl * STEP;

export const S4Grid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b } = useSceneClock();
  const k = BAR.grid; // 16
  const brk = k + 3; // 19

  const beatF = (i: number) => b(k + Math.floor(i / 4), i % 4);
  const xOfBeat = (i: number) => X0 + (i / 12) * (X1 - X0);
  const broken = frame >= b(brk);
  const dump = interpolate(frame, [b(brk) - 3, b(brk, 1)], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

  // price level at frame (eases between beat keys), then the break-down tail
  const lvlAt = (f: number) => {
    if (f <= beatF(0)) return 0;
    for (let i = 1; i < SEQ.length; i++) {
      if (f <= beatF(i)) {
        const t = (f - beatF(i - 1)) / (beatF(i) - beatF(i - 1));
        return interpolate(Easing.inOut(Easing.sin)(t), [0, 1], [SEQ[i - 1]!, SEQ[i]!]);
      }
    }
    const last = SEQ[SEQ.length - 1]!;
    const t = interpolate(f, [beatF(11), b(brk) - 3], [0, 1], clamp);
    return interpolate(t, [0, 1], [last, 0.4]) - dump * 6.2;
  };
  const xAt = (f: number) => {
    if (f <= beatF(0)) return X0;
    for (let i = 1; i < SEQ.length; i++) if (f <= beatF(i)) return interpolate(f, [beatF(i - 1), beatF(i)], [xOfBeat(i - 1), xOfBeat(i)]);
    return interpolate(f, [beatF(11), b(brk, 1)], [xOfBeat(11), X1 + 60], clamp);
  };

  const pts: string[] = [];
  const end = Math.max(0, frame);
  for (let f = 0; f <= end; f += 1) pts.push(`${f ? "L" : "M"}${xAt(f).toFixed(1)} ${yOf(lvlAt(f)).toFixed(1)}`);
  const d = pts.join(" ");

  let bi = 0;
  for (let i = 0; i < SEQ.length; i++) if (frame >= beatF(i)) bi = i;
  const book = SIM.snapshots[bi]!;
  const seen = SIM.fills.filter((fl) => frame >= beatF(fl.beat));
  const fillCount = steppedCount(frame, SIM.fills.map((fl) => beatF(fl.beat)), SIM.fills.map((_, i) => i + 1));
  const closes = SIM.fills.filter((fl) => fl.closes);
  const rtCount = steppedCount(frame, closes.map((fl) => beatF(fl.beat)), closes.map((_, i) => i + 1));
  const land = spring({ frame, fps, config: { damping: 15, stiffness: 150, mass: 0.8 } });
  const redden = interpolate(frame, [b(brk), b(brk) + 6], [0, 1], clamp);

  const colSide = (s: Side) => (s === "BUY" ? C.volt : s === "SELL" ? C.coral : "rgba(255,255,255,0.18)");

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,119,87,0.24)" glowB="rgba(159,255,0,0.1)" glow="top" floor={0.3} grid={0.55} />
      <Halftone opacity={0.035} gap={22} />

      <div style={{ position: "absolute", left: 96, top: 60, display: "flex", alignItems: "baseline", gap: 26 }}>
        <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 64, letterSpacing: "-0.02em", color: C.text }}>the grid at work</span>
        <Pill color={C.coralHi} size={19} dot={false}>illustration · strategy mechanics</Pill>
      </div>

      <Pulse intensity={0.5} shake={0.2} glow={false}>
        <div style={{ position: "absolute", left: 96, top: 170, transform: `translateY(${(1 - land) * 60}px)`, opacity: interpolate(land, [0, 0.3], [0, 1], clamp) }}>
          <Glass radius={26} glow={0.35} glowColor={broken ? "rgba(251,113,133,0.5)" : "rgba(217,119,87,0.4)"} fill="rgba(16,13,11,0.94)">
            <svg width={BW} height={BH} style={{ display: "block" }}>
              {/* band */}
              <rect x={X0 - 20} y={yOf(4.5)} width={X1 - X0 + 40} height={STEP * 9} fill={broken ? `rgba(190,18,60,${0.12 * redden})` : "rgba(159,255,0,0.05)"} stroke={broken ? C.negHi : "rgba(159,255,0,0.35)"} strokeWidth={2} strokeDasharray="8 8" rx={8} />
              <text x={X0 - 10} y={yOf(4.5) - 12} fontFamily={F.mono} fontSize={18} fill={C.textDim}>upper band</text>
              <text x={X0 - 10} y={yOf(-4.5) + 28} fontFamily={F.mono} fontSize={18} fill={C.textDim}>lower band</text>
              {RUNGS.map((r) => {
                const s = broken ? null : book.get(r) ?? null;
                const col = colSide(s);
                return (
                  <g key={r} opacity={broken ? 1 - 0.6 * redden : 1}>
                    <line x1={X0} x2={X1} y1={yOf(r)} y2={yOf(r)} stroke={col} strokeWidth={s ? 3 : 1.5} strokeDasharray={r === 0 ? "3 8" : "12 9"} opacity={s ? 0.8 : 0.5} />
                    <rect x={X1 + 18} y={yOf(r) - 17} width={96} height={34} rx={17} fill={s ? col : "transparent"} stroke={s ? INK : "rgba(255,255,255,0.2)"} strokeWidth={s ? 3 : 1.5} />
                    <text x={X1 + 66} y={yOf(r) + 7} textAnchor="middle" fontFamily={F.mono} fontWeight={800} fontSize={19} fill={s ? INK : C.textDim}>
                      {s ?? (r === 0 ? "mid" : "—")}
                    </text>
                  </g>
                );
              })}
              {/* price */}
              <path d={d} stroke={INK} strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} stroke={broken ? C.negHi : C.text} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {/* fills */}
              {seen.map((fl) => {
                const t = frame - beatF(fl.beat);
                const p = spring({ frame: t, fps, config: { damping: 9, stiffness: 220, mass: 0.5 } });
                const col = fl.side === "BUY" ? C.volt : C.coral;
                const x = xOfBeat(fl.beat);
                const y = yOf(fl.rung);
                return (
                  <g key={fl.beat} transform={`translate(${x} ${y}) scale(${0.3 + 0.7 * p})`}>
                    <circle r={17} fill={col} stroke={INK} strokeWidth={5} />
                    <text y={fl.side === "BUY" ? 50 : -30} textAnchor="middle" fontFamily={F.comic} fontSize={30} fill={col} stroke={INK} strokeWidth={5} paintOrder="stroke">
                      {fl.side}
                    </text>
                    {fl.closes ? (
                      <text x={0} y={fl.side === "BUY" ? 84 : -64} textAnchor="middle" fontFamily={F.mono} fontWeight={800} fontSize={20} fill={C.volt} opacity={interpolate(t, [2, 8], [0, 1], clamp)}>
                        +spread
                      </text>
                    ) : null}
                  </g>
                );
              })}
              {!broken ? <circle cx={xAt(frame)} cy={yOf(lvlAt(frame))} r={12} fill={C.volt} stroke={INK} strokeWidth={4} /> : null}
            </svg>
          </Glass>
        </div>

        {/* HUD */}
        <div style={{ position: "absolute", left: 1470, top: 170, width: 360, display: "flex", flexDirection: "column", gap: 22 }}>
          {[
            { label: "fills", v: fillCount, col: C.text },
            { label: "round trips · spread banked", v: rtCount, col: C.volt },
          ].map((h) => (
            <Glass key={h.label} radius={20} glow={0.2} glowColor="rgba(217,119,87,0.35)" fill="rgba(16,13,11,0.94)" innerStyle={{ padding: "20px 26px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 20, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h.label}</div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 110, lineHeight: 1, color: h.col, fontVariantNumeric: "tabular-nums" }}>{h.v}</div>
            </Glass>
          ))}
          <Glass radius={20} fill="rgba(16,13,11,0.94)" innerStyle={{ padding: "18px 24px" }}>
            <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 23, lineHeight: 1.35, color: C.text }}>
              Level spacing never tighter than <span style={{ color: C.coralHi }}>2 swap fees + slippage + gas</span>, so every banked spread clears costs.
            </div>
          </Glass>
        </div>
      </Pulse>

      {broken ? (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: "rgba(40,6,12,0.55)", opacity: redden }} />
          <SpeedBurst cx={760} cy={520} from={b(brk)} count={22} inner={220} spread={700} color={C.negHi} opacity={0.5} width={7} seed="flat" fade />
          <ComicText text="FLAT!" from={b(brk)} x={760} y={470} size={260} rotate={-6} skewX={-6} fill={C.volt} variant="onomatopoeia" echoColor={INK} />
          <ComicText text="circuit breaker: cancel every order, sit in stablecoin" from={b(brk, 2)} x={760} y={690} size={52} rotate={-1.5} fill={C.cream} />
        </AbsoluteFill>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.6} color={C.cream} />

      {SIM.fills.map((fl) => (
        <Sfx key={`f${fl.beat}`} name={fl.closes ? "chime" : "tick"} at={beatF(fl.beat)} volume={fl.closes ? 0.4 : 0.55} />
      ))}
      <Sfx name="impact" at={0} volume={0.7} />
      <Sfx name="impact" at={b(brk)} volume={0.95} />
      <Sfx name="tick" at={b(brk, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
