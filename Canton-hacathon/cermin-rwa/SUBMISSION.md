# Hackathon Submission Copy

## Project Description

Cermin-RWA is an autonomous, privacy-preserving agent on Canton Network that repays your RWA-collateralized loan from a private Shadow Vault before liquidation can ever happen. No margin call, no bots hunting your position, and no one can see your reserve or your rescue. Live on Canton DevNet at https://cermin-rwa.vercel.app

## Submission Details

**What we built.** Cermin-RWA is an autonomous liquidation-protection agent for RWA-collateralized loans, built end to end on Canton: 12 Daml templates across 5 modules (CIP-56 style TreasuryToken and StableCoin holdings, PriceFeed oracle, LendingPoolOffer/Loan/GracePeriod credit, ShadowVault/GuardPolicy/RescueEvent guard, CouponDistribution), a TypeScript Guard Agent that watches the ledger and exercises GuardRepay and SweepToLoan, an Express backend bridge over the JSON Ledger API v2, and a 5-screen React neobank frontend.

**Why privacy is the product.** Every template declares a minimal signatory/observer set. The Shadow Vault, the protection policy, and every rescue are visible only to the borrower and the Guard Agent. The pool operator can never see them. This is enforced by Daml's visibility model, not by an app-layer promise, and it cannot be replicated on a public EVM chain where bots hunt at-risk positions.

**Process.** We designed the privacy boundaries first (who sees what, per template), wrote Daml Script tests for every lifecycle path (fund, borrow, price drop, auto-repay, coupon sweep, full repay, last-resort default), proved the flow on a local Canton sandbox, then took it to the shared Canton DevNet and finally into an always-on production deployment.

**Key achievements.**
- Live on Canton DevNet, no mock fallback: https://cermin-rwa.vercel.app runs against participant `5nsandbox-devnet-2` (Canton 3.5.7, Global Synchronizer, real paidTrafficCost on every write) through a backend and Guard Agent running 24/7 on Railway.
- 5 namespaced parties allocated on DevNet (cermin-issuer, cermin-borrower, cermin-pool-operator, cermin-guard-agent, cermin-oracle), each with correctly scoped rights.
- Verified autonomous rescue on DevNet: a 24% price drop triggered the agent to repay $758.62 from the Shadow Vault within one 5-second poll, restoring the Health Ratio from 12667 to 14500 bps; a Coupon Sweep then applied $112.50 more, all matching the local test suite exactly.
- Green test suites across all four components: Daml Script, agent, backend, frontend.

**Links.** Demo video: https://youtu.be/fNKD4S2iWVw · Code: https://github.com/yeheskieltame/Cermin-RWA · Live: https://cermin-rwa.vercel.app
