import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Keyframed camera over a content plane. `x,y` = focus point in CONTENT px,
 * `scale` = zoom. Put keyframes ON beats: a move starts on one beat and lands
 * on a later one (hold segments = two keys with equal values).
 */
export type CamKey = { frame: number; x: number; y: number; scale: number; rot?: number };

export const interpKeys = (
  frame: number,
  keys: readonly CamKey[],
  sel: (k: CamKey) => number,
  easing = Easing.inOut(Easing.cubic),
): number => {
  if (keys.length === 1) return sel(keys[0]!);
  return interpolate(
    frame,
    keys.map((k) => k.frame),
    keys.map(sel),
    { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
};

/** Current camera scale (so a Cursor can counter-scale and stay constant size). */
export const CameraScaleContext = createContext<number>(1);
export const useCameraScale = () => useContext(CameraScaleContext);

export const Camera: React.FC<{
  keyframes: readonly CamKey[];
  children: React.ReactNode;
  /** Content plane size (defaults to the video size). */
  width?: number;
  height?: number;
  easing?: (t: number) => number;
}> = ({ keyframes, children, width, height, easing }) => {
  const frame = useCurrentFrame();
  const vc = useVideoConfig();
  const W = width ?? vc.width;
  const H = height ?? vc.height;
  const scale = interpKeys(frame, keyframes, (k) => k.scale, easing);
  const x = interpKeys(frame, keyframes, (k) => k.x, easing);
  const y = interpKeys(frame, keyframes, (k) => k.y, easing);
  const rot = interpKeys(frame, keyframes, (k) => k.rot ?? 0, easing);
  const tx = vc.width / 2 - x * scale;
  const ty = vc.height / 2 - y * scale;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `translate(${tx}px, ${ty}px) scale(${scale}) translate(${x}px, ${y}px) rotate(${rot}deg) translate(${-x}px, ${-y}px)`,
          transformOrigin: "0 0",
        }}
      >
        <CameraScaleContext.Provider value={scale}>{children}</CameraScaleContext.Provider>
      </div>
    </AbsoluteFill>
  );
};
