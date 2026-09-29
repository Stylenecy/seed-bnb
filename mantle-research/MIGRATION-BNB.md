# Migration: Mantle to BNB Chain

This is a data-research project, not a dApp. The tooling was ported to BNB Chain; the Mantle findings were not, because they are measurements of Mantle and would be false if relabeled.

## What changed

- `rwa-distribution-tracker/dune/*.sql`: `mantle.logs` to `bnb.logs`, `mantle.creation_traces` to `bnb.creation_traces`, `blockchain = 'mantle'` to `'bnb'`. Removed Mantle-specific defaults (SPCXx, Backed issuer wallet) and Mantle result comments. The hard-coded issuer wallet in q9 to q13 is now `{{issuer_wallet}}`; the hard-coded Bybit window dates in q11 to q13 are now `{{window_start}}` / `{{window_end}}`. q6 DEX notes now reference PancakeSwap and other BSC DEXs.
- `rwa-distribution-tracker/agent/tracker_agent.py`: holder snapshots switched from Routescan (Mantle) to BscScan through Etherscan API v2 (`chainid=56`, `tokensupply` + paginated `tokenholderlist`, key from `ETHERSCAN_API_KEY`). TVL now uses DeFiLlama `chainId == cfg["chain_id"]`. Digest text rebranded.
- `rwa-distribution-tracker/agent/config.json`: `chain_id` 56, empty `tokens` map with a `tokens_example` template, Dune sync disabled until BNB queries are published. `state.json` reset.
- `.github/workflows/tracker.yml`: passes the `ETHERSCAN_API_KEY` secret.
- `skill/mantle-rwa-research` renamed to `skill/bnb-rwa-research`; `SKILL.md` and `scripts/rwa_brief.py` rewritten for BNB Chain (BNB price, BSC TVL, token via `RWA_TOKEN` env).
- README, WALKTHROUGH and CLAUDE.md rewritten for BNB Chain.
- Moved to `legacy/mantle/`: `research-challenge/` (article, figures, Track 2 skill), `FINDINGS.md`, Mantle digests and state, Mantle config, a copy of the Mantle Dune SQL, and the original README/WALKTHROUGH/example output.

## Verification

- `python3 -m py_compile` passes for both scripts.
- `tracker_agent.py --alerts-only` runs cleanly with no key and no tokens configured.
- The Dune SQL was not executed (needs a Dune account and a real BNB Chain token).

## TODO

- Choose the BNB Chain RWA tokens to track (verify addresses and issuer wallets on bscscan.com) and add them to `agent/config.json`. Confirm whether the xStocks family is on BNB Chain; if not, change the `tokens.erc20` name filter in q5 and q8 to q13.
- Publish the queries on Dune, build the BNB dashboard, replace `query_7863671` in q8 with the new q5 id, add the ids to README/SKILL.md and to `config.json` (then set `dune.enabled` to true).
- Confirm your Etherscan API plan includes `tokenholderlist` for chainid 56; otherwise swap in another holder source.
- Add GitHub secrets `ETHERSCAN_API_KEY` (plus optional `ALERT_WEBHOOK_URL`, `DUNE_API_KEY`).
- Nothing here deploys contracts, so no BSC testnet deploy is needed.
