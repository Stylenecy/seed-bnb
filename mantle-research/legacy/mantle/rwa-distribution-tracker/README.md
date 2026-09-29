# Mantle RWA Distribution Tracker

A Dune dashboard and an automation agent that measure distribution, not just supply, for tokenized real-world assets (RWA) on Mantle. Follow-up to the Research Challenge thesis: supply is not adoption.

Live dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker

Research findings with full sources: [FINDINGS.md](FINDINGS.md)

New here? Follow the step-by-step walkthrough, from reading the dashboard to deploying your own autonomous monitor in about 30 minutes: [WALKTHROUGH.md](WALKTHROUGH.md)

Headline results (Mantle, snapshot 2026-07-02):

- 368 xStocks issued on Mantle. Only one (NVDAx) clears the 500-holder distribution bar; 15 have at least 10 holders.
- 926 wallets hold any xStock. 88% were acquired in a single four-week window, attributed on-chain to the opening of the Bybit gateway for xStocks on Mantle (April 10, 2026): Bybit's Mantle hot wallet delivered first xStocks to 462 of the 816 cohort wallets, then the wave stopped.
- Those users stuck. 98.3% of the Bybit-window cohort still holds, which is buy-and-hold demand rather than farming. By contrast, LP incentives (Project X, up to 100,000 MNT) produced trading churn, not holders.
- 45.6% of holder wallets arrived on Mantle with their first xStock (421 new wallets in seven months). The rest are long-time Mantle users (median wallet age 459 days).
- SPCXx (the SpaceX xStock): 30,000 net supply, 99.2% in the issuer wallet, external float 0.8%, 26 holders.

The supply is here. The demand, including Indonesia's roughly 26 million retail stock investors, is not. That gap is the opportunity.

## What the dashboard shows

The hero metric is external float: the share of net supply held outside the issuer wallet. High supply with tiny external float means issued, not adopted.

Falsifiable thresholds. A token counts as genuinely distributed when holders exceed 500, the top-1 wallet is below 75%, and DEX liquidity exceeds 100,000 USD (where priced).

Dashboard sections: (1) the adoption gap, (2) attribution, or who opened the tap, (3) single-token deep-dive with a token selector, (4) issuer-driven supply, (5) activity and liquidity. Every finding in [FINDINGS.md](FINDINGS.md) has a live panel.

| Section | Query | Live |
|---|-------|------|
| 1 | Ecosystem summary: issued versus adopted counters | [7863679](https://dune.com/queries/7863679) |
| 1 | xStock ecosystem league (every xStock, ranked) | [7863671](https://dune.com/queries/7863671) |
| 1 | xStock holders over time: the four-week spike | [7865851](https://dune.com/queries/7865851) |
| 1 | Holder acquisition: new wallets versus recycled users | [7865842](https://dune.com/queries/7865842) |
| 2 | Spike mechanism: how the cohort got its first xStock | [7866292](https://dune.com/queries/7866292) |
| 2 | Spike distributors: the Bybit hot wallet identified | [7866312](https://dune.com/queries/7866312) |
| 2 | Bybit-window cohort retention (98.3%) | [7866325](https://dune.com/queries/7866325) |
| 3 | Concentration: holders, top-1 share, external float, net supply | [7863618](https://dune.com/queries/7863618) |
| 3 | External float over time (hero metric) | [7863645](https://dune.com/queries/7863645) |
| 3 | Holders over time | [7863651](https://dune.com/queries/7863651) |
| 4 | Mint, burn and net supply over time | [7863661](https://dune.com/queries/7863661) |
| 5 | Daily activity | [7863657](https://dune.com/queries/7863657) |
| 5 | DEX activity (Merchant Moe) | [7863658](https://dune.com/queries/7863658) |

Queries are parameterized (`token_address`, `issuer_wallet`; default SPCXx). Fork any of them and change the parameter to track a different RWA.

## Methodology and honesty notes

- Exact 256-bit integer math (`decimal(38,0)`, not floating point). Doubles lose integer precision above 2^53, which forces fragile dust heuristics; with exact math a zero balance is exactly zero and holder counts are exact. Cross-checked against the Routescan API: top-1 share of 99.2% and 26 holders matched to the decimal.
- The ecosystem universe is `tokens.erc20` where the name contains "xStock". Matching on symbols ending in "x" would catch junk tokens such as `100x`, `55X` and `Arcane Flux`.
- External float in the league table uses each token's top holder as the issuer proxy, which avoids needing a per-token issuer map.
- DEX data: `dex.trades` covers Merchant Moe, Agni, Uniswap and FusionX on Mantle. Fluxion is not indexed yet. SPCXx is not in the DEX price oracle, so its DEX panel shows trade counts rather than USD.
- Every number carries its source and timestamp. Not financial advice.

## Agent Skill (`skill/mantle-rwa-research/`)

A drop-in Agent Skill that turns any AI assistant into a Mantle RWA research analyst. `SKILL.md` carries the four-metric framework (minted supply, external float, holder breadth, usable liquidity), the full data-source map (free live APIs plus the 13 public Dune queries above), the attribution method for demand-side questions, and honest interpretation rules. The bundled `scripts/rwa_brief.py` (standard library only) fetches live numbers and emits a markdown brief.

To use it: copy `skill/mantle-rwa-research/` into your assistant's skills directory, or paste `SKILL.md` as instructions into any agent runtime. Ask for "an RWA distribution brief for Mantle" and it knows the sources, the math, and the caveats. Step-by-step setup with expected outputs: [WALKTHROUGH.md](WALKTHROUGH.md), Parts C and D.

## Automation agent (`agent/`)

Python with the standard library only (no pip, so students can run it as-is). It tracks seven xStocks out of the box (NVDAx, TSLAx, CRCLx, GOOGLx, COINx, SPCXx, AAPLx). One run does three jobs:

- DIGEST: a weekly markdown brief written to `agent/reports/YYYY-MM-DD.md`, raw material for a weekly X thread. Holder counts are exact up to 1,000 via paginated Routescan calls; beyond that the count is reported as a lower bound with a plus sign.
- ALERTS: a webhook ping when a falsifiable threshold is crossed: top wallet below 75%, holders reaching 500 or more, top-1 dropping at least one point, or holders jumping by 25 or more. On its first multi-token run the agent detected NVDAx crossing both thresholds; see [FINDINGS.md](FINDINGS.md), finding F8.
- SYNC: a cross-check of the live Routescan number against the Dune concentration query, flagging divergence above two points.

The alert path is tested end to end: a local standard-library webhook receiver plus seeded state force every alert type through a real HTTP POST.

Run locally: `python3 agent/tracker_agent.py`

Automation runs free on GitHub Actions; the workflow ships at `.github/workflows/tracker.yml`. It produces a full digest every Monday at 08:00 WIB and an alert check on the other days, and it has a manual "Run workflow" button. Optional repository secrets: `ALERT_WEBHOOK_URL` (Discord or Slack) and `DUNE_API_KEY` (enables the sync check; without it the agent quietly uses Routescan only). To deploy this on your own fork, including the Actions enablement step people usually miss, follow [WALKTHROUGH.md](WALKTHROUGH.md), Parts E and F.

## Add a new token

Edit `agent/config.json` and add an entry under `tokens` (address plus issuer wallet from Mantlescan). On Dune, change the `token_address` query parameter.

Not financial advice.
