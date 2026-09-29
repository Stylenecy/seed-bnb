#!/usr/bin/env bash
# Downloads and extracts the OFFICIAL Digital Asset splice-node release bundle
# for a Canton DevNet validator. This script does NOT start anything and does
# NOT hand-author a docker-compose.yml — it stages the real, versioned bundle
# (which ships its own compose files + start.sh) so you can run Digital
# Asset's own tooling with the values from .env.
#
# Source (re-verified 2026-07-11):
#   https://docs.dev.sync.global/validator_operator/validator_compose.html
#   https://github.com/digital-asset/decentralized-canton-sync/releases
#
# Usage:
#   cp .env.example .env   # fill in real values first — see README.md
#   ./fetch-validator-bundle.sh
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
SPLICE_NODE_VERSION="${SPLICE_NODE_VERSION:-0.6.12}"

ASSET="${SPLICE_NODE_VERSION}_splice-node.tar.gz"
URL="https://github.com/digital-asset/decentralized-canton-sync/releases/download/v${SPLICE_NODE_VERSION}/${ASSET}"

echo "Downloading official splice-node bundle ${SPLICE_NODE_VERSION}..."
echo "  ${URL}"
curl -fsSL -o "${ASSET}" "${URL}"

mkdir -p splice-node
tar -xzf "${ASSET}" -C splice-node
rm -f "${ASSET}"

echo
echo "Extracted to ./splice-node/. Locating start.sh (bundled by Digital Asset):"
find splice-node -iname 'start.sh' -maxdepth 5 || true

echo
echo "Next: read README.md step 5 onward BEFORE running start.sh — it needs a"
echo "live SPONSOR_SV_URL, a freshly-minted (1-hour TTL) ONBOARDING_SECRET, and"
echo "the current MIGRATION_ID from https://canton.foundation/sv-network/."
echo "docs/07-devnet.md has the full status of what is ready now vs. what"
echo "still waits on your sponsor's IP allowlist."
