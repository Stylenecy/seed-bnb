// Gemini 2.5 Flash adapter for the MUSASHI dashboard chat.
//
// Talks directly to Google's Generative Language REST API so the dashboard can
// run a working agent with just a GEMINI_API_KEY (no local CLI). The tool
// surface is the shared, daemon-backed registry in lib/agent-tools — identical
// to the Hermes/Claude adapter.

import { getEnv } from "./env";
import { AGENT_TOOLS, TOOL_BY_NAME, type SSEEmit } from "./agent-tools";

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Hard cap on tool-call rounds per user turn. Without this Gemini can ping-pong
// tool calls indefinitely on flaky data; this cuts the risk of token blow-ups.
const MAX_TOOL_ROUNDS = 6;

function functionDeclarations() {
  return AGENT_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
}

// ─── Gemini wire types ───────────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

// Per Gemini v1beta function-calling docs the function response is sent back
// with role "user" (NOT "function") — it represents the user/host returning a
// tool result to the model.
interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

// ─── Public entry ────────────────────────────────────────────────────────────

export interface GeminiTurnDeps {
  systemPrompt: string;
  userMessage: string;
  // Multi-turn support: caller passes prior contents (excluding the new user message).
  history?: GeminiContent[];
  signal?: AbortSignal;
}

export async function runGeminiTurn(deps: GeminiTurnDeps, sse: SSEEmit): Promise<void> {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) {
    sse.error(
      "GEMINI_API_KEY is not set. Add it to .env (see .env.example) or use the Claude/Hermes tab.",
    );
    sse.done({ result: "", turnHistory: deps.history ?? [] });
    return;
  }

  const model = getEnv("MUSASHI_ONLINE_MODEL") || DEFAULT_MODEL;
  const base = getEnv("GEMINI_API_BASE") || DEFAULT_BASE;
  // Pass the API key via header (x-goog-api-key), NOT the URL query string —
  // query strings leak into proxy/access/error logs (AUDIT.md S5).
  const url = `${base}/models/${encodeURIComponent(model)}:generateContent`;

  const contents: GeminiContent[] = [
    ...(deps.history ?? []),
    { role: "user", parts: [{ text: deps.userMessage }] },
  ];

  const body = (turnContents: GeminiContent[]) => ({
    systemInstruction: { role: "user", parts: [{ text: deps.systemPrompt }] },
    contents: turnContents,
    tools: [{ functionDeclarations: functionDeclarations() }],
    toolConfig: { functionCallingConfig: { mode: "AUTO" } },
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  });

  let aggregatedText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body(contents)),
        signal: deps.signal,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "network error";
      sse.error(`Gemini request failed: ${msg}`);
      sse.done({ result: aggregatedText, turnHistory: contents });
      return;
    }

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      sse.error(`Gemini ${resp.status}: ${txt.slice(0, 400)}`);
      sse.done({ result: aggregatedText, turnHistory: contents });
      return;
    }

    let data: GeminiResponse;
    try {
      data = (await resp.json()) as GeminiResponse;
    } catch {
      sse.error("Gemini returned non-JSON response");
      sse.done({ result: aggregatedText, turnHistory: contents });
      return;
    }

    if (data.error?.message) {
      sse.error(`Gemini error: ${data.error.message}`);
      sse.done({ result: aggregatedText, turnHistory: contents });
      return;
    }

    if (data.promptFeedback?.blockReason) {
      sse.error(`Prompt blocked by Gemini safety: ${data.promptFeedback.blockReason}`);
      sse.done({ result: aggregatedText, turnHistory: contents });
      return;
    }

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    if (parts.length === 0) {
      // No content at all — treat as done with whatever text we already have.
      sse.done({ result: aggregatedText, turnHistory: contents });
      return;
    }

    contents.push({ role: "model", parts });

    const toolCalls: GeminiPart[] = [];
    for (const part of parts) {
      if (part.text) {
        aggregatedText += part.text;
        sse.text(part.text);
      }
      if (part.functionCall?.name) {
        toolCalls.push(part);
      }
    }

    if (toolCalls.length === 0) {
      // Final answer; we're done.
      sse.done({ result: aggregatedText, turnHistory: contents });
      return;
    }

    // Execute every tool call this turn requested, then feed the responses back.
    const responseParts: GeminiPart[] = [];
    for (const call of toolCalls) {
      const fn = call.functionCall!;
      const def = TOOL_BY_NAME.get(fn.name);
      sse.tool(fn.name, fn.args ?? {});
      if (!def) {
        const errPayload = { error: `Unknown tool: ${fn.name}` };
        sse.toolResult(fn.name, errPayload, "unknown tool");
        responseParts.push({ functionResponse: { name: fn.name, response: errPayload } });
        continue;
      }
      try {
        const result = await def.handler(fn.args ?? {});
        sse.toolResult(fn.name, result);
        responseParts.push({ functionResponse: { name: fn.name, response: { result } } });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sse.toolResult(fn.name, null, msg);
        responseParts.push({ functionResponse: { name: fn.name, response: { error: msg } } });
      }
    }

    contents.push({ role: "user", parts: responseParts });
    // Loop back: Gemini gets to read the tool results and either call more or finalize.
  }

  sse.error(
    `Stopped after ${MAX_TOOL_ROUNDS} tool-call rounds without a final answer. Try a more specific question.`,
  );
  sse.done({ result: aggregatedText, turnHistory: contents });
}

export type { GeminiContent };
