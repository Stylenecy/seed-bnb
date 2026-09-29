import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { Board, Check, Padlock, PopBall } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S4 · HOW A GAME WORKS (bars 19–24). Whips in on the bar-19 break with the
 * title; then a 2×2 comic grid, one step per bar (README "How it works"):
 *   bar 20  SEAL    board → hash on-chain; padlock drops on b1  ("LOCKED!")
 *   bar 21  CALL    balls 1 · 2 · 3 · 4 drop on b0–b3 (each call is a tx)
 *   bar 22  BINGO   line lights cell-by-cell, gold outline b2   ("BINGO!")
 *   bar 23  VERIFY  (break) boards revealed, contract replays → ✓ ("VERIFIED!")
 */
const PW = 800;
const PH = 350;
const POS = [
  { x: 130, y: 236 },
  { x: 990, y: 248 },
  { x: 130, y: 626 },
  { x: 990, y: 638 },
];

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Seal", body: "Build your own 5×5 board. Only hash(board + salt) goes on-chain. Locked, but secret.", bg: "#e2d0ff", bg2: "#8a5cc7" },
  { n: "2", title: "Call", body: "Players take turns calling 1–25. Every call is an on-chain tx. No drum, no house.", bg: "#bfe0ff", bg2: "#3d8bff" },
  { n: "3", title: "Claim", body: "Complete a line and send claimBingo(). The game moves to reveal.", bg: "#d9ffc2", bg2: "#6FFF00" },
  { n: "4", title: "Verify", body: "Everyone reveals board + salt. The contract replays every call, then pays out. 1% fee.", bg: "#fff1b8", bg2: "#F0B90B" },
];

/** Illustrative board: row 2 is 1..5 so the calls light it up. */
const SAFE = [8, 19, 6, 24, 12, 1, 2, 3, 4, 5, 17, 11, 21, 10, 15, 22, 9, 14, 7, 20, 13, 25, 16, 23, 18];

const StepText: React.FC<{ s: Step }> = ({ s }) => (
  <div style={{ position: "absolute", left: 392, right: 22, top: 26 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          width: 54,
          height: 54,
          borderRadius: 999,
          background: INK,
          color: C.neon,
          fontFamily: F.comic,
          fontSize: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {s.n}
      </span>
      <span style={{ fontFamily: F.comic, fontSize: 62, color: INK, letterSpacing: "0.02em", textTransform: "uppercase" }}>{s.title}</span>
    </div>
    <div
      style={{
        marginTop: 14,
        background: "#fff",
        border: `4px solid ${INK}`,
        boxShadow: `5px 5px 0 ${INK}`,
        padding: "12px 16px",
        fontFamily: F.sans,
        fontWeight: 700,
        fontSize: 25,
        lineHeight: 1.28,
        color: INK,
      }}
    >
      {s.body}
    </div>
  </div>
);

export const S4HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 19 — break; steps on 20..23
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + 1 + i, k + 2 + i), 0.02, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const hide = interpolate(frame, [b(k + 1, 1) - 4, b(k + 1, 1) + 2], [0, 1], clamp);
  const shut = interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 5], [0, 1], clamp);
  const lit = [1, 2, 3, 4, 5].filter((_, i) => frame >= b(k + 3, i * 0.5));
  const winP = interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 6], [0, 1], clamp);
  const reveal = interpolate(frame, [b(k + 4), b(k + 4) + 6], [1, 0], clamp);
  const check = interpolate(frame, [b(k + 4, 1), b(k + 4, 1) + 8], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(111,255,0,0.14)" glowB="rgba(183,154,232,0.16)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <ComicText text="How a game works" from={b(k)} x={960} y={118} size={104} rotate={-2} skewX={-5} fill={C.neon} stagger={1} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 176,
          textAlign: "center",
          fontFamily: F.script,
          fontSize: 44,
          color: C.text,
          opacity: interpolate(frame, [b(k, 2), b(k, 2) + 8], [0, 1], clamp),
        }}
      >
        four moves, all on-chain, no house
      </div>

      <Pulse intensity={0.9} shake={0.5}>
        {STEPS.map((s, i) => (
          <ComicPanel
            key={s.n}
            at={b(k + 1 + i)}
            x={POS[i]!.x}
            y={POS[i]!.y}
            w={PW}
            h={PH}
            rot={[-1.1, 1.0, 0.8, -1.2][i]}
            bg={s.bg}
            bg2={s.bg2}
            from={(["left", "right", "left", "right"] as const)[i]}
            punch={punches[i]}
          >
            <svg width={380} height={PH} viewBox={`0 0 380 ${PH}`} style={{ position: "absolute", left: 0, top: 0 }}>
              {i === 0 ? (
                <>
                  <Board x={170} y={190} s={0.82} nums={SAFE} hidden={hide} cell={52} rot={-4} />
                  {frame >= b(k + 1, 1) - 2 ? <Padlock x={290} y={110 + (1 - shut) * -60} s={0.9} shut={shut} rot={8} /> : null}
                </>
              ) : null}
              {i === 2 ? <Board x={190} y={190} s={0.82} nums={SAFE} marked={lit} cell={52} win={1} winP={winP} /> : null}
              {i === 3 ? (
                <>
                  <Board x={170} y={196} s={0.82} nums={SAFE} marked={[1, 2, 3, 4, 5]} hidden={frame >= b(k + 4) ? reveal : 1} cell={52} win={1} winP={1} rot={3} />
                  {frame >= b(k + 4, 1) ? <Check x={300} y={90} s={0.95} p={check} /> : null}
                </>
              ) : null}
            </svg>
            {i === 1
              ? [1, 2, 3, 4].map((v, j) => <PopBall key={v} at={b(k + 2, j)} x={90 + (j % 2) * 150 + (j > 1 ? 40 : 0)} y={110 + Math.floor(j / 2) * 150} size={140} label={v} rot={(j - 1.5) * 8} />)
              : null}
            <StepText s={s} />
          </ComicPanel>
        ))}

        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <InkArrow x1={900} y1={330} x2={1010} y2={340} at={b(k + 1, 2)} dur={6} bend={-40} color={C.neon} width={8} />
          <InkArrow x1={1230} y1={606} x2={880} y2={660} at={b(k + 2, 2)} dur={6} bend={40} color={C.neon} width={8} />
          <InkArrow x1={900} y1={740} x2={1010} y2={750} at={b(k + 3, 2)} dur={6} bend={-40} color={C.neon} width={8} />
        </svg>
      </Pulse>

      <ComicText text="LOCKED!" from={b(k + 1, 1)} x={POS[0]!.x + 250} y={POS[0]!.y + 10} size={72} rotate={-8} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2, 2)} />
      <ComicText text="BINGO!" from={b(k + 3, 2)} x={POS[2]!.x + 200} y={POS[2]!.y + 30} size={110} exitAt={b(k + 4)} rotate={-8} skewX={-6} fill={C.neon} variant="onomatopoeia" echoColor={INK} burst={C.ballO} />
      <ComicText text="VERIFIED!" from={b(k + 4, 1)} x={POS[3]!.x + 610} y={POS[3]!.y + 330} size={74} rotate={6} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" innerColor={C.neon} />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`im${i}`} name="impact" at={b(k + 1 + i)} volume={0.5} />
      ))}
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.5} />
      {[1, 2, 3].map((j) => (
        <Sfx key={`c${j}`} name="tick" at={b(k + 2, j)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 3, 2)} volume={0.55} />
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.5} />
    </AbsoluteFill>
  );
};
