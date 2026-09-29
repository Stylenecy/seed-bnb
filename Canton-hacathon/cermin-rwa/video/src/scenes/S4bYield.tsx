import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { Camera, CamKey } from "../lib/Camera";
import { Sfx } from "../lib/ui";
import { Pulse } from "../lib/Pulse";
import { Callout } from "../lib/Callout";
import { COLORS } from "../lib/tokens";
import { SEAM_FRAME, barB } from "../lib/beat";

/**
 * S4b · YIELD reveal — the Coupon Sweep payoff. Enters EXACTLY on the seam
 * (SEAM_FRAME = barB(13)); the music restarts mid-build, so this reads as the
 * head of act 2. Runs 3 bars → barB(16). Re-cut over `yield.mp4` (BSC testnet
 * take, ~10.6→16.6s): the issuer pays the quarterly coupon on-chain (payCoupon) and
 * the Guard Agent calls sweepToLoan on its own — Cermin's feed shows $112.50
 * swept straight into the loan and the ring steps 145.0% → 148.2%.
 */

const S = SEAM_FRAME; // barB(13) = 2088
const DUR = barB(16) - barB(13); // 169 frames (3 bars)

const YIELD = staticFile("video/yield.mp4");
const VW = 1920;
const VH = 1080;

const COVER_PAD = 6;
const coverVidKey = (k: CamKey): CamKey => {
  const scale = Math.max(k.scale, 1);
  const halfW = (VW / 2 + COVER_PAD) / scale;
  const halfH = (VH / 2 + COVER_PAD) / scale;
  const clamp = (v: number, lo: number, hi: number) =>
    lo <= hi ? Math.min(Math.max(v, lo), hi) : (lo + hi) / 2;
  return {
    frame: k.frame,
    scale,
    x: clamp(k.x, halfW, VW - halfW),
    y: clamp(k.y, halfH, VH - halfH),
  };
};
const coverVid = (keys: CamKey[]): CamKey[] => keys.map(coverVidKey);

// Source window ~10.6→16.6s: Home at 145.0%, then the coupon note lands (frame
// 385 = 12.83s, after the issuer's payCoupon + the agent's sweepToLoan mined)
// and the ring steps to 148.2%. rate ~1.06 keeps the reveal near real time.
// The camera pushes from the ring toward the "Your Treasury paid ... swept it
// straight into your loan" note at the top of Cermin's notes.
const RATE = 1.06;
const SRC_START = 10.64;

export const S4bYield: React.FC = () => {
  const trimBefore = Math.round(SRC_START * 30);
  const trimAfter = trimBefore + Math.ceil(DUR * RATE) + 2;
  return (
    <AbsoluteFill style={{ background: COLORS.app }}>
      {/* Steady footage — no pump/shake so the yield step reads clearly. */}
      <Pulse sceneStart={S} intensity={0} shake={0} glow={false}>
        <Camera
          keyframes={coverVid([
            { frame: 0, x: 900, y: 460, scale: 1.14 },
            { frame: 80, x: 1080, y: 430, scale: 1.24 },
            { frame: DUR, x: 1250, y: 410, scale: 1.34 },
          ])}
        >
          <AbsoluteFill>
            <OffthreadVideo
              src={YIELD}
              muted
              playbackRate={RATE}
              trimBefore={trimBefore}
              trimAfter={trimAfter}
              style={{ width: VW, height: VH, objectFit: "cover" }}
            />
          </AbsoluteFill>
          {/* ONE comic callout, parked in the dark below "Cermin's notes" and
              pointing straight up at the notes feed (the fresh coupon note sits
              at its top). Content-space, so it rides the camera push-in. */}
          <Callout
            text={"SWEPT INTO\nYOUR LOAN."}
            from={58}
            out={DUR - 10}
            tx={1335}
            ty={715}
            size={46}
            rotate={-3}
            skewX={-2}
            textFill={COLORS.goldSoft}
            px={1335}
            py={640}
            angle={-90}
            ptrFill={COLORS.gold}
            variant="tri"
            ptrSkew={-3}
          />
        </Camera>
      </Pulse>
      {/* Whoosh on the seam cut; chime as the coupon note lands. */}
      <Sfx type="whoosh" at={0} volume={0.4} />
      <Sfx type="chime" at={62} volume={0.45} />
    </AbsoluteFill>
  );
};
