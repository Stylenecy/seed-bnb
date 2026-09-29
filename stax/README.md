<div align="center">

<img src="web/public/brand/stax-dark.png#gh-light-mode-only" alt="Stax" width="92" />
<img src="web/public/brand/stax-light.png#gh-dark-mode-only" alt="Stax" width="92" />

# Stax

**Own the world's best companies — onchain, in one tap.**

Buy fractional shares of real tokenized stocks on BNB Chain, guided by **Vera**, an AI agent
whose every recommendation is **signed and verified on-chain before a cent moves**.

An AI agent that turns plain-language goals into risk-managed, verifiable RWA portfolios — originally built for the Mantle Turing Test Hackathon 2026, now running on **BNB Chain**.

<img src="docs/demo.gif" alt="Stax demo" width="640" />

### [▶ Live at stax.best](https://stax.best)

[Watch the full demo](web/public/stax.mp4) · [Contracts on BNB Chain ↓](#contracts-on-bnb-chain-bsc-testnet-97--mainnet-56)

</div>

---

## What makes it different — verifiable AI, on-chain

Most "AI × crypto" entries are a chatbot wrapped around a static product. Stax puts the AI
**inside the on-chain transaction** — the contract refuses to move funds unless the AI's signed
risk assessment passes verification:

```
Goal → /api/allocate          Vera turns plain words into a real allocation
     → /api/invest-plan        the server SIGNS an EIP-712 risk inference with the agent key
     → one gasless UserOp → StaxExecutor.investWithAI(...)
          → InferenceVerifier.verify(...)   reverts unless the signature is valid,
                                            assessedRisk ≤ maxRisk, and not expired
          → swaps execute (PancakeSwap V3)  emits RecommendationCommitted / AllocationExecuted
     → the app reads the events back for the receipt + Vera's public track record
```

That's the "provable, not just promised" guarantee on the success screen: the advice is
cryptographically signed and checked by a contract, not a marketing claim.

## How tracking works — the chain *is* the database

No off-chain DB. `StaxExecutor` emits an event on every action; the app reads them with
`getLogs` (`web/src/lib/onchainHistory.ts`):

| Event | Emitted when | Drives |
|---|---|---|
| `RecommendationCommitted(planId, user, recHash, riskScore, agentId)` | a plan is committed | "Plans built" |
| `AllocationExecuted(planId, user, usdcSpent, legCount)` | the invest executes | "Placed" + "$ invested" |
| `LegFilled(planId, tokenOut, usdcIn, received)` | each swap leg fills | per-asset detail |

Vera's reputation comes from `IdentityRegistry.reputationScore(agentId)`. Anyone can audit her
entire history on-chain — nothing is editable after the fact.

## Contracts on BNB Chain (BSC testnet 97 / mainnet 56)

> Migrated from Mantle — see [MIGRATION-BNB.md](MIGRATION-BNB.md). **Deployed on BSC testnet (97)** on 2026-09-25 (addresses below; record in `contracts/deployments/bsc-testnet.json`). Not yet on mainnet. Sources not yet verified on BscScan.

| Contract | Address | Role |
|---|---|---|
| **StaxExecutor** | [`0x8d684d9efcd779e69c29901292bd88266d5d2bdf`](https://testnet.bscscan.com/address/0x8d684d9efcd779e69c29901292bd88266d5d2bdf) | Commits the recommendation, calls the verifier, runs the swaps (non-custodial), emits the tracking events. Router/asset whitelists + slippage guards. |
| **InferenceVerifier** | [`0x674031d24b0b7874f1b9b278b98ebfebbdaa96ec`](https://testnet.bscscan.com/address/0x674031d24b0b7874f1b9b278b98ebfebbdaa96ec) | EIP-712 gate: `verify()` reverts unless the signature recovers to the agent signer, `assessedRisk ≤ maxRisk`, and `block.timestamp ≤ expiry`. |
| **IdentityRegistry** | [`0x5dd8fcb6a206b9f24847fbbc925e642b836555ea`](https://testnet.bscscan.com/address/0x5dd8fcb6a206b9f24847fbbc925e642b836555ea) | ERC-8004-style agent identity (Vera = **agentId 1**, an ERC-721 with an agent-card `tokenURI`) + reputation/feedback. |
| **MockERC20** (testnet only) | [`0x83f2dd5155dfe7d8eaa3d390c21fe89e2f1968bb`](https://testnet.bscscan.com/address/0x83f2dd5155dfe7d8eaa3d390c21fe89e2f1968bb) | 18-decimal "Mock USDC" settlement token for BSC testnet. |

Testnet-only mock assets (PancakeSwap V3, 0.25% tier, small full-range liquidity): AAPLx [`0xfc66023ef47b05bfd192cda3619e4f34db882258`](https://testnet.bscscan.com/address/0xfc66023ef47b05bfd192cda3619e4f34db882258) (pool [`0x3649748053A842c65A0f0Fdb9F932f5A542b13b4`](https://testnet.bscscan.com/address/0x3649748053A842c65A0f0Fdb9F932f5A542b13b4), ~$230), TSLAx [`0x1affa0ee05549c777772a100cb32877dd1390b9e`](https://testnet.bscscan.com/address/0x1affa0ee05549c777772a100cb32877dd1390b9e) (pool [`0x77ebB0FAFb1BE749C5055E9bB81EaD2210BFa582`](https://testnet.bscscan.com/address/0x77ebB0FAFb1BE749C5055E9bB81EaD2210BFa582), ~$250).
Vera is registered in the canonical ERC-8004 IdentityRegistry on BSC testnet (`0x8004A818BFB912233c491871b3d84c89A494BD9e`) as **agentId 97:2473** ([8004scan](https://www.8004scan.io/agents/97/2473)).
Fee treasury (testnet): `0xeAAedEae0d96f2155062c8B47832af87A5d4797A`. Agent signer: `0x71a909625BA8B0c67BA16a9B620De41FB2488D95`. Public env block: `web/.env.bsc-testnet` / `web/.env.example`.

Deploy with `cd contracts && npm run deploy:testnet` (BSC testnet) or `npm run deploy:bsc` (mainnet).
Sources in `contracts/contracts/*.sol` (Hardhat, Solidity 0.8.24, EVM `cancun`, OpenZeppelin 5.6).

## What you can do

- **Invest with Vera** — say a goal in plain words ("grow $300, mostly big tech, keep some safe"),
  review the named plan, place it in one tap. Gasless, with the on-chain-verified receipt.
- **Trade manually** — buy or sell any listed asset with live PancakeSwap V3 quotes and charts.
- **Wallet** — balance, send/receive (QR), holdings with live prices, and full incoming/outgoing
  transaction history (Etherscan V2 on BSC).
- **Autopilot** — delegate your embedded wallet (Privy session signer) so Vera invests on a
  schedule, autonomously and gaslessly, **within hard bounds** (per-period cap + risk ceiling)
  you authorize, revocable any time. *(Delegation + bounded config are live; the scheduled
  executor is in progress.)*
- **Gasless onboarding** — sign in with email or passkey, no seed phrase; funds live in an
  ERC-4337 smart account and Stax sponsors every gas fee.

## Assets

**Buyable now:** Apple, Nvidia, Tesla, Google, Meta, Robinhood, Circle, Strategy (stocks) and
S&P 500, Nasdaq-100 (funds) — tokenized stocks routed through PancakeSwap V3 on BNB Chain (BSC token/pool addresses are
configured via `NEXT_PUBLIC_ASSET_ADDRESSES` — TODO) — plus Safe Dollars and Staked ETH once
validated BSC routes are added.

**Coming soon:** Bitcoin, US Treasuries (Ondo USDY), and Ondo USD (mUSD) — added to Stax once
they're buyable on BNB Chain without paperwork.

## Revenue

A flat **25 bps (0.25%)** on capital deployed (buys + AI invests), taken as a gasless USDC
transfer to the treasury batched into the same UserOp. Gas stays on us. No spreads, no
subscription. (`web/src/lib/fees.ts`, configurable via `NEXT_PUBLIC_STAX_FEE_BPS`.)

## Tech

Next.js 16 (App Router, PWA) · Tailwind v4 · **Privy** (email/passkey embedded wallet,
delegated session signers) · **Pimlico + permissionless** (gasless ERC-4337, SimpleAccount v0.7)
· viem / wagmi · **Anthropic** via the AI SDK (Vera) · PancakeSwap V3 (BNB Chain
DEX) · Backed xStocks · Alchemy RPC + Etherscan V2 (tx history) · Hardhat contracts.

## Run it locally

```bash
# deploy contracts to BSC testnet first (see MIGRATION-BNB.md)
cd contracts && npm install && cp .env.example .env && npm run deploy:testnet

cd ../web && npm install
cp .env.example .env.local      # fill in the keys below
npm run dev                     # http://localhost:3000  (landing) · /app (the product)
```

**Required env** (full list in `web/.env.example`): `NEXT_PUBLIC_PRIVY_APP_ID` + `PRIVY_APP_SECRET`,
`PIMLICO_API_KEY`, `ANTHROPIC_API_KEY`, `AGENT_SIGNER_PRIVATE_KEY` (server-only — signs risk
inferences), `ETHERSCAN_API_KEY`, the deployed contract addresses, and
`NEXT_PUBLIC_STAX_EXECUTOR_BLOCK`. Optional: `ALCHEMY_API_KEY`, plus `PRIVY_AUTHORIZATION_KEY` +
`AUTOPILOT_CRON_SECRET` for Autopilot.

> Funds live on the **smart-account** address (the ERC-4337 account), not the Privy embedded EOA
> that owns it. The app always derives and shows the smart account.

## Repo layout

```
contracts/   Hardhat workspace — StaxExecutor / InferenceVerifier / IdentityRegistry + deploy scripts
web/         Next.js PWA — app/ (routes + API), src/components, src/lib, src/hooks
docs/        spec + README assets
```

## Security

Server routes require a verified Privy session; the Pimlico relay is auth-gated and
method-allowlisted; swaps enforce on-chain `amountOutMinimum` plus a price-impact ceiling; the
agent key is server-only. Hardening (auth, rate-limiting, input bounds, headers) lives across
`web/src/lib/server/*`.
