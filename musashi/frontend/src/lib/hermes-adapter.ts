// Hermes / Claude adapter — the PRODUCTION chat runtime "anyone can try".
//
// Talks to an OpenAI-compatible /chat/completions endpoint (Hermes Agent proxy,
// Nous Portal, OpenRouter, LiteLLM, or a self-hosted gateway) so Claude (or any
// model the gateway serves) runs over plain HTTP — no per-user CLI install,
// works on serverless. Tool surface is the shared, daemon-backed registry in
// lib/agent-tools, identical to the Gemini adapter.
//
// Config (operator sets these once on the server; end users just chat):
//   HERMES_API_URL    base URL, e.g. https://openrouter.ai/api/v1  (no trailing /chat/completions)
//   HERMES_API_KEY    bearer token for the gateway
//   HERMES_MODEL      model id as the gateway names it, e.g. anthropic/claude-sonnet-4
//
// Wire format is OpenAI-compatible (the de-facto standard for these gateways).
// If you point this at a native Anthropic /v1/messages endpoint instead, swap
// the request/response mapping here — the tool registry and SSE interface stay.

import { getEnv } from "./env";
import { AGENT_TOOLS, TOOL_BY_NAME, type SSEEmit } from "./agent-tools";

const MAX_TOOL_ROUNDS = 6;

function openAITools() {
  return AGENT_TOOLS.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

// ─── OpenAI-compatible wire types ────────────────────────────────────────────

interface OAToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OAMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: OAToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface OAChoice {
  message?: OAMessage;
  finish_reason?: string;
}

interface OAResponse {
  choices?: OAChoice[];
  error?: { message?: string } | string;
}

export type HermesMessage = OAMessage;

export interface HermesTurnDeps {
  systemPrompt: string;
  userMessage: string;
  /** Prior conversation messages (NOT including the system prompt). */
  history?: HermesMessage[];
  signal?: AbortSignal;
}

/** Whether the Hermes runtime is configured (used by the chat route to route). */
export function hermesConfigured(): boolean {
  return !!getEnv("HERMES_API_KEY");
}

function safeParseArgs(raw: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function runHermesTurn(deps: HermesTurnDeps, sse: SSEEmit): Promise<void> {
  const apiKey = getEnv("HERMES_API_KEY");
  const base = (getEnv("HERMES_API_URL") || "").replace(/\/+$/, "");
  const model = getEnv("HERMES_MODEL") || "";

  const history = deps.history ?? [];
  if (!apiKey || !base || !model) {
    const missing = [
      !base && "HERMES_API_URL",
      !apiKey && "HERMES_API_KEY",
      !model && "HERMES_MODEL",
    ]
      .filter(Boolean)
      .join(", ");
    sse.error(
      `Hermes/Claude runtime is not configured (missing ${missing}). Set it in .env (see .env.example), or use the Gemini tab.`,
    );
    sse.done({ result: "", turnHistory: history });
    return;
  }

  const url = `${base}/chat/completions`;

  // Conversation we persist (excludes the system prompt, which is prepended fresh each call).
  const convo: OAMessage[] = [...history, { role: "user", content: deps.userMessage }];
  let aggregatedText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const payload = {
      model,
      messages: [{ role: "system", content: deps.systemPrompt }, ...convo],
      tools: openAITools(),
      tool_choice: "auto",
      temperature: 0.4,
      max_tokens: 2048,
    };

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
        signal: deps.signal,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "network error";
      sse.error(`Hermes request failed: ${msg}`);
      sse.done({ result: aggregatedText, turnHistory: convo });
      return;
    }

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      sse.error(`Hermes ${resp.status}: ${txt.slice(0, 400)}`);
      sse.done({ result: aggregatedText, turnHistory: convo });
      return;
    }

    let data: OAResponse;
    try {
      data = (await resp.json()) as OAResponse;
    } catch {
      sse.error("Hermes returned non-JSON response");
      sse.done({ result: aggregatedText, turnHistory: convo });
      return;
    }

    if (data.error) {
      const msg = typeof data.error === "string" ? data.error : data.error.message;
      sse.error(`Hermes error: ${msg ?? "unknown"}`);
      sse.done({ result: aggregatedText, turnHistory: convo });
      return;
    }

    const message = data.choices?.[0]?.message;
    if (!message) {
      sse.done({ result: aggregatedText, turnHistory: convo });
      return;
    }

    // Surface any assistant text (some models emit text alongside tool calls).
    if (message.content) {
      aggregatedText += message.content;
      sse.text(message.content);
    }

    const toolCalls = message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      // Final answer.
      convo.push({ role: "assistant", content: message.content ?? "" });
      sse.done({ result: aggregatedText, turnHistory: convo });
      return;
    }

    // Record the assistant turn verbatim (with tool_calls) so the follow-up tool
    // messages reference valid tool_call_ids.
    convo.push({
      role: "assistant",
      content: message.content ?? "",
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      const name = call.function?.name ?? "";
      const args = safeParseArgs(call.function?.arguments ?? "");
      const def = TOOL_BY_NAME.get(name);
      sse.tool(name, args);

      let resultPayload: Record<string, unknown>;
      if (!def) {
        resultPayload = { error: `Unknown tool: ${name}` };
        sse.toolResult(name, resultPayload, "unknown tool");
      } else {
        try {
          const result = await def.handler(args);
          resultPayload = { result };
          sse.toolResult(name, result);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          resultPayload = { error: msg };
          sse.toolResult(name, null, msg);
        }
      }

      convo.push({
        role: "tool",
        tool_call_id: call.id,
        name,
        content: JSON.stringify(resultPayload),
      });
    }
    // Loop back: model reads tool results and either calls more or finalizes.
  }

  sse.error(
    `Stopped after ${MAX_TOOL_ROUNDS} tool-call rounds without a final answer. Try a more specific question.`,
  );
  sse.done({ result: aggregatedText, turnHistory: convo });
}
