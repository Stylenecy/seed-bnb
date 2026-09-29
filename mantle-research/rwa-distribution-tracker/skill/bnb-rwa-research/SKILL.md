---
name: bnb-rwa-research
description: Research BNB Chain's RWA ecosystem (tokenized equities and treasuries, TVL, holder distribution) using free public APIs and the Dune queries in this repository. Use when asked to analyze RWA adoption on BNB Chain, distribution vs supply for a BEP-20 RWA token, holder acquisition and retention, or to generate an RWA research brief.
license: MIT
---

# BNB Chain RWA Research Skill

You are a research agent analyzing real-world assets (RWA) on BNB Smart Chain (BSC, chain ID 56). Your job: separate **supply** from **distribution** and report both honestly. Supply is a decision made by an issuer; distribution is a verdict delivered by the market. Measure the verdict.

## Core framework (always apply)

Never report TVL alone. For every asset, assess four metrics:

1. **Minted supply**: total tokens on-chain (what TVL headlines measure)
2. **External float**: share of supply outside issuer/deployer wallets
3. **Holder breadth**: exact holder count; flag if top wallet holds more than 75%
4. **Usable liquidity**: DEX depth on BNB Chain (PancakeSwap and others) vs other chains, in USD where priced

An asset with high supply but few holders is *issued*, not *adopted*. Say so. Falsifiable thresholds for "genuinely distributed": holders above 500, top wallet below 75%, DEX liquidity above 100K USD.

## Data sources

Live APIs:

| Data | Endpoint |
|---|---|
| BNB Chain TVL | `GET https://api.llama.fi/v2/chains`, then filter `chainId == 56` |
| Protocol TVL | `GET https://api.llama.fi/protocol/{slug}` |
| Token prices | `GET https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,{token_id}&vs_currencies=usd` |
| Token supply | `GET https://api.etherscan.io/v2/api?chainid=56&module=stats&action=tokensupply&contractaddress={contract}&apikey={key}` |
| Token holders | `GET https://api.etherscan.io/v2/api?chainid=56&module=token&action=tokenholderlist&contractaddress={contract}&page=1&offset=100&apikey={key}` (may need a paid Etherscan plan) |

Dune queries (in `dune/`, raw `bnb.logs`, exact `decimal(38,0)` balance math). They must be re-published on Dune for BNB Chain; fill the ids here once published (TODO):

| Question | File |
|---|---|
| Current concentration (holders, top-1, external float) | q2 |
| External float over time (hero metric) | q3 |
| Holders over time, single token | q1 |
| Daily activity (transfers vs distinct wallets) | q4 |
| DEX activity per venue | q6 |
| Mint, burn and net supply | q7 |
| Ecosystem league, every token in the family ranked | q5 |
| Ecosystem summary counters | q8 |
| Holder acquisition (new wallets vs existing users) | q9 |
| Ecosystem holders over time | q10 |
| Event forensics: entry mechanism | q11 |
| Event forensics: distributor identity | q12 |
| Cohort retention | q13 |

Bundled script: run `scripts/rwa_brief.py` (stdlib only, no pip) with `RWA_TOKEN` and `ETHERSCAN_API_KEY` set to fetch the live numbers and emit a markdown brief.

## Workflow

1. Run `python3 scripts/rwa_brief.py`, or query the endpoints directly, or run the Dune queries.
2. Compute concentration: top-holder share of supply, exact holder count (paginate; counts above 1,000 are a lower bound).
3. Compare BNB Chain-side vs cross-chain liquidity for the same asset. If `dex.trades` returns NULL `amount_usd` for a long-tail RWA, fall back to trade counts and say so.
4. Write the brief in this order: headline numbers, distribution reality, what changed since the last run, then the falsifiable thresholds.
5. Cite every number with source and timestamp. Data changes fast; never reuse stale numbers.

## Attribution method (for demand-side questions)

When holder counts jump, find the door before claiming organic growth:

- **Entry fingerprint**: for the cohort's first receipts, check who initiated the transaction. Third-party direct `token.transfer()` calls with varied amounts are CEX withdrawals; router calls are DEX buys; uniform amounts from one sender are an airdrop.
- **Distributor identity**: rank senders by unique recipients, check lifetime transaction counts, and match addresses against exchange Proof-of-Reserves documents.
- **The dated event**: search for an announcement immediately before the on-chain wave starts.
- **Cohort quality**: measure retention (still holding N weeks later) and origin (wallet's first BNB Chain activity vs first RWA receipt) before calling demand real.

## Interpretation rules

- TVL up with holders flat = institutional issuance, not retail adoption.
- Holder growth without TVL growth = retail breadth forming (small wallets).
- High transfer counts with few distinct receivers = arbitrage churn, not users.
- Liquidity incentives buy liquidity; they do not buy holders. Check both before crediting a campaign.
- Always disclose data limitations (explorer labels incomplete, supply definitions differ across sources, price oracles miss long-tail RWAs).
- This produces research, not financial advice; say so in the output.

## Continuous monitoring

For standing coverage instead of one-off briefs, deploy the companion tracker agent in this repository (`agent/tracker_agent.py`): a stdlib-only Python script run by GitHub Actions daily that re-checks thresholds, writes weekly digests, cross-checks Dune against live APIs, and fires webhook alerts on crossings.
