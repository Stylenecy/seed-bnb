import { resolve } from "path";
import { readFileSync } from "fs";

export const PROJECT_ROOT = resolve(process.cwd(), "..");

function parseDotenvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const eq = trimmed.indexOf("=");
  if (eq < 0) return null;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if (!key) return null;
  // Strip surrounding quotes if present
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  // Drop trailing inline comment (only when value isn't quoted and there's whitespace before #)
  const hashIdx = val.indexOf(" #");
  if (hashIdx > 0) val = val.slice(0, hashIdx).trim();
  if (!val) return null;
  return [key, val];
}

function loadDotenv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const kv = parseDotenvLine(line);
      if (kv) out[kv[0]] = kv[1];
    }
  } catch {
    // .env may not exist — non-fatal
  }
  return out;
}

const parentEnv = loadDotenv(resolve(PROJECT_ROOT, ".env"));

// Secrets that must NEVER be handed to a child process spawned by the web tier.
// Per ARCHITECTURE.md invariant #1, the private key lives only in the daemon /
// CLI publish path — never in anything reachable from an HTTP request. Stripping
// it here means a prompt-injected or compromised agent cannot read it from its
// environment (AUDIT.md S1/S2).
const SENSITIVE_KEYS = new Set(["BSC_PRIVATE_KEY", "OG_STORAGE_PRIVATE_KEY"]);

function sanitize(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out = { ...env };
  for (const k of SENSITIVE_KEYS) delete out[k];
  return out;
}

// Environment passed to spawned analysis subprocesses (musashi-core read
// commands, and — when explicitly opted in — claude/openclaw agents).
// Intentionally excludes BSC_PRIVATE_KEY / OG_STORAGE_PRIVATE_KEY. On-chain writes go through the
// daemon publish path, not the web tier.
export const childEnv: NodeJS.ProcessEnv = sanitize({ ...process.env, ...parentEnv });

export function getEnv(key: string): string | undefined {
  return process.env[key] ?? parentEnv[key];
}

export function hasEnv(key: string): boolean {
  const v = getEnv(key);
  return typeof v === "string" && v.length > 0;
}
