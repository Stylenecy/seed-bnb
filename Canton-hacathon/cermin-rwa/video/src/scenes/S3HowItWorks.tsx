import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Atmosphere, Sfx } from "../lib/ui";
import { Pulse } from "../lib/Pulse";
import { ComicText } from "../lib/ComicText";
import { COLORS } from "../lib/tokens";
import { comicImg, ComicName } from "../lib/assets";
import { barA } from "../lib/beat";

/**
 * S3 · HOW IT WORKS — a six-panel ANIMATED COMIC STRIP (replacing the old
 * FE-card diagram). One panel per bar over the frozen window barA(9)→barA(15),
 * each with a slow Ken-Burns push (alive, never static) and in-scene ComicText
 * laid along the art. Panels hand off with APERTURE MATCH-CUTS: the camera
 * dives INTO a bright/dark element of the outgoing panel (the coin, the teller
 * spout, the chest, the lantern, the sky crack, the meter dial) while the next
 * panel pulls back out of its own aperture — a continuous "falling through the
 * pages" feel, one whoosh per hand-off.
 *
 * Local landmarks (S = barA(8) — the scene now enters WITH the build's
 * re-entry, one bar earlier, so the S2 logo blinks for exactly one quiet bar):
 *   s1 POST   bars 8–10 (the establishing panel gets the extra bar) · "POST YOUR TREASURY."
 *   s2 BORROW bar 10 · "BORROW AGAINST IT."
 *   s3 VAULT  bar 11 · "FUND A SHADOW VAULT."
 *   s4 WATCH  bars 12–13 (the vigil hold) · "I WATCH. EVERY 5 SECONDS."
 *   s5 CRASH  bar 14 (the PEAK — shake + terracotta flash kept) · "CRASH!"
 *   s6 SAVED  bar 14→15 tail · "SAVED. WHILE YOU SLEPT." (chime), then hard-cut to the app.
 */

const S = barA(8);
const b = (k: number): number => barA(k) - S;
// b(8)=0 · b(9)=56 · b(10)=113 · b(11)=169 · b(12)=225 · b(13)=281 · b(14)=338 · b(15)=394

const clampBoth = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Focus = [number, number];

const ENTER = 12;
const EXIT = 12;

/**
 * One full-bleed comic panel. A single aperture point drives everything: the
 * entrance pulls BACK out of it (scale enter0 → 1), a slow Ken-Burns pushes
 * gently toward it, and the exit DIVES into it (scale → exit1) — so the outgoing
 * dive and the incoming pull-back share the aperture-zoom gesture. ComicText
 * children live inside the scaled group, so the lettering flies through with the
 * art on the hand-off.
 */
const ComicPanel: React.FC<{
  name: ComicName;
  start: number;
  dur: number;
  aperture: Focus;
  enter0?: number;
  exit1?: number;
  fadeFloor?: number;
  last?: boolean;
  children?: React.ReactNode;
}> = ({
  name,
  start,
  dur,
  aperture,
  enter0 = 1.46,
  exit1 = 1.44,
  fadeFloor = 0,
  last = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  if (local < 0 || local > dur) return null;
  const [ax, ay] = aperture;

  const scale = interpolate(
    local,
    [0, ENTER, dur - EXIT, dur],
    [enter0, 1.0, 1.08, last ? 1.14 : exit1],
    clampBoth,
  );
  const enterOp = interpolate(local, [0, 8], [fadeFloor, 1], clampBoth);
  const exitOp = last ? 1 : interpolate(local, [dur - 4, dur], [1, 0], clampBoth);
  const op = Math.min(enterOp, exitOp);

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: `${ax * 100}% ${ay * 100}%`,
          willChange: "transform",
        }}
      >
        <Img
          src={comicImg(name)}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
          }}
        />
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const S3HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();

  // Keep the incident SLAM on the PEAK (bar 14 = b(14)=282): a hard shake +
  // terracotta flash exactly as before — now it lands on the CRASH panel.
  const slamAmt = interpolate(frame, [b(14), b(14) + 6, b(14) + 26], [0, 1, 0], clampBoth);
  const slamX = Math.sin(frame * 2.4) * 7 * slamAmt;
  const slamY = Math.cos(frame * 3.0) * 6 * slamAmt;
  const slamFlash = interpolate(frame, [b(14) - 1, b(14), b(14) + 3], [0, 0.42, 0], clampBoth);

  return (
    <Atmosphere>
      <AbsoluteFill style={{ transform: `translate(${slamX}px, ${slamY}px)` }}>
        <Pulse sceneStart={S} intensity={0.5} shake={0.3}>
          <AbsoluteFill>
            {/* s1 · POST — glowing coin on the bank counter. Aperture = the coin. */}
            <ComicPanel name="s1-post" start={b(8)} dur={125} aperture={[0.41, 0.6]} enter0={1.1} fadeFloor={0.55}>
              <ComicText text={"Post your\nTreasury."} from={b(8) + 6} x={600} y={300} size={98} rotate={4} skewX={6} tiltX={6} fill={COLORS.goldSoft} />
            </ComicPanel>

            {/* s2 · BORROW — coins stream from the teller. Aperture = the spout. */}
            <ComicPanel name="s2-borrow" start={b(10)} dur={68} aperture={[0.64, 0.47]}>
              <ComicText text={"Borrow\nagainst it."} from={b(10) + 7} x={720} y={360} size={104} rotate={8} skewX={7} tiltX={5} fill={COLORS.text} />
            </ComicPanel>

            {/* s3 · VAULT — guardian + borrower fill a hidden chest. Aperture = the chest. */}
            <ComicPanel name="s3-vault" start={b(11)} dur={68} aperture={[0.66, 0.64]}>
              <ComicText text={"Fund a\nshadow vault."} from={b(11) + 7} x={960} y={235} size={92} rotate={-2} skewX={-4} tiltX={6} fill={COLORS.text} />
            </ComicPanel>

            {/* s4 · WATCH — guardian alone on the watchtower (the vigil hold).
                Aperture = the raised lantern. */}
            <ComicPanel name="s4-watch" start={b(12)} dur={113} aperture={[0.65, 0.28]}>
              <ComicText text={"I watch.\nEvery 5 seconds."} from={b(12) + 9} x={600} y={260} size={90} rotate={-3} skewX={-4} tiltX={5} fill={COLORS.goldSoft} />
            </ComicPanel>

            {/* s5 · CRASH — guardian deflects the chart-meteor. Enters from the
                lantern; CRASH! pops ON bar 14. Aperture = the sky crack. */}
            <ComicPanel name="s5-crash" start={b(14) - 12} dur={52} aperture={[0.28, 0.2]}>
              <ComicText
                text={"Crash!"}
                from={b(14)}
                x={1120}
                y={470}
                size={220}
                rotate={14}
                skewX={-8}
                tiltX={8}
                variant="onomatopoeia"
                fill={COLORS.goldSoft}
                echoColor={COLORS.terracotta}
              />
            </ComicPanel>

            {/* s6 · SAVED — coins into the loan-meter, borrower asleep. Last panel
                now holds a FULL EXTRA BAR (scene extended to barA(16)) so the
                payoff can breathe and the narration finishes before the cut. */}
            <ComicPanel name="s6-saved" start={b(14) + 28} dur={b(16) - (b(14) + 28)} aperture={[0.22, 0.33]} last>
              <ComicText text={"Saved.\nWhile you slept."} from={b(14) + 32} x={960} y={230} size={92} rotate={-2} skewX={-3} tiltX={5} fill={COLORS.goldSoft} />
            </ComicPanel>
          </AbsoluteFill>
        </Pulse>
      </AbsoluteFill>

      {/* Incident flash — terracotta, 1 frame, on the peak downbeat. */}
      {slamFlash > 0.001 ? (
        <AbsoluteFill style={{ background: COLORS.terracotta, opacity: slamFlash, pointerEvents: "none" }} />
      ) : null}

      {/* Whoosh on every aperture hand-off; riser into the crash; a whoosh on the
          slam; chime as the position is saved. */}
      <Sfx type="whoosh" at={b(9) + 57} volume={0.4} />
      <Sfx type="whoosh" at={b(11)} volume={0.4} />
      <Sfx type="whoosh" at={b(12)} volume={0.4} />
      <Sfx type="whoosh" at={b(14) - 12} volume={0.4} />
      <Sfx type="riser" at={b(14) - 12} volume={0.4} />
      <Sfx type="whoosh" at={b(14)} volume={0.5} />
      <Sfx type="whoosh" at={b(14) + 28} volume={0.4} />
      <Sfx type="chime" at={b(14) + 32} volume={0.45} />
    </Atmosphere>
  );
};
