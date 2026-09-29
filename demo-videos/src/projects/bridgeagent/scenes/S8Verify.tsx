import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicText, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";
import { Terminal } from "../ui";
import type { TermLine } from "../ui";

/**
 * S8 · VERIFY IT YOURSELF (bars 38–40). The status page's own "Verify this
 * yourself" cast command, run against the real BSC-testnet RPC; the output
 * lines are the actual response (captured 2026-09-26).
 *   38 b0 tradesByAgent(1, 0, 50) · b2 the two records · b3 ownerOf(1)
 *   39 (dip) "DON'T TRUST. VERIFY."
 */
export const S8Verify: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.verify; // 38

  const L: TermLine[] = [
    { at: b(k), txt: `$ cast call ${CHAIN.journal} \\`, col: C.gold, bold: true },
    { at: b(k) + 3, txt: `    "tradesByAgent(uint256,uint256,uint256)(…)[]" 1 0 50`, col: C.gold },
    { at: b(k, 1), txt: "[(1, 0x262154ad…930ebc, 150, 1790290128),", col: C.pos },
    { at: b(k, 1) + 4, txt: " (1, 0xb340b5f6…ffff05,  75, 1790290138)]", col: C.pos },
    { at: b(k, 2), txt: `$ cast call ${CHAIN.registry} "ownerOf(uint256)(address)" 1`, col: C.gold, bold: true },
    { at: b(k, 3), txt: CHAIN.owner, col: C.pos },
  ];
  const dim = interpolate(frame, [b(k + 1), b(k + 1) + 5], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(105,147,120,0.3)" glowB="rgba(240,185,11,0.12)" glow="center" floor={0.4} grid={0.5} />
      <Halftone opacity={0.035} gap={22} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
        <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: "0.3em", color: C.moss }}>§ FROM THE STATUS PAGE</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 92, color: C.bone, marginTop: 2 }}>Verify this yourself.</div>
      </div>

      <Pulse intensity={0.5} shake={0.2} glow={false}>
        <div style={{ position: "absolute", left: 150, top: 290 }}>
          <Terminal title="any machine · --rpc-url https://bsc-testnet-rpc.publicnode.com · no API key" lines={L} w={1620} minH={420} size={29} />
        </div>
      </Pulse>

      <AbsoluteFill style={{ background: "rgba(6,12,9,0.8)", opacity: dim }} />
      <SpeedBurst cx={960} cy={470} from={b(k + 1)} count={20} inner={260} spread={640} color={C.pos} opacity={0.4} width={7} seed="verify" fade />
      <ComicText text="DON'T TRUST." from={b(k + 1)} x={960} y={380} size={200} rotate={-5} skewX={-6} fill={C.bone} variant="onomatopoeia" echoColor={INK} />
      <ComicText text="VERIFY." from={b(k + 1, 1)} x={960} y={620} size={230} rotate={3} skewX={-6} fill={C.pos} variant="onomatopoeia" echoColor={INK} />
      <ComicText text="Only the agent's wallet can append. Anyone can read." from={b(k + 1, 2)} x={960} y={850} size={58} rotate={-1} fill={C.mossSoft} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" />

      <Sfx name="tick" at={b(k)} volume={0.5} />
      <Sfx name="tick" at={b(k, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="chime" at={b(k, 3)} volume={0.45} />
      <Sfx name="impact" at={b(k + 1)} volume={0.85} />
      <Sfx name="impact" at={b(k + 1, 1)} volume={0.75} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
