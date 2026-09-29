#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
#  bsc-deploy.sh — deploy IPayPool + IPayGiftPool to BNB Smart Chain
# ─────────────────────────────────────────────────────────────────────────
#
# Replaces the Initia Move flow in legacy-initia/ (01-build / 02-deploy / 03-init).
#
# Usage (testnet, deploys a MockERC20 "USDT" unless TOKEN_ADDRESS is set):
#   BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
#   DEPLOYER_PK=0x... RELAYER_ADDRESS=0x... \
#     bash scripts/deploy/bsc-deploy.sh testnet
#
# Mainnet (TOKEN_ADDRESS required, e.g. USDT 0x55d398326f99059fF775485246999027B3197955):
#   BSC_RPC_URL=https://bsc-dataseed.bnbchain.org TOKEN_ADDRESS=0x55d3... \
#   DEPLOYER_PK=0x... RELAYER_ADDRESS=0x... \
#     bash scripts/deploy/bsc-deploy.sh mainnet
#
# Optional: PAY_FEE_BPS, PAY_FEE_CAP (token base units), BSCSCAN_API_KEY (adds --verify).
set -euo pipefail

NET="${1:-testnet}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT/packages/contracts/foundry"

: "${DEPLOYER_PK:?set DEPLOYER_PK}"
case "$NET" in
  testnet) RPC_ALIAS=bsc_testnet ;;
  mainnet) RPC_ALIAS=bsc; : "${TOKEN_ADDRESS:?TOKEN_ADDRESS is required on mainnet}" ;;
  *) echo "usage: $0 testnet|mainnet" >&2; exit 1 ;;
esac

[ -d lib/forge-std ] || forge install foundry-rs/forge-std --no-git
[ -d lib/openzeppelin-contracts ] || forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git

VERIFY=()
[ -n "${BSCSCAN_API_KEY:-}" ] && VERIFY=(--verify)

forge script script/Deploy.s.sol --rpc-url "$RPC_ALIAS" --broadcast --private-key "$DEPLOYER_PK" ${VERIFY[@]+"${VERIFY[@]}"}

echo ""
echo "Next: copy the printed addresses into packages/api/.env and packages/{app,admin}/.env,"
echo "then run scripts/deploy/bsc-register-gift-boxes.sh to load the gift box catalog."
