# RWA Research (BNB Chain): project context

Goal: build Yeheskiel's reputation in the BNB Chain ecosystem with RWA distribution research. Angle: RWA distribution plus the Indonesian student market. Author: Yeheskiel Yunus Tame (@YeheskielTame), UKDW Blockchain Club founder, OwnaFarm builder.

This project was migrated from Mantle to BNB Chain. The original Mantle study (research challenge entries, FINDINGS.md, snapshots, Mantle Dune ids and key addresses) lives in `legacy/mantle/` and must not be presented as BNB Chain data. See `MIGRATION-BNB.md`.

## Structure

- `rwa-distribution-tracker/`: Dune queries plus automation agent, ported to BNB Chain
  - `dune/q1..q13.sql`: DuneSQL queries on raw `bnb.logs` (exact decimal(38,0) math; q3 external float is the hero metric; q9-q13 are acquisition, trend and attribution forensics, parameterized by `window_start` / `window_end` / `issuer_wallet`). Not yet published on Dune.
  - `agent/tracker_agent.py`: weekly digest, threshold alerts, Dune sync check; holder data from BscScan via Etherscan API v2 (chainid=56); cron at `.github/workflows/tracker.yml` (daily 01:00 UTC, Monday full digest)
  - `skill/bnb-rwa-research/`: Agent Skill plus stdlib script `scripts/rwa_brief.py`
- `legacy/mantle/`: the original Mantle research (reference only)

## Key facts

- BNB Smart Chain mainnet chain ID 56 (testnet 97); explorer https://bscscan.com
- Data APIs: Etherscan API v2 (BscScan, needs key; `tokenholderlist` may need a paid plan), DeFiLlama, CoinGecko
- Tracked tokens: TODO (none configured yet in `agent/config.json`)
- Falsifiable thresholds: holders above 500, top wallet below 75%, BNB Chain DEX liquidity above 100K USD
- Content rule: lead with thesis and value; do not center hackathon wins

## Conventions

- Writing: professional, zero AI slop. NEVER use em dashes ("—"), decorative separators, arrows, or circled numbers in any deliverable, dashboard text, query name or comment. Grep for "—" before committing prose.
- Python: stdlib only for agent scripts (students must run them without pip)
- Every published number needs a source and a timestamp; always disclose "not financial advice"
- Language: deliverables in English, discussion in Bahasa Indonesia
