import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ComicPanel, ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { NARR, NARR_TEST } from "../data";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import type { TermLine, TermMark } from "../ui";
import { ComicTerminal, RealTag, Stamp } from "../ui";

/**
 * S8 · NARRATIVE-ALPHA (bars 28–31, DROP on 28, whip). The companion Track-2
 * strategy skill in the same repo. It does NOT connect to the agent (no shared
 * code, no chain code), so it is shown as a sibling, honestly labelled:
 *   28 b0 command · b1 top narrative (marked) · b2 basket · b3 weights
 *   29 b0 backtest block · b2 "fixture replay" note
 *   30 b0 pytest line · b1 "24/24 PASS" · b2 panel: what it is / isn't
 */
export const S8Narrative: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.narr; // 28

  const at = [b(k, 1), b(k, 1), b(k, 2), b(k, 2), b(k, 3), b(k, 3), b(k, 3), b(k + 1), b(k + 1), b(k + 1), b(k + 1, 1), b(k + 1, 1), b(k + 1, 1)];
  const lines: TermLine[] = [
    { t: "python -m src run --mode fixture", at: 0, cmd: true, type: 10 },
    ...NARR.map((t, i) => ({ t, at: at[i] ?? b(k + 1, 1), color: i === 0 ? C.neon : i === 2 || i === 8 ? C.gold : C.text, weight: i === 0 ? 700 : undefined })),
    { t: "python -m pytest tests -q", at: b(k + 2), cmd: true, type: 6 },
    { t: NARR_TEST[0]!, at: b(k + 2) + 6, color: C.neon },
    { t: NARR_TEST[1]!, at: b(k + 2, 1), color: C.neon, weight: 700 },
  ];
  const marks: TermMark[] = [
    { line: 1, at: b(k, 1) + 3, c0: 0, c1: NARR[0]!.length, color: C.neon },
    { line: 16, at: b(k + 2, 1) + 2, c0: 0, c1: 9, color: C.neon },
  ];
  const pP = useBeatPunch(beatsIn(k + 1, k + 3), 0.02, 5);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(30,159,242,0.18)" glowB="rgba(14,203,129,0.12)" glow="left" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 92, top: 38 }}>
        <RealTag at={0} kind="real output" label="Narrative-Alpha · companion strategy skill in the same repo (Python)" color={C.cyan} />
      </div>

      <Pulse intensity={0.5} shake={0} glow={false}>
        <ComicTerminal at={0} x={80} y={120} w={1080} h={880} title="Narrative-Alpha — narrative rotation" lines={lines} marks={marks} size={22} lh={1.45} from="left" prompt="$" tab="STRATEGY" tabColor={C.cyan} />
      </Pulse>

      <Pulse intensity={0.8} shake={0.2}>
        <ComicPanel at={b(k + 1, 2)} x={1220} y={200} w={620} h={620} rot={1.6} bg="#DCEFFC" bg2="#1e9ff2" from="right" punch={pP}>
          <div style={{ padding: "34px 38px" }}>
            <div style={{ fontFamily: F.comic, fontSize: 44, color: INK }}>WHAT IT IS</div>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: INK, lineHeight: 1.3, marginTop: 6 }}>
              Ranks market narratives by velocity + acceleration, builds a capped basket, writes a reviewable strategy card.
            </div>
            <div style={{ fontFamily: F.comic, fontSize: 44, color: INK, marginTop: 24 }}>WHAT IT ISN'T (YET)</div>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: INK, lineHeight: 1.3, marginTop: 6 }}>
              Wired into the agent. It runs on fixtures, has no chain code and places no orders.
            </div>
          </div>
        </ComicPanel>
      </Pulse>

      {frame >= b(k + 1, 3) ? (
        <div style={{ position: "absolute", left: 1220, top: 850, fontFamily: F.mono, fontSize: 22, color: C.text2, ...fadeUp(frame, b(k + 1, 3), 6, 10) }}>
          Backtest = fixture replay, 2026-01-01 → 04-01
        </div>
      ) : null}
      <Stamp at={b(k, 1) + 2} x={1500} y={170} text="TOP NARRATIVE" color={C.neon} size={40} rot={6} />
      <ComicText text="24/24 PASS" from={b(k + 2, 1)} x={1530} y={960} size={100} rotate={-4} fill={C.neon} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k, 1) + 2} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.45} />
      <Sfx name="tick" at={b(k, 3)} volume={0.45} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 2)} volume={0.45} />
      <Sfx name="impact" at={b(k + 2, 1)} volume={0.8} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
