# Walkthrough: from zero to your own RWA distribution tracker on BNB Chain

A step-by-step path through this repository, from running a single query to an autonomous monitor. Requirements grow per part; Part A needs a free Dune account, Part E needs a free GitHub account.

The original Mantle version of this walkthrough, with real outputs from the July 2026 Mantle snapshot, is in `../legacy/mantle/rwa-distribution-tracker/WALKTHROUGH.md`.

---

## Part A: run a query on BNB Chain (5 minutes, free Dune account)

**Step 1.** Pick a BEP-20 RWA token on BNB Chain and note its contract address and issuer/deployer wallet (both visible on https://bscscan.com).

**Step 2.** On Dune, create a new query and paste `dune/q2_concentration_current.sql`. Set `token_address` and `issuer_wallet` and run it.

You should see one row with exact integer holder counts, top-1 share, issuer share and external float, computed from raw `bnb.logs`.

**Step 3.** Read the SQL while it runs. The balance reconstruction is one pattern: sum signed `decimal(38,0)` transfer amounts per holder, keep balances above zero. Every other query in `dune/` reuses it.

**Step 4.** Publish the rest of the `dune/` queries the same way and assemble them into a dashboard. q8 reads q5 through a cross-query reference; replace `query_7863671` with your q5 id.

## Part B: run the research brief locally (5 minutes, any Python 3)

```bash
export ETHERSCAN_API_KEY=...        # Etherscan API v2 key (BscScan data via chainid=56)
export RWA_TOKEN=0x...              # the token from Step 1
export RWA_COINGECKO_ID=...         # optional
python3 skill/bnb-rwa-research/scripts/rwa_brief.py
```

You should see a markdown brief on stdout: BNB Chain TVL, BNB price, holder page and top-wallet share, a verdict, and the threshold checklist. If a data source rate-limits you or the holder endpoint needs a paid plan, the script says so and continues with the sources that responded. Partial data is labeled, never silently filled.

## Part C: give the methodology to an AI assistant (5 minutes)

```bash
mkdir -p ~/.claude/skills
cp -r skill/bnb-rwa-research ~/.claude/skills/
```

Ask your assistant: "Give me an RWA distribution brief for <token> on BNB Chain." It should apply the four-metric framework, cite sources with timestamps, and reach for the attribution method before calling holder growth organic.

## Part D: run the tracker agent once (5 minutes)

Add your token to `agent/config.json` under `tokens` (see `tokens_example`), then:

```bash
ETHERSCAN_API_KEY=... python3 agent/tracker_agent.py
```

You should see `digest written: agent/reports/YYYY-MM-DD.md` and an alerts count. `agent/state.json` now holds the snapshot; the next run diffs against it.

## Part E: deploy your own autonomous monitor (10 minutes, free)

1. Fork this repository on GitHub.
2. On the fork, open the Actions tab and enable workflows (GitHub disables scheduled workflows on forks until you opt in).
3. Add repository secrets: `ETHERSCAN_API_KEY`, and optionally `ALERT_WEBHOOK_URL` (Discord or Slack webhook) and `DUNE_API_KEY`.
4. Run "RWA Distribution Tracker" once manually. You should see a green run and a commit by `rwa-tracker-bot`. From then on it runs daily at 01:00 UTC (08:00 WIB), a full digest on Mondays and an alert check on other days.
5. Optional Dune cross-check: set `dune.enabled` to `true` in `agent/config.json` and put your published q2 id in `dune.query_ids.concentration`.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `python3: command not found` | Install Python 3.8+; no packages are needed beyond that |
| Digest says `data unavailable` | No `ETHERSCAN_API_KEY`, or your plan lacks `tokenholderlist`; check the warning on stderr |
| Brief prints a `fetch failed ... 429` comment | A public API rate-limited you; wait a minute or rerun |
| Fork's Actions tab shows nothing running | Scheduled workflows are off on forks until you enable them |
| Holder count shows a plus sign, like `1000+` | Pagination cap reached; the count is exact up to 1,000 and a lower bound beyond it |
| DEX panel shows trades but no USD | The token is missing from Dune's DEX price oracle; chart trade counts instead |
| Digest deltas all say `first run` | Expected: there was no previous snapshot in `agent/state.json` |

Not financial advice.
