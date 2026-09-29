# mantle-rwa-research: an Agent Skill for onchain RWA research

*Mantle Research Challenge, Track 2: The Research Agent*
*By Yeheskiel Yunus Tame, Founder of UKDW Blockchain Club, builder on Mantle (OwnaFarm). X: @YeheskielTame*

## What it does and why it's useful

Most RWA dashboards show you **TVL**. TVL measures minted supply, not whether anyone actually holds the asset. When tokenized SpaceX (SPCXx) launched on Mantle in June 2026, headlines said "$6.4M live on Mantle"; on-chain, 99.5% sat in one issuer wallet with 24 holders.

This skill makes an AI agent (Claude, or anything supporting the open [Agent Skills](https://agentskills.io) format that Mantle's AI Agent Skills build on) do RWA research the honest way: **supply vs distribution, every time**. It ships with a zero-dependency Python script that pulls live data from three free APIs and emits a markdown research brief with a built-in verdict and falsifiable thresholds.

Built for students: no API keys, no pip installs, no paid tools. If you have Python 3, you can audit a $247M RWA ecosystem from a campus laptop.

## How it's built

Three parts, all in this folder:

1. **`SKILL.md`**: the agent's instructions. It holds the four-metric framework (minted supply, externally distributed supply, holder breadth, usable liquidity), data sources, and interpretation rules (e.g., "TVL up + holders flat = institutional issuance, not retail adoption"). Drop the folder into any Agent Skills-compatible runtime and the agent picks it up automatically.
2. **`scripts/rwa_brief.py`**: a stdlib-only fetcher hitting:
   - `api.llama.fi/v2/chains` for Mantle DeFi TVL
   - `api.coingecko.com` for MNT and SPCXx prices
   - `api.routescan.io` (Mantle, chainId 5000) for SPCXx holder distribution and top-wallet concentration
3. **Falsifiable thresholds** baked into the output (holders >500, top wallet <75%, Mantle DEX liquidity >$100K) so every brief tracks whether distribution is actually improving. This operationalizes the checklist proposed in VM Crypta's "99.54% Problem" analysis.

## How to use it (3 steps)

```bash
# 1. Get the skill
git clone <this-repo> && cd track2-research-agent

# 2. Run the data script directly…
python3 scripts/rwa_brief.py > brief.md

# 3. …or give the folder to an agent (Claude Code, Cowork, or any
#    Agent Skills runtime) and ask:
#    "Generate today's Mantle RWA brief and compare with last week."
```

The agent reads `SKILL.md`, runs the script, and writes the analysis around the numbers, including what changed since the last run.

## Live example

See [`example-output.md`](example-output.md), a real brief generated July 2, 2026. Highlights from that run:

- Mantle DeFi TVL: **$143.5M** (DeFiLlama, live)
- SPCXx top wallet: **99.20%** of supply (Routescan, live), down just 0.34 points from 99.54% on June 16
- Verdict the agent produced: *"ISSUED, NOT ADOPTED. Supply exists but sits with the issuer."*

That one number, checked in seconds by anyone, is the difference between repeating a TVL headline and doing research.

## Extend it

- Swap the contract address to track any xStock (TSLAx, NVDAx, CRCLx) or USDY.
- Add DeFiLlama `/protocol/{slug}` calls for Merchant Moe / Aave-on-Mantle pool depth.
- Schedule it (cron or agent scheduler) for a weekly distribution digest.

*Not financial advice. Data sources are free public APIs; verify before citing.*
