import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Sfx } from "../lib/ui";
import { COLORS } from "../lib/tokens";
import { ComicText } from "../lib/ComicText";
import { barA, beatA } from "../lib/beat";
import { comicImg, ComicName } from "../lib/assets";

/**
 * S1 · COLD-OPEN HOOK — a beat-cut ANIMATED COMIC that STATES THE PROBLEM.
 * No introduction: the four flat comic panels (public/images/comic/h1..h4) slam
 * one per beat-block, with in-scene ComicText lettering laid ALONG each panel's
 * diagonals — the coin's rays, the monitor rows, the vault light-gap, the
 * explosion speed-lines. Same beat/frame structure as before (cuts, per-beat
 * punch-ins, DROP shake, aftermath strobe, 2.39:1 letterbox all preserved):
 *   bars 0–1  (7→120)   h1-tokenized, punch per beat  · "YOUR TREASURY." / "TOKENIZED. ON-CHAIN."
 *   bar  2    (120→176) h2-inpublic smash-pan         · "YOUR LOAN. IN PUBLIC."
 *   bar  3    (176→232) h3-onedip, alarm crack        · "ONE" "PRICE" "DIP…"  (punch every beat)
 *   DROP bar4 (232)     SLAM → h4-liquidation, flash  · "PUBLIC LIQUIDATION." (onomatopoeia)
 *   bars 4–7  (232→401) aftermath: h4/h2 cuts every beat, terracotta strobe
 *                       · "SOLD. IN FRONT OF EVERYONE." → "IT DOESN'T HAVE TO BE THIS WAY."
 * The letterbox snaps away on the hard cut at bar 7 → the S2 logo answer.
 */

const B = (k: number): number => barA(k);
const bt = (k: number): number => beatA(k);

const INK = "#05070a";
const clampBoth = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Max of decaying impulses fired on each beat frame — a sharp per-beat punch. */
const beatPunch = (
  f: number,
  beats: readonly number[],
  amt: number,
  decay = 4,
): number => {
  let e = 0;
  for (const b of beats) {
    if (f >= b) {
      const v = amt * Math.exp(-(f - b) / decay);
      if (v > e) e = v;
    }
  }
  return e;
};

/* ----------------------------------------------------------- full-bleed panel */

type Focus = [number, number];

const PanelImage: React.FC<{
  name: ComicName;
  from: number;
  to: number;
  focus?: Focus;
  baseFrom?: number;
  baseTo?: number;
  beats?: readonly number[];
  punchAmt?: number;
  punchDecay?: number;
  panX?: number;
  panY?: number;
  rotate?: number;
  vignette?: string;
  brightness?: number;
  extraScale?: number;
}> = ({
  name,
  from,
  to,
  focus = [0.5, 0.5],
  baseFrom = 1.06,
  baseTo = 1.16,
  beats = [],
  punchAmt = 0.06,
  punchDecay = 4,
  panX = 0,
  panY = 0,
  rotate = 0,
  vignette,
  brightness = 1,
  extraScale = 0,
}) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const dur = to - from;
  const base = interpolate(local, [0, dur], [baseFrom, baseTo], clampBoth);
  const scale = base + beatPunch(frame, beats, punchAmt, punchDecay) + extraScale;
  const px = interpolate(local, [0, dur], [0, panX], clampBoth);
  const py = interpolate(local, [0, dur], [0, panY], clampBoth);
  const [fx, fy] = focus;
  return (
    <AbsoluteFill>
      <Img
        src={comicImg(name)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${fx * 100}% ${fy * 100}%`,
          transform: `translate(${px}px, ${py}px) scale(${scale}) rotate(${rotate}deg)`,
          transformOrigin: `${fx * 100}% ${fy * 100}%`,
          filter: brightness !== 1 ? `brightness(${brightness})` : undefined,
        }}
      />
      {vignette ? (
        <AbsoluteFill style={{ background: vignette, pointerEvents: "none" }} />
      ) : null}
    </AbsoluteFill>
  );
};

const GOLD_VIGNETTE =
  "radial-gradient(95% 82% at 50% 40%, transparent 40%, rgba(5,7,10,0.6) 100%)";
const RED_VIGNETTE =
  "radial-gradient(100% 86% at 55% 45%, transparent 30%, rgba(40,10,8,0.42) 72%, rgba(5,7,10,0.7) 100%)";
const TERRA_VIGNETTE =
  "radial-gradient(95% 85% at 50% 52%, transparent 28%, rgba(120,34,20,0.3) 62%, rgba(5,7,10,0.7) 100%)";

/* --------------------------------------------------------------- DROP slam */

const DropCrash: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - B(4),
    fps,
    config: { damping: 13, stiffness: 150, mass: 0.9 },
  });
  const scale = interpolate(p, [0, 1], [1.28, 1.1]);
  const emberPush = interpolate(frame, [B(4), B(5)], [0, 0.04], clampBoth);
  const [fx, fy] = [0.5, 0.5];
  return (
    <AbsoluteFill>
      <Img
        src={comicImg("h4-liquidation")}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${fx * 100}% ${fy * 100}%`,
          transform: `scale(${scale + emberPush})`,
          transformOrigin: `${fx * 100}% ${fy * 100}%`,
          filter: "brightness(1.06) contrast(1.05)",
        }}
      />
      <AbsoluteFill style={{ background: TERRA_VIGNETTE, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------- aftermath cuts */

type AfterSeg = { from: number; to: number; name: ComicName; focus: Focus; tight?: boolean };
const AFTER: AfterSeg[] = [
  { from: bt(20), to: bt(21), name: "h2-inpublic", focus: [0.72, 0.5] }, // 288
  { from: bt(21), to: bt(22), name: "h4-liquidation", focus: [0.5, 0.5] }, // 302
  { from: bt(22), to: bt(23), name: "h4-liquidation", focus: [0.5, 0.5], tight: true }, // 317
  { from: bt(23), to: bt(24), name: "h2-inpublic", focus: [0.3, 0.55] }, // 331
  { from: bt(24), to: bt(25), name: "h4-liquidation", focus: [0.36, 0.6] }, // 345
  { from: bt(25), to: bt(26), name: "h3-onedip", focus: [0.55, 0.5] }, // 359
  { from: bt(26), to: bt(27), name: "h4-liquidation", focus: [0.62, 0.55] }, // 373
  { from: bt(27), to: bt(28), name: "h4-liquidation", focus: [0.5, 0.5], tight: true }, // 387
];

const AfterShot: React.FC<{ seg: AfterSeg }> = ({ seg }) => (
  <PanelImage
    name={seg.name}
    from={seg.from}
    to={seg.to}
    focus={seg.focus}
    baseFrom={seg.tight ? 1.28 : 1.12}
    baseTo={seg.tight ? 1.4 : 1.2}
    beats={[seg.from]}
    punchAmt={seg.tight ? 0.16 : 0.13}
    punchDecay={5}
    vignette={TERRA_VIGNETTE}
    brightness={1.05}
  />
);

const AFTER_BEATS = [bt(20), bt(21), bt(22), bt(23), bt(24), bt(25), bt(26), bt(27)] as const;

const AftermathStrobe: React.FC = () => {
  const frame = useCurrentFrame();
  let op = 0;
  for (const b of AFTER_BEATS) {
    if (frame >= b && frame <= b + 2) {
      const v = interpolate(frame, [b, b + 2], [0.3, 0], clampBoth);
      if (v > op) op = v;
    }
  }
  if (op <= 0.001) return null;
  return (
    <AbsoluteFill
      style={{ background: COLORS.terracotta, opacity: op, pointerEvents: "none" }}
    />
  );
};

/* ------------------------------------------------------------- letterbox */

const Letterbox: React.FC = () => {
  const frame = useCurrentFrame();
  const barH = 138; // 2.39:1 on a 1920×1080 frame
  const h = barH * interpolate(frame, [0, 7], [0, 1], clampBoth);
  const bar: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    height: h,
    background: INK,
    zIndex: 50,
  };
  return (
    <>
      <div style={{ ...bar, top: 0 }} />
      <div style={{ ...bar, bottom: 0 }} />
    </>
  );
};

/* ------------------------------------------------------------------ scene */

export const S1Problem: React.FC = () => {
  const frame = useCurrentFrame();

  // DROP screen-shake: ±8px + ±0.4°, decaying over bar 4.
  const shakeAmt = interpolate(frame, [B(4), B(4) + 7, B(5)], [0.4, 1, 0], clampBoth);
  const shakeX = Math.sin(frame * 2.4) * 8 * shakeAmt;
  const shakeY = Math.cos(frame * 3.1) * 7 * shakeAmt;
  const shakeRot = Math.sin(frame * 2.05) * 0.4 * shakeAmt;

  // bar-3 shake ramps into the drop (was baked into the old vault shot).
  const ramp = interpolate(frame, [B(3), B(4)], [0, 1], clampBoth);
  const jx = frame >= B(3) && frame < B(4) ? Math.sin(frame * 1.9) * 5 * ramp : 0;
  const jy = frame >= B(3) && frame < B(4) ? Math.cos(frame * 2.3) * 4 * ramp : 0;

  const inFalling = frame < B(2); // 0..120
  const inTerminal = frame >= B(2) && frame < B(3); // 120..176
  const inVault = frame >= B(3) && frame < B(4); // 176..232
  const inDrop = frame >= B(4) && frame < B(5); // 232..288
  const inAfter = frame >= B(5); // 288..401

  return (
    <AbsoluteFill style={{ background: INK }}>
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX + jx}px, ${shakeY + jy}px) rotate(${shakeRot}deg)`,
        }}
      >
        {/* IMAGE LAYER — one comic panel live at a time (hard cuts). */}
        {inFalling ? (
          <PanelImage
            name="h1-tokenized"
            from={0}
            to={B(2)}
            focus={[0.5, 0.44]}
            baseFrom={1.05}
            baseTo={1.16}
            beats={[bt(0), bt(1), bt(2), bt(3), bt(4), bt(5), bt(6), bt(7)]}
            punchAmt={0.05}
            panY={16}
            vignette={GOLD_VIGNETTE}
            brightness={1.05}
          />
        ) : null}

        {inTerminal ? (
          <PanelImage
            name="h2-inpublic"
            from={B(2)}
            to={B(3)}
            focus={[0.7, 0.5]}
            baseFrom={1.1}
            baseTo={1.18}
            beats={[bt(8), bt(9), bt(10), bt(11)]}
            punchAmt={0.06}
            panX={80}
            vignette={RED_VIGNETTE}
            brightness={1.04}
          />
        ) : null}

        {inVault ? (
          <PanelImage
            name="h3-onedip"
            from={B(3)}
            to={B(4)}
            focus={[0.55, 0.5]}
            baseFrom={1.08}
            baseTo={1.2}
            beats={[B(3), bt(13), bt(14), bt(15)]}
            punchAmt={0.09}
            panX={-16}
            vignette={RED_VIGNETTE}
            brightness={1.04}
          />
        ) : null}

        {inDrop ? <DropCrash /> : null}

        {inAfter
          ? AFTER.map((seg) =>
              frame >= seg.from && frame < seg.to ? (
                <AfterShot key={seg.from} seg={seg} />
              ) : null,
            )
          : null}

        {/* COMIC LETTERING LAYER — laid along each panel's diagonals. */}
        {/* h1: "YOUR TREASURY." arcs under the coin along the gold rays. */}
        {frame < B(1) ? (
          <ComicText text={"Your Treasury."} from={bt(0)} x={960} y={848} size={150} rotate={-3} skewX={-5} tiltX={8} fill={COLORS.goldSoft} />
        ) : null}
        {frame >= B(1) && frame < B(2) ? (
          <ComicText text={"Tokenized.\nOn-chain."} from={bt(4)} x={1000} y={770} size={112} rotate={4} skewX={6} tiltX={6} fill={COLORS.text} />
        ) : null}

        {/* h2: "YOUR LOAN. IN PUBLIC." tilted along the monitor rows. */}
        {frame >= B(2) && frame < B(3) ? (
          <ComicText text={"Your loan.\nIn public."} from={bt(8)} x={960} y={520} size={130} rotate={-4} skewX={-6} tiltX={7} fill={COLORS.text} />
        ) : null}

        {/* h3: word stabs step DOWN the vault light-gap. */}
        {frame >= bt(12) && frame < bt(13) ? (
          <ComicText text={"One"} from={bt(12)} x={880} y={300} size={190} rotate={-6} skewX={-4} fill={COLORS.text} />
        ) : null}
        {frame >= bt(13) && frame < bt(14) ? (
          <ComicText text={"Price"} from={bt(13)} x={975} y={500} size={190} rotate={3} skewX={4} fill={COLORS.text} />
        ) : null}
        {frame >= bt(14) && frame < B(4) ? (
          <ComicText text={"Dip…"} from={bt(14)} x={1080} y={710} size={190} rotate={10} skewX={8} fill={COLORS.amber} />
        ) : null}

        {/* DROP: "PUBLIC LIQUIDATION." slammed along the explosion speed-lines. */}
        {frame >= B(4) && frame < bt(20) ? (
          <ComicText
            text={"Public\nLiquidation."}
            from={B(4)}
            x={960}
            y={540}
            size={148}
            rotate={-8}
            skewX={-9}
            tiltX={10}
            variant="onomatopoeia"
            fill={COLORS.text}
            echoColor={COLORS.terracotta}
          />
        ) : null}

        {/* aftermath copy */}
        {frame >= bt(20) && frame < bt(26) ? (
          <ComicText text={"Sold.\nIn front of everyone."} from={bt(20)} x={960} y={556} size={104} rotate={-3} skewX={-5} tiltX={6} fill={COLORS.text} />
        ) : null}
        {frame >= bt(26) ? (
          <ComicText text={"It doesn't have to\nbe this way."} from={bt(26)} x={960} y={540} size={98} rotate={2} skewX={3} tiltX={5} fill={COLORS.goldSoft} />
        ) : null}

        {inAfter ? <AftermathStrobe /> : null}
      </AbsoluteFill>

      <Letterbox />

      {/* SFX kept sparse — the music carries the hook. One riser into the drop,
          one whoosh on the slam. */}
      <Sfx type="riser" at={B(3)} volume={0.4} />
      <Sfx type="whoosh" at={B(4)} volume={0.5} />
    </AbsoluteFill>
  );
};
