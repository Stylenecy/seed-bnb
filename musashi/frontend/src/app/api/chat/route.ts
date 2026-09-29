import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { MUSASHI_SYSTEM_PROMPT } from "@/lib/musashi-system-prompt";
import { PROJECT_ROOT, childEnv, hasEnv, getEnv } from "@/lib/env";
import { runGeminiTurn, type GeminiContent } from "@/lib/gemini-adapter";
import { runHermesTurn, hermesConfigured, type HermesMessage } from "@/lib/hermes-adapter";
import type { SSEEmit } from "@/lib/agent-tools";

// ─────────────────────────────────────────────────────────────────────────────
// MUSASHI chat API — routes user messages to a runtime:
//
//   "claude"/"hermes" — Claude (or any model) via Hermes, an OpenAI-compatible
//                       gateway. Pure HTTP + constrained tools → works for
//                       EVERYONE on hosted deploys, no per-user install. This is
//                       the production path (needs HERMES_API_URL/KEY/MODEL).
//   "gemini"          — Gemini 2.5 Flash via REST (needs GEMINI_API_KEY). Also
//                       hosted-friendly. Another "online mode" option.
//   local fallback    — Claude Code / OpenClaw CLI, shell-capable, OFF by default
//                       (MUSASHI_ENABLE_LOCAL_AGENTS=1), trusted local dev only.
//
// Every runtime receives the SAME MUSASHI persona primer and the SAME constrained
// tool registry (lib/agent-tools → musashi-core daemon) so behavior is identical.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 4000;

// Simple in-memory rate limiter (per-IP, 10 requests per minute).
// NOTE: this resets on serverless cold starts and isn't shared across
// instances — replace with Redis/Upstash before scaling beyond a single node.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

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

// Chat sessions live in process memory keyed by sessionId. Same caveat as the
// rate limiter — single-instance only (replace with a shared store to scale).
const GEMINI_SESSIONS = new Map<string, GeminiContent[]>();
const HERMES_SESSIONS = new Map<string, HermesMessage[]>();
const SESSION_LIMIT = 200;

function trimSessions(store: Map<string, unknown>) {
  if (store.size <= SESSION_LIMIT) return;
  const drop = store.size - SESSION_LIMIT;
  let i = 0;
  for (const k of store.keys()) {
    if (i++ >= drop) break;
    store.delete(k);
  }
}

// Hosted preview detection — Vercel etc. can't spawn local binaries. We still
// allow Gemini there because it's pure HTTP. Claude / OpenClaw get a clear
// setup hint instead of an opaque ENOENT.
const IS_HOSTED_PREVIEW = !!process.env.VERCEL || !!process.env.MUSASHI_HOSTED_PREVIEW;

// Local Claude Code / OpenClaw agents are shell-capable. Wiring them to an
// unauthenticated HTTP endpoint is an RCE risk (AUDIT.md S1), so they are OFF
// by default. Operators opt in via MUSASHI_ENABLE_LOCAL_AGENTS=1 in a trusted
// local environment. The default chat runtime is Gemini (constrained tools).
const LOCAL_AGENTS_ENABLED = ["1", "true", "yes"].includes(
  (getEnv("MUSASHI_ENABLE_LOCAL_AGENTS") || "").trim().toLowerCase(),
);

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return Response.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, agent, sessionId: rawSessionId } = body;

  if (!message || typeof message !== "string") {
    return Response.json({ error: "message required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` }, { status: 400 });
  }

  let sessionId: string | undefined;
  if (typeof rawSessionId === "string" && rawSessionId.length > 0) {
    if (!/^[\w-]+$/.test(rawSessionId)) {
      return Response.json({ error: "Invalid sessionId format" }, { status: 400 });
    }
    sessionId = rawSessionId;
  }

  const agentType =
    agent === "openclaw"
      ? "openclaw"
      : agent === "gemini"
        ? "gemini"
        : agent === "hermes"
          ? "hermes"
          : "claude";

  if (agentType === "gemini") {
    if (!hasEnv("GEMINI_API_KEY")) {
      return Response.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Add it to .env (see .env.example) or pick the Claude tab.",
        },
        { status: 503 },
      );
    }
    return streamGemini(message, sessionId, request.signal);
  }

  // Claude — production path via Hermes (OpenAI-compatible gateway). Pure HTTP +
  // constrained tools, no per-user install: the "anyone can try it" path, works
  // on hosted deploys. Used whenever HERMES_API_KEY is configured.
  if ((agentType === "claude" || agentType === "hermes") && hermesConfigured()) {
    return streamHermes(message, sessionId, request.signal);
  }

  // Fallback: local shell-capable agents (Claude Code / OpenClaw). Off by default
  // (RCE risk over HTTP — AUDIT.md S1); opt in for trusted local dev only.
  if (!LOCAL_AGENTS_ENABLED) {
    return Response.json(
      {
        error:
          "No hosted chat runtime is configured. Set HERMES_API_KEY (Claude via Hermes) or " +
          "GEMINI_API_KEY (Gemini) for a hosted, shareable agent. Local Claude Code / OpenClaw " +
          "are off by default — set MUSASHI_ENABLE_LOCAL_AGENTS=1 to enable them in a trusted " +
          "local environment.",
      },
      { status: 503 },
    );
  }

  // Local binaries can't run on hosted previews.
  if (IS_HOSTED_PREVIEW) {
    return Response.json(
      {
        error:
          "Hosted preview cannot spawn the local `claude` / `openclaw` binaries. " +
          "Configure HERMES_API_KEY (Claude via Hermes) or GEMINI_API_KEY for a hosted demo.",
      },
      { status: 503 },
    );
  }

  return agentType === "openclaw"
    ? streamOpenClaw(message, sessionId, request.signal)
    : streamClaude(message, sessionId, request.signal);
}

// ─────────────────────────────────────────────────────────────────────── Gemini ─

// Shared SSE plumbing for the HTTP runtimes (Gemini, Hermes). Builds the event
// stream + SSEEmit, persists the turn history via `persist`, runs `run`.
function streamLLM(
  signal: AbortSignal,
  sid: string,
  persist: (turnHistory: unknown) => void,
  run: (sse: SSEEmit) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const enqueue = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          /* controller already torn down */
        }
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          /* noop */
        }
      };

      signal.addEventListener("abort", finish);

      const sse: SSEEmit = {
        text: (content) => enqueue({ type: "text", content }),
        tool: (name, input) => enqueue({ type: "tool", name, input }),
        toolResult: (name, output, error) => enqueue({ type: "tool_result", name, output, error }),
        done: ({ result, turnHistory }) => {
          persist(turnHistory);
          enqueue({ type: "done", result, sessionId: sid, cost: 0 });
          finish();
        },
        error: (msg) => enqueue({ type: "error", content: msg }),
      };

      void run(sse).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        enqueue({ type: "error", content: `Agent turn crashed: ${msg}` });
        finish();
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

function streamGemini(message: string, sessionId: string | undefined, signal: AbortSignal): Response {
  const sid = sessionId ?? randomUUID();
  const history = sessionId ? GEMINI_SESSIONS.get(sessionId) ?? [] : [];
  return streamLLM(
    signal,
    sid,
    (turnHistory) => {
      GEMINI_SESSIONS.set(sid, turnHistory as GeminiContent[]);
      trimSessions(GEMINI_SESSIONS);
    },
    (sse) =>
      runGeminiTurn({ systemPrompt: MUSASHI_SYSTEM_PROMPT, userMessage: message, history, signal }, sse),
  );
}

function streamHermes(message: string, sessionId: string | undefined, signal: AbortSignal): Response {
  const sid = sessionId ?? randomUUID();
  const history = sessionId ? HERMES_SESSIONS.get(sessionId) ?? [] : [];
  return streamLLM(
    signal,
    sid,
    (turnHistory) => {
      HERMES_SESSIONS.set(sid, turnHistory as HermesMessage[]);
      trimSessions(HERMES_SESSIONS);
    },
    (sse) =>
      runHermesTurn({ systemPrompt: MUSASHI_SYSTEM_PROMPT, userMessage: message, history, signal }, sse),
  );
}

// ─────────────────────────────────────────────────────────────── Claude Code ─

function streamClaude(message: string, sessionId: string | undefined, signal: AbortSignal): Response {
  // NOTES:
  //   - Session persistence MUST stay on (do not pass --no-session-persistence),
  //     otherwise --resume fails next turn with "No conversation found".
  //   - The user message is always piped via stdin, never as a positional arg.
  //   - --append-system-prompt injects the MUSASHI primer on top of the
  //     default Claude Code system prompt.
  const args = [
    "-p",
    "--verbose",
    "--model", "sonnet",
    "--output-format", "stream-json",
    "--allowedTools", "Bash,Read,Glob,Grep,WebSearch,WebFetch,Skill",
    "--append-system-prompt", MUSASHI_SYSTEM_PROMPT,
  ];

  if (sessionId) args.push("--resume", sessionId);

  const child = spawn("claude", args, {
    cwd: PROJECT_ROOT,
    env: childEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const cleanup = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  signal.addEventListener("abort", cleanup);

  child.stdin.write(message);
  child.stdin.end();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      child.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === "assistant" && event.message?.content) {
              for (const block of event.message.content) {
                if (block.type === "text") {
                  sendEvent({ type: "text", content: block.text });
                } else if (block.type === "tool_use") {
                  sendEvent({ type: "tool", name: block.name, input: block.input });
                }
              }
            } else if (event.type === "result") {
              sendEvent({
                type: "done",
                result: event.result,
                sessionId: event.session_id,
                cost: event.total_cost_usd,
              });
            }
          } catch {
            // non-JSON line, skip
          }
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const text = chunk.toString().trim();
        if (text) sendEvent({ type: "error", content: text });
      });

      child.on("close", () => {
        signal.removeEventListener("abort", cleanup);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });

      child.on("error", (err) => {
        sendEvent({ type: "error", content: err.message });
        controller.close();
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

// ─────────────────────────────────────────────────────────────────── OpenClaw ─

interface OpenClawPayload {
  text?: string;
  mediaUrl?: string | null;
}
interface OpenClawResult {
  payloads?: OpenClawPayload[];
  meta?: {
    aborted?: boolean;
    agentMeta?: {
      sessionId?: string;
      model?: string;
      provider?: string;
    };
    stopReason?: string;
  };
}

/** Extract the last complete top-level JSON object from a mixed stderr blob. */
function extractTrailingJson(raw: string): OpenClawResult | null {
  const end = raw.lastIndexOf("}");
  if (end < 0) return null;

  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = end; i >= 0; i--) {
    const ch = raw[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "}") depth++;
    else if (ch === "{") {
      depth--;
      if (depth === 0) { start = i; break; }
    }
  }
  if (start < 0) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as OpenClawResult;
  } catch {
    return null;
  }
}

function openClawSetupHelp(reason: string): string {
  return [
    `OpenClaw runtime is installed but can't run an agent turn.`,
    `Reason: ${reason}`,
    ``,
    `First-time setup (one command each):`,
    `  openclaw configure                     # credentials + model provider key`,
    `  openclaw skills install musashi        # install the MUSASHI skill from ClawHub`,
    `  openclaw agent --local --agent main \\`,
    `    --message "musashi scan base"        # smoke test`,
    ``,
    `For an immediate interactive demo without OpenClaw, switch to the`,
    `**Gemini Online** tab (set GEMINI_API_KEY) or **Claude Code** tab (local install).`,
  ].join("\n");
}

function streamOpenClaw(message: string, sessionId: string | undefined, signal: AbortSignal): Response {
  const content = sessionId
    ? message
    : `${MUSASHI_SYSTEM_PROMPT}\n\n---\n\nUser: ${message}`;

  const args = [
    "--log-level", "silent",
    "agent",
    "--local",
    "--agent", "main",
    "--json",
    "--message", content,
  ];
  if (sessionId) args.push("--session-id", sessionId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      const finish = () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      };

      sendEvent({ type: "text", content: "Spinning up OpenClaw local agent...\n\n" });

      let child;
      try {
        child = spawn("openclaw", args, {
          cwd: PROJECT_ROOT,
          env: childEnv,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (e) {
        sendEvent({ type: "error", content: openClawSetupHelp((e as Error).message) });
        finish();
        return;
      }

      const cleanup = () => {
        if (child && !child.killed) child.kill("SIGTERM");
      };
      signal.addEventListener("abort", cleanup);

      child.stdin.end();

      let stderrBuf = "";
      let stdoutBuf = "";

      child.stdout.on("data", (c: Buffer) => { stdoutBuf += c.toString(); });
      child.stderr.on("data", (c: Buffer) => { stderrBuf += c.toString(); });

      child.on("error", (err) => {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          sendEvent({
            type: "error",
            content: "OpenClaw CLI not found on this machine. Install it from https://github.com/openclaw/openclaw, then `openclaw configure` and `openclaw skills install musashi`. Meanwhile use the Gemini Online or Claude Code tab.",
          });
        } else {
          sendEvent({ type: "error", content: openClawSetupHelp(err.message) });
        }
        finish();
      });

      child.on("close", (code) => {
        signal.removeEventListener("abort", cleanup);
        const raw = stderrBuf + stdoutBuf;
        const parsed = extractTrailingJson(raw);

        if (!parsed) {
          sendEvent({
            type: "error",
            content: `OpenClaw exited with code ${code} but produced no parseable JSON payload.\n\nLast stderr bytes:\n${raw.slice(-600)}`,
          });
          finish();
          return;
        }

        const payloadText = (parsed.payloads ?? [])
          .map((p) => (typeof p.text === "string" ? p.text : ""))
          .filter(Boolean)
          .join("\n");
        const stopReason = parsed.meta?.stopReason;
        const newSessionId = parsed.meta?.agentMeta?.sessionId;

        if (
          stopReason === "error" &&
          /401|authentication|credentials|unauthorized|api key/i.test(payloadText)
        ) {
          sendEvent({ type: "text", content: "\n" });
          sendEvent({
            type: "text",
            content: openClawSetupHelp(
              `OpenClaw reported: ${payloadText.split("\n")[0] || "auth failure"}`
            ),
          });
          sendEvent({ type: "done", result: "", sessionId: null, cost: 0 });
          finish();
          return;
        }

        if (stopReason === "error") {
          sendEvent({ type: "text", content: "\n" });
          sendEvent({ type: "error", content: payloadText || "OpenClaw reported an error." });
          finish();
          return;
        }

        sendEvent({ type: "text", content: "\n" });
        sendEvent({ type: "text", content: payloadText });
        sendEvent({
          type: "done",
          result: payloadText,
          sessionId: newSessionId ?? null,
          cost: 0,
        });
        finish();
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
