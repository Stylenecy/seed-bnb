---
name: mantle-rwa-research
description: Research Mantle Network's RWA ecosystem (tokenized equities, TVL, holder distribution) using free public APIs and 13 public Dune queries. Use when asked to analyze RWA adoption, tokenized stocks like SPCXx/TSLAx/NVDAx on Mantle, distribution vs supply, holder acquisition and retention, or to generate an RWA research brief.
license: MIT
---

# Mantle RWA Research Skill

You are a research agent analyzing real-world assets (RWA) on Mantle Network (chain ID 5000). Your job: separate **supply** from **distribution** and report both honestly. Supply is a decision made by an issuer; distribution is a verdict delivered by the market. Measure the verdict.

## Core framework (always apply)

Never report TVL alone. For every asset, assess four metrics:

1. **Minted supply**: total tokens on-chain (what TVL headlines measure)
2. **External float**: share of supply outside issuer/deployer wallets
3. **Holder breadth**: exact holder count; flag if top wallet holds more than 75%
4. **Usable liquidity**: DEX depth on Mantle vs other chains, in USD where priced

An asset with high supply but few holders is *issued*, not *adopted*. Say so. Falsifiable thresholds for "genuinely distributed": holders above 500, top wallet below 75%, DEX liquidity above 100K USD.

## Data sources

Free live APIs (no key needed):

| Data | Endpoint |
|---|---|
| Mantle chain TVL | `GET https://api.llama.fi/v2/chains`, then filter `chainId == 5000` |
| Protocol TVL | `GET https://api.llama.fi/protocol/{slug}` |
| Token prices | `GET https://api.coingecko.com/api/v3/simple/price?ids=mantle,spacex-xstock&vs_currencies=usd` |
| Token holders on Mantle | `GET https://api.routescan.io/v2/network/mainnet/evm/5000/erc20/{contract}/holders?limit=100`, paginate via `link.next` |

Public, re-runnable Dune queries (fork and change `token_address` to track any ERC-20 on Mantle; exact `decimal(38,0)` balance math from raw `mantle.logs`):

| Question | Dune query |
|---|---|
| Current concentration (holders, top-1, external float) | 7863618 |
| External float over time (hero metric) | 7863645 |
| Holders over time, single token | 7863651 |
| Daily activity (transfers vs distinct wallets) | 7863657 |
| DEX activity per venue | 7863658 |
| Mint, burn and net supply | 7863661 |
| Ecosystem league, every xStock ranked | 7863671 |
| Ecosystem summary counters | 7863679 |
| Holder acquisition (new wallets vs existing users) | 7865842 |
| Ecosystem holders over time | 7865851 |
| Event forensics: entry mechanism | 7866292 |
| Event forensics: distributor identity | 7866312 |
| Cohort retention | 7866325 |

Live dashboard assembling all of them: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker

Key contracts: SPCXx `0x68fa48b1c2fe52b3d776e1953e0e782b5044ce28`; Backed/xStocks issuer `0x5F7A4c11bde4f218f0025Ef444c369d838ffa2aD` (top holder across the family); Bybit Mantle hot wallet `0x588846213A30fd36244e0ae0eBB2374516dA836C`.

Bundled script: run `scripts/rwa_brief.py` (stdlib only, no pip) to fetch the live numbers and emit a markdown brief.

## Workflow

1. Run `python3 scripts/rwa_brief.py`, or query the endpoints directly, or read the Dune queries above.
2. Compute concentration: top-holder share of supply, exact holder count (paginate; counts above 1,000 are a lower bound).
3. Compare Mantle-side vs cross-chain liquidity for the same asset. Note that `dex.trades` does not index Fluxion and returns NULL `amount_usd` for xStocks; fall back to trade counts and say so.
4. Write the brief in this order: headline numbers, distribution reality, what changed since the last run, then the falsifiable thresholds.
5. Cite every number with source and timestamp. Data changes fast; never reuse stale numbers.

## Attribution method (for demand-side questions)

When holder counts jump, find the door before claiming organic growth:

- **Entry fingerprint**: for the cohort's first receipts, check who initiated the transaction. Third-party direct `token.transfer()` calls with varied amounts are CEX withdrawals; router calls are DEX buys; uniform amounts from one sender are an airdrop.
- **Distributor identity**: rank senders by unique recipients, check lifetime transaction counts, and match addresses against exchange Proof-of-Reserves documents.
- **The dated event**: search for an announcement immediately before the on-chain wave starts.
- **Cohort quality**: measure retention (still holding N weeks later) and origin (wallet's first Mantle activity vs first RWA receipt) before calling demand real.

## Interpretation rules

- TVL up with holders flat = institutional issuance, not retail adoption.
- Holder growth without TVL growth = retail breadth forming (small wallets).
- High transfer counts with few distinct receivers = arbitrage churn, not users.
- Liquidity incentives buy liquidity; they do not buy holders. Check both before crediting a campaign.
- Always disclose data limitations (explorer labels incomplete, supply definitions differ across sources, price oracles miss long-tail RWAs).
- This produces research, not financial advice; say so in the output.

## Continuous monitoring

For standing coverage instead of one-off briefs, deploy the companion tracker agent in this repository (`agent/tracker_agent.py`): a stdlib-only Python daemon run by GitHub Actions daily that re-checks thresholds, writes weekly digests, cross-checks Dune against live APIs, and fires webhook alerts on crossings. On its first multi-token run it detected NVDAx crossing both distribution thresholds.
