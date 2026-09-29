import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicText, fadeUp, Glass, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · THE BSC-ONLY BUG (bars 32–34, phrase downbeat). VERIFY-BNB.md "Bug found
 * on the live chain (fixed)": web3.py 7 rejected the first real BSC block.
 *   32 b0 traceback "ExtraDataLengthError" → "CRASH!"; b1 279 bytes vs the 32-byte slot (drawn to scale)
 *      b2 "BSC is PoSA" · b3 "the anvil fork never hit it"
 *   33 b0 the fix in bnb/client.py → "FIXED!"; b1 header accepted; b2 smoke tests PASS
 */
const PX_PER_BYTE = 2.4;

export const S6Bug: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.bug; // 32
  const fixed = frame >= b(k + 1);
  const grow = interpolate(frame, [b(k, 1), b(k, 1) + 12], [32, CHAIN.extraData], clamp);
  const shake = !fixed && frame < b(k, 1) + 14 ? Math.sin(frame * 2.3) * interpolate(frame, [b(k), b(k) + 14], [14, 0], clamp) : 0;
  const barCol = fixed ? C.pos : C.red;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA={fixed ? "rgba(143,220,170,0.28)" : "rgba(248,113,113,0.3)"} glowB="rgba(240,185,11,0.12)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={22} />

      <div style={{ position: "absolute", left: 90, top: 58 }}>
        <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: "0.26em", color: fixed ? C.pos : C.red }}>FOUND ON THE REAL TESTNET · NOT ON THE FORK</div>
        <div style={{ fontFamily: F.sans, fontWeight: 500, letterSpacing: "-0.02em", fontSize: 64, color: C.text, marginTop: 4 }}>
          A BSC-only bug, <span style={{ fontFamily: F.serif, fontStyle: "italic", color: C.bone, fontSize: 76 }}>caught live.</span>
        </div>
      </div>

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        <div style={{ position: "absolute", left: 90, top: 250, width: 1010, transform: `translateX(${shake}px)` }}>
          <Glass radius={22} glow={0.5} glowColor={fixed ? "rgba(143,220,170,0.5)" : "rgba(248,113,113,0.55)"} fill="rgba(8,14,11,0.96)">
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.line}` }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, opacity: 0.85 }} />
              ))}
              <span style={{ marginLeft: 14, fontFamily: F.mono, fontSize: 20, color: C.textMuted }}>{fixed ? "bridgeagent/src/bridgeagent/bnb/client.py" : "python scripts/bnb_smoke_test.py · real BSC testnet"}</span>
            </div>
            <div style={{ padding: "22px 26px", minHeight: 420, fontFamily: F.mono, fontSize: fixed ? 21 : 25, lineHeight: 1.7, whiteSpace: "pre" }}>
              {!fixed ? (
                <>
                  <div style={{ color: C.textMuted }}>Traceback (most recent call last):</div>
                  <div style={{ color: C.textMuted }}>  … w3.eth.get_block("latest")</div>
                  <div style={{ color: C.red, fontWeight: 700, ...fadeUp(frame, b(k), 4, 8) }}>web3.exceptions.ExtraDataLengthError:</div>
                  {frame >= b(k, 1) ? <div style={{ color: C.red, ...fadeUp(frame, b(k, 1), 4, 8) }}>  "extraData is {CHAIN.extraData} bytes, but should be 32"</div> : null}
                  {frame >= b(k, 2) ? <div style={{ color: C.amber, marginTop: 14, ...fadeUp(frame, b(k, 2), 6, 8) }}># BSC is PoSA: every header carries long extraData</div> : null}
                  {frame >= b(k, 3) ? <div style={{ color: C.amber, ...fadeUp(frame, b(k, 3), 6, 8) }}># anvil forks mint short headers, so the fork run never hit it</div> : null}
                </>
              ) : (
                <>
                  <div style={{ color: C.textMuted }}>w3 = Web3(Web3.HTTPProvider(config.BNB_RPC_URL))</div>
                  <div style={{ color: C.textDim }}># BSC is a PoSA chain: block extraData exceeds 32 bytes</div>
                  <div style={{ color: C.pos, background: "rgba(143,220,170,0.1)" }}>+ try:  # web3 &gt;= 7</div>
                  <div style={{ color: C.pos, background: "rgba(143,220,170,0.1)" }}>+     from web3.middleware import ExtraDataToPOAMiddleware as _poa</div>
                  <div style={{ color: C.pos, background: "rgba(143,220,170,0.1)" }}>+ except ImportError:  # web3 6.x</div>
                  <div style={{ color: C.pos, background: "rgba(143,220,170,0.1)" }}>+     from web3.middleware import geth_poa_middleware as _poa</div>
                  <div style={{ color: C.pos, background: "rgba(143,220,170,0.1)", fontWeight: 700 }}>+ w3.middleware_onion.inject(_poa, layer=0)</div>
                  {frame >= b(k + 1, 2) ? <div style={{ color: C.gold, marginTop: 12, fontWeight: 700, ...fadeUp(frame, b(k + 1, 2), 6, 8) }}>bnb_smoke_test.py PASS · runtime_mirror_smoke.py PASS</div> : null}
                </>
              )}
            </div>
          </Glass>
        </div>

        {/* header diagram: the extraData field vs web3's 32-byte slot, to scale */}
        <div style={{ position: "absolute", left: 1150, top: 270, width: 690 }}>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textMuted, letterSpacing: "0.16em", marginBottom: 16 }}>BLOCK HEADER · extraData</div>
          <div style={{ position: "relative", height: 150, borderRadius: 16, border: `2px solid ${C.line}`, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ position: "absolute", left: 20, top: 40, height: 70, width: grow * PX_PER_BYTE * (fixed ? 1 : 1), maxWidth: 650, borderRadius: 10, background: barCol, boxShadow: `0 0 30px ${barCol}`, border: `4px solid ${INK}` }} />
            <div style={{ position: "absolute", left: 20 + 32 * PX_PER_BYTE, top: 12, bottom: 12, width: 5, background: C.gold, borderRadius: 3 }} />
            <div style={{ position: "absolute", left: 20 + 32 * PX_PER_BYTE - 40, top: 156, fontFamily: F.mono, fontSize: 20, color: C.gold }}>32 B</div>
            <div style={{ position: "absolute", right: 16, top: 156, fontFamily: F.mono, fontSize: 24, fontWeight: 700, color: barCol }}>{Math.round(grow)} B</div>
          </div>
          <div style={{ marginTop: 70, padding: "18px 24px", borderRadius: 16, border: `2px solid ${barCol}88`, background: `${barCol}14`, fontFamily: F.sans, fontWeight: 600, fontSize: 32, color: barCol, textAlign: "center" }}>
            {fixed ? "POA middleware at layer 0 → header accepted" : "web3.py default validation → rejected"}
          </div>
        </div>
      </Pulse>

      <SpeedBurst cx={1500} cy={870} from={b(k)} count={18} inner={140} spread={380} color={C.red} opacity={0.5} width={7} seed="crash" fade />
      <ComicText text="CRASH!" from={b(k)} x={1490} y={880} size={190} rotate={-7} skewX={-6} fill={C.red} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1) - 2} />
      <SpeedBurst cx={1500} cy={870} from={b(k + 1)} count={18} inner={140} spread={380} color={C.pos} opacity={0.5} width={7} seed="fix" fade />
      <ComicText text="FIXED!" from={b(k + 1)} x={1490} y={880} size={190} rotate={-5} skewX={-6} fill={C.pos} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="tick" at={b(k, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.9} />
      <Sfx name="chime" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.55} />
    </AbsoluteFill>
  );
};
