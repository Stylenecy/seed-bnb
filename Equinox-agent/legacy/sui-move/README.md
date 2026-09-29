# Equinox Contracts

On-chain Move package for Equinox, a modular DeFi vault router on Sui. A user
deposits collateral, chooses where to borrow and where to lend, and an off-chain
agent manages the position while an on-chain defense keeps it solvent.

The whole Sui toolchain runs in Docker, so the only host requirement is Docker.

Related docs: product overview in the repo-root `README.md`, design notes in
`../BLUEPRINT.md`, deployment ids in `DEPLOYMENTS.md`, venue integration notes in
`INTEGRATIONS.md`.

## Status

Live on Sui testnet, `sui move test` green (14/14). Single upgradable package,
cross-asset USD pricing via Pyth, modular venue selection, no Nautilus.

## Prerequisites

Docker (Desktop or Colima) installed and running. `make` is optional and used in
the examples below. The image bundles `sui`, `move-analyzer`, and `walrus`, pinned
via `suiup`.

## Quick start

```bash
make build-image    # first run vendors the sui CLI, then builds the image
make build          # compile the package
make test           # run unit tests
make shell          # interactive shell with the sui CLI
```

Without `make`:

```bash
./scripts/fetch-sui.sh
GITHUB_TOKEN=$(gh auth token) docker compose build
docker compose run --rm sui sui move build
```

The sui CLI binary is vendored on the host (`scripts/fetch-sui.sh`) and copied into
the image, because pulling the full release tarball inside the Docker VM was
unreliable. The image is based on Ubuntu 24.04 (the prebuilt sui binaries need
glibc 2.39).

## Layout

```
contracts/
  Dockerfile            Sui toolchain image
  docker-compose.yml    dev service + optional localnet
  Makefile              task shortcuts (all run in Docker)
  Move.toml             package manifest
  scripts/fetch-sui.sh  vendors the sui CLI binary (build helper)
  sources/
    access.move         AdminCap, AgentCap
    math.move           bps, LTV, health-factor helpers
    events.move         event definitions
    registry.move       registered venues + per-asset risk params
    oracle.move         USD price cache + Pyth read + valuation
    strategy.move       adapter convention + hot-potato ticket
    vault.move          Vault<C,Q>: collateral C, debt/reserve/spendable Q
    agent.move          strategy config, templates, skim, action log
    defense.move        cross-asset health factor + defend()
    shadow.move         optional per-user spendable pool
    strategies/
      native.move       Equinox native lending pool (real)
      scallop.move      Scallop venue adapter
      navi.move         Navi venue adapter
  vendor/pyth/          read-only Pyth interface (links to on-chain Pyth)
  tests/                unit and scenario tests (14)
```

## Modules

| Module | Responsibility |
|--------|----------------|
| `access` | `AdminCap` (protocol admin) and `AgentCap` (revocable executor authority). |
| `registry` | Shared singleton of supported venues and per-asset risk params (max LTV, liquidation threshold, oracle feed). Admin gated. |
| `oracle` | USD price cache. `refresh_from_pyth` reads a real Pyth price on-chain (via `vendor/pyth`); `set_price` is a keeper fallback. Plus `usd_value` and `amount_from_usd`. |
| `strategy` | Adapter convention and the `StrategyTicket` hot potato that forces a venue round-trip to settle in one PTB. |
| `vault` | `Vault<C, Q>` (shared): collateral `Balance<C>`, reserve `Balance<Q>` (defend source, skim destination, spendable), debt in `Q`, and an `ObjectBag` of opaque venue positions. |
| `agent` | Per-position config: `borrow_venue`, `lend_venue`, `apply_template` (conservative, balanced, aggressive), `skim_to_reserve`, and an action hash chain. |
| `defense` | Cross-asset USD health factor and a permissionless `defend()` that repays debt from the reserve. |
| `shadow` | Optional shared per-user spendable pool, kept for future auto-payouts. |
| `strategies/native` | Equinox native lending pool, the reference adapter. |
| `strategies/scallop`, `strategies/navi` | Venue registration plus the PTB recipe to wire the real protocol (mainnet). |

## Design

Three constraints shape the code:

1. Modular venues. Move has no dynamic dispatch, so the core never calls into a
   venue. The vault custodies opaque venue position objects (`P: key + store`) and
   the real venue call is composed in the PTB. Adding a venue is a registry entry,
   no core upgrade.
2. Upgradable. One package, one `UpgradeCap`. State layouts are upgrade-stable so
   logic can evolve under the compatible policy.
3. Trust. The agent acts under a revocable `AgentCap`, and every action is
   committed to an on-chain hash chain (full logs on Walrus). There is no Nautilus.

The core has zero external Move dependencies. Sui framework and MoveStdlib resolve
automatically. `vendor/pyth` is a read-only interface that links to the on-chain
Pyth package by id, so the build stays clean.

## Deploy

Two Makefile targets wrap the sui CLI. Run everything in the container. The package
is already live on testnet; current ids and a worked bootstrap are in
`DEPLOYMENTS.md`.

```bash
make build && make test                 # gate

make shell                              # then, inside the container:
  sui client switch --env testnet       # or mainnet
  sui client faucet                     # testnet gas; mainnet needs real SUI
  sui client balance

make deploy                             # publish (prints package id + objects)
make upgrade UPGRADE_CAP=0x...          # ship compatible changes to a deployment
```

`deploy` and `upgrade` use `--skip-dependency-verification` because the vendored
Pyth interface links by id, not bytecode. The toolchain records the published
address in `Published.toml`; a second `make deploy` reports "already published", so
use `upgrade` for changes. Signature or struct-layout changes are not compatible
and need a fresh publish.

After deploy, bootstrap as admin (repeatable, no redeploy): create pools, register
venues and assets, issue caps, and refresh prices. New venues are added the same
way at any time. Exact calls with real ids are in `DEPLOYMENTS.md`.

For repeatable multi-step bootstrap, the production path is a typed setup script
using the `@mysten/sui` TypeScript SDK in the app or backend repo. The CLI steps
are the source of truth.

## Networks

On Sui CLI 1.73.x, `testnet` and `mainnet` are built-in environments. Do not
declare them in `Move.toml`. The image is pinned to the testnet sui build; for
mainnet, `make NETWORK=mainnet build-image`. The wallet persists in the `sui-home`
Docker volume across `--rm`.

## Commands

| Task | Command |
|------|---------|
| Build image | `make build-image` |
| Compile | `make build` |
| Test | `make test` |
| Coverage | `make test-coverage` |
| Shell | `make shell` |
| Deploy | `make deploy` |
| Upgrade | `make upgrade UPGRADE_CAP=0x...` |
| Local network | `make localnet` / `make localnet-stop` |

Run `make help` for the full list.
