# 04 — 4-Week Scope & Demo Script

## Week 1 — Foundations
- CN Quickstart LocalNet running; team comfortable with Daml basics.
- Daml: TreasuryToken (CIP-56-style holding/allocation subset), PriceFeed, mint & transfer scripts.
- Decide party layout, write Daml Script happy-path test.

## Week 2 — Credit core
- Daml: LendingPool/Loan (lock collateral, draw stablecoin, repay), ShadowVault + narrow GuardRepay delegation, GuardPolicy.
- Daml Script tests: borrow, price drop, manual repay, vault-funded repay.

## Week 3 — The agent + coupon
- Guard Agent service (Ledger API): monitor → trigger → GuardRepay, grace-period fallback.
- CouponDistribution + Coupon Sweep path.
- End-to-end scripted run on LocalNet.

## Week 4 — UX + pitch
- React frontend: 5 screens per docs/03-ux.md, simulation mode.
- Polish activity-feed copy, record fallback demo video, write submission + pitch deck.
- Buffer: 2 days for breakage.

## Cut lines (if behind schedule)
1. Cut Coupon Sweep UI (keep it in Daml Script demo).
2. Cut onboarding screens (start at dashboard).
3. Never cut: simulation-mode rescue moment — it is the demo.

## Demo script (3 minutes)
1. (20s) Problem: "This May, RWA borrowers got liquidated by bots that could see their positions. Institutions will never accept that."
2. (30s) Dashboard: position, loan, Shadow Vault with privacy badge. "The pool cannot see this vault. Only you and your agent."
3. (60s) Simulation: slide price down 10% → ring dips → Cermin fires → feed: "I repaid $1,200 from your Shadow Vault." → ring green. "No margin call. No liquidation. Nobody saw it."
4. (30s) Coupon Sweep: fast-forward to coupon date → loan shrinks by itself. "Treasuries pay yield — Cermin turns your collateral into your repayment plan."
5. (20s) Layer story: "Built on CIP-56 — every asset entering Canton in 2026, DTCC Treasuries, JPM Coin, tokenized gold, becomes protectable collateral with zero integration."

## Risks
| Risk | Mitigation |
|---|---|
| Daml learning curve | Week 1 fully dedicated; keep templates simple; official quickstart patterns only |
| LocalNet resource pain | Dev on one strong machine; docker profiles trimmed |
| Token standard complexity | Implement faithful subset, state it honestly in submission |
| Demo-day breakage | Recorded video fallback; deterministic mock oracle |
