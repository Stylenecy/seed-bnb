import React, { useContext } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraScaleContext } from "./Camera";

/**
 * A cursor waypoint: at `frame`, the cursor STARTS springing toward (x,y),
 * expressed in the same CONTENT coordinates the surrounding <Camera> uses.
 */
export type CursorKey = { frame: number; x: number; y: number };

/**
 * A spring-driven parchment pointer. It lives inside the camera's content
 * space (so it can point at world coordinates) but counter-scales by the
 * camera scale so it stays a constant ~28px on screen. The pointer springs
 * between waypoints — it should be given waypoints a beat BEFORE the camera
 * moves, so the camera appears to follow the cursor.
 */
export const Cursor: React.FC<{
  keyframes: readonly CursorKey[];
  size?: number;
  hidden?: boolean;
}> = ({ keyframes, size = 30, hidden = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camScale = useContext(CameraScaleContext);

  // Find the active waypoint (last one whose frame has passed).
  let idx = 0;
  for (let i = 0; i < keyframes.length; i++) {
    if (frame >= keyframes[i]!.frame) idx = i;
  }
  const to = keyframes[idx]!;
  const from = idx > 0 ? keyframes[idx - 1]! : to;

  const progress = spring({
    frame: frame - to.frame,
    fps,
    config: { damping: 22, stiffness: 130, mass: 0.9 },
  });

  const x = interpolate(progress, [0, 1], [from.x, to.x]);
  const y = interpolate(progress, [0, 1], [from.y, to.y]);

  // Keep the pointer a constant on-screen size regardless of camera zoom.
  const s = size / camScale;

  if (hidden) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: s,
        height: s,
        transform: "translate(-14%, -8%)",
        pointerEvents: "none",
      }}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        style={{
          filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.55))",
          display: "block",
        }}
      >
        {/* Classic arrow pointer: parchment fill, ink outline. */}
        <path
          d="M4 2 L4 19 L8.5 14.8 L11.3 21.2 L14.1 20 L11.3 13.7 L17.5 13.7 Z"
          fill="#f3ede2"
          stroke="#0a0c10"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
