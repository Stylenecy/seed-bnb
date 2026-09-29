# Seed BNB Indo

Hackathon projects migrated to **BNB Chain**, each deployed and smoke-tested live on **BSC Testnet (chainId 97)**.

Every project folder has:
- `MIGRATION-BNB.md` — what changed to run on BNB Chain
- `VERIFY-BNB.md` — fork + live testnet verification, contract addresses, tx hashes (BscScan links)

| Project | What it is |
|---|---|
| `iusd-payment` | Gasless USDT payments & gift boxes (relayer auto-claim) |
| `stax` | AI-allocated tokenized-stock investing via PancakeSwap V3 |
| `Cermin` | Self-driving BNB-collateral vault (skim / defend) |
| `Canton-hacathon/cermin-rwa` | Guarded RWA loans with a Shadow Vault + Guard Agent |
| `Equinox-agent` | Agent-managed vaults with a shadow wallet |
| `drift` | Macro-regime trading agent with on-chain MacroGuard |
| `stellar-apac` (Liber) | Pay QRIS straight from USDC |
| `musashi` | Conviction-weighted token intelligence agent |
| `zero-arena` | Verifiable AI trading-agent arena |
| `flowrol` (Flowroll) | On-chain payroll with yield + salary advance |
| `BridgeAgent` | Trading agent with on-chain identity + trade journal |
| `monad-Golda-finance` (Golda) | Vault that hedges dollars into gold |
| `celo-pos/*` | Claudelance, BingoChain, LanceHub — multichain Celo + BNB |
| `Tessera` | Multi-chain address scanner (BSC, opBNB + 9 chains) |
| `Gridora` | Grid-trading agent with on-chain receipts (BSC mainnet + testnet) |
| `bnbhack-winn` | Neural-Alpha BSC trading agent (paper mode) |
| `demo-videos` | Remotion workspace for all demo videos |

**Demo videos** (with and without voice-over) are attached to the GitHub Release, not committed.
Contract deps: run `forge install` in each `contracts/` folder. Copy `.env.example` → `.env` and fill your own keys.
