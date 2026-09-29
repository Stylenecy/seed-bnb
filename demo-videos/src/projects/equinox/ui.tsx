import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, Glass } from "../../kit";
import { C, F, hfColor } from "./theme";

/**
 * Equinox mark, redrawn from frontend/components/ui/Logo.tsx (ring + two
 * horizon arcs, the lower one in the lime accent). `draw` 0..1 draws it on.
 */
export const EqxMark: React.FC<{ size?: number; draw?: number; glow?: boolean }> = ({ size = 120, draw = 1, glow = true }) => {
  const ring = 2 * Math.PI * 12;
  const arc = 20;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" style={{ display: "block", overflow: "visible", filter: glow ? `drop-shadow(0 0 ${size * 0.08}px rgba(228,243,61,0.45))` : undefined }}>
      <defs>
        <linearGradient id="eqx-ring" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ededeb" />
          <stop offset="100%" stopColor="#a6a6a1" />
        </linearGradient>
      </defs>
      <circle cx="14" cy="14" r="12" fill="none" stroke="url(#eqx-ring)" strokeWidth="1.4" strokeDasharray={ring} strokeDashoffset={ring * (1 - draw)} transform="rotate(-90 14 14)" />
      <path d="M5.5 18.2 Q14 11.2 22.5 18.2" fill="none" stroke={C.lime} strokeWidth="1.6" strokeLinecap="round" strokeDasharray={arc} strokeDashoffset={arc * (1 - Math.min(1, draw * 1.4))} />
      <path d="M5.5 14 Q14 7 22.5 14" fill="none" stroke="#ededeb" strokeWidth="1.1" strokeLinecap="round" opacity={0.5 * draw} />
    </svg>
  );
};

/** "UI PREVIEW · MOCK DATA" tag — mandatory on every frontend capture. */
export const MockTag: React.FC<{ at?: number; style?: React.CSSProperties; size?: number }> = ({ at = 0, style, size = 22 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 220, mass: 0.6 } });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: `${size * 0.45}px ${size * 0.9}px`,
        borderRadius: 999,
        background: "rgba(24,19,10,0.94)",
        border: `1.5px solid ${C.amber}aa`,
        color: C.amber,
        fontFamily: F.sans,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        transform: `scale(${0.7 + 0.3 * p})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        ...style,
      }}
    >
      <span style={{ width: size * 0.45, height: size * 0.45, borderRadius: 99, background: C.amber }} />
      UI preview · mock data
    </div>
  );
};

/**
 * A 1920×1080 capture drawn `w` px wide inside a glass browser frame. The
 * mock account e-mail in the app header is covered (it is placeholder data).
 * `children` render in SCREENSHOT px (scaled with the image).
 */
export const Shot: React.FC<{ src: string; w: number; url?: string; redactHeader?: boolean; glow?: number; children?: React.ReactNode }> = ({
  src,
  w,
  url = "localhost:3230",
  redactHeader = false,
  glow = 0.35,
  children,
}) => {
  const barH = Math.round(w * 0.032);
  const k = (w - 3) / 1920;
  return (
    <Glass radius={18} glow={glow} glowColor="rgba(145,129,245,0.4)" fill="#0e0e10">
      <div style={{ height: barH, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: barH * 0.32, height: barH * 0.32, borderRadius: 99, background: c, opacity: 0.85 }} />
        ))}
        <div
          style={{
            marginLeft: 16,
            width: w * 0.4,
            height: barH * 0.6,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.55)",
            fontFamily: F.mono,
            fontSize: barH * 0.34,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: w - 3, height: (w - 3) * (1080 / 1920), overflow: "hidden" }}>
        <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          {redactHeader ? (
            <div
              style={{
                position: "absolute",
                left: 1600,
                top: 10,
                width: 250,
                height: 44,
                borderRadius: 999,
                background: "#101412",
                border: "1px solid rgba(22,217,168,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontFamily: F.sans,
                fontSize: 17,
                color: C.emeraldSoft,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 99, background: C.emerald }} /> demo account
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </Glass>
  );
};

/**
 * Code-drawn health-factor gauge in the app's HealthGauge style: 270° arc,
 * fill mapped from HF 1.0 → 2.5, colour from the app's statusForHF.
 * `hf` = null shows "∞" (no debt yet).
 */
export const HfGauge: React.FC<{ hf: number | null; size?: number; minHf?: number; label?: string }> = ({ hf, size = 460, minHf = 1.5, label }) => {
  const gid = `hfg${React.useId().replace(/:/g, "")}`;
  const r = 86;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.75;
  const fill = hf === null ? 1 : Math.min(1, Math.max(0, (hf - 1) / 1.5));
  const col = hf === null ? C.emerald : hfColor(hf + 1e-9);
  const status = hf === null ? "No debt" : hf >= 1.5 ? "Safe" : hf >= 1.3 ? "Caution" : "Defense needed";
  // minHf tick position on the arc
  const mf = (minHf - 1) / 1.5;
  const ang = ((135 + 270 * mf) * Math.PI) / 180;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 220 220" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={gid} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={col} stopOpacity={0.22} />
            <stop offset="100%" stopColor={col} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx="110" cy="110" r="104" fill={`url(#${gid})`} />
        <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} transform="rotate(135 110 110)" />
        <circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash * fill} ${circ}`}
          transform="rotate(135 110 110)"
          style={{ filter: `drop-shadow(0 0 8px ${col})` }}
        />
        {/* minHf tick */}
        <line x1={110 + Math.cos(ang) * 70} y1={110 + Math.sin(ang) * 70} x2={110 + Math.cos(ang) * 102} y2={110 + Math.sin(ang) * 102} stroke={C.lime} strokeWidth="3" strokeLinecap="round" />
        <text x={110 + Math.cos(ang) * 118} y={110 + Math.sin(ang) * 118 + 3} textAnchor="middle" fontFamily={F.mono} fontSize="9" fill={C.lime}>
          min 1.50
        </text>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: "0.3em", color: C.textMuted, fontWeight: 600 }}>{label ?? "HEALTH FACTOR"}</div>
        <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: size * 0.24, color: col, lineHeight: 1.05, fontVariantNumeric: "tabular-nums", textShadow: `0 0 30px ${col}66` }}>
          {hf === null ? "∞" : hf.toFixed(2)}
        </div>
        <div
          style={{
            marginTop: 8,
            padding: "6px 16px",
            borderRadius: 999,
            border: `1px solid ${col}88`,
            background: `${col}18`,
            color: col,
            fontFamily: F.sans,
            fontWeight: 700,
            fontSize: size * 0.04,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          ● {status}
        </div>
      </div>
    </div>
  );
};
