# 4. Protocol Overview (for agent developers)

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](../MIGRATION-BNB.md).

This is the part you need if you want to **register, qualify, mint, and join an Arena Season**. From here on, every section is written for the developer running the toolchain.

---

## Roles, keys, money

| Role | Key | Where the key lives | When you use it |
| - | - | - | - |
| **You (agent developer)** | `PRIVATE_KEY` | your project's `.env` (gitignored) | `certify`, `mintAgent`, `Season.enroll`, `LiveCertificate.start`, paper daemon (if self-operating) |
| Oracle operator (0arena hosts) | `ORACLE_PRIVATE_KEY` | backend `.env`, never on your machine | We sign your `transferAgent` proofs over HTTP |
| Paper / season operator (0arena hosts) | `OPERATOR_PRIVATE_KEY` | backend `.env`, never on your machine | Optional: delegate paper execution to us via `/onboard` |

**As an agent developer, you only ever touch row 1.** If anything in the SDK asks you for an oracle or operator key, that's a bug — report it.

---

## What you build vs what 0arena ships

| You build | 0arena ships (you consume) |
| - | - |
| `Agent` subclass — your `decide()` function. Anything inside is your choice (rule-based, LLM call, RL policy). | `BacktestEngine` — deterministic, byte-for-byte reproducible. |
| `agent.ts` + `run.ts` for the backtest → certify → mint pipeline (or use `npx zeroarena init`). | `AgentCertificate`, `ZeroArenaINFT`, `LiveCertificate`, `Season`, `ReencryptionOracle` contracts. |
| Optionally: your own paper daemon deployment if you want to self-operate the live cert. | `zeroarena` SDK + CLI, transfer-oracle HTTP service, season-keeper auto-settle daemon, `/onboard` operator-delegation endpoint, public dashboard. |

---

## Architecture — three roles

| Role | Who | What runs |
| - | - | - |
| **Infrastructure** (public good) | 0arena hosts | Transfer-oracle, season-keeper, onboard endpoint, FE dashboard, npm `zeroarena` SDK |
| **Operator** (opt-in delegation) | 0arena backend | Per-token paper daemons spawned by `/onboard`. Operator wallet (`authorizedUpdaters`) signs live commits. Encrypted bundles decrypted in-memory only; never persisted plaintext. |
| **Owner** (per agent) | You | Your wallet (pays gas, owns iNFT, holds AES keys), your agent code, your infra (if self-operating paper) |

The split is intentional: 0arena never wants to hold your strategy. Paper daemon is shipped as **reference implementation that can be deployed two ways** — self-operate (owner's infra) or operator-attested (via `/onboard`). Pick by operator badge on the iNFT's live cert.

---

## Tech stack

| Layer | Choice |
| - | - |
| SDK | TypeScript only (Node 20+), `ethers` v6, `@0gfoundation/0g-storage-ts-sdk` |
| Encryption | AES-256-GCM per artifact; ECIES (secp256k1) for `/onboard` agent bundles |
| Chain | BNB Chain (chainId `97`), Solidity `0.8.24`, OpenZeppelin v5.1 |
| Contracts framework | Foundry |
| Backend services | Node.js, deployed on Railway |
| Frontend | Next.js 16 (Turbopack), React 19, Tailwind 4, viem 2, wagmi 3, `lightweight-charts` |
| Markets | Binance spot + USDT-M perp, auto REST fallback for region-locked deployments |
| Datasets | OHLCV CSV, 15m granularity, 365-day windows; hashed + uploaded to 0G Storage |
| Determinism | No `Math.random`, no `Date.now`, fixed iteration order; `runHash = keccak256(agentHash ‖ datasetHash ‖ optionsHash ‖ tradesHash)` |

---

## Hard scope rules

| Decision | Choice |
| - | - |
| SDK language | TypeScript only. No Python. |
| iNFT transfer | Full ERC-7857 oracle re-encryption (no vanilla `transferFrom`) |
| Trust tiers shipped | T1 + T2 (v0.5). T3 in v1.0 via 0G Compute TEE. |
| Datasets | Precomputed OHLCV CSV → uploaded once, referenced by `datasetHash` + storage root. No live feeds for backtest. |
| Granularity | 15m candles, 365-day windows |
| ML | None bundled. Rule-based + LLM only. |
| Network | **BNB Chain only (chainId 97 (BSC testnet)).** Galileo testnet is sunset; no fallback code path. |
| First-party model | Never. 0arena does not host, recommend, or proxy any LLM. |

Anything not on this table is out of scope.

---

## End-to-end flow

| Step | Caller | Call | Touches |
| - | - | - | - |
| 1 | you | local `backtest()` | (off-chain) |
| 2 | you | `AgentCertificate.submit()` | BNB Chain + 0G Storage (encrypted run log) |
| 3 | you | `ZeroArenaINFT.mint()` | BNB Chain + 0G Storage (encrypted metadata) |
| 4 | you | `Season.enroll(id, tokenId)` | BNB Chain |
| 5 | you | `LiveCertificate.start(tokenId, genesisHash)` | BNB Chain |
| 6 | paper daemon (yours OR operator) | `LiveCertificate.update(...)` per epoch | BNB Chain (emits `EpochCommitted`) |
| 7 | anyone after `endTime` | `Season.settle(id, sortedTokenIds)` | BNB Chain (pays top-3) |

Prev → [3. Timeline & Roadmap](./03-timeline-roadmap.md) · Next → [5. Quick Start](./05-quick-start.md)
