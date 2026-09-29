#!/usr/bin/env bash
# Stops everything scripts/dev.sh started (anvil, backend, Guard Agent).
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for f in "$ROOT"/.dev/*.pid; do
  [ -f "$f" ] || continue
  kill "$(cat "$f")" 2>/dev/null || true
  rm -f "$f"
done
pkill -f "$ROOT/backend/src/index.ts" 2>/dev/null || true
pkill -f "$ROOT/agent/src/index.ts" 2>/dev/null || true
echo "[stop] stopped."
