import React, { createContext } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * A single camera keyframe. `x`/`y` is the focus point in CONTENT coordinates
 * (the same coordinate space the scene lays its cards out in — which may be
 * wider than the 1920×1080 frame). `scale` is the zoom factor.
 */
export type CamKey = { frame: number; x: number; y: number; scale: number };

/**
 * Per-segment eased keyframe interpolation. Remotion's `interpolate` applies
 * the easing within each matched segment, so a hold segment (equal values)
 * stays still while motion segments ease in and out — never linear.
 */
export const interpKeys = (
  frame: number,
  keys: readonly CamKey[],
  sel: (k: CamKey) => number,
  easing = Easing.inOut(Easing.cubic),
): number => {
  if (keys.length === 1) return sel(keys[0]!);
  const frames = keys.map((k) => k.frame);
  const values = keys.map(sel);
  return interpolate(frame, frames, values, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/**
 * The camera's current scale, provided to descendants so a <Cursor> can
 * counter-scale itself and stay a constant on-screen size while the world
 * zooms underneath it.
 */
export const CameraScaleContext = createContext<number>(1);

export const Camera: React.FC<{
  keyframes: readonly CamKey[];
  children: React.ReactNode;
}> = ({ keyframes, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const scale = interpKeys(frame, keyframes, (k) => k.scale);
  const x = interpKeys(frame, keyframes, (k) => k.x);
  const y = interpKeys(frame, keyframes, (k) => k.y);

  // Translate so the focus point (x,y) lands at the frame centre after scaling.
  const tx = width / 2 - x * scale;
  const ty = height / 2 - y * scale;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        <CameraScaleContext.Provider value={scale}>
          {children}
        </CameraScaleContext.Provider>
      </div>
    </AbsoluteFill>
  );
};
