#!/usr/bin/env bash
#
# Cermin-RWA local full stack on an anvil fork-free devnet that pretends to be
# BSC testnet (chain id 97), so the exact same code paths as BSC testnet run
# locally: deploy contracts -> backend (EvmLedger) -> Guard Agent (EvmLedger).
# Then: cd frontend && VITE_API_URL=http://localhost:3001 npm run dev
#
# Requires: Foundry (anvil, forge), Node 22+. Uses anvil's well-known dev keys —
# LOCAL ONLY, never on a real network. Stop with scripts/stop.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV="$ROOT/.dev"; mkdir -p "$DEV"
RPC_PORT="${RPC_PORT:-8545}"
RPC="http://127.0.0.1:$RPC_PORT"
OPERATOR_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # anvil #0
GUARD_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d    # anvil #1
GUARD_ADDR=0x70997970C51812dc3A010C7d01b50e0d17dc79C8

"$ROOT/scripts/stop.sh" >/dev/null 2>&1 || true

echo "[dev] anvil (chain id 97) on :$RPC_PORT"
anvil --chain-id 97 --port "$RPC_PORT" --silent > "$DEV/anvil.log" 2>&1 < /dev/null &
echo $! > "$DEV/anvil.pid"
sleep 2

echo "[dev] deploying contracts"
OUT="$(cd "$ROOT/contracts" && PRIVATE_KEY=$OPERATOR_PK GUARD_AGENT_ADDRESS=$GUARD_ADDR \
  forge script script/Deploy.s.sol:Deploy --rpc-url "$RPC" --broadcast 2>&1)"
RWA="$(echo "$OUT" | sed -n 's/.*CERMIN_RWA_ADDRESS=\(0x[0-9a-fA-F]*\).*/\1/p')"
[ -n "$RWA" ] || { echo "$OUT"; echo "[dev] deploy failed"; exit 1; }
echo "[dev] CerminRWA at $RWA"

cat > "$ROOT/backend/.env" <<ENV
MOCK_LEDGER=false
CHAIN_ID=97
BSC_RPC_URL=$RPC
CERMIN_RWA_ADDRESS=$RWA
OPERATOR_PRIVATE_KEY=$OPERATOR_PK
GUARD_AGENT_ADDRESS=$GUARD_ADDR
USER_KEY_SECRET=local-dev-only
USERS_DB_PATH=$DEV/users.json
ENV
cat > "$ROOT/agent/.env" <<ENV
MOCK_LEDGER=false
CHAIN_ID=97
BSC_RPC_URL=$RPC
CERMIN_RWA_ADDRESS=$RWA
GUARD_AGENT_PRIVATE_KEY=$GUARD_PK
POLL_MS=3000
ENV

(cd "$ROOT/backend" && [ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null)
(cd "$ROOT/agent" && [ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null)

echo "[dev] backend on :3001, Guard Agent polling"
(cd "$ROOT/backend" && exec node --env-file=.env src/index.ts) > "$DEV/backend.log" 2>&1 < /dev/null &
echo $! > "$DEV/backend.pid"
(cd "$ROOT/agent" && set -a && . ./.env && set +a && exec node --import tsx src/index.ts) > "$DEV/agent.log" 2>&1 < /dev/null &
echo $! > "$DEV/agent.pid"

echo "[dev] up. Frontend: cd frontend && VITE_API_URL=http://localhost:3001 npm run dev"
