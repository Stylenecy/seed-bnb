# Equinox Agent — Blueprint

> **BNB Chain migration note (2026-09).** This blueprint was written for the original Sui version (Sui Overflow 2026). The product has since been moved to **BNB Smart Chain**. The Solidity contracts are in `contracts/`, and the original Move code is in `legacy/sui-move/`. Read the Sui-specific parts below using this mapping:
>
> | Sui version | BNB Chain version |
> |---|---|
> | Move | Solidity |
> | Sui objects and capabilities | OpenZeppelin AccessControl roles |
> | Pyth / Supra | Chainlink on BSC |
> | Walrus | BNB Greenfield / IPFS |
> | zkLogin | wagmi/viem wallets or social login |
> | Suilend / Scallop / Cetus / DeepBook | Venus / Lista / PancakeSwap |
> | Nautilus | none (dropped even before the migration) |
>
> See `MIGRATION-BNB.md`. The sponsor and roadmap sections below are historical.

This document is the deep dive. For the high-level intro, problem, solution, and 5W1H, see `README.md`.

This blueprint covers: how the agent thinks, the math behind the spread, the Move module breakdown, the three user modes in detail, the defense system, sponsor integration, attack surface, and the roadmap.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Mechanics](#2-core-mechanics)
3. [User Modes — Detailed Behavior](#3-user-modes--detailed-behavior)
4. [The Agent — What It Actually Does](#4-the-agent--what-it-actually-does)
5. [Auto-Defense System](#5-auto-defense-system)
6. [Shadow Wallet](#6-shadow-wallet)
7. [Move Module Architecture](#7-move-module-architecture)
8. [Off-Chain Components](#8-off-chain-components)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Sponsor Integration](#10-sponsor-integration)
11. [Economics & Spread Math](#11-economics--spread-math)
12. [Attack Surface & Mitigations](#12-attack-surface--mitigations)
13. [Roadmap](#13-roadmap)

---

## 1. System Overview

Equinox Agent has four functional layers. From bottom to top:

**Layer 1 — Order Book**: A two-sided lending order book on Sui. Lenders post lend offers (rate, amount, term). Borrowers post borrow offers. Compatible orders match into loan objects. This is the original Equinox engine, kept intact, simplified to focus on fixed-rate term loans.

**Layer 2 — Agent Execution Layer**: Autonomous logic that, on behalf of each user, places orders into Layer 1, monitors positions, captures spreads, and triggers defensive actions. Runs partly on-chain (Move contracts that respond to triggers) and partly off-chain (Nautilus verifiable compute that decides what triggers to fire).

**Layer 3 — Mode Logic**: User-selected behavior templates (Forever Income / Loan + Auto-Repay / Yield Maximizer) that configure how the agent allocates spread, sizes positions, and defines exit conditions.

**Layer 4 — UX Layer**: Three-click onboarding, dashboard with three balances, activity feed, mode controls. Everything below this layer is invisible to the user unless they enable Pro Mode.

---

## 2. Core Mechanics

The protocol earns a user money by capturing **rate spread** between the lowest borrow offer and the highest lend offer in the order book at any given moment. That spread is then routed according to the user's selected mode.

### The borrow-lend loop

When a user activates a position with collateral `C`:

1. Agent calculates safe borrow amount `B = C × LTV_target` where `LTV_target` depends on risk profile.
2. Agent scans order book for the lowest available lend offer (i.e., the cheapest rate the user can borrow at). Calls this `r_borrow`.
3. Agent submits a borrow order matching that offer, takes `B` in USDC, and writes the debt to the user's vault.
4. Agent calculates `B_recycle = B × recycle_ratio` where `recycle_ratio` is a mode-dependent constant (typically 30–50%). The remaining `B - B_recycle` is routed to the user according to mode (cash payout, shadow wallet, or compounded back).
5. Agent scans the order book for the highest available borrow demand (i.e., the highest rate someone is willing to pay to borrow). Calls this `r_lend`.
6. Agent submits a lend order matching that demand, deploying `B_recycle` as a lend position.
7. The position now has two streams: outflow of `B × r_borrow` in interest, inflow of `B_recycle × r_lend` in interest.
8. The spread `B_recycle × r_lend − B × r_borrow` is captured per period and routed by mode logic.

If the spread is positive, the user's debt service is covered (and then some). If the spread is negative — which happens in tight rate markets — the agent reduces `B_recycle` until the configured safety condition holds, which may shrink user payouts but never lets the position become unsafe.

### Why this works on Sui specifically

The math above only works if (a) the order book has real two-sided depth, (b) finality is fast enough that the agent can act before stale orders mislead it, and (c) the cost of placing/canceling orders is low enough to do it frequently. Sui hits all three: DeepBook depth, ~400ms Mysticeti finality, sub-cent gas. On most other chains the spread would get eaten by gas and latency.

---

## 3. User Modes — Detailed Behavior

Each mode is a different policy on **what to do with captured spread** and **how to size the position**.

### Mode A: Forever Income (the "Pension" mode)

**Goal**: Generate continuous spendable yield from collateral that the user never wants to sell.

**Position sizing**: LTV stays inside a tight band (e.g., 50–55% for Balanced). When collateral appreciates, agent borrows more to maintain LTV; when it depreciates, agent repays from buffer.

**Spread allocation**:
- 100% of captured spread → split between Shadow Wallet (configurable, default 70%) and buffer (30%).
- Borrowed principal beyond what's recycled flows to Shadow Wallet on activation.

**Debt behavior**: Debt principal stays roughly constant in dollar terms. The user is treated as a permanent borrower whose interest is permanently subsidized by the lend leg. Exit at any time by repaying the outstanding balance (typically covered by the buffer + a small user top-up if the buffer was drawn down).

**Best for**: SUI long-term holders who want to live off their stack without selling.

### Mode B: Loan + Auto-Repay (the "Goal" mode)

**Goal**: Get a one-time loan now, have it repay itself by a target date, get collateral back whole.

**Position sizing**: Conservative LTV. Borrow amount is set to a target dollar value (e.g., user requests $1500). Excess capacity stays as buffer.

**Spread allocation**:
- 100% of captured spread → debt principal repayment.
- No shadow wallet payouts in this mode.
- Collateral appreciation also routes to debt repayment first, then to buffer once debt is paid off.

**Debt behavior**: Debt declines monotonically (modulo defense events). Math is sized so that under modeled rate conditions, debt reaches zero by the user's target date. If rates move adversely, the agent extends the timeline silently rather than failing — and warns the user via dashboard well before the original target.

**Best for**: Users who need a fixed-purpose loan (buying something, covering an expense) without recurring payments.

### Mode C: Yield Maximizer

**Goal**: Maximize total return on collateral over time. No withdrawals during active period.

**Position sizing**: Aggressive band (LTV up to 70% Balanced / higher for Aggressive risk).

**Spread allocation**:
- 100% of captured spread → re-borrowed and re-deployed into more lend positions (compounding the lend leg).
- No shadow wallet, no debt reduction.

**Debt behavior**: Debt grows over time (because compounding adds more borrow). Net position grows faster as long as spread stays positive. User exits by unwinding the entire position on demand.

**Best for**: Users who want to maximize SUI-denominated returns and don't need cash flow.

---

## 4. The Agent — What It Actually Does

The "agent" is not a single program. It's a coordinated set of on-chain triggers and off-chain decision logic. Per active user position, the agent has the following responsibilities:

### Responsibility 1: Order placement and replacement

The agent monitors the order book continuously. When a better borrow offer appears (lower `r_borrow`), the agent unwinds the existing borrow position and replaces it. When a better lend opportunity appears (higher `r_lend`), the agent moves the recycled portion. Frequency is throttled to avoid griefing the order book.

### Responsibility 2: Spread accounting

Every block, the agent computes accrued interest on both legs and routes the net to the configured destination (Shadow Wallet, debt principal, or compounded re-lend) per mode policy.

### Responsibility 3: Health monitoring

The agent watches the user's collateral price (via Pyth or Supra oracle) and computes health factor `HF = (collateral_value × liquidation_threshold) / debt_value`. When `HF` drops below mode-configured threshold, the defense system triggers (see Section 5).

### Responsibility 4: Capacity routing

When collateral appreciates, new borrow capacity unlocks. The agent routes new capacity per mode policy: Forever Income splits between Shadow and buffer; Loan + Auto-Repay routes everything to debt; Yield Maximizer compounds.

### Responsibility 5: Decision logging

Every meaningful decision (place order, cancel order, defense trigger, capacity routing) is hashed and stored in Walrus, with a Move-side commitment to the hash. This makes the agent's behavior fully auditable post-hoc — critical for trust in autonomous systems.

### Where the logic runs

- **On-chain (Move)**: parameter validation, position state, debt accounting, oracle reads, defense execution, emergency pause.
- **Off-chain (Nautilus)**: order book scanning, optimal rate selection, timing of replacements, compute-heavy decisions. Output is a signed instruction that the on-chain contract verifies before executing.

This split means the agent's *decisions* are verifiable but its *speed* isn't bottlenecked by every block.

---

## 5. Auto-Defense System

Auto-defense is the feature that makes "set and forget" honest. Without it, the agent is just a fancy frontend.

### How the defense fund accumulates

Two sources fund the buffer:

1. **Spread overflow**: when the spread is fatter than needed to cover debt service, the excess (per mode allocation) goes to buffer.
2. **Collateral appreciation**: a configured share of new borrow capacity unlocked by price increases.

The buffer is held in USDC inside the user's vault, not lent out. It must be liquid for instant deployment.

### Defense triggers

The agent watches two thresholds:

- **`HF_warn` (e.g., 1.5)**: agent stops opening new lend positions, shrinks `B_recycle`, accumulates more buffer.
- **`HF_defend` (e.g., 1.3)**: agent immediately repays a portion of debt from buffer to push `HF` back above 1.6.

### What happens in a crash

Suppose collateral drops 30% in an hour. The position's HF drops from 1.8 to 1.26. The agent:

1. Reads oracle price update.
2. Computes new HF, sees it's below `HF_defend`.
3. Calculates repay amount needed to restore HF to safe level.
4. Pulls that amount from buffer.
5. Submits debt repayment via the order book (which closes part of the borrow position).
6. Logs the event to Walrus.
7. If buffer is insufficient, escalates: notifies user, pauses spread capture, optionally sells a small fraction of collateral via DeepBook (only as last resort, only if user opted into this in risk profile).

Liquidation only happens if the buffer is drained AND user-opted-in collateral sale is also exhausted AND HF still drops below the protocol's hard liquidation threshold. In Conservative profile, this is a multi-standard-deviation event.

### Permissionless defense

In addition to the agent, anyone can call `defend(position_id)` on the contract. If the position is below `HF_defend` and the agent hasn't acted (e.g., Nautilus downtime), any third party can trigger the defense logic and earn a small reward. This is the on-chain safety net that makes the system robust even if the off-chain agent fails.

---

## 6. Shadow Wallet

The Shadow Wallet is a per-user balance of spendable USDC that lives inside the protocol but doesn't reduce the user's collateral.

### How it fills

- **Mode A**: every period the spread is captured, a configured share lands here.
- **Mode A & C**: when collateral appreciates and new capacity unlocks, a share lands here (Mode A only — Mode C compounds instead).
- **Mode B**: doesn't fill — Shadow is disabled.

### How it empties

User can withdraw any time. Withdrawal does not affect debt, collateral, or HF. It's effectively a yield payout.

### Why it's separate from collateral

The Shadow Wallet exists because users emotionally want to know: "this is the money I can spend, my BTC/SUI is over there and untouched." Conflating them creates anxiety. Separating them creates clarity. This is a UX principle, not a technical one — but the technical design enforces it: collateral lives in a Move object the user cannot withdraw without closing the position; Shadow lives in a separate balance that's freely withdrawable.

---

## 7. Move Module Architecture

The protocol is six core modules.

### `vault.move`
Holds user collateral. Owns the position object. Tracks collateral balance, debt principal, accrued interest, buffer balance, shadow balance. All position mutations go through here.

### `orderbook.move`
The lending order book (kept from original Equinox design). Stores lend offers and borrow offers. Matches compatible orders. Emits loan objects. Simplified from the original to focus on fixed-rate term loans only — variable-rate orders removed for MVP.

### `agent.move`
Holds per-position agent state: mode, risk profile, target LTV band, recycle ratio, defense thresholds, last action timestamp, action log hash chain. Executes agent instructions submitted from off-chain (with verifiable Nautilus signatures).

### `defense.move`
The on-chain defense logic. Reads oracle price, computes HF, executes buffer-funded repayments. Exposes the permissionless `defend()` entry function. Has emergency-pause cap held by protocol multisig.

### `shadow.move`
The shadow wallet balances per user. Mint/burn logic restricted to `agent.move` (for fills) and user (for withdrawals).

### `registry.move`
Asset registry for supported collateral types and configurations. Risk parameters (liquidation threshold, oracle feed, allowed LTV) per asset.

### Module interaction diagram

```
        ┌─────────┐
        │  User   │
        └────┬────┘
             │ deposit / activate / withdraw
             ▼
        ┌─────────┐
        │  vault  │◄───────────┐
        └────┬────┘            │
             │ owns            │ updates state
             ▼                 │
        ┌─────────┐         ┌──┴──────┐
        │  agent  │────────►│ defense │
        └────┬────┘ checks  └─────────┘
             │ trades                ▲
             ▼                       │ permissionless trigger
        ┌─────────┐                  │
        │orderbook│◄─────────────────┘
        └─────────┘

        ┌─────────┐
        │ shadow  │◄── filled by agent, withdrawn by user
        └─────────┘
```

---

## 8. Off-Chain Components

### Nautilus agent worker

Runs on Sui's verifiable compute infrastructure. One worker process per active position (or sharded across positions for efficiency). Responsibilities:

- Poll order book state every block.
- Compute optimal `r_borrow` / `r_lend` selection.
- Determine whether replacement is worth doing (factoring gas).
- Compute defense decisions in real time.
- Sign instructions with Nautilus attestation.
- Submit signed instructions on-chain via `agent.move`.

The on-chain contract verifies the Nautilus attestation before executing, so a compromised worker can't issue malicious instructions.

### Walrus storage layer

Stores three things:

1. **Decision logs**: full reasoning trace for every agent action, hashed and committed on-chain.
2. **Order book history**: for analytics and rate forecasting.
3. **User onboarding metadata**: encrypted, only readable by the user (via zkLogin-derived key).

Walrus is the canonical storage for anything that doesn't need to be on-chain but needs to be verifiable and durable.

### Oracle layer

Pyth as primary, Supra as fallback. Read every block in `defense.move`. Cross-checked against DeepBook spot price for sanity (rejects updates that diverge by more than a configured tolerance).

---

## 9. Frontend Architecture

### Stack
Next.js + React + Tailwind + shadcn/ui. Sui SDK + zkLogin SDK. WebSocket for real-time agent activity feed.

### Three core screens

**Onboarding (3 steps)**:
- Step 1: zkLogin → choose collateral asset
- Step 2: Pick mode (3 large cards)
- Step 3: Pick risk profile (3 large cards)
- Confirmation summary → "Activate"

**Dashboard**:
- Three balance cards (Collateral, Active Debt, Shadow Wallet)
- Live agent activity feed (last 10 actions)
- HF gauge with color coding (green/yellow/red)
- Mode-specific projections (e.g., "Goal mode: debt projected to zero in 287 days")
- Pro Mode toggle (reveals raw order book interface for advanced users)

**Settings**:
- Change mode (with cooldown)
- Change risk profile
- Pause / unwind position
- Export decision log (Walrus URL)

### Design constraints

- Black-and-white aesthetic with a single accent color, glowing highlights on active states. No gradients, no neon.
- Mobile-first responsive layout.
- All numerical values double-displayed: USD value + asset units.
- Activity feed uses agent's persona (each user's agent has a name + minimal avatar) for engagement.

---

## 10. Sponsor Integration

Concrete, non-cosmetic integration for each Sui Overflow 2026 sponsor.

### Walrus (Headline Partner)

Walrus is core infrastructure for the agent's auditability. Every meaningful agent decision produces a structured log entry — what data the agent saw, what alternatives it considered, what action it took, what the expected outcome was. These entries are stored on Walrus, with on-chain commitments to their hash.

This matters because autonomous financial agents need post-hoc auditability or no one will trust them with real money. Walrus is the only Sui-native solution that provides durable, verifiable, decentralized storage for this volume of data. Storing logs on-chain would be cost-prohibitive; storing them on a centralized server would defeat the purpose.

### OpenZeppelin (Prize Sponsor)

OpenZeppelin patterns are used for:
- Vault access control (only owner can withdraw shadow; only agent can mutate debt; only protocol multisig can emergency-pause).
- Reentrancy guards on all multi-module calls (vault → orderbook → defense paths are sensitive).
- Upgradeable proxy patterns for the agent module specifically (agent logic will iterate post-mainnet; vault and orderbook should not).

### OtterSec (Prize Sponsor)

The protocol is designed with audit in mind from day one:
- Minimal trusted computing base (defense.move is small and pure).
- All external calls through gates with explicit invariant checks.
- Property tests for the spread accounting logic (it's the easy place to introduce off-by-one bugs that drain protocol funds).
- Clear separation between user funds and protocol fees.

OtterSec audit is a target post-MVP. Submitting to their prize track means the project will be designed to their published audit-readiness criteria.

### Scallop (Prize Sponsor)

Scallop is an integration partner, not a competitor. Two integration paths:

1. **Lend leg fallback**: when the Equinox order book has no lend opportunity above the threshold rate, the agent can route the recycled portion into Scallop's lending pool as a fallback. Scallop gets TVL flow; Equinox users get continuous yield even in thin order book conditions.
2. **Cross-protocol mode**: a future mode where Scallop's pool is the primary lend destination and Equinox's order book is the borrow source. Combines pool-style depth with order-book-style rate optimization.

---

## 11. Economics & Spread Math

### Per-position revenue (gross, before protocol fee)

Let:
- `B` = borrow size in USDC
- `r_b` = borrow rate (annualized)
- `B_r` = recycled lend size = `B × ρ` where `ρ ∈ [0.3, 0.5]` is recycle ratio
- `r_l` = lend rate (annualized)

Annual debt service: `B × r_b`
Annual lend yield: `B_r × r_l = B × ρ × r_l`
Net annual surplus: `B × (ρ × r_l − r_b)`

For the spread to cover debt service entirely (i.e., the loan is "free"), we need:
```
ρ × r_l ≥ r_b
```

Example: if `r_b = 5%` and `r_l = 12%`, then `ρ ≥ 5/12 ≈ 0.42` makes the loan free. With `ρ = 0.5`, the surplus is `B × (0.5 × 0.12 − 0.05) = B × 0.01`, i.e., 1% of borrow size per year as net positive spread.

### When spread goes negative

If `r_l` drops below `r_b / ρ`, the position bleeds. The agent's response:

1. First, reduce `ρ` to keep the position breakeven (lend less, borrow less recycled).
2. If even `ρ = 0` makes spread negative (i.e., `r_b` itself is high), stop opening new positions and stop subsidizing existing ones from the buffer. User's debt now grows at `r_b`. User notified.
3. In modes A and B, the agent will draw from buffer to cover debt service for a configurable grace period before passing the cost to the user.

### Protocol fee

A flat percentage of captured spread (e.g., 10%) flows to the protocol treasury. This is the only revenue source for the project and is transparent in the dashboard.

### Sensitivity to rate compression

If Sui's lending market compresses rates over time (typical of mature DeFi), spread shrinks. The protocol degrades gracefully:
- Mode C (Yield Max) loses the most appeal.
- Mode B (Loan + Auto-Repay) extends timelines.
- Mode A (Forever Income) reduces shadow wallet payouts.

The protocol does not break in tight-rate environments. It just produces less yield. This is honest behavior; no synthetic yield is invented.

---

## 12. Attack Surface & Mitigations

### Oracle manipulation
**Risk**: Attacker manipulates Pyth/Supra to trigger false defense or false liquidation.
**Mitigation**: Cross-check with DeepBook spot, reject divergent updates, time-weighted average price for non-emergency reads, hard divergence circuit breaker.

### Order book manipulation
**Risk**: Attacker stuffs the book with phantom lend offers at near-zero rates to lure the agent into a bad borrow that gets immediately re-priced.
**Mitigation**: Agent only matches against orders that have been resting for `N` blocks. Real lender capital must show commitment.

### Sandwich on agent transactions
**Risk**: Searcher sandwiches the agent's order placements.
**Mitigation**: Agent uses Sui's native transaction submission (no public mempool that bots can frontrun the same way as Ethereum). Stealth Mode (ZK-private orders) for whale positions.

### Nautilus worker compromise
**Risk**: Off-chain worker is compromised and submits malicious instructions.
**Mitigation**: All instructions are verified on-chain against Nautilus attestation. The worker can't issue an instruction that violates the user's mode parameters or risk profile (the contract enforces bounds, the worker just decides where inside the bounds to act).

### Spread accounting bug
**Risk**: Off-by-one error in interest accrual drains funds over time.
**Mitigation**: Property-based tests for accounting invariants. Conservative rounding (always round in protocol's favor). Daily reconciliation report posted to Walrus for any anomaly detection.

### Cascade liquidation in extreme markets
**Risk**: All buffer-defended positions hit the buffer simultaneously, draining liquidity and triggering cascade.
**Mitigation**: Buffers are per-position, not pooled, so individual positions can't drain a shared resource. In extreme system-wide stress, the protocol still falls back to ordinary liquidation (no synthetic guarantees).

---

## 13. Roadmap

### Phase 1 — Sui Overflow 2026 MVP

**Scope**:
- Single collateral (SUI), single borrow asset (USDC)
- One mode active: Loan + Auto-Repay (most demonstrable for judges)
- Three risk profiles
- Order book with fixed-rate term loans only
- On-chain defense + permissionless `defend()`
- Walrus log integration
- Pyth oracle
- Frontend with 3-step onboarding + dashboard
- zkLogin auth

**Out of scope for MVP**:
- Modes A and C
- Multi-collateral
- Scallop fallback
- Mobile app polish
- Pro Mode

### Phase 2 — Post-Hackathon

- Modes A (Forever Income) and C (Yield Maximizer)
- Multi-collateral: stSUI, ETH, wBTC
- Scallop fallback integration
- Mobile responsive polish + native wrapper
- Pro Mode for advanced users
- OtterSec audit kickoff

### Phase 3 — Mainnet

- Audit complete
- Mainnet deployment
- Real liquidity bootstrapping (potential incentive program)
- Cross-protocol partnerships (Navi, Bucket, DeepBook deepening)

### Phase 4 — Beyond

- Programmable agents (users can write their own agent strategies that plug into the same vault/orderbook infrastructure)
- Cross-chain expansion (Wormhole-bridged collateral)
- Vesting vault re-introduction (from original Equinox) as Mode D

---

## Closing

Equinox Agent is not a new financial primitive. It's a packaging of three existing primitives — order-book lending, autonomous agents, and self-repaying loan logic — into something that retail users can actually use. The bet is that Sui in 2026 has the right infrastructure (Mysticeti finality + DeepBook depth + Nautilus verifiable compute + Walrus storage + zkLogin onboarding) to make this packaging finally work. Other chains have one or two of these. Sui has all of them.

The product wins not by inventing new math but by removing the requirement that users do the math themselves.

---

**Equinox Agent** © 2026
