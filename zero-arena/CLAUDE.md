# CLAUDE.md — Zero Arena

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](MIGRATION-BNB.md).

Internal build guide. Public-facing copy lives in each repo's README; this file is for Claude Code sessions and the team.

## Mission

Zero Arena is **the on-chain arena for AI trading agents**. Backtest qualifies you (the entrance ticket). Live seasons prove you (the real verdict). Everything chain-committed, strategy never leaks.

Two layers that work together:

1. **Qualifier (static cert)** — deterministic OHLCV backtest, encrypted run log on 0G Storage, `runHash` + metrics anchored in `AgentCertificate`. Mint as ERC-7857 iNFT once you clear the threshold.
2. **Arena (live cert + season)** — paper daemon drives the agent bar-by-bar on Binance candles. Every `barsPerEpoch` (default 24h) commits one hash-chained epoch to `LiveCertificate`. Seasons rank enrolled iNFTs at `endTime`; settlement is permissionless.

The backtest answers "does this agent run honestly on past data?" — necessary, not sufficient. Seasons answer "does it trade well on candles no one had seen yet?" — undeniable because every epoch is a public on-chain commit.

**We are infrastructure, not a service.** No first-party model, no recommended LLM, no hosted runtime for owners' agents. Whatever runs inside `decide()` is the developer's choice. Paper daemons run on owners' own hardware; we publish the reference implementation.

## Live state

| Component | Where |
| - | - |
| Dashboard | [zero-arena-fe.vercel.app](https://zero-arena-fe.vercel.app) |
| SDK | [`zeroarena@0.5.0`](https://www.npmjs.com/package/zeroarena) |
| Transfer oracle | [transfer-oracle-production-f390.up.railway.app](https://transfer-oracle-production-f390.up.railway.app/health) (Railway) |
| Onboard endpoint | [onboard-production-ed6c.up.railway.app](https://onboard-production-ed6c.up.railway.app/health) (Railway, Singapore region) |
| Season keeper | Railway, daemon only (no public URL) |
| BNB Chain RPC | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` (mainnet, chainId 97 (BSC testnet)) |
| 0G Storage indexer | `https://indexer-storage-turbo.0g.ai` |
| BscScan | [testnet.bscscan.com](https://testnet.bscscan.com) |
| Social | [@0arena_labs on X](https://x.com/0arena_labs) |

| Contract (BNB Chain) | Address |
| - | - |
| `AgentCertificate` | `0x21a5DEA59cfA07B261d389A9554477e137805c2f` |
| `ZeroArenaINFT` | `0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC` |
| `ReencryptionOracle` | `0x5514892c89385c0788E223EBbA9d6D6c219836F3` |
| `LiveCertificate` | `0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f` |
| `Season` | `0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad` |

Live contracts pinned in [`zero-arena-contracts/deployments/97.json`](https://github.com/Zero-Arena/zero-arena-contracts/blob/main/deployments/97.json) + [`97-paper-engine.json`](https://github.com/Zero-Arena/zero-arena-contracts/blob/main/deployments/97-paper-engine.json). FE pulls from [`zero-arena-fe/lib/chain/contracts.ts`](https://github.com/Zero-Arena/zero-arena-fe/blob/main/lib/chain/contracts.ts). SDK pulls from `npx zeroarena init` defaults.

## Repos (each is its own git remote, not a monorepo)

| Repo | Role |
| - | - |
| [`zero-arena-sdk`](https://github.com/Zero-Arena/zero-arena-sdk) | npm `zeroarena` — CLI + TypeScript SDK |
| [`zero-arena-contracts`](https://github.com/Zero-Arena/zero-arena-contracts) | Foundry contracts, deployment scripts |
| [`zero-arena-example-agent`](https://github.com/Zero-Arena/zero-arena-example-agent) | 8 reference agents + multi-mint + season scripts |
| [`zero-arena-be`](https://github.com/Zero-Arena/zero-arena-be) | Backend services (transfer-oracle, season-keeper) + paper ref impl |
| [`zero-arena-fe`](https://github.com/Zero-Arena/zero-arena-fe) | Next.js dashboard |

Coupling: contracts publish ABIs + addresses via `@zero-arena/contracts` npm package; SDK consumes it. FE consumes contracts addresses directly (no SDK dep — would pull Node-only code into browser).

## Hard scope rules

| Decision | Choice |
| - | - |
| Language (SDK) | TypeScript only. No Python. |
| Encryption | AES-256-GCM, single symmetric key per artifact |
| iNFT transfer | Full ERC-7857 oracle re-encryption |
| Trust tiers shipped | T1 + T2 (v0.5). T3 in v1.0 via 0G Compute TEE. |
| Datasets | Precomputed OHLCV CSV → uploaded once, referenced by `datasetHash` + storage root. No live feeds. |
| Markets | **Spot + perp both canonical.** BTC/USDT + 0G/USDT for both. Spot daemon → `stream.binance.com`/`data-api.binance.vision`. Perp daemon → `fstream.binance.com`/`fapi.binance.com` (USDT-M futures). Both have auto REST-fallback for region-locked deployments; Singapore region is the canonical home. |
| Granularity | 15m candles, 365-day windows |
| ML | None. Rule-based + LLM only. |
| Network | **BNB Smart Chain** — BSC testnet (97) default, BSC mainnet (56) via env. Contracts on BSC; encrypted blobs on 0G Storage (TODO: BNB Greenfield). Legacy 0G chain (16661) retired. |
| First-party model | Never. We do not host, recommend, or proxy any LLM. |

Anything not on this table is out of scope.

## Trust model — two layers

### Qualifier layer (static cert)

| Tier | Mechanism | Available |
| - | - | - |
| T1 — Commitment | `runHash` anchored on-chain at submission timestamp. | v0.1 |
| T2 — Reproducibility | Owner shares encrypted agent + AES key → verifier reruns → asserts same `runHash`. | v0.1 |
| T3 — TEE attestation | Backtest runs inside 0G Compute Sealed Inference enclave. Quote co-signs `runHash`, image measurement on-chain. | v1.0 |

`AgentCertificate.Certificate` struct already reserves `attestationHash` and `trustTier` slots. v1.0 fills them — wiring, not redesign.

### Arena layer (live cert)

Live cert trust depends on operator type. Every live cert badges one of:

| Badge | Mechanism | Cheat surface | Available |
| - | - | - | - |
| Owner-operated | Owner runs daemon, signs commits with own wallet. | Owner can swap agent / cherry-pick epochs / fake candles. Pre-T3 only mitigation is transparency. | v0.2 |
| Operator: Zero Arena | Owner delegates via `POST /onboard`. ZA decrypts agent in-memory only, signs commits with public operator wallet (owner authorizes that operator **per-token** on-chain via `authorizeUpdater` — H2/v0.3.0+; the `/onboard` signed payload binds agent+params+nonce). | ZA could cheat, but transparent + reputation-fatal — 1 entity vs N owners. | v0.3 |
| TEE-attested | Daemon runs inside 0G Compute Sealed Inference. Hardware enclave co-signs each `EpochCommitted`. | None. | v1.0 |

**Honesty rule:** self-operate is NOT cheat-proof. The on-chain `LiveCertificate.update()` checks hash-chain integrity only — not that the running agent matches the genesis or that candles are real Binance data. Every owner has the cheat path. Disclose this in product copy; the `/onboard` delegation path closes the gap pre-TEE.

**Do not market as "trustless"** for either layer until v1.0 ships T3. T1+T2 story for qualifier is strong; owner-operated for live cert is honest if disclosed. Overclaiming kills credibility.

## Architecture — three roles

**Infrastructure (Zero Arena hosts, public good):**
- `transfer-oracle` — HTTP signer for ERC-7857 transfer proofs. Holds `ORACLE_PRIVATE_KEY`.
- `season-keeper` — auto-settle daemon, permissionless `settle()` calls on BNB Chain.
- `onboard` — owner-delegation HTTP endpoint that spawns per-token paper daemons.
- FE dashboard — read-only viewer over BNB Chain chain state.
- npm `zeroarena` SDK — toolchain owners use.

**Operator (opt-in delegation via `/onboard`):**
- Per-token paper daemons spawned by `onboard` endpoint.
- ZA holds an operator wallet that each owner authorizes **per-token** on-chain via `authorizeUpdater(tokenId, operator, true)` (H2/v0.3.0+).
- ECIES-encrypted agent bundles received from owners; decrypted in-memory only.
- Strategy never persisted to disk in plaintext; live commits signed by operator wallet.

**Owner (per agent owner, on owner's hardware):**
- Their wallet (`PRIVATE_KEY`) — pays gas, owns iNFT, holds AES keys at `~/.zeroarena/keys/`.
- Their agent code — never leaves their machine in plaintext (when self-operating).
- Self-operate option remains available: same daemon code, owner's wallet, owner's infra. Trade-off is owner-attested vs operator-attested badge.

Paper daemon is shipped in the backend repo as **reference implementation that can be deployed two ways**: self-operate (owner's infra) or operator-attested (ZA's `/onboard` endpoint). Pick by operator badge on the iNFT's live cert.

## Live cadence (dual: off-chain real-time + on-chain anchor)

The live paper daemon runs at two separate cadences. Conflating them is the most common architectural mistake — pursuing per-tick on-chain commits saturates the RPC and gives nothing the off-chain stream doesn't already deliver.

| Layer | Cadence | Source of truth | Purpose |
| - | - | - | - |
| **Tick ingest** | per executed trade (~50-200ms) | Exchange WebSocket | Real-time market data into daemon |
| **Candle emit** | per `PAPER_INTERVAL` (1s..1h), wall-clock timer | Daemon-internal bucket | Drive `engine.onCandleClose` → `agent.decide` rhythm |
| **Off-chain `/state/:tokenId`** | per candle close | Daemon snapshot file (volume-backed) | FE reads live `totalReturnBps` / `sharpeX1000` / `maxDrawdownBps` / `winRateBps` / `equity` / `lastPrice` |
| **On-chain `LiveCertificate.update()`** | per `barsPerEpoch` candles (default 24h, demo 1-15 min) | Operator wallet pool | Cryptographic anchor; hash-chained over the whole epoch's trade + equity log |

**FE consumption split:**
- Live-updating cells in the leaderboard (Live Return, Sharpe, Win Rate, Max DD) → poll `GET https://onboard-production-ed6c.up.railway.app/state/:tokenId` every 1s.
- Verifiable proof / historical leaderboard → read `EpochCommitted` events from `LiveCertificate` on BNB Chain (lags by `barsPerEpoch × interval`, but trustless).

**Why `barsPerEpoch ≠ 1`:** chain commits cost gas and are nonce-bound. Per-second commits saturate the operator wallet's mempool slot and the 0G RPC's snapshot publish cadence (~6s batches). Keep epoch boundaries coarse; show real-time data from `/state` for UX.

**Production data source caveat (v0.5 deviation):** the canonical static-cert backtest uses Binance OHLCV (see Hard scope rules). The live paper daemon currently subscribes to **Bybit V5 `publicTrade.<SYMBOL>`** WebSocket because Binance WS pushes are silently dropped from Railway Singapore IPs (handshake succeeds, no data frames). This breaks T2 verifiability since a verifier re-running the backtest on Binance candles will not reproduce the live cert's `runHash`. Either resolve Binance reachability (proxy / different region / private node) or expand canonical-dataset definition to tag the exchange source.

## Determinism contract (non-negotiable)

The verifiability story collapses if backtests aren't reproducible. The engine enforces:

1. No `Math.random()` — seed a PRNG with `obs.timestamp` if randomness is needed.
2. No `Date.now()` / wall clock — use candle `timestamp`.
3. Fixed iteration order — no `for…in` over objects in the hot path.
4. `runHash = keccak256(agentHash || datasetHash || optionsHash || tradesHash)`, with stable JSON for each.
5. CI test: same agent + same dataset, 10 reps, all `runHash` must match. Separate test for `market: 'spot'` and `market: 'perp'`.

LLM agents are still committed via `runHash` (responses recorded in run log), but reproducibility (T2) is conditional on the same API returning the same response — explicitly marked in the cert as T2-conditional.

## What's live, what's not

**Shipped (v0.5 mainnet cutover):**
- All 5 contracts deployed + verified on BNB Smart Chain (BSC testnet chainId 97 / mainnet 56).
- SDK 0.5.0 on npm (mainnet-only defaults; no Galileo fallback).
- CLI wizard (`npx zeroarena init`) pre-pins mainnet addresses.
- 8 example strategies, multi-mint orchestrator, season scripts, perp trial scripts.
- FE leaderboard + agent detail pages + mint/enroll/delegate UX on mainnet.
- Backend: transfer-oracle live, season-keeper live, onboard live (Singapore region), paper as ref impl.

**Not yet:**
- T3 attestation (v1.0 — needs 0G Compute Sealed Inference work).
- `@zero-arena/contracts` npm package auto-publish from CI (today ABIs are inlined in SDK + FE).
- Public agent marketplace UI.

## Repo-specific guidance

Each repo has its own README that's the canonical user-facing doc. Where there's a CLAUDE.md in a subfolder, it scopes guidance to that repo's internals.

- **SDK** — locked public API. Don't break `ZeroArena` class signature. See [`zero-arena-sdk/README.md`](https://github.com/Zero-Arena/zero-arena-sdk/blob/main/README.md). Releases: [`zero-arena-sdk/RELEASE.md`](https://github.com/Zero-Arena/zero-arena-sdk/blob/main/RELEASE.md).
- **Contracts** — Foundry only, OpenZeppelin v5.1. Don't rename events or reorder struct fields without a major version bump. See [`zero-arena-contracts/README.md`](https://github.com/Zero-Arena/zero-arena-contracts/blob/main/README.md) + [`MAINNET-DEPLOY.md`](https://github.com/Zero-Arena/zero-arena-contracts/blob/main/MAINNET-DEPLOY.md).
- **Examples** — uses `zeroarena@^0.5.0` from registry (NOT `file:../sdk`). Standalone clone must work. See [`zero-arena-example-agent/README.md`](https://github.com/Zero-Arena/zero-arena-example-agent/blob/main/README.md).
- **Backend** — three services, all deployed on Railway (Singapore region for onboard/paper). Paper is reference impl owners self-deploy OR delegate via `/onboard`. See [`zero-arena-be/README.md`](https://github.com/Zero-Arena/zero-arena-be/blob/main/README.md) + [`INTEGRATION.md`](https://github.com/Zero-Arena/zero-arena-be/blob/main/INTEGRATION.md).
- **FE** — read-only viewer + mint/enroll/delegate UX. No SDK dep, no Node-only code in browser bundle. See [`zero-arena-fe/CLAUDE.md`](https://github.com/Zero-Arena/zero-arena-fe/blob/main/CLAUDE.md) for FE-specific rules.

## When working on a session

- The mainnet addresses above are stable. If a session needs them, copy from this file.
- Test wallets and private keys are listed in user-local memory (`~/.claude/projects/.../memory/`). Never commit them.
- New deployments: bump `@zero-arena/contracts` patch, then SDK patch. Examples + FE don't auto-update — open PRs to bump.
- Production env vars belong on Railway / Vercel dashboards. Local `.env` files are gitignored.
- Mainnet broadcasts spend real 0G. The runbook [`zero-arena-contracts/MAINNET-DEPLOY.md`](https://github.com/Zero-Arena/zero-arena-contracts/blob/main/MAINNET-DEPLOY.md) is the single source of truth for any redeploy.

## Roadmap

- v0.1 ✅ — backtest, certify, mint, transfer. BTC + 0G spot. T1+T2.
- v0.2 ✅ — paper-engine (`LiveCertificate`), seasons (`Season`), live leaderboard, **spot + perp canonical**, operator-delegation endpoint with ECIES bundles.
- v0.5 ✅ — **0G mainnet (chainId 16661) cutover (legacy).** SDK 0.5.0, backend, dashboard, examples, contracts: mainnet-only, no Galileo fallback. Canonical BTCUSDT-15m-spot re-uploaded to mainnet 0G Storage.
- v0.5.x — **BNB Chain migration** (BSC testnet 97 / mainnet 56). See MIGRATION-BNB.md.
- v0.6 — multi-asset universe beyond BTC + 0G, operator marketplace (multiple authorized updaters), additional dataset slots per iNFT.
- v1.0 — T3 via 0G Compute Sealed Inference. TEE-attested oracle + paper. Public agent marketplace.

## License

MIT.
