import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Robot, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { AddressTag, CoinStack, FanOut, TypeStamps } from "../art";
import { C, CHAIN, F, short } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 23–28). Slides in on 23 (title + "4 STEPS."), then one
 * comic step per bar, slamming on the downbeat, detail on b2:
 *   24 (DROP) PASTE AN ADDRESS  CLI `scan-chain`, HTTP, or the MCP tool
 *   25 FAN OUT    11 public RPCs in parallel — BSC 56 · opBNB 204 · BSC Testnet 97 first
 *   26 CLASSIFY   eth_getCode → EOA / Contract · native + USDT/USDC/FDUSD at 18 decimals
 *   27 REPORT     a table for you, JSON for the agent (scan_chain)
 */
const PW = 404;
const PH = 600;
const PY = 300;
const GAP = 38;
const X0 = (1920 - (PW * 4 + GAP * 3)) / 2;
const px = (i: number) => X0 + i * (PW + GAP);

const Step: React.FC<{ n: number; title: string; sub: string; subAt: number; children: React.ReactNode }> = ({ n, title, sub, subAt, children }) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", left: 22, top: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 54, height: 54, borderRadius: 99, background: INK, color: C.gold, fontFamily: F.comic, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
        <span style={{ fontFamily: F.comic, fontSize: 40, color: INK, letterSpacing: "0.03em" }}>{title}</span>
      </div>
      <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", inset: 0 }}>
        {children}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          padding: "12px 16px",
          background: "#f4efe4",
          border: `4px solid ${INK}`,
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 24,
          lineHeight: 1.25,
          color: INK,
          opacity: interpolate(f, [subAt, subAt + 5], [0, 1], clamp),
          transform: `translateY(${interpolate(f, [subAt, subAt + 7], [16, 0], clamp)}px)`,
        }}
      >
        {sub}
      </div>
    </>
  );
};

export const S3HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 23
  const s = k + 1; // 24

  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(s + i, s + i + 1), 0.025, 5)); // eslint-disable-line react-hooks/rules-of-hooks
  const title = interpolate(frame, [b(k), b(k) + 10], [0, 1], clamp);
  const fan = interpolate(frame, [b(s + 1), b(s + 1, 3)], [0, 1], clamp);
  const which = frame >= b(s + 2, 2) ? "both" : frame >= b(s + 2, 1) ? "eoa" : "none";

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(70,214,208,0.16)" glowB="rgba(232,99,58,0.12)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 92, textAlign: "center", opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: "0.3em", color: C.signal }}>HOW IT WORKS</div>
        <div style={{ fontFamily: F.display, fontSize: 80, color: C.bone, marginTop: 2 }}>
          One address in. <i style={{ color: C.gold }}>Eleven chains out.</i>
        </div>
      </div>

      <Pulse intensity={1} shake={0.4}>
        <ComicPanel at={b(s)} x={px(0)} y={PY} w={PW} h={PH} rot={-1.4} bg="#FFE0D2" bg2="#e8633a" from="up" punch={punches[0]}>
          <Step n={1} title="PASTE AN ADDRESS" sub="CLI scan-chain, the HTTP API, or the MCP tool." subAt={b(s, 2)}>
            <g transform="translate(202 250)">
              <rect x={-165} y={-95} width={330} height={190} rx={14} fill={C.void} stroke={INK} strokeWidth={7} />
              <text x={-140} y={-45} fontFamily={F.mono} fontWeight={700} fontSize={24} fill={C.signal}>
                $ tessera
              </text>
              <text x={-140} y={-10} fontFamily={F.mono} fontWeight={700} fontSize={24} fill={C.bone}>
                scan-chain
              </text>
            </g>
            <AddressTag x={210} y={330} s={0.95} rot={-5} text={short(CHAIN.hotWallet)} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 1)} x={px(1)} y={PY + 14} w={PW} h={PH} rot={1.2} bg="#FFF1BF" bg2="#F0B90B" from="down" punch={punches[1]}>
          <Step n={2} title="FAN OUT" sub="11 public RPCs in parallel. BSC 56 · opBNB 204 · Testnet 97 first." subAt={b(s + 1, 2)}>
            <FanOut x={202} y={275} r={140} p={fan} labels={["56", "204", "97", "ETH", "BASE", "OP", "ARB", "MNT", "SCR", "LNA", "ZK"]} hot={[0, 1, 2]} s={0.95} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 2)} x={px(2)} y={PY - 6} w={PW} h={PH} rot={-1} bg="#DDF7F5" bg2="#46d6d0" from="down" punch={punches[2]}>
          <Step n={3} title="CLASSIFY" sub="eth_getCode → EOA or Contract. Native + USDT/USDC/FDUSD (18 dp)." subAt={b(s + 2, 2)}>
            <TypeStamps x={200} y={210} which={which} />
            <CoinStack x={200} y={390} s={0.85} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 3)} x={px(3)} y={PY + 8} w={PW} h={PH} rot={1.5} bg="#E9E4D6" bg2="#9ba39f" from="right" punch={punches[3]}>
          <Step n={4} title="REPORT" sub="A table for you. JSON for the agent's scan_chain tool." subAt={b(s + 3, 2)}>
            <g transform="translate(250 190)">
              <rect x={-120} y={-80} width={240} height={170} rx={10} fill={C.void} stroke={INK} strokeWidth={7} />
              {[0, 1, 2, 3].map((r) => (
                <g key={r}>
                  <rect x={-100} y={-58 + r * 36} width={90} height={16} rx={4} fill={r === 0 ? C.gold : C.boneDim} />
                  <rect x={0} y={-58 + r * 36} width={80} height={16} rx={4} fill={r === 1 ? C.ember : C.signal} opacity={frame >= b(s + 3, 1) ? 1 : 0.3} />
                </g>
              ))}
            </g>
            <Robot x={110} y={370} s={0.8} mood="happy" visor={C.signal} fill={C.ember} />
          </Step>
        </ComicPanel>

        {[0, 1, 2].map((i) => (
          <InkArrow key={i} x1={px(i) + PW - 30} y1={PY + 110} x2={px(i + 1) + 40} y2={PY + 110} at={b(s + i + 1) - 4} dur={6} bend={-30} color={C.gold} width={6} />
        ))}
      </Pulse>

      <ComicText text="4 STEPS." from={b(k, 2)} x={960} y={620} size={170} rotate={-4} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(s) - 2} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Sfx name="impact" at={b(s + i)} volume={0.7} />
          <Sfx name="tick" at={b(s + i, 2)} volume={0.5} />
        </React.Fragment>
      ))}
      <Sfx name="tick" at={b(s + 2, 1)} volume={0.5} />
    </AbsoluteFill>
  );
};
