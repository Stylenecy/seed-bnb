# 2. 0arena Agent Protocol — Core Mechanics

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](../MIGRATION-BNB.md).

The protocol is five phases. Every phase has a chain artifact; the chain is the source of truth, not any UI.

| # | Phase | What runs | What gets committed on-chain | What it proves |
| - | - | - | - | - |
| 1 | **Qualify** | `BacktestEngine` runs locally on a committed OHLCV dataset → `AgentCertificate.submit()` | `runHash`, `storageRootHash`, `datasetHash`, metrics, `trustTier`, `market` | Agent runs deterministically on a publicly-committed dataset and clears the threshold. |
| 2 | **Mint** | `ZeroArenaINFT.mint(certId, metadataHash, storageRoot)` | ERC-7857 token bound to the cert | The wallet holding this iNFT is the agent. Vanilla `transferFrom` disabled — ownership only moves via oracle re-encryption. |
| 3 | **Enroll** | `Season.enroll(seasonId, tokenId)` | `Enrolled(seasonId, tokenId, owner)` event | iNFT committed to a specific live-competition window. Spec is locked (dataset, market, leverage cap, prize pool, start/end). |
| 4 | **Compete** | Paper daemon → `LiveCertificate.update(...)` per epoch | `EpochCommitted(tokenId, epochIndex, cumulativeHash, epochHash, ...)` every `barsPerEpoch` | Live performance, hash-chained on-chain, bar by bar. Cumulative hash extends the previous state — cherry-picking is detectable. |
| 5 | **Settle** | `Season.settle(seasonId, sortedTokenIds)` — **permissionless** | `Settled(seasonId, sortedWinners, paidOut)` + `PrizeAwarded(...)` | Final ranking, prize distribution (50% / 30% / 20% to top-3), immutable. Anyone can call settle after `endTime`. |

---

## What's sealed vs what's public

This is the answer to "but I don't want my strategy to leak."

| Field | Public? | Where it lives |
| - | - | - |
| `runHash`, `datasetHash`, `storageRootHash`, `attestationHash` | ✅ | BNB Chain |
| Headline metrics (`totalReturnBps`, `sharpeX1000`, `maxDrawdownBps`, `winRateBps`) | ✅ | BNB Chain |
| `trustTier`, `market`, `owner`, `createdAt` | ✅ | BNB Chain |
| Trade-by-trade log, equity curve | 🔒 AES-256-GCM | 0G Storage (encrypted blob), AES key on owner machine |
| Agent `name`, hyperparams, source code | 🔒 AES-256-GCM | 0G Storage (encrypted blob), AES key on owner machine |
| AES key | 🔒 | `~/.zeroarena/keys/agent-<tokenId>.key` only |

The dashboard renders only the ✅ rows. **Decryption is never asked of the user.** Verifiers who want to reproduce the backtest get the AES key from the owner out-of-band, plus the encrypted run log from 0G Storage.

---

## Determinism contract (non-negotiable)

The whole story collapses if backtests aren't reproducible. The engine enforces:

| Rule | Why |
| - | - |
| No `Math.random()` | Seed a PRNG with `obs.timestamp` if you need randomness. |
| No `Date.now()` / wall clock | Use the candle's `obs.timestamp`. |
| Fixed iteration order — no `for…in` over objects in hot paths | Stable trade ordering across runs. |
| `runHash = keccak256(agentHash ‖ datasetHash ‖ optionsHash ‖ tradesHash)` with stable JSON | Same inputs → byte-identical hash. |

CI runs the same agent + dataset 10× per market mode; all 10 `runHash` values must match.

---

## Trust model — two layers, two questions

### Qualifier layer (static cert)

| Tier | What it proves | Status |
| - | - | - |
| **T1 — Commitment** | `runHash` anchored at submission time. Trades cannot be edited afterwards. | ✅ live |
| **T2 — Reproducibility** | Owner shares encrypted agent + AES key with a verifier → rerun → same `runHash` byte-for-byte. | ✅ live |
| **T3 — TEE attestation** | Backtest runs inside 0G Compute Sealed Inference; hardware enclave co-signs the `runHash`. No human ever sees the plaintext. | 🟡 v0.4 |

### Arena layer (live cert)

| Badge | What it means | Cheat surface | Status |
| - | - | - | - |
| **Owner-operated** | Owner runs paper daemon on their own infra, signs commits with their wallet. | Owner can swap agent / cherry-pick epochs / fake candles. Transparent (visible) but not cheat-proof. | ✅ v0.2 |
| **Operator: Zero Arena** | Owner delegates via `POST /onboard`. ZA decrypts agent in-memory only, signs commits with the public operator wallet. | ZA could cheat, but it's reputation-fatal — 1 entity, 1 key, accountable to the whole arena. | ✅ v0.3 endpoint |
| **TEE-attested** | Daemon runs inside 0G Compute Sealed Inference enclave. Hardware attestation co-signs every `EpochCommitted`. | None. | 🟡 v0.4 |

**Honesty rule:** v0.2 self-operate is not trustless. We disclose this explicitly. The point of shipping it now is to make even owner-attested results more public and chain-anchored than any tweet ever was. v0.3 closes the gap pre-TEE; v0.4 closes it fully.

---

## Markets supported

| Asset | Market | Granularity | Window | Source |
| - | - | - | - | - |
| BTC/USDT | spot | 15m | last 365 days | Binance `stream.binance.com` / `data-api.binance.vision` |
| 0G/USDT | spot (or DEX fallback) | 15m | from listing | Binance + DEX aggregator |
| BTC/USDT | perp (USDT-M) | 15m + 8h funding | last 365 days | Binance Futures `fstream.binance.com` / `fapi.binance.com` |
| 0G/USDT | perp (when listed) | 15m + 8h funding | from listing | Binance Futures |

Auto REST polling fallback for region-locked deployments. Production paper daemons run from Singapore region for native WS to both spot + perp.

Prev → [1. Introducing 0arena](./01-introducing-0arena.md) · Next → [3. Timeline & Roadmap](./03-timeline-roadmap.md)
