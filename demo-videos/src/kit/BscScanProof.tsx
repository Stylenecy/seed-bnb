import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scrambleHex } from "./anim";
import { BnbMark } from "./BnbBadge";
import { FONTS } from "./fonts";
import { Glass } from "./Glass";
import { BNB_GOLD, clamp, GLASS, SUCCESS } from "./tokens";

/**
 * Explorer-style proof card: a list of real contract addresses / tx hashes,
 * each row landing on its own LOCAL frame (`at`) with a hex-scramble resolve.
 * Pass REAL values only (from VERIFY-BNB.md / deployments json).
 */
export type ProofRow = {
  /** Left label, e.g. "IPayPool" or "deposit". */
  label: string;
  /** Full address / tx hash (0x…). Shortened for display when `short`. */
  value: string;
  /** Right-hand meta, e.g. "77,948 gas" or "feeBps 50". */
  meta?: string;
  /** Status pill text (default "Success" for txs when kind === "tx"). */
  status?: string;
  kind?: "address" | "tx";
  at: number;
  /** Highlight this row (accent border + glow). */
  hot?: boolean;
};

export const shortHex = (h: string, head = 10, tail = 8): string =>
  h.length <= head + tail + 1 ? h : `${h.slice(0, head)}…${h.slice(-tail)}`;

export const BscScanProof: React.FC<{
  title: string;
  subtitle?: string;
  rows: ProofRow[];
  /** LOCAL frame the card itself lands. */
  at: number;
  width?: number;
  accent?: string;
  /** Display full values (addresses) instead of shortened. */
  full?: boolean;
  network?: string;
}> = ({ title, subtitle, rows, at, width = 1180, accent = BNB_GOLD, full = false, network = "BSC Testnet · chainId 97" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 150, mass: 0.8 } });
  if (f < at) return null;
  return (
    <div style={{ width, transform: `translateY(${(1 - p) * 60}px) scale(${0.94 + 0.06 * p})`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <Glass radius={26} glow={0.35} glowColor="rgba(240,185,11,0.35)" fill="rgba(14,14,16,0.82)">
        <div style={{ padding: "26px 34px 14px", display: "flex", alignItems: "center", gap: 18, borderBottom: `1px solid ${GLASS.line}` }}>
          <BnbMark size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.manrope, fontWeight: 800, fontSize: 30, color: GLASS.txt, letterSpacing: "-0.01em" }}>{title}</div>
            {subtitle ? <div style={{ fontFamily: FONTS.mono, fontSize: 17, color: GLASS.txtDim, marginTop: 4 }}>{subtitle}</div> : null}
          </div>
          <div
            style={{
              fontFamily: FONTS.manrope,
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "0.14em",
              color: accent,
              border: `1px solid ${accent}66`,
              borderRadius: 999,
              padding: "8px 16px",
              textTransform: "uppercase",
            }}
          >
            {network}
          </div>
        </div>
        <div style={{ padding: "10px 20px 20px" }}>
          {rows.map((r, i) => {
            const rp = spring({ frame: f - r.at, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
            if (f < r.at) return <div key={i} style={{ height: 74 }} />;
            const shown = full ? r.value : shortHex(r.value, r.kind === "tx" ? 14 : 12, r.kind === "tx" ? 10 : 8);
            const status = r.status ?? (r.kind === "tx" ? "Success" : undefined);
            return (
              <div
                key={i}
                style={{
                  height: 64,
                  margin: "10px 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "0 16px",
                  borderRadius: 14,
                  background: r.hot ? "rgba(240,185,11,0.10)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${r.hot ? accent + "aa" : GLASS.line}`,
                  boxShadow: r.hot ? `0 0 28px rgba(240,185,11,0.25)` : undefined,
                  transform: `translateX(${(1 - rp) * 60}px)`,
                  opacity: interpolate(rp, [0, 0.35], [0, 1], clamp),
                }}
              >
                <div style={{ width: 230, fontFamily: FONTS.manrope, fontWeight: 700, fontSize: 24, color: r.hot ? accent : GLASS.txt }}>{r.label}</div>
                <div style={{ flex: 1, fontFamily: FONTS.mono, fontWeight: 500, fontSize: full ? 22 : 24, color: GLASS.txtMid, letterSpacing: "0.01em" }}>
                  {scrambleHex(f, shown, r.at, 12)}
                </div>
                {r.meta ? <div style={{ fontFamily: FONTS.mono, fontSize: 20, color: GLASS.txtDim }}>{r.meta}</div> : null}
                {status ? (
                  <div
                    style={{
                      fontFamily: FONTS.manrope,
                      fontWeight: 800,
                      fontSize: 16,
                      letterSpacing: "0.08em",
                      color: SUCCESS,
                      background: "rgba(52,199,89,0.12)",
                      border: "1px solid rgba(52,199,89,0.4)",
                      borderRadius: 8,
                      padding: "6px 12px",
                      textTransform: "uppercase",
                    }}
                  >
                    ✓ {status}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Glass>
    </div>
  );
};
