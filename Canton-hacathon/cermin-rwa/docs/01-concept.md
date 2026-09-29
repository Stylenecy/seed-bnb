# 01 — Concept

## Problem

RWA-collateralized lending is arriving on-chain at institutional scale (~$335B represented Treasuries on Canton via Broadridge DLR; DTCC tokenized Treasuries rolling out 2026; tokenized gold pilots by Euroclear/World Gold Council). But lending against volatile-priced collateral inherits DeFi's ugliest mechanic: **forced liquidation**. Rates move, bond and gold prices drop, and positions get liquidated at the worst moment. On public chains this is worse: positions are public, so liquidation bots and competitors literally hunt them.

Institutions do not work this way. In real capital markets, a margin shortfall triggers a *process* — margin call, top-up, negotiation — not an instant fire-sale. And 57% of OTC transaction costs are operational, largely manual margin workflows (ISDA).

## Solution

**Cermin-RWA: an autonomous guard agent that makes liquidation obsolete.**

1. Borrower posts tokenized RWA (Treasury, gold) as collateral and borrows stablecoin.
2. Borrower funds a **Shadow Vault** — a private reserve invisible to everyone, including the lender.
3. The **Guard Agent** watches the Health Ratio continuously.
4. Health Ratio hits the Guard Trigger → agent automatically repays part of the loan from the Shadow Vault → ratio restored. No margin call. No liquidation. No one ever saw it happen.
5. **Coupon Sweep (the RWA superpower):** Treasuries pay coupons. The agent routes that yield straight into loan repayment. The loan pays itself off while remaining protected. BTC could never do this — RWA can.

## Branding

- **Name:** Cermin-RWA ("cermin" = mirror). The agent is your reflection in the market: it acts when you can't.
- **Tagline:** *"Shadow money. Zero liquidations."*
- **Narrative arc for the pitch:** Cermin v1 protected BTC borrowers on Mezo. Cermin-RWA graduates the concept to institutional capital markets, on the only chain where protection can be truly private.
- **Tone:** calm, premium, neobank. Never DeFi-degen. The user feeling: "my money has a bodyguard."

## Personas

1. **Treasury desk at a fintech** — holds tokenized T-bills, wants USD liquidity without selling (tax, yield), cannot afford a public liquidation headline.
2. **Crypto-native fund going RWA** — knows Alchemix-style self-repaying loans, wants the institutional-safe version.
3. **Private-wealth individual** — holds tokenized gold, wants a credit line with absolute peace of mind.

## Judge-criteria mapping (Track 1)

| Criterion | Answer |
|---|---|
| Clear use of privacy | Position, reserve, and rescue events visible only to borrower + agent. On EVM this is structurally impossible. |
| Real financial use case | Margin protection = what tri-party collateral agents (BNY, Euroclear) do for TradFi, automated and on-chain. |
| Strong product logic | A *layer*, not another lending venue: attaches to any CIP-56 asset and any future lending venue. |
| Institutional relevance | Collateral set = Treasuries/gold, the exact assets institutions are tokenizing on Canton in 2026. |

## What Cermin-RWA is NOT

- Not a lending platform competing with ACME/Alpend — it is a protection layer; the built-in pool is a reference venue for the demo.
- Not a rebranded liquidation bot — it prevents liquidations rather than performing them.
- Not yield farming — Coupon Sweep uses the collateral's own native yield, no leverage loops.
