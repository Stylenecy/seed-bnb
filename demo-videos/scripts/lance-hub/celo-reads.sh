#!/usr/bin/env bash
# Live reads of the LanceHub proxy on Celo mainnet (+ BSC testnet) with foundry `cast`.
# Output → scripts/lance-hub/celo-reads.json (values used in src/projects/lance-hub/theme.ts CELO).
set -euo pipefail
P=0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2; R=https://forno.celo.org
c() { cast call "$P" "$1" --rpc-url "$R" | awk '{print $1}'; }
cat > "$(dirname "$0")/celo-reads.json" <<J
{ "proxy": "$P", "block": $(cast block-number --rpc-url $R), "at": "$(date -u +%FT%TZ)",
  "symbol": $(cast call $P "symbol()(string)" --rpc-url $R), "nav": "$(c 'nav()(uint256)')",
  "totalSupply": "$(c 'totalSupply()(uint256)')", "totalAssets": "$(c 'totalAssets()(uint256)')",
  "redeemFeeBps": $(c 'redeemFeeBps()(uint256)'), "owner": "$(c 'owner()(address)')" }
J
cat "$(dirname "$0")/celo-reads.json"
