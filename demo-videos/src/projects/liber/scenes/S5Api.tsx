import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  clamp,
  CoinDot,
  ComicPanel,
  ComicText,
  fadeUp,
  Glass,
  Halftone,
  INK,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  steppedCount,
  useBeatPunch,
  useSceneClock,
  Wallet,
} from "../../../kit";
import { BnbCoin } from "../art";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S5 · BACKEND, LIVE (bars 23–28). The real Hono API (CHAIN_ID=97,
 * publicnode RPC, MockUSDC) answering the capture run — values as returned.
 *   23  BREAK: slides in, title + "Hono + Postgres · reads BSC testnet"
 *   24  DROP: POST /users (fresh wallet, 0 BNB)  → 202 awaiting_funding   ("NOT YET!")
 *   25       POST /users (funded smoke wallet)   → 201 {userId}            ("ACTIVATED!")
 *   26       GET /users/:id/balance              → usdcBalance "995" (counter ticks b0–b3)
 *   27  BREAK: "read from the contract" — balanceOf + decimals() on MockUSDC
 */
type Req = { bar: number; method: string; path: string; body?: string; status: string; statusColor: string; resp: string };

const StatusStamp: React.FC<{ text: string; color: string; at: number }> = ({ text, color, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 240, mass: 0.6 } });
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 16px",
        borderRadius: 10,
        border: `3px solid ${color}`,
        color,
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: 30,
        transform: `scale(${1.8 - 0.8 * p}) rotate(${(1 - p) * -8}deg)`,
        boxShadow: `0 0 20px ${color}66`,
      }}
    >
      {text}
    </span>
  );
};

export const S5Api: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.api; // 23

  const REQS: Req[] = [
    { bar: k + 1, method: "POST", path: "/users", body: '{"walletAddress":"0x56a0f687…4C1B"}  · 0 BNB', status: "202", statusColor: "#F0B90B", resp: '{"status":"awaiting_funding"}' },
    { bar: k + 2, method: "POST", path: "/users", body: '{"walletAddress":"0xE2D654a8…18b5"}  · funded', status: "201", statusColor: C.bright, resp: '{"userId":"2d47db19-005b-…"}' },
    { bar: k + 3, method: "GET", path: "/users/2d47db19…/balance", status: "200", statusColor: C.bright, resp: '{"usdcBalance":"995", …}' },
  ];
  const bal = steppedCount(frame, [b(k + 3), b(k + 3, 1), b(k + 3, 2), b(k + 3, 3)], [0, 250, 640, 995]);
  const pA = useBeatPunch(beatsIn(k + 1, k + 4), 0.03, 4);
  const coinFall = interpolate(frame, [b(k + 2), b(k + 2) + 10], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(47,217,138,0.18)" glowB="rgba(240,185,11,0.14)" glow="top" floor={0.4} grid={0.5} />
      <Halftone opacity={0.035} gap={22} />

      <ComicText text="The backend, live" from={b(k)} x={960} y={120} size={100} rotate={-2} skewX={-5} fill={C.gold} stagger={1} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 184, textAlign: "center", fontFamily: F.display, fontStyle: "italic", fontSize: 34, color: C.text, ...fadeUp(frame, b(k, 2), 10, 14) }}>
        Hono + Postgres · reads BNB Chain testnet (chainId 97)
      </div>

      <Pulse intensity={0.55} shake={0.2} glow={false}>
        <div style={{ position: "absolute", left: 90, top: 270, width: 1130 }}>
          {frame >= b(k, 1) ? (
            <div style={fadeUp(frame, b(k, 1), 12, 40)}>
              <Glass radius={24} glow={0.4} glowColor="rgba(47,217,138,0.3)" fill="rgba(6,16,12,0.9)">
                <div style={{ padding: "16px 26px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                    <span key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c, opacity: 0.85 }} />
                  ))}
                  <span style={{ marginLeft: 14, fontFamily: F.mono, fontSize: 20, color: C.dim }}>liber-backend · :3261 · BSC_RPC_URL=bsc-testnet-rpc.publicnode.com</span>
                </div>
                <div style={{ padding: "18px 30px 26px", minHeight: 560 }}>
                  {REQS.map((r, i) =>
                    frame >= b(r.bar) ? (
                      <div key={i} style={{ marginTop: i ? 26 : 4, ...fadeUp(frame, b(r.bar), 8, 20) }}>
                        <div style={{ fontFamily: F.mono, fontSize: 28, color: C.text }}>
                          <span style={{ color: C.gold }}>$ </span>
                          <span style={{ color: r.method === "GET" ? "#8ab4ff" : C.bright, fontWeight: 700 }}>{r.method}</span> {r.path}
                        </div>
                        {r.body ? <div style={{ fontFamily: F.mono, fontSize: 22, color: C.dim, marginTop: 6, paddingLeft: 30 }}>{r.body}</div> : null}
                        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10, paddingLeft: 30 }}>
                          <StatusStamp text={r.status} color={r.statusColor} at={b(r.bar, 1)} />
                          <span style={{ fontFamily: F.mono, fontSize: 26, color: r.statusColor, opacity: interpolate(frame, [b(r.bar, 1), b(r.bar, 1) + 6], [0, 1], clamp) }}>{r.resp}</span>
                        </div>
                      </div>
                    ) : null,
                  )}
                  {frame >= b(k + 4) ? (
                    <div style={{ marginTop: 30, fontFamily: F.sans, fontSize: 28, color: C.dim, ...fadeUp(frame, b(k + 4), 10, 16) }}>
                      <span style={{ color: C.bright }}>✓ </span>
                      <span style={{ fontFamily: F.mono, color: C.text }}>balanceOf</span> + <span style={{ fontFamily: F.mono, color: C.text }}>decimals()</span> on MockUSDC{" "}
                      <span style={{ fontFamily: F.mono, color: C.gold }}>{CHAIN.mockUsdc.slice(0, 6)}…{CHAIN.mockUsdc.slice(-4)}</span>
                    </div>
                  ) : null}
                </div>
              </Glass>
            </div>
          ) : null}
        </div>

        {/* Right: the comic gate — what the backend sees on-chain. */}
        <ComicPanel at={b(k + 1)} x={1290} y={290} w={540} h={600} rot={1.8} bg={frame >= b(k + 3) ? "#B8F5D6" : frame >= b(k + 2) ? "#FFE9A8" : "#FFD0C4"} bg2={frame >= b(k + 3) ? C.bright : frame >= b(k + 2) ? "#F0B90B" : "#E88A6F"} from="right" punch={pA}>
          <svg width={540} height={600} viewBox="0 0 540 600" style={{ position: "absolute", inset: 0 }}>
            {frame < b(k + 2) ? <Wallet x={270} y={300} s={1.6} label="0 BNB" fill="#5b3a22" /> : null}
            {frame >= b(k + 2) && frame < b(k + 3) ? (
              <>
                <Wallet x={270} y={360} s={1.6} label="HAS BNB" fill="#5b3a22" />
                <BnbCoin x={270} y={120 + 110 * coinFall} s={1.1} opacity={1 - Math.max(0, coinFall - 0.9) * 10} />
              </>
            ) : null}
            {frame >= b(k + 3) ? (
              <>
                {[0, 1, 2, 3, 4].map((i) => (frame >= b(k + 3, Math.min(3, i)) ? <CoinDot key={i} cx={270} cy={400 - i * 44} r={80} face="#6FB1FF" ring="#D6E9FF" scaleX={1} /> : null))}
              </>
            ) : null}
          </svg>
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 26, textAlign: "center" }}>
            {frame >= b(k + 3) ? (
              <div style={{ fontFamily: F.comic, fontSize: 110, color: "#fff", WebkitTextStroke: `4px ${INK}`, paintOrder: "stroke fill", textShadow: `6px 6px 0 ${INK}` }}>{bal} USDC</div>
            ) : (
              <div style={{ fontFamily: F.comic, fontSize: 54, color: INK }}>{frame >= b(k + 2) ? "HAS GAS → ACTIVE" : "NO GAS → WAIT"}</div>
            )}
          </div>
        </ComicPanel>
      </Pulse>

      <ComicText text="NOT YET!" from={b(k + 1, 2)} x={1560} y={300} size={86} rotate={-8} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="ACTIVATED!" from={b(k + 2, 2)} x={1560} y={300} size={80} rotate={6} fill={C.bright} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3)} />
      <ComicText text={"READ FROM\nTHE CONTRACT!"} from={b(k + 4, 1)} x={1540} y={960} size={64} rotate={-4} fill={C.gold} variant="onomatopoeia" echoColor={C.emerald} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      <Sfx name="whoosh" at={b(k, 1)} volume={0.4} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`r${i}`} name="impact" at={b(k + i)} volume={0.6} />
      ))}
      {[1, 2, 3].map((i) => (
        <Sfx key={`s${i}`} name="tick" at={b(k + i, 1)} volume={0.6} />
      ))}
      {[1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k + 3, i)} volume={0.55} />
      ))}
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.6} />
    </AbsoluteFill>
  );
};
