#!/usr/bin/env bash
#
# Stops everything scripts/dev.sh started: the Guard Agent, the backend bridge,
# and the daml sandbox + JSON API. Kills by recorded pid AND by listening port
# (the `daml start` parent can exit after backgrounding, leaving JVM children
# owning the ports), so this is safe to run even if pidfiles are stale.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_DIR="$ROOT/.dev"
LEDGER_PORT="${LEDGER_PORT:-6865}"
JSON_API_PORT="${JSON_API_PORT:-7575}"
BACKEND_PORT="${BACKEND_PORT:-3001}"

log() { printf '\033[36m[stop]\033[0m %s\n' "$*"; }

kill_pidfile() {
  local f="$1"
  [ -f "$f" ] || return 0
  local pid; pid="$(cat "$f" 2>/dev/null || true)"
  if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
    # kill the process group where possible (npm/daml spawn children)
    kill "$pid" 2>/dev/null || true
    sleep 0.3
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$f"
}

kill_port() {
  local port="$1"
  local pids; pids="$(lsof -ti :"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    log "Freeing port $port (pids: $pids)"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.3
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
}

log "Stopping backend, agent, sandbox..."
kill_pidfile "$DEV_DIR/backend.pid"
kill_pidfile "$DEV_DIR/agent.pid"
kill_pidfile "$DEV_DIR/sandbox.pid"

kill_port "$BACKEND_PORT"
kill_port "$JSON_API_PORT"
kill_port "$LEDGER_PORT"

# The Guard Agent binds no port, and its npm/tsx children get re-parented when
# the pidfile'd bash wrapper dies — sweep them by path as a final pass.
pkill -f "$ROOT/agent/node_modules" 2>/dev/null || true
pkill -f "$ROOT/backend/src/index.ts" 2>/dev/null || true

log "Stopped."
