# Cermin-RWA

**Shadow money that repays your loan before liquidation ever happens.**

Cermin-RWA is an autonomous deleveraging agent for RWA-collateralized loans on **BNB Chain**. Borrowers post tokenized real-world assets (a mock tokenized US Treasury, `mUST`) as collateral, borrow a stablecoin (`mUSD`), and fund a "Shadow Vault". When collateral value drops, the Guard Agent automatically repays part of the loan from the Shadow Vault — before any margin call or liquidation can occur. Yield-bearing collateral (Treasury coupons) can also stream into repayment: a loan that pays itself off.

> Originally built on Canton Network (Daml) for the Build on Canton Hackathon (Encode Club, Track 1). It has been ported to BNB Chain — see [MIGRATION-BNB.md](./MIGRATION-BNB.md). The original Daml code lives in [`legacy/`](./legacy).

## Why the guard is trustworthy

The Guard Agent's only power over your vault is `CerminRWA.guardRepay(borrower)`, which re-reads the oracle price, recomputes your Health Ratio on-chain and **reverts unless it is below your own Guard Trigger**. It repays `min(amount-to-target, maxRepayPerEvent, vault balance)` straight to the pool. A healthy loan cannot be touched, and the pool has no function that can move your vault or policy.

Privacy note: Canton's sub-transaction privacy does not exist on a public EVM chain. On BNB Chain, loans, vaults, policies and rescue events are publicly readable.

## Repository layout

| Path | Purpose |
|---|---|
| `contracts/` | Foundry workspace: `CerminRWA.sol` (loan, Shadow Vault, Guard Policy, grace period, coupons), `RwaPriceFeed.sol` (mock oracle), `MockToken.sol` (mUST / mUSD), tests, `script/Deploy.s.sol` |
| `agent/` | Guard Agent service (TypeScript + viem): polls the contract and calls `guardRepay` / `startGracePeriod` / `sweepToLoan` |
| `backend/` | Thin Express bridge the frontend polls (`/api/position`, onboard, faucet, borrow, vault, price simulation); talks to the contract via viem |
| `frontend/` | React + Tailwind neobank UI — 5 screens incl. simulation mode; runs standalone or against the backend |
| `scripts/` | `dev.sh` (local full stack on anvil, chain id 97) and `stop.sh` |
| `legacy/` | Original Canton/Daml implementation and Canton network scripts (reference only) |
| `docs/` | Concept, UX, scope and pitch docs (written for the Canton version) |

## Network

| | BSC testnet (default) | BSC mainnet |
|---|---|---|
| Chain ID | 97 | 56 |
| RPC | https://data-seed-prebsc-1-s1.bnbchain.org:8545 | https://bsc-dataseed.bnbchain.org |
| Explorer | https://testnet.bscscan.com | https://bscscan.com |
| Faucet | https://www.bnbchain.org/en/testnet-faucet | — |

## Deployments

**BSC testnet (chainId 97)**, deployed 2026-09-25 at block 132,984,577. The addresses are also in [`contracts/deployments/bsc-testnet.json`](./contracts/deployments/bsc-testnet.json). Contracts are not verified on BscScan.

| Name | Address |
|---|---|
| CerminRWA | [`0x8651515462D17b6f4E7AEDe854E4C872C9eB64F2`](https://testnet.bscscan.com/address/0x8651515462D17b6f4E7AEDe854E4C872C9eB64F2) |
| mUST (MockToken) | [`0x3cf630d564b7ebEf6ff89D1aDACBA05CE9C03fC4`](https://testnet.bscscan.com/address/0x3cf630d564b7ebEf6ff89D1aDACBA05CE9C03fC4) |
| mUSD (MockToken) | [`0x11a430cf299dA0962783cB9851a81BB3Af20Ef50`](https://testnet.bscscan.com/address/0x11a430cf299dA0962783cB9851a81BB3Af20Ef50) |
| RwaPriceFeed | [`0x76B6F4b25216CD5e234d3D59A0e11fCA6790177E`](https://testnet.bscscan.com/address/0x76B6F4b25216CD5e234d3D59A0e11fCA6790177E) |
| Operator (issuer/pool/oracle EOA) | [`0x486a0a8A3Da3a2d752697BE8270976FCC3d36B7d`](https://testnet.bscscan.com/address/0x486a0a8A3Da3a2d752697BE8270976FCC3d36B7d) |
| Guard Agent (EOA) | [`0x5be38f0754454e7fbD93EB6615E33cE009070130`](https://testnet.bscscan.com/address/0x5be38f0754454e7fbD93EB6615E33cE009070130) |


## Quickstart

- Standalone demo (no chain needed): `cd frontend && npm install && npm run dev` → http://localhost:5173
- Contracts: `cd contracts && forge build && forge test`
- Full stack locally (anvil pretending to be BSC testnet): `scripts/dev.sh`, then `cd frontend && VITE_API_URL=http://localhost:3001 npm run dev`. Stop with `scripts/stop.sh`.
- BSC testnet: deploy with `contracts/script/Deploy.s.sol`, then fill `backend/.env` and `agent/.env` from their `.env.example` files (see MIGRATION-BNB.md).
