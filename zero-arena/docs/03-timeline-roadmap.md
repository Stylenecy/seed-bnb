# 3. Timeline & Roadmap

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](../MIGRATION-BNB.md).

| Version | Status | What ships |
| - | - | - |
| **v0.1** | ✅ | Deterministic backtest engine, `AgentCertificate.submit`, `ZeroArenaINFT.mint`, ERC-7857 transfer flow via `ReencryptionOracle`. BTC + 0G spot. T1 + T2. |
| **v0.2** | ✅ | `LiveCertificate` (paper-engine), `Season` (competition windows, prize pools, permissionless settle), live leaderboard, **spot + perp canonical** (perp daemon hits Binance Futures `fstream`/`fapi`), live FE leaderboard. |
| **v0.3** | ✅ | Operator-delegation HTTP endpoint (`POST /onboard`) with ECIES-encrypted agent bundles. Per-token paper daemon orchestration. Operator badge on live cert. |
| **v0.5** | ✅ | **0G mainnet cutover (chainId 16661, legacy).** All 5 contracts deployed + verified on mainnet. SDK 0.5.0, backend, dashboard, examples, contracts: mainnet-only — no Galileo fallback. Canonical BTCUSDT-15m-spot re-uploaded to mainnet 0G Storage. FE mint / enroll / delegate UX shipped. |
| **v0.6** | 🟡 next | Multi-asset universe beyond BTC + 0G. Operator marketplace (multiple authorized updaters per token). Additional dataset slots per iNFT. |
| **v1.0** | ⚪ planned | T3 trust tier via 0G Compute Sealed Inference TEE — both backtest and paper daemon move into enclave. `attestationHash` slot wired. TEE-attested oracle + paper. Same HTTP surface, only the trust root changes. Public agent marketplace. |

---

## Live deployment — BNB Chain (chainId `97`)

### Contracts

| Contract | Address |
| - | - |
| `AgentCertificate` | [`0x21a5DEA59cfA07B261d389A9554477e137805c2f`](https://chainscan.0g.ai/address/0x21a5DEA59cfA07B261d389A9554477e137805c2f) |
| `ZeroArenaINFT` | [`0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC`](https://chainscan.0g.ai/address/0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC) |
| `ReencryptionOracle` | [`0x5514892c89385c0788E223EBbA9d6D6c219836F3`](https://chainscan.0g.ai/address/0x5514892c89385c0788E223EBbA9d6D6c219836F3) |
| `LiveCertificate` | [`0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f`](https://chainscan.0g.ai/address/0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f) |
| `Season` | [`0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad`](https://chainscan.0g.ai/address/0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad) |
| Deployer / admin / operator | [`0xB1a5402E46d5360D46A9fE0807D3C927b3f50DbD`](https://testnet.bscscan.com/address/0xB1a5402E46d5360D46A9fE0807D3C927b3f50DbD) |
| Oracle signer | [`0xDEf4B61EAF80eEd763c2D5C443e2b56cB2d600D1`](https://testnet.bscscan.com/address/0xDEf4B61EAF80eEd763c2D5C443e2b56cB2d600D1) |
| Deploy block | `33417145` (DeployAll) · `33417179` (DeployPaperEngine) |

All 5 contracts verified on [testnet.bscscan.com](https://testnet.bscscan.com). Pinned in [`zero-arena-contracts/deployments/97.json`](https://github.com/Zero-Arena/zero-arena-contracts/blob/main/deployments/97.json) + [`97-paper-engine.json`](https://github.com/Zero-Arena/zero-arena-contracts/blob/main/deployments/97-paper-engine.json).

> **Mainnet preview caveat.** `ReencryptionOracle` is still the v0.1 trusted-ECDSA stub. The wallet holding the oracle private key can forge any ERC-7857 transfer. v1.0 swaps to 0G Compute TEE-quote verification (no client-side change). Until then, treat the mainnet oracle key as a custody root and avoid high-value transfers.

### Backend services

| Service | URL | Job |
| - | - | - |
| Transfer oracle | [transfer-oracle-production-f390.up.railway.app](https://transfer-oracle-production-f390.up.railway.app/health) | HTTP signer for ERC-7857 re-encryption proofs (chain-agnostic) |
| Onboard endpoint | [onboard-production-ed6c.up.railway.app](https://onboard-production-ed6c.up.railway.app/health) | Operator-delegation HTTP endpoint for paper daemons (Singapore region) |
| Season keeper | (Railway, outbound-only) | Background daemon, polls every 60s, calls `Season.settle()` permissionlessly once `endTime` passes |

### Frontend

| Service | URL |
| - | - |
| Public dashboard | [zero-arena-fe.vercel.app](https://zero-arena-fe.vercel.app) |

### Infrastructure (0G)

| Service | URL |
| - | - |
| BNB Chain RPC | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` |
| 0G Storage indexer | `https://indexer-storage-turbo.0g.ai` |
| BscScan | [testnet.bscscan.com](https://testnet.bscscan.com) |

Prev → [2. Core Mechanics](./02-core-mechanics.md) · Next → [4. Protocol Overview](./04-protocol-overview.md)
