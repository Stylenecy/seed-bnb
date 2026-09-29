import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ComicText, fadeUp, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import { HEALTH, MCP, TOOLS } from "../data";
import { C, F } from "../theme";
import { BAR } from "../timeline";
import type { TermLine, TermMark } from "../ui";
import { ComicTerminal, RealTag, Stamp } from "../ui";

/**
 * S6 · BACKEND (bars 36–40). The REAL Go service (`PORT=3300 ./tessera serve`,
 * no AI key set) answering over HTTP — runs/tessera-health.txt,
 * runs/tessera-tools-list.json, runs/tessera-mcp-scan.json (verbatim values).
 *   36 b0 serve · b1 curl /api/health · b2 headers · b3 {"status":"ok"} → "200 OK!"
 *   37 b0 MCP tools/list · b1–b3 the 10 tool names; scan_chain marked
 *   38 b0 right terminal: tools/call scan_chain(0xF977…) · b1–b3 the JSON prints, BSC facts marked
 *   39 (dip) b1 contractVerified / recentTxCount marked (→ the honest limit) · b2 "10 TOOLS. ANY AGENT."
 */
const SERVE_LOG = `{"time":"2026-09-26T01:03:51.212983+07:00","level":"INFO","msg":"tessera listening","addr":":3300","model":"claude-opus-4-8","backends":[]}`;

export const S6Backend: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.backend; // 36

  // ---- left: health + tools/list
  const pairs: string[] = [];
  for (let i = 0; i < TOOLS.length; i += 2) pairs.push(`  ${TOOLS[i]!.padEnd(22)}${TOOLS[i + 1] ?? ""}`);
  const left: TermLine[] = [
    { t: "PORT=3300 ./tessera serve &", at: 0, cmd: true, type: 8 },
    { t: SERVE_LOG, at: 8, color: C.boneDim },
    { t: "curl -si localhost:3300/api/health", at: b(k, 1), cmd: true, type: 9 },
    ...HEALTH.slice(1, 6).map((t) => ({ t, at: b(k, 2), color: t.startsWith("HTTP") ? C.good : C.boneDim })),
    { t: HEALTH[7]!, at: b(k, 3), color: C.good, weight: 700 },
    { t: "curl -s localhost:3300/mcp \\", at: b(k + 1), cmd: true, type: 7 },
    { t: `    -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'`, at: b(k + 1) + 7 },
    { t: "# result.tools[].name — 10 tools", at: b(k + 1, 1), color: C.boneFaint },
    ...pairs.map((t, i) => ({ t, at: b(k + 1, 1) + Math.round((i * (b(k + 1, 3) - b(k + 1, 1))) / pairs.length), color: C.signal })),
  ];
  const scanPair = pairs.findIndex((p) => p.includes("scan_chain"));
  const scanCol = pairs[scanPair]!.indexOf("scan_chain");
  const leftMarks: TermMark[] = [
    { line: 3, at: b(k, 2) + 3, color: C.good },
    { line: 8, at: b(k, 3), color: C.good },
    { line: 12 + scanPair, at: b(k + 1, 3), c0: scanCol, c1: scanCol + 10, color: C.gold },
  ];

  // ---- right: tools/call scan_chain (tokenBalances compacted to one object per line; values verbatim)
  const tokenLines = [16, 20, 24].map((i, j) => `        { ${MCP[i]!.trim()} ${MCP[i + 1]!.trim()} }${j < 2 ? "," : ""}`);
  const json = [...MCP.slice(0, 15), ...tokenLines, ...MCP.slice(27)];
  const j0 = b(k + 2, 1);
  const right: TermLine[] = [
    { t: "curl -s localhost:3300/mcp \\", at: b(k + 2), cmd: true, type: 6 },
    { t: `    -d '{"method":"tools/call","params":{"name":"scan_chain",`, at: b(k + 2) + 6 },
    { t: `         "arguments":{"address":"0xF977…aceC"}}}'`, at: b(k + 2) + 9 },
    { t: "# result.content[0].text, pretty-printed · 3.4 s", at: j0, color: C.boneFaint },
    ...json.map((t, i) => ({ t, at: j0 + Math.min(i, 30) * 1, color: t.includes("…") ? C.boneFaint : undefined })),
  ];
  const R = (needle: string) => 4 + json.findIndex((t) => t.includes(needle));
  const rightMarks: TermMark[] = [
    { line: R('"chainId": 56'), at: b(k + 2, 2), color: C.gold },
    { line: R('"USDT"'), at: b(k + 2, 3), color: C.gold },
    { line: R('"USDC"'), at: b(k + 2, 3), color: C.gold },
    { line: R('"contractVerified"'), at: b(k + 3, 1), color: C.warn },
    { line: R('"recentTxCount"'), at: b(k + 3, 1), color: C.warn },
    { line: R('"tokenTransfers"'), at: b(k + 3, 1), color: C.warn },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(70,214,208,0.18)" glowB="rgba(232,99,58,0.12)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 92, top: 38 }}>
        <RealTag at={0} kind="real output" label="Go backend on :3300 · /api/health + MCP over HTTP · no AI key needed" />
      </div>

      <Pulse intensity={0.45} shake={0} glow={false}>
        <ComicTerminal at={0} x={70} y={118} w={900} h={880} title="tessera serve · :3300" tab="BACKEND" tabColor={C.signal} lines={left} marks={leftMarks} size={17.5} lh={1.45} prompt="$" rot={-0.8} from="left" />
        <ComicTerminal at={b(k + 2)} x={1000} y={112} w={850} h={890} title="POST /mcp · tools/call scan_chain" tab="MCP" tabColor={C.gold} lines={right} marks={rightMarks} size={16.5} lh={1.4} prompt="$" rot={0.7} from="right" />
      </Pulse>

      <Stamp at={b(k, 3)} x={760} y={300} text="200 OK!" color={C.good} size={60} rot={-8} />
      {frame >= b(k + 3, 1) ? (
        <div style={{ position: "absolute", left: 130, top: 730, width: 720, padding: "12px 18px", background: "#f4efe4", border: `4px solid ${INK}`, boxShadow: `6px 6px 0 ${INK}`, transform: "rotate(2deg)", fontFamily: F.sans, fontWeight: 700, fontSize: 24, lineHeight: 1.25, color: INK, ...fadeUp(frame, b(k + 3, 1), 6, 14) }}>
          Explorer fields stay false / 0 — hold that thought.
        </div>
      ) : null}
      <ComicText text="10 TOOLS. ANY AGENT." from={b(k + 3, 2)} x={520} y={930} size={96} rotate={-4} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k, 3)} volume={0.8} />
      <Sfx name="tick" at={b(k + 1)} volume={0.5} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + 1, i)} volume={0.45} />
      ))}
      <Sfx name="whoosh" at={b(k + 2)} volume={0.45} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.6} />
      <Sfx name="impact" at={b(k + 2, 3)} volume={0.6} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.8} />
    </AbsoluteFill>
  );
};
