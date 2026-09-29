# flowroll-frontend

> The frontend for the Flowroll protocol — now on **BNB Smart Chain** (BSC testnet 97 by default). See [`../MIGRATION-BNB.md`](../MIGRATION-BNB.md).

This repo is a submodule of the [Flowroll monorepo](https://github.com/LanreAkintayo/flowroll). For a full overview of the protocol and instructions to run the entire stack, see the root README there.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Tech Stack

- **Framework:** Next.js 15, React
- **Styling:** Tailwind CSS, Framer Motion
- **Web3:** Wagmi, Viem, TanStack Query
- **Network:** BNB Smart Chain (viem `bscTestnet` / `bsc`), wagmi injected connector (MetaMask, Binance Web3 Wallet, Trust, Rabby…)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [npm](https://www.npmjs.com/)

> The frontend connects to a running instance of the offchain agent and deployed contracts. Make sure both are set up before running the frontend. See the [root monorepo README](https://github.com/LanreAkintayo/flowroll) for the full setup flow.

### Installation

**From the monorepo:**

```bash
cd flowroll-frontend
npm install
```

**As a standalone repo:**

```bash
git clone hhttps://github.com/LanreAkintayo/flowroll-frontend.git
cd flowroll-frontend
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Fill in the values. See [Environment Variables](#environment-variables) below.

### Run

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Deployments

BSC Testnet (97) contracts, deployed 2026-09-25 at block 132984157. The full table with BscScan links is in [`../flowroll-contract/README.md`](../flowroll-contract/README.md#deployments). Ready-to-use public env: `.env.bsc-testnet` (addresses only). Use it with `set -a; source .env.bsc-testnet; set +a; FAUCET_PRIVATE_KEY=... pnpm build && pnpm start`.
- PayrollManager [`0xC41a28492C6B07f4f6c97193022A764047fd69D7`](https://testnet.bscscan.com/address/0xC41a28492C6B07f4f6c97193022A764047fd69D7)
- YieldRouter [`0xefE4d6A2bb6359EdB745460130164e4a21DF81d4`](https://testnet.bscscan.com/address/0xefE4d6A2bb6359EdB745460130164e4a21DF81d4)
- PayVault [`0xDA21296afff7441F13dC123B684d55d150A5861F`](https://testnet.bscscan.com/address/0xDA21296afff7441F13dC123B684d55d150A5861F)
- MockUSDC [`0x9Bff57e4becEDD645813600d24d44F069eCf2F34`](https://testnet.bscscan.com/address/0x9Bff57e4becEDD645813600d24d44F069eCf2F34)

## Environment Variables

See `.env.example`. Key variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | `97` (BSC testnet, default) or `56` (BSC mainnet) |
| `NEXT_PUBLIC_BSC_RPC_URL` | Optional RPC override |
| `NEXT_PUBLIC_*_ADDRESS`, `NEXT_PUBLIC_DEPLOYMENT_BLOCK` | Contract addresses + deploy block from `flowroll-contract` `Deploy.s.sol` output |
| `NEXT_PUBLIC_ONBOARDING_TOKEN_ADDRESS` | Mock onboarding token (`ONBOARDING_TOKEN_ADDRESS`, formerly bridged INIT) |
| `NEXT_PUBLIC_AGENT_URL` | URL of the running rebalance agent health endpoint |
| `FAUCET_PRIVATE_KEY` | **Server-only** testnet faucet wallet (tBNB + MockUSDC). Was `NEXT_PUBLIC_FAUCET_PRIVATE_KEY`, which leaked into the browser bundle. |
| `FAUCET_NATIVE_AMOUNT` | tBNB sent per faucet claim (default `0.005`) |

Get testnet BNB from https://www.bnbchain.org/en/testnet-faucet.
