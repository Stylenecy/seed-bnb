# Golda Finance

Autonomous Safe-Haven Agent for Onchain Treasuries on BNB Chain. 

Golda Finance is a defensive DeFi primitive designed to protect capital from market volatility. It uses an off-chain AI engine for macro regime classification and executes on-chain hedging via a Privy Agent Wallet. The vault rotates assets between stablecoins (USDT on BSC) and PAXG based on market conditions.

## Architecture
* AI Engine (Off-chain): Next.js backend utilizing LLMs for regime classification based on macro data and sentiment.
* Execution (Hybrid): Server-side Privy Agent Wallet constrained by strict execution policies.
* Custody (On-chain): Modified ERC-4626 vault on BNB Smart Chain (BSC Testnet chain ID 97, BSC Mainnet chain ID 56).
* Valuation: 5-minute PancakeSwap V3 TWAP (Uniswap V3-compatible oracle interface, no external oracles).
* Routing: LI.FI API for swap calldata generation.

## Repository Structure
* /Contracts - Foundry project (Smart Contracts & Tests)
* /FE - Next.js project (AI API, Privy Auth, LI.FI Routing, Frontend)
* claude.md - Context guidelines for AI coding assistants
* PLANNING.md - Development roadmap and concept overview

## Setup Instructions

### Smart Contract (/Contracts)
```
cd Contracts
forge install
forge build
forge test

# Deploy to BSC Testnet (deploys MockUSDT + MockPAXG)
cp .env.example .env && source .env
forge script script/DeployGolda.s.sol:DeployGolda --rpc-url bsc_testnet --private-key $PRIVATE_KEY --broadcast
```
See MIGRATION-BNB.md for details.

## Deployments

BSC Testnet (chainId 97), deployed 2026-09-25. Not verified on BscScan (no API key available).

| Contract | Address |
|---|---|
| GoldaVault (gVAULT) | [`0x8b91743bA458eb322DdAd7F75f265382581c95e0`](https://testnet.bscscan.com/address/0x8b91743bA458eb322DdAd7F75f265382581c95e0) |
| MockUSDT (18 dec, open mint) | [`0xeA200bD121a2AE2B149E0B46aDd2e3C620F1457A`](https://testnet.bscscan.com/address/0xeA200bD121a2AE2B149E0B46aDd2e3C620F1457A) |
| MockPAXG | [`0x2790a5B7c8fe75F346d6932edd4e491E0FdFce43`](https://testnet.bscscan.com/address/0x2790a5B7c8fe75F346d6932edd4e491E0FdFce43) |

LI.FI rebalance is not available on testnet; no PancakeSwap V3 pool is set (PAXG valued at 0). Addresses also in `Contracts/.env.bsc-testnet`.

### Web Application (/FE)
```
cd FE
npm install
npm run dev
```