# VERIFY-BNB: mantle-research (rwa-distribution-tracker)

Verified 2026-09-25. **Read-only against BSC mainnet (56).** Nothing here deploys contracts.

**Verdict: PARTIAL.** The pipeline runs end-to-end on BNB data. The per-token holder snapshot is blocked because it needs a **paid** Etherscan plan for chain 56.

| Check | Result | Notes |
|---|---|---|
| `py_compile` of both scripts | PASS | |
| `agent/tracker_agent.py` full run | PASS | Ran on a scratch copy with `tokens = {PAXG (BEP-20 0x7950…10f7)}`, so the repo state and reports were not touched. The digest was written with BNB Chain TVL of $5.86B from DeFiLlama. With no key, the token row degrades cleanly to "data unavailable". Output: 0 alerts. |
| `skill/bnb-rwa-research/scripts/rwa_brief.py` | PASS | `RWA_TOKEN` = PAXG. BSC TVL, BNB price ($778) and PAXG price all resolved. |
| Holder snapshot (Etherscan v2 `chainid=56`) | **BLOCKED** | Etherscan v2 answers `"Free API access is not supported for this chain. Please upgrade your api plan"` for chain 56. `tokenholderlist` also needs an API Pro plan. |
| Dune SQL (`dune/q1`–`q13`, on `bnb.*` tables) | SKIPPED | Not executed. That needs a Dune account and credits, plus a chosen BNB RWA token. The migrated SQL has no leftover `mantle.*` table references. |
| Address checks | N/A | `config.json` ships with an empty `tokens` map. PAXG was used only as a test token: it has code on BSC and 18 decimals. |

## Bugs fixed
- `agent/tracker_agent.py` `chain_tvl()` and `scripts/rwa_brief.py` `chain_tvl()`: DeFiLlama `/v2/chains` has **two** entries with `chainId == 56`, "BSC" ($5.86B) and "Binance" ($0). The code took the first match, so it would report $0 TVL if the API reordered them. Both now take the largest TVL for the chain id.

## Steps remaining
1. Choose the BNB Chain RWA tokens, verify them on bscscan.com, and fill `agent/config.json` → `tokens` (address plus issuer wallet).
2. Holder data needs one of:
   - an Etherscan API plan that covers BSC (chain 56 is paid-only; `tokenholderlist` needs Pro), set as the `ETHERSCAN_API_KEY` GitHub secret; or
   - swapping `token_snapshot()` to another holder source, such as the Dune q2 result via `DUNE_API_KEY`, Moralis, or Covalent.
3. Publish `dune/*.sql` on Dune, then set `dune.enabled=true` and the query ids.
4. No tBNB is needed. There is no on-chain write.
