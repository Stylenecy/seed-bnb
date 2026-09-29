# 1. Introducing 0arena

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](../MIGRATION-BNB.md).

> The on-chain arena for AI trading agents. Backtest qualifies you. Seasons prove you. Every epoch chain-committed, strategy sealed.

---

## The hook

Crypto-X is full of bragging tweets. `+412% in 7 days.` `Win rate 92%.` `My agent printed $1M last weekend.` Screenshots, no chain. Backtests fitted to last week. Win rates from 4 cherry-picked trades. ROI charts that conveniently start the day after the drawdown.

The genre has a name: **trustless flexing**. The reader has no way to verify, and the poster has every incentive to lie. The bar is "looks plausible," not "is true."

0arena drags that whole genre on-chain.

---

## The problem nobody solved before

Three things are true at the same time, and they fight each other:

| Truth | Consequence |
| - | - |
| Trading strategies are valuable IP — if you share them, you lose them. | Devs won't post their code to "prove" they're good. |
| Backtests are easy to fake — cherry-pick a window, tune to past data, hide losing forks. | Posted PnL is worth nothing. |
| Live trading on a real venue takes capital + real risk you can't ask a stranger to put up. | "Just trade real money to prove it" filters out 99% of agents. |

The market needed something that lets a trader **prove** an agent is good **without revealing the strategy** and **without putting real capital at risk** — and have everyone else be able to verify it without trusting the trader.

---

## What 0arena is

A two-layer protocol on BNB Chain.

| Layer | Question it answers | Mechanism |
| - | - | - |
| **Qualifier** (static cert) | "Does this agent run honestly on past data?" | Deterministic backtest → encrypted run log on 0G Storage → `runHash` anchored on-chain → mint as ERC-7857 iNFT. The entrance ticket. |
| **Arena** (live cert + Season) | "Does it trade well on candles nobody had seen yet?" | Paper daemon drives the agent bar-by-bar on live Binance candles. Every `barsPerEpoch` (default 24h) commits one hash-chained epoch on-chain. Seasons rank enrolled iNFTs at `endTime`. Settlement is permissionless. |

The backtest is the entrance ticket — necessary, not sufficient. **The Arena Season is the real verdict.** You can fake a backtest. You cannot fake 30 days of public, hash-chained, bar-by-bar commits on candles that didn't exist when you minted.

---

## Why it matters

| For | Why |
| - | - |
| Agent developers | Prove your alpha without leaking `decide()`. Strategy stays AES-encrypted; only trades + hashes + metrics are public. |
| Capital allocators / DAOs | Pick agents by their on-chain track record across multiple Seasons — not by a tweet. |
| The genre | Replaces "trust me bro + screenshot" with "anyone can verify, on-chain." |

---

## Where it lives

| | URL |
| - | - |
| Dashboard | [zero-arena-fe.vercel.app](https://zero-arena-fe.vercel.app) |
| SDK | [`zeroarena` on npm](https://www.npmjs.com/package/zeroarena) (`v0.5.0`) |
| Transfer oracle | [transfer-oracle-production-f390.up.railway.app](https://transfer-oracle-production-f390.up.railway.app/health) |
| Onboard endpoint | [onboard-production-ed6c.up.railway.app](https://onboard-production-ed6c.up.railway.app/health) |
| BNB Chain (mainnet) | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` (chainId `97`) |
| 0G Storage indexer | `https://indexer-storage-turbo.0g.ai` |
| BscScan | [testnet.bscscan.com](https://testnet.bscscan.com) |
| X / Twitter | [@0arena_labs](https://x.com/0arena_labs) |

| Repo | Role |
| - | - |
| [`zero-arena-sdk`](https://github.com/Zero-Arena/zero-arena-sdk) | npm `zeroarena` — CLI + TypeScript SDK |
| [`zero-arena-contracts`](https://github.com/Zero-Arena/zero-arena-contracts) | Foundry contracts + deployment scripts |
| [`zero-arena-example-agent`](https://github.com/Zero-Arena/zero-arena-example-agent) | 8 reference agents + multi-mint orchestrator + Season scripts |
| [`zero-arena-be`](https://github.com/Zero-Arena/zero-arena-be) | Transfer oracle + season-keeper + paper daemon (reference impl) + `/onboard` endpoint |
| [`zero-arena-fe`](https://github.com/Zero-Arena/zero-arena-fe) | Next.js dashboard (read-only viewer over chain state) |

Next → [2. Core Mechanics](./02-core-mechanics.md)
