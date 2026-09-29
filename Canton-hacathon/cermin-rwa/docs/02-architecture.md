# 02 — Architecture (conceptual, no code)

## Canton stack used

| Layer | Choice | Why |
|---|---|---|
| Network | CN Quickstart **LocalNet** (Docker: validator, super validator, CC wallet) | Official scaffold; devnet-equivalent; judges recognize it |
| Contracts | **Daml** | Privacy at the language level via signatory/observer |
| Token | Mock Treasury token following **CIP-56 / Splice token standard** (holdings + allocation interfaces) | Composability story: any CIP-56 asset works later |
| Automation | Off-ledger **Guard Agent** service on the **Ledger API** | Standard Canton pattern for automation ("nanobot" style) |
| Prices | Mock **Oracle party** publishing price contracts | Deterministic demo, no external dependency |
| Frontend | React + JSON API | Neobank UX per docs/03-ux.md |

## Parties (privacy model)

- `Issuer` — mints mock Treasury tokens (mUST) and pays coupons.
- `Borrower` — owns collateral, funds Shadow Vault.
- `PoolOperator` — runs the reference lending pool (stablecoin liquidity).
- `GuardAgent` — Cermin's automation party. Borrower delegates a *narrow* right: "repay my loan from my vault when trigger fires" — nothing more.
- `Oracle` — publishes prices.

Who sees what (the pitch slide): the Pool sees only the loan and locked collateral. It does NOT see the Shadow Vault, its balance, or the guard rules. Other borrowers see nothing at all. The Oracle sees nothing about anyone. On EVM every one of these is public.

## Core contracts (conceptual)

1. **TreasuryToken (CIP-56-style holding)** — face value, coupon rate, maturity; transfers/locks via allocation pattern.
2. **LendingPool / Loan** — borrower locks collateral, receives stablecoin; carries LTV terms; choices: `Repay`, `TopUpCollateral`, `LastResortDefault` (exists, never used in demo).
3. **ShadowVault** — signatory: Borrower; observer: GuardAgent only. Holds stablecoin reserve. Choice `GuardRepay` exercisable by GuardAgent only when an on-ledger trigger condition (price contract + threshold) is satisfied — the delegation is provably narrow.
4. **GuardPolicy** — borrower-defined rules: trigger ratio, max repay per event, coupon-sweep on/off, notification prefs.
5. **PriceFeed** — oracle-signed current price for mUST/gold.
6. **CouponDistribution** — issuer pays coupon → if sweep enabled, routed to loan repayment atomically.

## Guard Agent behavior (off-ledger service)

Loop: subscribe to PriceFeed + Loan + GuardPolicy state → compute Health Ratio → if ratio < trigger: exercise `GuardRepay` (partial repay from vault, smallest amount that restores ratio + buffer) → emit private notification event for the UI. Also: on coupon receipt with sweep enabled, exercise repay with coupon amount.

Failure honesty (judges will ask): if the vault is empty, the agent notifies and starts a grace-period contract; only after grace expiry can the pool exercise remediation. Protection has layers: coupon yield → shadow vault → grace period → negotiated remediation.

## Why this is "layer, not from scratch"

- Scaffold = CN Quickstart (official), token = standard interfaces (official), automation = standard Ledger API pattern.
- Because collateral is standard CIP-56, Cermin can later attach to external venues (ACME, Alpend) or new assets (DTCC Treasuries, JPM Coin as cash leg) without re-architecture. The reference pool exists only because external venues expose no public devnet APIs today — see docs/05-ecosystem-fit.md.

## Explicitly out of scope

Real oracles, multiple pools, cross-venue routing, mainnet deployment, real KYC, governance token. Mention as roadmap only.
