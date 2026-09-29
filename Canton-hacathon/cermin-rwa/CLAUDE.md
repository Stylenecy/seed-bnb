# CLAUDE.md — Cermin-RWA

Guidance for Claude Code when working in this repository.

**FIRST: read `STATE.md` at the repo root.** It is the living cross-session state — binding decisions, lessons learned from reviews, working rules, and current focus. It supersedes stale prose in docs/. Every agent (main session or subagent) reads it before working; update it when a decision, lesson, or milestone lands.

## What this project is

Cermin-RWA is a hackathon project (Build on Canton Hackathon by Encode, Track 1: Private DeFi & Capital Markets). It is an autonomous liquidation-protection agent for loans collateralized by tokenized real-world assets (RWA), originally on Canton Network and now ported to BNB Chain. Read `docs/01-concept.md` through `docs/05-ecosystem-fit.md` before writing any code.

Core loop: borrower posts mock tokenized Treasury (mUST) as collateral → borrows stablecoin (mUSD) from a simple lending pool → funds a Shadow Vault → an off-chain agent monitors collateral value → when health ratio drops below threshold, the agent calls `CerminRWA.guardRepay`, which repays part of the loan from the Shadow Vault → position restored, no liquidation.

## Stack (migrated to BNB Chain — see MIGRATION-BNB.md)

- **Smart contracts:** Solidity 0.8.24 + Foundry + OpenZeppelin in `contracts/` (`CerminRWA.sol`, `RwaPriceFeed.sol`, `MockToken.sol`). The original Daml templates are kept in `legacy/daml/` as the reference spec.
- **Network:** BNB Smart Chain — BSC testnet (97) by default, mainnet (56) via `CHAIN_ID`. Local dev: anvil with `--chain-id 97` (`scripts/dev.sh`).
- **Tokens:** mock tokenized Treasury `mUST` and mock stablecoin `mUSD` (ERC-20, 18 decimals).
- **Agent:** TypeScript Guard Agent using viem (`agent/src/evmLedger.ts`) with its own key.
- **Price feed:** mock oracle contract (`RwaPriceFeed`), owned by the operator.
- **Frontend:** React + Tailwind, talks to the chain through the thin backend (`backend/src/evmLedger.ts`).

## Hard rules

1. **Narrow delegation is the product.** The Guard Agent may only move vault money through `guardRepay`, gated on-chain by the borrower's trigger. (Canton's privacy guarantees do not carry over to BNB Chain — all state is public; don't claim otherwise in UI/docs.)
2. **No forced-liquidation code path in the happy demo.** Liquidation exists as a last-resort choice but the demo narrative is that the agent prevents it.
3. **Keep scope inside `docs/04-scope.md`.** Do not add features (governance, multi-pool, real oracles, mainnet deploy) without explicit request.
4. **No secrets in repo.** Keys via `.env` (gitignored).
5. Prefer clarity over cleverness in Solidity — judges will read the contracts.

## Working conventions

- Conventional commits (`feat:`, `fix:`, `docs:`).
- Each contract function gets a short doc comment mapping it to the original Daml choice.
- Tests: Foundry tests for every lifecycle path (fund, borrow, price drop, auto-repay, coupon sweep, full repay, last-resort default path).
- The demo script in `docs/04-scope.md` is the acceptance test: if a change breaks the demo flow, it's wrong.

## Vocabulary (use consistently in code, UI, docs)

- **Shadow Vault** — borrower's private reserve that repays the loan automatically ("shadow money").
- **Guard Agent** — the off-ledger automation party ("Cermin" = mirror: it watches your position so you don't have to).
- **Health Ratio** — collateral value / debt.
- **Guard Trigger** — threshold health ratio at which auto-repay fires.
- **Coupon Sweep** — routing collateral yield into loan repayment (self-repaying mode).
