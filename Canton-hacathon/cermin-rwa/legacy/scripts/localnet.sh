#!/usr/bin/env bash
# Cermin-RWA — CN Quickstart LocalNet (Mode C) helper.
#
# Boots a LEAN Splice LocalNet: the real Canton network (canton + splice super
# validator + postgres + onboarding + wallet/scan UIs) WITHOUT the quickstart's
# own licensing app (no backend-service / frontend / pqs), WITHOUT Keycloak
# (shared-secret auth), and WITHOUT the observability stack. This is all we need
# to deploy the Cermin DAR and run the Guard Agent against JSON Ledger API v2.
#
# Why not `make start`? The quickstart's `make build` compiles its own app with
# `dpm` (Digital Asset Package Manager) + a Gradle/npm toolchain that ships via
# its Nix devshell — none of which we have or need. We only want the network, so
# we invoke docker compose directly on the localnet + splice-onboarding modules
# (both are pulled images from ghcr.io; splice-onboarding is a tiny local build).
#
# Prerequisites: Docker Desktop running with >= ~10 GiB memory (see the runbook).
#
# Note: `up` returns once containers are STARTED — it does not gate on health
# (compose's own canton-health wait can time out and abort a slow fresh boot).
# Poll `scripts/localnet.sh ps` until canton shows (healthy) before seeding.
#
# Usage:
#   scripts/localnet.sh up        # pull + start the lean stack (detached)
#   scripts/localnet.sh down      # stop + remove containers (keeps volumes)
#   scripts/localnet.sh clean     # down + remove volumes (full reset)
#   scripts/localnet.sh ps        # container status
#   scripts/localnet.sh logs [svc]
#   scripts/localnet.sh dc ...    # raw docker compose passthrough
#
# Override the clone location with CN_QUICKSTART_DIR (default: sibling dir).
set -euo pipefail

CN_QUICKSTART_DIR="${CN_QUICKSTART_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/cn-quickstart}"
QS="$CN_QUICKSTART_DIR/quickstart"
if [ ! -d "$QS" ]; then
  echo "cn-quickstart not found at $QS" >&2
  echo "Clone it:  git clone https://github.com/digital-asset/cn-quickstart \"$CN_QUICKSTART_DIR\"" >&2
  exit 1
fi
cd "$QS"

# SPLICE_VERSION (image tag) comes from the quickstart's .env.
SPLICE_VERSION="$(grep -E '^SPLICE_VERSION=' .env | cut -d= -f2)"
if [ -z "$SPLICE_VERSION" ]; then
  echo "Could not read SPLICE_VERSION from $QS/.env — is the cn-quickstart clone intact?" >&2
  echo "Re-clone it:  git clone https://github.com/digital-asset/cn-quickstart \"$CN_QUICKSTART_DIR\"" >&2
  exit 1
fi

export MODULES_DIR="$QS/docker/modules"
export LOCALNET_DIR="$MODULES_DIR/localnet"
export LOCALNET_ENV_DIR="$LOCALNET_DIR/env"
export APP_PROVIDER_AUTH_ENV="$LOCALNET_ENV_DIR/app-provider-auth-on.env"
export APP_USER_AUTH_ENV="$LOCALNET_ENV_DIR/app-user-auth-on.env"
export SV_AUTH_ENV="$LOCALNET_ENV_DIR/sv-auth-on.env"
export IMAGE_TAG="$SPLICE_VERSION"
export IMAGE_REPO="ghcr.io/digital-asset/decentralized-canton-sync/docker/"
export DOCKER_NETWORK="quickstart"
export AUTH_MODE="shared-secret"
export TEST_MODE="off"
export PARTY_HINT="cermin-localnet-1"
export APP_PROVIDER_PROFILE="on" APP_USER_PROFILE="on" SV_PROFILE="on"

# Ensure a minimal .env.local exists (the compose --env-file chain expects it).
if [ ! -f .env.local ]; then
  cat > .env.local <<EOF
OBSERVABILITY_ENABLED=false
AUTH_MODE=shared-secret
PARTY_HINT=cermin-localnet-1
TEST_MODE=off
EOF
fi

dc() {
  docker compose \
    -f docker/modules/localnet/compose.yaml \
    -f docker/modules/localnet/resource-constraints.yaml \
    -f docker/modules/splice-onboarding/compose.yaml \
    -f docker/modules/splice-onboarding/resource-constraints.yaml \
    --env-file .env --env-file .env.local \
    --env-file docker/modules/localnet/compose.env \
    --env-file docker/modules/localnet/env/common.env \
    --profile app-provider --profile app-user --profile sv \
    "$@"
}

cmd="${1:-up}"; shift || true
case "$cmd" in
  up)    dc up -d --no-recreate "$@" ;;
  down)  dc down "$@" ;;
  clean) dc down -v "$@" ;;
  ps)    dc ps "$@" ;;
  logs)  dc logs "$@" ;;
  dc)    dc "$@" ;;
  *)     echo "unknown command: $cmd" >&2; exit 1 ;;
esac
