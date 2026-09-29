// Pure helpers for parsing the conviction judge's free-text output.
// Kept side-effect free so the test suite can hit them without spinning up
// any process or mocking the Claude CLI.
//
// The judge prompt (prompts/conviction_judge.md) allows four verdicts:
//   PASS, STRIKE_WATCH, FAIL, NEED_MORE_DATA
// The original parser only matched PASS|FAIL — so STRIKE_WATCH was silently
// reported as FAIL in the dashboard. This rewrite covers all four and keeps a
// "raw" fallback when the model emits something unexpected.

export type Verdict = "PASS" | "STRIKE_WATCH" | "FAIL" | "NEED_MORE_DATA" | "UNKNOWN";

export interface ParsedVerdict {
  verdict: Verdict;
  /** True when conviction is PASS-grade enough to publish a strike. */
  pass: boolean;
  convergence: number;
  confidence: number | null;
}

const VERDICT_RE =
  /VERDICT\s*[:\-]\s*(PASS|STRIKE[_\s-]?WATCH|FAIL|NEED[_\s-]?MORE[_\s-]?DATA)/i;

const CONVERGENCE_RE = /CONVERGENCE\s*[:\-]\s*(\d)/i;
const CONFIDENCE_RE = /CONFIDENCE\s*[:\-]\s*(\d{1,3})/i;

function normalizeVerdict(raw: string): Verdict {
  const compact = raw.replace(/[\s_-]+/g, "").toUpperCase();
  if (compact === "PASS") return "PASS";
  if (compact === "STRIKEWATCH") return "STRIKE_WATCH";
  if (compact === "FAIL") return "FAIL";
  if (compact === "NEEDMOREDATA") return "NEED_MORE_DATA";
  return "UNKNOWN";
}

export function parseVerdict(report: string): ParsedVerdict {
  const verdictMatch = VERDICT_RE.exec(report);
  const verdict = verdictMatch ? normalizeVerdict(verdictMatch[1]) : "UNKNOWN";

  const convergenceMatch = CONVERGENCE_RE.exec(report);
  const convergence = convergenceMatch
    ? Math.max(0, Math.min(4, parseInt(convergenceMatch[1], 10)))
    : 0;

  const confidenceMatch = CONFIDENCE_RE.exec(report);
  const confidence = confidenceMatch
    ? Math.max(0, Math.min(100, parseInt(confidenceMatch[1], 10)))
    : null;

  // PASS is the only verdict that can lead to publishing on-chain.
  // STRIKE_WATCH is a journal-only signal — never auto-publish.
  const pass = verdict === "PASS";

  return { verdict, pass, convergence, confidence };
}
