# Walkthrough: from zero to your own RWA distribution tracker

A step-by-step path through everything in this repository. Each step tells you what to do and what you should see, using real outputs. Total time from nothing to your own autonomous monitor: about 30 minutes. Requirements grow per part; Part A needs only a browser, Part F needs a free GitHub account.

Numbers shown below are from the 2026-07-02/03 snapshot and will have moved by the time you run this. That is the point.

---

## Part A: read the market (2 minutes, browser only)

**Step 1.** Open the live dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker

**Step 2.** Read it top to bottom. Section 1 is the ecosystem (368 tokens, the league table, holder growth, holder origin). Section 2 is the attribution forensics. Sections 3 to 5 are a single-token deep dive, SPCXx by default.

**Step 3.** Switch the token. In the league table (Section 1), copy any contract address, for example TSLAx: `0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0`. Paste it into the `token_address` selector at the top of the dashboard and press Enter.

You should see: every panel in Sections 3 to 5 recompute for TSLAx. Concentration moves from SPCXx's 99.2% top wallet to TSLAx's roughly 82%.

## Part B: reproduce a number from scratch (5 minutes, free Dune account)

Do not trust this repository; check it.

**Step 4.** Open the concentration query: https://dune.com/queries/7863618

**Step 5.** Click Fork (top right). On your fork, change the `token_address` parameter to the TSLAx address above and run it.

You should see: one row with exact integer holder counts. At the July 2026 snapshot: `holders 328, top1_pct 81.96, external_float_pct 18.04`. Whatever you get, it now comes from your own query against raw `mantle.logs`, not from this repo's claims.

**Step 6.** Read the SQL while it runs. The balance reconstruction is one pattern: sum signed `decimal(38,0)` transfer amounts per holder, keep balances above zero. Every other query in `dune/` reuses it.

## Part C: run the research brief locally (5 minutes, any Python 3)

**Step 7.** Clone and run. No pip installs, no API keys:

```bash
git clone https://github.com/yeheskieltame/mantle-rwa-distribution-tracker.git
cd mantle-rwa-distribution-tracker
python3 skill/mantle-rwa-research/scripts/rwa_brief.py
```

You should see a markdown brief on stdout, ending in a verdict and threshold checklist:

```
# Mantle RWA Research Brief

## Distribution reality (SPCXx on Mantle)

- Holders returned (top page): 24
- Top wallet share of sampled supply: 99.25%
- Verdict: ISSUED, NOT ADOPTED. Supply exists but sits with the issuer.

## Thresholds to watch (falsifiable)

- [ ] SPCXx holders > 500
- [ ] Top wallet < 75% of supply
```

If a data source rate-limits you (CoinGecko often does), the script says so in an HTML comment and continues with the sources that responded. Partial data is labeled, never silently filled.

## Part D: give the methodology to an AI assistant (5 minutes)

**Step 8.** The `skill/mantle-rwa-research/` folder is a standard Agent Skill. Install it in your assistant's skills directory, for example for Claude Code:

```bash
mkdir -p ~/.claude/skills
cp -r skill/mantle-rwa-research ~/.claude/skills/
```

Any other runtime that accepts instruction files works too: paste `SKILL.md` as system instructions.

**Step 9.** Ask your assistant: "Give me an RWA distribution brief for TSLAx on Mantle."

You should see it apply the framework rather than improvise: four metrics (minted supply, external float, holder breadth, usable liquidity), sources cited with timestamps, transfer counts treated as churn until distinct receivers say otherwise, and a not-financial-advice line. If holder counts jumped recently, it should reach for the attribution method (entry fingerprint, distributor identity, dated event) before calling growth organic.

## Part E: run the tracker agent once (5 minutes)

**Step 10.** From the repository root:

```bash
python3 agent/tracker_agent.py
```

You should see, within about a minute:

```
digest written: agent/reports/2026-07-03.md
alerts: 1 | sync notes: 0
```

The one standing alert is NVDAx: its top wallet sits below the 75% threshold, and the agent re-states an active crossing on every run for as long as it holds. That is what the run of 2026-07-02 looked like the moment both thresholds were first crossed:

```
🚨 NVDAx: top wallet below 75.0% (74.553%). Distribution threshold CROSSED.
🎯 NVDAx: holders reached 500+ (629). Distribution threshold CROSSED.
alerts: 2 | sync notes: 0
```

The holders alert fires only on the crossing itself; the top-wallet alert stays on while the condition is true.

**Step 11.** Open the digest it wrote in `agent/reports/`. You should see a per-token table (exact holders via paginated Routescan, top-1 share, external float, deltas vs the last run) and a falsifiable-thresholds checklist. `agent/state.json` now exists; the next run diffs against it.

## Part F: deploy your own autonomous monitor (10 minutes, free)

**Step 12.** Fork this repository on GitHub.

**Step 13.** On your fork, open the Actions tab and click "I understand my workflows, go ahead and enable them" (GitHub disables scheduled workflows on forks until you opt in).

**Step 14.** Run it once manually: Actions, then "RWA Distribution Tracker", then "Run workflow". Wait about 30 seconds.

You should see: a green run, and a new commit on your fork authored by `rwa-tracker-bot` like `tracker: 2026-07-03 run`. From now on the cron runs daily at 01:00 UTC (08:00 WIB), a full digest on Mondays and an alert check other days. This repository's own [Actions history](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/actions) shows what months of that look like.

**Step 15 (optional).** Wire alerts to Discord or Slack. In Discord: Server Settings, Integrations, Webhooks, New Webhook, copy the URL. On your fork: Settings, Secrets and variables, Actions, New repository secret, name `ALERT_WEBHOOK_URL`, paste the URL. Threshold crossings now land in your channel.

**Step 16 (optional).** Enable the Dune cross-check: add a second secret `DUNE_API_KEY` (a free-tier key works). The agent then compares its live numbers against query 7863618 every run and flags divergence above two points. Without the key, it quietly runs on Routescan alone.

## Part G: point the machine at something else (5 minutes)

**Step 17.** Track a different token: add an entry to `agent/config.json` under `tokens` with the contract address and issuer wallet (both visible on Mantlescan), commit, push. The digest table and alerts pick it up on the next run.

**Step 18.** Track a different chain: change `chain_id` in the same file. Any network Routescan indexes works the same way.

**Step 19.** Track a different token family on Dune: fork the league query (7863671) and change the `tokens.erc20` name filter; fork the parameterized single-token queries and change the default `token_address`. The exact-math balance pattern transfers unchanged to any ERC-20 on any chain Dune indexes.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `python3: command not found` | Install Python 3.8+; no packages are needed beyond that |
| Brief prints a `fetch failed ... 429` comment | A public API rate-limited you; wait a minute or rerun, the other sources still work |
| Fork's Actions tab shows nothing running | Scheduled workflows are off on forks until you enable them (Step 13) |
| Holder count shows a plus sign, like `1000+` | Pagination cap reached; the count is exact up to 1,000 and a lower bound beyond it |
| DEX volume shows trades but no USD | `dex.trades` has no price for most xStocks and does not index Fluxion; the README's methodology notes cover this |
| Digest deltas all say `first run` | Expected: there was no previous `agent/state.json` to diff against |

Every number this walkthrough promises is reproducible from the queries and scripts in this repository. If one is not, open an issue; that would be a finding.
