import React from "react";
import { Img } from "remotion";
import { Glass } from "./Glass";

/**
 * Device frames for REAL screenshots of a project's frontend.
 *   <PhoneFrame src=… width={420} />   — mobile capture (e.g. 860×1864 @2x)
 *   <BrowserFrame src=… width={1400} url="app.example" /> — desktop capture
 * Both are glass-bordered with a soft glow; the image fills the screen area.
 * `children` render on top of the screen (overlays, cursor, highlights) in
 * the screen's own px coordinates.
 */
export const PhoneFrame: React.FC<{
  src: string;
  width?: number;
  /** Source image aspect (h / w). */
  aspect?: number;
  glow?: number;
  glowColor?: string;
  /** Vertical scroll of the screenshot inside the screen (px of screen). */
  scrollY?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ src, width = 420, aspect = 1864 / 860, glow = 0.5, glowColor, scrollY = 0, children, style }) => {
  const bezel = Math.round(width * 0.035);
  const screenW = width - bezel * 2;
  const screenH = Math.round(screenW * Math.min(aspect, 2.16));
  return (
    <div style={{ width, ...style }}>
      <Glass radius={width * 0.13} glow={glow} glowColor={glowColor} fill="#0b0b0c" innerStyle={{ padding: bezel }}>
        <div style={{ position: "relative", width: screenW, height: screenH, borderRadius: width * 0.1, overflow: "hidden", background: "#141414" }}>
          <Img src={src} style={{ position: "absolute", left: 0, top: -scrollY, width: screenW, height: screenW * aspect }} />
          {/* dynamic island */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: bezel * 0.7,
              width: screenW * 0.3,
              height: screenW * 0.075,
              transform: "translateX(-50%)",
              borderRadius: 999,
              background: "#000",
            }}
          />
          {children}
        </div>
      </Glass>
    </div>
  );
};

export const BrowserFrame: React.FC<{
  src: string;
  width?: number;
  aspect?: number;
  url?: string;
  glow?: number;
  glowColor?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ src, width = 1400, aspect = 1000 / 1600, url = "", glow = 0.4, glowColor, children, style }) => {
  const barH = Math.round(width * 0.032);
  return (
    <div style={{ width, ...style }}>
      <Glass radius={18} glow={glow} glowColor={glowColor} fill="#0e0e10">
        <div style={{ height: barH, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: barH * 0.32, height: barH * 0.32, borderRadius: 99, background: c, opacity: 0.85 }} />
          ))}
          <div
            style={{
              marginLeft: 16,
              flex: 1,
              maxWidth: width * 0.45,
              height: barH * 0.6,
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.55)",
              fontFamily: "monospace",
              fontSize: barH * 0.34,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
            }}
          >
            {url}
          </div>
        </div>
        <div style={{ position: "relative", width: width - 3, height: (width - 3) * aspect, overflow: "hidden" }}>
          <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
          {children}
        </div>
      </Glass>
    </div>
  );
};
