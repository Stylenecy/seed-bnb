#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────
# MUSASHI — Deploy, link, verify on BNB Chain (BSC testnet 97 / mainnet 56)
# ─────────────────────────────────────────────────────
# `forge script script/Deploy.s.sol` also works on BSC; this script adds:
#   - `forge create` silently reports "deployed to" even when the tx failed
#     (status 0 / out of gas). This script explicitly reads the receipt and
#     aborts if any deploy actually reverted.
#
# What it does (UUPS upgradeable):
#   1. Deploy ConvictionLog impl + ERC1967 proxy (initialize())
#   2. Deploy MusashiINFT impl  + ERC1967 proxy (initialize(convictionLogProxy))
#   3. Assert receipts are status=1 and have bytecode on-chain
#   4. ConvictionLog.setINFT(MusashiINFT proxy)
#   5. MusashiINFT.setOracle(deployer)     (hackathon: deployer = oracle)
#   6. Verify the IMPLEMENTATION sources on BscScan (needs ETHERSCAN_API_KEY)
#   7. Poll verify status
#   8. Update .env with the PROXY addresses (the canonical contract addresses)
#
# Upgrades later: deploy a new impl, then call upgradeToAndCall(newImpl, "") as
# the owner (UUPSUpgradeable). State persists in the proxy.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${CONTRACTS_DIR}/.env.local"
[[ -f "$ENV_FILE" ]] && { set -a; source "$ENV_FILE"; set +a; }

# Fallback: project root .env (where the user actually keeps the key)
ROOT_ENV="${CONTRACTS_DIR}/../.env"
if [[ -z "${BSC_PRIVATE_KEY:-}" && -f "$ROOT_ENV" ]]; then
    set -a; source "$ROOT_ENV"; set +a
fi

if [[ -z "${BSC_PRIVATE_KEY:-}" ]]; then
    echo "ERROR: BSC_PRIVATE_KEY not set. Put it in contracts/.env.local or the project-root .env."
    exit 1
fi

RPC_URL="${BSC_RPC_URL:-https://data-seed-prebsc-1-s1.bnbchain.org:8545}"   # default: BSC Testnet (97)
CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL")
EXPLORER_URL="${BSC_EXPLORER_URL:-$([[ "$CHAIN_ID" == "56" ]] && echo https://bscscan.com || echo https://testnet.bscscan.com)}"
SOLC_VERSION="0.8.28"
CL_GAS="${CL_GAS:-}"       # empty = let node estimate
INFT_GAS="${INFT_GAS:-6000000}"

cd "$CONTRACTS_DIR"

DEPLOYER=$(cast wallet address --private-key "$BSC_PRIVATE_KEY")

echo "╔════════════════════════════════════════════════╗"
echo "║   MUSASHI — Deploy + Verify (BNB Chain, chainId $CHAIN_ID)  "
echo "║   RPC:       $RPC_URL"
echo "║   Deployer:  $DEPLOYER"
echo "╚════════════════════════════════════════════════╝"
echo ""

# ─────────── helper: assert bytecode exists ───────────
assert_code() {
    local label="$1" addr="$2"
    local code
    code=$(cast code "$addr" --rpc-url "$RPC_URL" 2>/dev/null)
    if [[ "$code" == "0x" || -z "$code" ]]; then
        echo "ERROR: no bytecode at $addr ($label) — contract is not actually there"
        exit 1
    fi
}

# ─────────── helper: deploy + assert success ───────────
# Supports skipping deploy if a pre-deployed address is passed via $4.
deploy_contract() {
    local name="$1"         # human label
    local target="$2"       # src/Foo.sol:Foo
    local gas_flag="$3"     # empty or "--gas-limit N"
    local pre_deployed="$4" # if non-empty, skip deploy and just verify bytecode
    shift 4
    local constructor_args=("$@")

    if [[ -n "$pre_deployed" ]]; then
        echo ">>> Reusing existing $name at $pre_deployed (skip deploy)"
        assert_code "$name" "$pre_deployed"
        DEPLOYED_ADDR="$pre_deployed"
        DEPLOYED_TX=""
        return
    fi

    local cmd=(forge create "$target"
        --rpc-url "$RPC_URL"
        --private-key "$BSC_PRIVATE_KEY"
        --legacy --broadcast --json)
    [[ -n "$gas_flag" ]] && cmd+=($gas_flag)
    if ((${#constructor_args[@]})); then
        cmd+=(--constructor-args "${constructor_args[@]}")
    fi

    echo ">>> Deploying $name..."
    local raw
    raw=$("${cmd[@]}" 2>&1) || { echo "$raw"; echo "ERROR: forge create exited non-zero for $name"; exit 1; }

    # forge create --json prints pretty-printed JSON across multiple lines.
    # Strip any non-JSON prelude (e.g. "No files changed...") and parse the
    # trailing JSON object as a whole.
    local addr tx
    addr=$(echo "$raw" | python3 -c "
import sys, json, re
raw = sys.stdin.read()
m = re.search(r'\{[\s\S]*\}', raw)
if not m:
    sys.exit(0)
try:
    d = json.loads(m.group(0))
    print(d.get('deployedTo',''))
except Exception:
    pass
")
    tx=$(echo "$raw" | python3 -c "
import sys, json, re
raw = sys.stdin.read()
m = re.search(r'\{[\s\S]*\}', raw)
if not m:
    sys.exit(0)
try:
    d = json.loads(m.group(0))
    print(d.get('transactionHash',''))
except Exception:
    pass
")

    if [[ -z "$addr" || -z "$tx" ]]; then
        echo "$raw"
        echo "ERROR: could not parse forge create JSON output for $name"
        exit 1
    fi
    echo "    tx:   $tx"
    echo "    addr: $addr"

    # Assert receipt status=1 (cast receipt --json returns hex status)
    local status
    status=$(cast receipt "$tx" --rpc-url "$RPC_URL" --json 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin); print(d.get('status',''))
except Exception:
    pass
")
    if [[ "$status" != "0x1" && "$status" != "1" ]]; then
        echo "ERROR: $name deploy tx reverted (status=$status). Bump gas via CL_GAS / INFT_GAS env vars."
        exit 1
    fi

    assert_code "$name" "$addr"

    DEPLOYED_ADDR="$addr"
    DEPLOYED_TX="$tx"
}

# ─────────── helper: deploy an ERC1967 (UUPS) proxy + assert success ───────────
deploy_proxy() {
    local label="$1" impl="$2" initdata="$3"
    echo ">>> Deploying $label UUPS proxy (impl=$impl)..."
    local raw addr
    raw=$(forge create lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
        --rpc-url "$RPC_URL" --private-key "$BSC_PRIVATE_KEY" --legacy --broadcast --json \
        --constructor-args "$impl" "$initdata" 2>&1) \
        || { echo "$raw"; echo "ERROR: $label proxy deploy failed"; exit 1; }
    addr=$(echo "$raw" | python3 -c "
import sys, json, re
m = re.search(r'\{[\s\S]*\}', sys.stdin.read())
print(json.loads(m.group(0)).get('deployedTo','') if m else '')
")
    if [[ -z "$addr" ]]; then echo "$raw"; echo "ERROR: could not parse $label proxy address"; exit 1; fi
    assert_code "$label proxy" "$addr"
    echo "    proxy: $addr"
    DEPLOYED_ADDR="$addr"
}

# ─────────── Step 1: ConvictionLog (implementation + UUPS proxy) ───────────
# UUPS pattern: deploy the implementation, then an ERC1967 proxy that runs
# initialize() in its constructor. The PROXY is the canonical address (the impl
# is never called directly). Set CL_IMPL_ADDR to reuse a known-good impl.
deploy_contract "ConvictionLog impl" "src/ConvictionLog.sol:ConvictionLog" \
    "$([[ -n "$CL_GAS" ]] && echo "--gas-limit $CL_GAS")" \
    "${CL_IMPL_ADDR:-}"
CL_IMPL="$DEPLOYED_ADDR"
deploy_proxy "ConvictionLog" "$CL_IMPL" "$(cast calldata 'initialize()')"
CONVICTION_LOG="$DEPLOYED_ADDR"

# ─────────── Step 2: MusashiINFT (implementation + UUPS proxy) ───────────
deploy_contract "MusashiINFT impl" "src/MusashiINFT.sol:MusashiINFT" \
    "--gas-limit $INFT_GAS" \
    "${INFT_IMPL_ADDR:-}"
INFT_IMPL="$DEPLOYED_ADDR"
deploy_proxy "MusashiINFT" "$INFT_IMPL" "$(cast calldata 'initialize(address)' "$CONVICTION_LOG")"
MUSASHI_INFT="$DEPLOYED_ADDR"

echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  ConvictionLog:  $CONVICTION_LOG"
echo "│  MusashiINFT:    $MUSASHI_INFT"
echo "└─────────────────────────────────────────────┘"
echo ""

# ─────────── Step 3: ConvictionLog.setINFT ───────────
echo ">>> Linking ConvictionLog.setINFT($MUSASHI_INFT)..."
# Tolerate INFTAlreadySet (re-run path): we rely on the state read below as the
# source of truth anyway. `|| true` keeps the script alive when cast send reverts.
cast send "$CONVICTION_LOG" "setINFT(address)" "$MUSASHI_INFT" \
    --rpc-url "$RPC_URL" --private-key "$BSC_PRIVATE_KEY" --legacy >/dev/null 2>&1 || true

# Some RPCs return null for cast send's receipt — verify via state read instead.
LINKED=$(cast call "$CONVICTION_LOG" "inft()(address)" --rpc-url "$RPC_URL")
if [[ "$(echo "$LINKED" | tr '[:upper:]' '[:lower:]')" != "$(echo "$MUSASHI_INFT" | tr '[:upper:]' '[:lower:]')" ]]; then
    echo "ERROR: setINFT did not land. inft() = $LINKED (expected $MUSASHI_INFT)"
    exit 1
fi
echo "    linked OK (inft()=$LINKED)"
echo ""

# ─────────── Step 4: MusashiINFT.setOracle(deployer) ───────────
echo ">>> MusashiINFT.setOracle($DEPLOYER)..."
cast send "$MUSASHI_INFT" "setOracle(address)" "$DEPLOYER" \
    --rpc-url "$RPC_URL" --private-key "$BSC_PRIVATE_KEY" --legacy >/dev/null 2>&1 || true

ORACLE=$(cast call "$MUSASHI_INFT" "oracle()(address)" --rpc-url "$RPC_URL")
if [[ "$(echo "$ORACLE" | tr '[:upper:]' '[:lower:]')" != "$(echo "$DEPLOYER" | tr '[:upper:]' '[:lower:]')" ]]; then
    echo "ERROR: setOracle did not land. oracle() = $ORACLE (expected $DEPLOYER)"
    exit 1
fi
echo "    oracle set OK"
echo ""

# ─────────── Step 5: verify on BscScan (Etherscan V2 API) ───────────
verify_contract() {
    local addr="$1" target="$2"
    echo ">>> Verifying $target @ $addr"
    if [[ -z "${ETHERSCAN_API_KEY:-}" ]]; then
        echo "    skipped — set ETHERSCAN_API_KEY (Etherscan V2 key, works for BscScan) to verify"
        return 0
    fi
    forge verify-contract "$addr" "$target" \
        --chain "$CHAIN_ID" \
        --etherscan-api-key "$ETHERSCAN_API_KEY" \
        --compiler-version "$SOLC_VERSION" \
        --watch || echo "    verification failed/pending — retry later with forge verify-contract"
}

# Verify the IMPLEMENTATION contracts at their impl addresses. UUPS impls have
# argless constructors, so no constructor args. The proxies are standard
# OpenZeppelin ERC1967Proxy — BscScan detects them via "Is this a proxy?".
verify_contract "$CL_IMPL"   "src/ConvictionLog.sol:ConvictionLog"
verify_contract "$INFT_IMPL" "src/MusashiINFT.sol:MusashiINFT"

echo ""

# ─────────── Step 6: persist addresses ───────────
echo ">>> Writing addresses to .env.local + project-root .env (if present)..."
touch "$ENV_FILE"
python3 - "$ENV_FILE" "$CONVICTION_LOG" "$MUSASHI_INFT" <<'PY'
import sys, re, pathlib
path = pathlib.Path(sys.argv[1])
cl, inft = sys.argv[2], sys.argv[3]
text = path.read_text() if path.exists() else ""
def upsert(txt, k, v):
    if re.search(rf"^{k}=", txt, flags=re.M):
        return re.sub(rf"^{k}=.*$", f"{k}={v}", txt, flags=re.M)
    return (txt.rstrip() + "\n" + f"{k}={v}\n") if txt else f"{k}={v}\n"
text = upsert(text, "CONVICTION_LOG_ADDRESS", cl)
text = upsert(text, "MUSASHI_INFT_ADDRESS",   inft)
path.write_text(text)
PY

if [[ -f "$ROOT_ENV" ]]; then
    python3 - "$ROOT_ENV" "$CONVICTION_LOG" "$MUSASHI_INFT" <<'PY'
import sys, re, pathlib
path = pathlib.Path(sys.argv[1])
cl, inft = sys.argv[2], sys.argv[3]
text = path.read_text()
def upsert(txt, k, v):
    if re.search(rf"^{k}=", txt, flags=re.M):
        return re.sub(rf"^{k}=.*$", f"{k}={v}", txt, flags=re.M)
    return txt.rstrip() + "\n" + f"{k}={v}\n"
text = upsert(text, "CONVICTION_LOG_ADDRESS", cl)
text = upsert(text, "MUSASHI_INFT_ADDRESS",   inft)
path.write_text(text)
PY
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   DEPLOYMENT + LINK + VERIFY COMPLETE             "
echo "╠══════════════════════════════════════════════════╣"
echo "║  ConvictionLog (proxy): $CONVICTION_LOG"
echo "║  ConvictionLog (impl):  $CL_IMPL"
echo "║  MusashiINFT  (proxy):  $MUSASHI_INFT"
echo "║  MusashiINFT  (impl):   $INFT_IMPL"
echo "║  Oracle:                $DEPLOYER"
echo "╠══════════════════════════════════════════════════╣"
echo "║  $EXPLORER_URL/address/$CONVICTION_LOG"
echo "║  $EXPLORER_URL/address/$MUSASHI_INFT"
echo "╚══════════════════════════════════════════════════╝"
