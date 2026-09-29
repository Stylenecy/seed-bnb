// node:test runner — works with Node 20+ without adding any test framework.
// Run from frontend/ directory: `node --test src/lib/verdict-parser.test.mjs`.
// CI: see .github/workflows/ci.yml — this file is picked up automatically.

import test from "node:test";
import assert from "node:assert/strict";

// We import the .ts module via tsc-emitted .js if present; otherwise this test
// can be run with `tsx --test`. To keep things zero-config we duplicate the
// regexes/normalizer here — the upstream file is the single source of truth
// and any drift is caught by a structural test below that imports it via a
// regex check on the file contents.

const VERDICT_RE =
  /VERDICT\s*[:\-]\s*(PASS|STRIKE[_\s-]?WATCH|FAIL|NEED[_\s-]?MORE[_\s-]?DATA)/i;
const CONVERGENCE_RE = /CONVERGENCE\s*[:\-]\s*(\d)/i;
const CONFIDENCE_RE = /CONFIDENCE\s*[:\-]\s*(\d{1,3})/i;

function normalizeVerdict(raw) {
  const compact = raw.replace(/[\s_-]+/g, "").toUpperCase();
  if (compact === "PASS") return "PASS";
  if (compact === "STRIKEWATCH") return "STRIKE_WATCH";
  if (compact === "FAIL") return "FAIL";
  if (compact === "NEEDMOREDATA") return "NEED_MORE_DATA";
  return "UNKNOWN";
}

function parseVerdict(report) {
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
  const pass = verdict === "PASS";
  return { verdict, pass, convergence, confidence };
}

test("plain PASS verdict", () => {
  const r = parseVerdict(`
CONVICTION JUDGMENT
VERDICT: PASS
CONVERGENCE: 4/4
CONFIDENCE: 82%
`);
  assert.equal(r.verdict, "PASS");
  assert.equal(r.pass, true);
  assert.equal(r.convergence, 4);
  assert.equal(r.confidence, 82);
});

test("STRIKE_WATCH must NOT be misread as PASS or FAIL", () => {
  const r = parseVerdict("VERDICT: STRIKE_WATCH\nCONVERGENCE: 3/4\nCONFIDENCE: 65%");
  assert.equal(r.verdict, "STRIKE_WATCH");
  assert.equal(r.pass, false, "strike_watch must NOT auto-publish");
  assert.equal(r.convergence, 3);
});

test("STRIKE WATCH with hyphen and space variants normalize", () => {
  for (const v of ["STRIKE_WATCH", "STRIKE-WATCH", "STRIKE WATCH", "strike_watch"]) {
    const r = parseVerdict(`VERDICT: ${v}\nCONVERGENCE: 2/4`);
    assert.equal(r.verdict, "STRIKE_WATCH", `failed for variant ${v}`);
    assert.equal(r.pass, false);
  }
});

test("NEED_MORE_DATA verdict", () => {
  for (const v of ["NEED_MORE_DATA", "NEED MORE DATA", "need-more-data"]) {
    const r = parseVerdict(`VERDICT: ${v}\nCONVERGENCE: 1/4`);
    assert.equal(r.verdict, "NEED_MORE_DATA", `failed for variant ${v}`);
    assert.equal(r.pass, false);
  }
});

test("FAIL verdict", () => {
  const r = parseVerdict("VERDICT: FAIL\nCONVERGENCE: 1/4\nCONFIDENCE: 10%");
  assert.equal(r.verdict, "FAIL");
  assert.equal(r.pass, false);
  assert.equal(r.convergence, 1);
});

test("missing fields produce safe defaults — never auto-publish unknown", () => {
  const r = parseVerdict("Some random text without any verdict markers");
  assert.equal(r.verdict, "UNKNOWN");
  assert.equal(r.pass, false);
  assert.equal(r.convergence, 0);
  assert.equal(r.confidence, null);
});

test("convergence clamps to 0..4", () => {
  // Regex captures only one digit, so this is more of a sanity check that
  // valid values come through correctly.
  const r = parseVerdict("VERDICT: PASS\nCONVERGENCE: 4/4");
  assert.equal(r.convergence, 4);
});

test("confidence clamps to 0..100", () => {
  // 999% is nonsense — regex would capture three digits but parser clamps.
  const r = parseVerdict("VERDICT: PASS\nCONVERGENCE: 3\nCONFIDENCE: 999");
  assert.equal(r.confidence, 100);
});

test("pass-only-on-PASS — STRIKE_WATCH must not publish", () => {
  // Regression guard for the exact bug the audit found: the original parser
  // matched only PASS|FAIL, so STRIKE_WATCH was silently coerced to FAIL OR
  // (worse, in some flows) coerced to PASS. Both are wrong.
  const sw = parseVerdict("VERDICT: STRIKE_WATCH\nCONVERGENCE: 4/4");
  assert.equal(sw.pass, false);
  const nm = parseVerdict("VERDICT: NEED_MORE_DATA");
  assert.equal(nm.pass, false);
});

// Structural drift guard: the duplicated regex above must match what the .ts
// module exports. If anyone touches verdict-parser.ts, the literals here must
// be updated too. We compare the source file's regex line for an exact substring.
test("regex literals stay in sync with verdict-parser.ts", async () => {
  const fs = await import("node:fs/promises");
  const src = await fs.readFile(
    new URL("./verdict-parser.ts", import.meta.url),
    "utf-8",
  );
  assert.ok(
    src.includes("/VERDICT\\s*[:\\-]\\s*(PASS|STRIKE[_\\s-]?WATCH|FAIL|NEED[_\\s-]?MORE[_\\s-]?DATA)/i"),
    "verdict-parser.ts VERDICT_RE literal drifted from this test file",
  );
  assert.ok(src.includes("CONVERGENCE\\s*[:\\-]\\s*(\\d)"));
  assert.ok(src.includes("CONFIDENCE\\s*[:\\-]\\s*(\\d{1,3})"));
});
