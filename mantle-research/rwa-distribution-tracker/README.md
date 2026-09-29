# RWA Distribution Tracker (BNB Chain)

A Dune query set and an automation agent that measure distribution, not just supply, for tokenized real-world assets (RWA) on BNB Smart Chain (BSC, chain ID 56). Thesis: supply is not adoption.

This toolkit was first built and validated on Mantle. The original Mantle study (findings, snapshots, published Dune ids, research article) is kept for reference in [`../legacy/mantle/`](../legacy/mantle/). No BNB Chain numbers have been published yet; every figure must come from a fresh run.

New here? Follow the step-by-step walkthrough: [WALKTHROUGH.md](WALKTHROUGH.md)

## What the dashboard shows

The hero metric is external float: the share of net supply held outside the issuer wallet. High supply with tiny external float means issued, not adopted.

Falsifiable thresholds. A token counts as genuinely distributed when holders exceed 500, the top-1 wallet is below 75%, and DEX liquidity exceeds 100,000 USD (where priced).

Dashboard sections: (1) the adoption gap, (2) attribution, or who opened the tap, (3) single-token deep-dive with a token selector, (4) issuer-driven supply, (5) activity and liquidity.

| Section | Query | File |
|---|-------|------|
| 1 | Ecosystem summary: issued versus adopted counters | `dune/q8_ecosystem_summary.sql` |
| 1 | Ecosystem league (every token in the family, ranked) | `dune/q5_xstocks_comparison.sql` |
| 1 | Ecosystem holders over time | `dune/q10_holders_trend.sql` |
| 1 | Holder acquisition: new wallets versus recycled users | `dune/q9_holder_acquisition.sql` |
| 2 | Spike mechanism: how a cohort got its first token | `dune/q11_spike_mechanism.sql` |
| 2 | Spike distributors: who sent it | `dune/q12_spike_distributors.sql` |
| 2 | Spike-window cohort retention | `dune/q13_cohort_retention.sql` |
| 3 | Concentration: holders, top-1 share, external float, net supply | `dune/q2_concentration_current.sql` |
| 3 | External float over time (hero metric) | `dune/q3_external_float_over_time.sql` |
| 3 | Holders over time | `dune/q1_holders_over_time.sql` |
| 4 | Mint, burn and net supply over time | `dune/q7_mint_burn_supply.sql` |
| 5 | Daily activity | `dune/q4_daily_activity.sql` |
| 5 | DEX activity (PancakeSwap and other indexed BSC DEXs) | `dune/q6_dex_volume.sql` |

Queries read raw `bnb.logs` and are parameterized (`token_address`, `issuer_wallet`; forensics queries also take `window_start` / `window_end`). TODO: publish them on Dune and add the live links here.

## Methodology and honesty notes

- Exact 256-bit integer math (`decimal(38,0)`, not floating point). Doubles lose integer precision above 2^53, which forces fragile dust heuristics; with exact math a zero balance is exactly zero and holder counts are exact.
- The ecosystem universe in q5/q8-q13 is `tokens.erc20` filtered by name (default "xStock"). TODO: confirm which tokenized-equity or RWA family is live on BNB Chain and adjust the filter.
- External float in the league table uses each token's top holder as the issuer proxy, which avoids needing a per-token issuer map.
- BSC is a high-volume chain; wide scans over `bnb.logs` (q9) cost more Dune credits than on smaller chains. Add date bounds if needed.
- Every number carries its source and timestamp. Not financial advice.

## Agent Skill (`skill/bnb-rwa-research/`)

A drop-in Agent Skill that turns any AI assistant into a BNB Chain RWA research analyst. `SKILL.md` carries the four-metric framework (minted supply, external float, holder breadth, usable liquidity), the data-source map, the attribution method for demand-side questions, and interpretation rules. The bundled `scripts/rwa_brief.py` (standard library only) fetches live numbers and emits a markdown brief.

## Automation agent (`agent/`)

Python with the standard library only (no pip). One run does three jobs:

- DIGEST: a weekly markdown brief written to `agent/reports/YYYY-MM-DD.md`. Holder counts are exact up to 1,000 via paginated BscScan (Etherscan API v2) calls; beyond that the count is reported as a lower bound with a plus sign.
- ALERTS: a webhook ping when a falsifiable threshold is crossed: top wallet below 75%, holders reaching 500 or more, top-1 dropping at least one point, or holders jumping by 25 or more.
- SYNC: a cross-check of the live BscScan number against the Dune concentration query, flagging divergence above two points.

Run locally: `ETHERSCAN_API_KEY=... python3 agent/tracker_agent.py`

Holder data uses the Etherscan API v2 (`chainid=56`) endpoints `tokensupply` and `tokenholderlist`; the latter may require a paid Etherscan plan. Without a key the agent still runs and reports "data unavailable".

Automation runs free on GitHub Actions (`.github/workflows/tracker.yml`): a full digest every Monday at 08:00 WIB and an alert check on the other days. Repository secrets: `ETHERSCAN_API_KEY`, plus optional `ALERT_WEBHOOK_URL` (Discord or Slack) and `DUNE_API_KEY` (enables the sync check).

## Add a token

`agent/config.json` ships with an empty `tokens` map. Add an entry (address plus issuer wallet from https://bscscan.com), using `tokens_example` as the template. On Dune, change the `token_address` query parameter.

Not financial advice.
