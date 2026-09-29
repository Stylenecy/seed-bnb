import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { resolve } from "path";
import { readFileSync } from "fs";
import { PROJECT_ROOT, childEnv, getEnv } from "@/lib/env";
import { parseVerdict } from "@/lib/verdict-parser";
import { daemonGet } from "@/lib/musashi-cli";

/* ---------- constants & env ---------- */

const VALID_CHAIN_IDS = new Set([1, 56, 137, 42161, 8453, 16661]);

// Debate spawns the local Claude Code agent for specialists + judge. Off by
// default (shell-capable local agents — see AUDIT.md S1 / F2). Gate + history
// data come from the read-only daemon over HTTP, not a spawned binary.
const LOCAL_AGENTS_ENABLED = ["1", "true", "yes"].includes(
  (getEnv("MUSASHI_ENABLE_LOCAL_AGENTS") || "").trim().toLowerCase(),
);

const SPECIALIST_TIMEOUT_MS = 120_000;
const JUDGE_TIMEOUT_MS = 180_000;

// Rate limiter: 3 req/min (debates are expensive)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

/* ---------- prompt loading ---------- */
//
// Specialist + judge prompts are the canonical files in /prompts/*.md. They
// used to be inline string literals in this route, which silently drifted
// away from the slash-command pipeline whenever someone updated the .md files.
// We load them once at module scope so subsequent debate calls don't re-read
// from disk per turn.

function readPrompt(rel: string): string {
  try {
    return readFileSync(resolve(PROJECT_ROOT, "prompts", rel), "utf-8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load prompts/${rel}: ${msg}`);
  }
}

const PROMPTS = {
  safety: readPrompt("safety_specialist.md"),
  onchain: readPrompt("onchain_specialist.md"),
  narrative: readPrompt("narrative_specialist.md"),
  market: readPrompt("market_specialist.md"),
  pattern: readPrompt("musashi_pattern.md"),
  judge: readPrompt("conviction_judge.md"),
};

/* ---------- validation ---------- */

function validateAddress(token: string): string {
  const cleaned = token.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(cleaned)) {
    throw new Error("Invalid token address format");
  }
  return cleaned;
}

function validateChainId(chainId: number): number {
  const id = Math.floor(chainId);
  if (!VALID_CHAIN_IDS.has(id)) {
    throw new Error(`Invalid chain ID: ${id}`);
  }
  return id;
}

/* ---------- history / reputation runner ---------- */

async function runHistory(agentId: number = 0, limit: number = 12): Promise<string> {
  try {
    const result = await daemonGet("/v1/history", { agentId, limit });
    return JSON.stringify(result);
  } catch {
    // Non-fatal: agent can still function without history
    return "{}";
  }
}

/* ---------- gate runner ---------- */

async function runGates(token: string, chainId: number): Promise<string> {
  // Gate data comes from the read-only daemon (no spawned binary).
  const result = await daemonGet("/v1/gates", { token, chain: chainId });
  return JSON.stringify(result);
}

/* ---------- specialist definitions ---------- */
//
// Each specialist gets the canonical prompt body + a small per-domain envelope
// pinning the token + the slice of gate data they're responsible for. The
// envelope includes the SHARED stringified gate dump exactly once per debate
// so we don't pay the JSON.stringify token tax 4 times.

interface SpecialistDef {
  name: "safety" | "onchain" | "narrative" | "market";
  prompt: string;
  gateNums: number[];
  extraTools?: string;
}

const SPECIALISTS: SpecialistDef[] = [
  { name: "safety", prompt: PROMPTS.safety, gateNums: [1, 2] },
  { name: "onchain", prompt: PROMPTS.onchain, gateNums: [3] },
  {
    name: "narrative",
    prompt: PROMPTS.narrative,
    gateNums: [4, 5],
    // Narrative specialist needs WebSearch / WebFetch for seeding-stage detection.
    extraTools: "WebSearch,WebFetch,Skill",
  },
  { name: "market", prompt: PROMPTS.market, gateNums: [6, 7] },
];

interface PipelineGate {
  gate_num: number;
  gate?: string;
  status?: string;
  reason?: string;
}

interface PipelineResult {
  gates?: PipelineGate[];
  token_age?: string;
}

function extractGates(pipeline: PipelineResult, nums: number[]): PipelineGate[] {
  if (!Array.isArray(pipeline.gates)) return [];
  return pipeline.gates.filter((g) => nums.includes(g.gate_num));
}

function buildSpecialistPrompt(
  spec: SpecialistDef,
  token: string,
  chainId: number,
  pipeline: PipelineResult,
  cachedGateBlob: string,
): string {
  const slice = JSON.stringify(extractGates(pipeline, spec.gateNums), null, 2);
  const age = pipeline.token_age ?? "unknown";
  return `${spec.prompt}

---

## Run context

- Token: ${token}
- Chain ID: ${chainId}
- Token age class: ${age}
- Gate data for your domain (gates ${spec.gateNums.join(", ")}):

\`\`\`json
${slice}
\`\`\`

Reference (full gate run, in case you need cross-domain context — do not duplicate work):

\`\`\`json
${cachedGateBlob}
\`\`\`

Now produce your specialist report following the protocol described above. Be concise and structured.`;
}

/* ---------- SSE helpers ---------- */

type SSEController = ReadableStreamDefaultController<Uint8Array>;

function sseWrite(controller: SSEController, encoder: TextEncoder, payload: Record<string, unknown>) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

/* ---------- spawn a Claude agent and stream output ---------- */

function spawnAgent(opts: {
  model: "sonnet" | "opus";
  prompt: string;
  timeoutMs: number;
  allowedTools?: string;
  signal?: AbortSignal;
}): {
  process: ReturnType<typeof spawn>;
  result: Promise<string>;
  onChunk: (cb: (text: string) => void) => void;
} {
  const args = [
    "-p",
    "--verbose",
    "--model", opts.model,
    "--output-format", "stream-json",
    "--no-session-persistence",
  ];

  if (opts.allowedTools) {
    args.push("--allowedTools", opts.allowedTools);
  }

  args.push(opts.prompt);

  const child = spawn("claude", args, {
    cwd: PROJECT_ROOT,
    env: childEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });

  child.stdin.end();

  let chunkCallback: ((text: string) => void) | null = null;

  if (opts.signal) {
    opts.signal.addEventListener("abort", () => {
      if (!child.killed) child.kill("SIGTERM");
    });
  }

  const result = new Promise<string>((res, rej) => {
    let accumulated = "";
    let buffer = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      rej(new Error("Agent timed out"));
    }, opts.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);

          if (event.type === "assistant" && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === "text") {
                accumulated += block.text;
                if (chunkCallback) chunkCallback(block.text);
              }
            }
          }

          if (event.type === "content_block_delta" && event.delta?.text) {
            accumulated += event.delta.text;
            if (chunkCallback) chunkCallback(event.delta.text);
          }

          if (event.type === "content_block_start" && event.content_block?.type === "text" && event.content_block?.text) {
            accumulated += event.content_block.text;
            if (chunkCallback) chunkCallback(event.content_block.text);
          }

          if (event.type === "result" && event.result) {
            accumulated = event.result;
          }
        } catch {
          // skip non-JSON
        }
      }
    });

    child.on("close", () => {
      clearTimeout(timeout);
      res(accumulated);
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      rej(err);
    });
  });

  return {
    process: child,
    result,
    onChunk(cb) {
      chunkCallback = cb;
    },
  };
}

/* ---------- main orchestration ---------- */

async function orchestrate(
  token: string,
  chainId: number,
  controller: SSEController,
  encoder: TextEncoder,
  signal: AbortSignal,
) {
  /* ---- Phase 1: Gates ---- */
  sseWrite(controller, encoder, { type: "phase", phase: "gates", status: "start" });

  let gatesRaw: string;
  let gates: PipelineResult;
  try {
    gatesRaw = await runGates(token, chainId);
    gates = JSON.parse(gatesRaw) as PipelineResult;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown gates error";
    sseWrite(controller, encoder, { type: "error", content: `Gates failed: ${msg}` });
    sseWrite(controller, encoder, { type: "done" });
    controller.close();
    return;
  }

  sseWrite(controller, encoder, { type: "gates", data: gates });
  sseWrite(controller, encoder, { type: "phase", phase: "gates", status: "done" });

  // Stringify the full gate dump ONCE — pass by reference to every specialist
  // instead of running JSON.stringify per specialist.
  const cachedGateBlob = JSON.stringify(gates, null, 2);

  /* ---- Phase 2 (kicked off in parallel): history fetch ---- */
  // We don't await this until the judge phase — the network call runs while
  // the four specialists are thinking.
  const historyPromise = runHistory(0, 12).catch(() => "{}");

  /* ---- Phase 2: Specialists (parallel) ---- */
  sseWrite(controller, encoder, { type: "phase", phase: "specialists", status: "start" });

  const reports: Record<string, string> = {};
  const errors: Record<string, string> = {};

  const specialistPromises = SPECIALISTS.map((spec) => {
    const prompt = buildSpecialistPrompt(spec, token, chainId, gates, cachedGateBlob);

    sseWrite(controller, encoder, { type: "agent_start", agent: spec.name, model: "sonnet" });

    const agent = spawnAgent({
      model: "sonnet",
      prompt,
      timeoutMs: SPECIALIST_TIMEOUT_MS,
      allowedTools: spec.extraTools,
      signal,
    });

    agent.onChunk((text) => {
      sseWrite(controller, encoder, { type: "agent_stream", agent: spec.name, content: text });
    });

    return agent.result
      .then((report) => {
        reports[spec.name] = report;
        sseWrite(controller, encoder, { type: "agent_report", agent: spec.name, report });
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors[spec.name] = msg;
        sseWrite(controller, encoder, { type: "agent_error", agent: spec.name, error: msg });
      });
  });

  await Promise.all(specialistPromises);

  sseWrite(controller, encoder, { type: "phase", phase: "specialists", status: "done" });

  /* ---- Phase 2.5: assemble agent history (parallel-fetched above) ---- */
  let historyContext = "";
  try {
    const historyRaw = await historyPromise;
    const history = JSON.parse(historyRaw);
    const rep = history.reputation;
    const strikes = history.strikes as Array<Record<string, unknown>> | undefined;

    // Cold-start rule from prompts/conviction_judge.md: skip history calibration
    // when strikeCount < 5. Saves ~300-500 tokens per judge call on a fresh agent.
    const coldStart = !rep || (rep.strikes ?? 0) < 5;

    if (rep && !coldStart) {
      const winRate = rep.total_filled > 0
        ? ((rep.wins / rep.total_filled) * 100).toFixed(1)
        : "N/A";
      const totalReturn = (rep.total_return_bps / 100).toFixed(2);

      let strikeHistory = "";
      if (Array.isArray(strikes) && strikes.length > 0) {
        const filled = strikes.filter((s) => s.outcome_filled);
        const pending = strikes.filter((s) => !s.outcome_filled);
        const wins = filled.filter((s) => (s.outcome_bps as number) > 0);
        const losses = filled.filter((s) => (s.outcome_bps as number) < 0);

        strikeHistory = `
Recent completed strikes:
${filled.slice(0, 6).map((s) => `  - Strike #${s.id}: token ${(s.token as string).slice(0, 10)}... on chain ${s.chain_id}, convergence ${s.convergence}/4 → ${(s.outcome_bps as number) > 0 ? "WIN" : "LOSS"} (${((s.outcome_bps as number) / 100).toFixed(1)}%)`).join("\n")}
${pending.length > 0 ? `\n${pending.length} strikes still awaiting outcome.` : ""}

Pattern observations:
- Wins: ${wins.length} of ${filled.length} completed (${filled.length > 0 ? ((wins.length / filled.length) * 100).toFixed(0) : 0}%)
- Average win return: ${wins.length > 0 ? ((wins.reduce((sum, s) => sum + (s.outcome_bps as number), 0) / wins.length) / 100).toFixed(1) : "N/A"}%
- Average loss return: ${losses.length > 0 ? ((losses.reduce((sum, s) => sum + (s.outcome_bps as number), 0) / losses.length) / 100).toFixed(1) : "N/A"}%`;
      }

      historyContext = `
== AGENT MEMORY: ON-CHAIN TRACK RECORD ==

This is your verifiable performance history, recorded on BNB Chain (ConvictionLog).
Use this to calibrate your conviction threshold.

Total strikes published: ${rep.strikes}
Outcomes recorded: ${rep.total_filled}
Win rate: ${winRate}%
Cumulative return: ${totalReturn}%
${strikeHistory}

Calibration guidance:
- If your win rate is above 70%, your threshold is well-calibrated. Maintain it.
- If your win rate is below 50%, you are too permissive. Apply stricter hesitation.
- If you have many pending outcomes, be cautious — the data is incomplete.
- Your reputation is permanent and on-chain. Every PASS you issue is recorded forever.

`;
    } else if (coldStart) {
      historyContext = `
== AGENT MEMORY: COLD START ==

Strike count is below 5 — apply STATIC high-conviction thresholds rather than
calibrating from past outcomes. The first 5 strikes set MUSASHI's reputation
forever, so err on the side of FAIL / STRIKE_WATCH unless 4/4 convergence.

`;
    }
  } catch {
    // Non-fatal: continue without history
  }

  /* ---- Phase 3: Judge ---- */
  sseWrite(controller, encoder, { type: "phase", phase: "judgment", status: "start" });

  const gateSummary = Array.isArray(gates.gates)
    ? gates.gates.map((g) => `Gate ${g.gate_num} (${g.gate}): ${g.status} — ${g.reason ?? ""}`)
    : ["Gate data unavailable"];

  const reportsBlock = Object.entries(reports)
    .map(([name, text]) => `=== ${name.toUpperCase()} SPECIALIST ===\n${text}`)
    .join("\n\n");

  const failedAgents = Object.entries(errors)
    .map(([name, msg]) => `=== ${name.toUpperCase()} SPECIALIST (FAILED) ===\nError: ${msg}`)
    .join("\n\n");

  const judgePrompt = `${PROMPTS.judge}

---

## Run context

${historyContext}

== SPECIALIST REPORTS ==

${reportsBlock}
${failedAgents ? `\n${failedAgents}` : ""}

== GATE DATA ==

${gateSummary.join("\n")}

== TOKEN ==

${token} on chain ${chainId}

Now deliver your judgment in this exact format:

CONVICTION JUDGMENT

VERDICT: [PASS/STRIKE_WATCH/FAIL/NEED_MORE_DATA]
CONVERGENCE: [1-4]/4
CONFIDENCE: [percentage]

CROSS-EXAMINATION:
- [where specialists agree]
- [where they contradict]
- [hidden patterns]

DECISIVE FACTOR: [what tipped the decision]

FINAL REASONING: [2-3 sentences]`;

  sseWrite(controller, encoder, { type: "judge_start", model: "opus" });

  let judgeReport = "";

  try {
    const judge = spawnAgent({
      model: "opus",
      prompt: judgePrompt,
      timeoutMs: JUDGE_TIMEOUT_MS,
      signal,
    });

    judge.onChunk((text) => {
      sseWrite(controller, encoder, { type: "judge_stream", content: text });
    });

    judgeReport = await judge.result;
    const parsed = parseVerdict(judgeReport);

    sseWrite(controller, encoder, {
      type: "verdict",
      result: {
        verdict: parsed.verdict,
        pass: parsed.pass,
        convergence: parsed.convergence,
        confidence: parsed.confidence,
        reasoning: judgeReport,
        reports,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown judge error";
    sseWrite(controller, encoder, { type: "error", content: `Judge failed: ${msg}` });
    sseWrite(controller, encoder, {
      type: "verdict",
      result: {
        verdict: "UNKNOWN",
        pass: false,
        convergence: 0,
        confidence: null,
        reasoning: `Judge failed: ${msg}. Partial specialist reports available.`,
        reports,
      },
    });
  }

  sseWrite(controller, encoder, { type: "phase", phase: "judgment", status: "done" });
  sseWrite(controller, encoder, { type: "done" });
  controller.close();
}

/* ---------- POST handler ---------- */

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return Response.json(
      { error: "Rate limit exceeded. Debates are expensive — try again in a minute." },
      { status: 429 },
    );
  }

  // Debate runs the local Claude Code agent (specialists + judge). It is off by
  // default — exposing a shell-capable agent over HTTP is a security risk, and
  // it can't run on hosted previews anyway (no local binary). Opt in explicitly.
  if (!LOCAL_AGENTS_ENABLED) {
    return Response.json(
      {
        error:
          "Adversarial debate requires the local Claude Code agent and is disabled by default. " +
          "Set MUSASHI_ENABLE_LOCAL_AGENTS=1 in a trusted local environment to enable it.",
      },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token, chain } = body;

  if (!token || typeof token !== "string") {
    return Response.json({ error: "token address required" }, { status: 400 });
  }

  if (chain === undefined || typeof chain !== "number") {
    return Response.json({ error: "chain ID required (number)" }, { status: 400 });
  }

  let safeToken: string;
  let safeChain: number;
  try {
    safeToken = validateAddress(token);
    safeChain = validateChainId(chain);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Validation error";
    return Response.json({ error: msg }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      orchestrate(safeToken, safeChain, controller, encoder, request.signal).catch((err) => {
        const msg = err instanceof Error ? err.message : "Orchestration error";
        try {
          sseWrite(controller, encoder, { type: "error", content: msg });
          sseWrite(controller, encoder, { type: "done" });
          controller.close();
        } catch {
          // controller may already be closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
