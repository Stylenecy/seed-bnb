import { interpolate } from "remotion";

/** A macOS-style pointer the scenes move around to simulate clicks/taps. The
 *  `down` value (0..1) drives a click-ring + a small press-shrink. */
export function Cursor({ x, y, down = 0 }: { x: number; y: number; down?: number }) {
  const scale = interpolate(down, [0, 1], [1, 0.82]);
  const ringSize = interpolate(down, [0, 1], [0, 46]);
  const ringOpacity = interpolate(down, [0, 0.2, 1], [0, 0.55, 0]);
  return (
    <div
      style={{ position: "absolute", left: x, top: y, zIndex: 9999, pointerEvents: "none", transform: "translate(-3px,-2px)" }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: ringSize,
          height: ringSize,
          marginLeft: -ringSize / 2 + 2,
          marginTop: -ringSize / 2 + 2,
          borderRadius: "9999px",
          border: "2px solid #6FFF00",
          opacity: ringOpacity,
        }}
      />
      <svg width="28" height="28" viewBox="0 0 24 24" style={{ transform: `scale(${scale})`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.55))" }}>
        <path d="M5 3l14 7-6 1.5L9.5 18 5 3z" fill="#ffffff" stroke="#010828" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
