# The RWA Distribution Gap on Mantle: Findings

**TL;DR: Mantle has solved RWA supply, not RWA distribution. 368 tokenized US equities are live on-chain and exactly one is genuinely distributed. 926 wallets hold any of them. 88% of those wallets arrived in a single four-week window, and that window is now attributed: it was the opening of the Bybit gateway to Mantle for xStocks (April 10, 2026). Those users are excellent demand (98.3% still hold), but when the launch moment passed, acquisition collapsed to single digits per week. Mantle's RWA demand engine is one CEX gateway that only fires during launch moments. This gap is measurable, and it is fixable.**

All numbers are measured on-chain from raw `mantle.logs` Transfer events (coverage: Mantle genesis 2023-07-02 through 2026-07-02) in exact 256-bit integer arithmetic, cross-validated against the Routescan API (concentration matched to the decimal; holder counts within about 3%, live data being fresher). Snapshot date: 2026-07-02. Every finding links to a public, re-runnable Dune query. Not financial advice.

**Live dashboard:** https://dune.com/yeheskiel/mantle-rwa-distribution-tracker

---

## Findings

### F1. 368 issued, 1 distributed
Backed's xStocks put 368 tokenized US equities on Mantle (family launched 2025-12-01). Against falsifiable distribution thresholds (holders above 500, top-1 wallet below 75%):

- One token passes: NVDAx, with 612 holders and a 74.55% top-1 wallet on the Dune snapshot (629 holders on the same-day live Routescan check; both sources agree the thresholds are crossed).
- 15 of 368 (4.1%) have at least 10 holders.
- The median xStock has one to three holders: issued, not adopted.

Evidence: [league query 7863671](https://dune.com/queries/7863671), [summary 7863679](https://dune.com/queries/7863679), live cross-check in the [agent digest of 2026-07-02](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/blob/main/agent/reports/2026-07-02.md).

### F2. Adoption is event-driven, and the event is identified: the Bybit gateway
Weekly first-time-holder counts show three regimes:

- December 2025 to mid-March 2026: almost nothing. Three to six total holders in the first 3.5 months after launch.
- April 13 to May 10, 2026: an explosion. 816 new holder wallets in four weeks (353 in the week of April 13 alone). 88% of all holders ever were acquired in this one window.
- Since May 18: one to eleven new holders per week. Even the SpaceX token launch (June 11) added only about 50.

Attribution rests on three independent lines of evidence:

1. The on-chain fingerprint. The cohort's entry transfers are overwhelmingly direct `token.transfer()` calls initiated by a third party (transaction target is the token contract itself; none are self-initiated). That is the CEX-withdrawal pattern, not DEX buys and not an airdrop (amounts vary widely, standard deviation about 14 tokens).
2. The distributor. One hot wallet, `0x5888...836c`, delivered first xStocks to 462 of the 816 cohort wallets, across seven tickers, active every single day from April 13 to May 10, and then stopped. The wallet has 2.76 million lifetime transactions on Mantle and appears in Bybit's Proof-of-Reserves reports for the Mantle network. It is Bybit's Mantle hot wallet.
3. The dated event. On April 10, 2026, Mantle, Bybit and Backed announced the xStocks integration, with Bybit enabling xStocks deposits and withdrawals on the Mantle network ([Bybit announcement](https://announcements.bybit.com/en/article/bybit-now-supports-xstocks-deposits-and-withdrawals-on-mantle-bltd6af69aacd874633/), [The Block](https://www.theblock.co/post/378030/bybit-backed-xstocks-tokenized-nvidia-mstr-mantle)). The on-chain wave starts the first Monday after.

The spike proves demand can be activated on Mantle through the CEX gateway. The collapse proves there is no always-on funnel behind it.

Evidence: [trend 7865851](https://dune.com/queries/7865851), [mechanism 7866292](https://dune.com/queries/7866292), [distributors 7866312](https://dune.com/queries/7866312).

### F3. The Bybit-gateway users are excellent demand: 98.3% still hold
Of the 816 wallets that received their first xStock in the Bybit window, 802 (98.3%) still hold today. This is buy-and-hold retail, not incentive farming. The contrast case: the June SPCXx launch shipped with Merchant Moe's "Project X" campaign (up to 100,000 MNT in LP rewards). It produced pool liquidity and trading churn (F6) but almost no new holders. Liquidity incentives buy liquidity; the CEX gateway buys holders. Mantle currently funds the former and leaves the latter to launch-day marketing.

Evidence: [retention 7866325](https://dune.com/queries/7866325), [Project X press release](https://chainwire.org/2026/06/12/mantle-and-xstocks-bring-tokenized-spacex-spcxx-to-fluxion-merchant-moe-as-historys-largest-ipo-goes-live/).

### F4. RWAs do acquire new users, but the funnel is tiny
Classifying all 923 current external holder wallets by their on-chain history:

| Wallet origin | Wallets | Share |
|---|---|---|
| Existing Mantle user (median 459 days on Mantle before first xStock) | 458 | 49.6% |
| Arrived on Mantle with their first xStock | 421 | 45.6% |
| Contract (DEX pool or vault) | 30 | 3.3% |
| Passive receiver (never initiated a transaction) | 14 | 1.5% |

Two implications. First, tokenized stocks are a real user-acquisition product: nearly half the holders are wallets that showed up for the RWA. Second, 421 new wallets in seven months is the entire acquisition result. For scale, Indonesia alone has roughly 26 million retail stock investors.

Evidence: [acquisition query 7865842](https://dune.com/queries/7865842).

### F5. Case study SPCXx: supply without demand
The SpaceX xStock (launched June 11, 2026, heavily promoted) has a net supply of 30,000 tokens with 99.2% still in the issuer wallet. External float after three weeks: 0.8%. It has 26 holders, of which 7 hold at least one whole token. Supply was set by exactly one mint (150,000) and one burn (120,000). These are issuer operations, not demand.

Evidence: [concentration 7863618](https://dune.com/queries/7863618), [float over time 7863645](https://dune.com/queries/7863645), [mint and burn 7863661](https://dune.com/queries/7863661).

### F6. Activity is not adoption
SPCXx shows 5,686 transfers in 21 days (with spikes above 1,400 per day) but never more than about 19 distinct receiving addresses in a day. High transfer counts here are churn from arbitrage bots and issuer operations, not users. Any RWA metric based on transaction counts will overstate adoption.

Evidence: [daily activity 7863657](https://dune.com/queries/7863657).

### F7. The ecosystem cannot yet measure its own RWA liquidity
- SPCXx trades on one indexed venue (Merchant Moe: 418 trades, peaking at 208 per week and decaying to about 42).
- Fluxion, Mantle's RWA-focused DEX, is not indexed in Dune's `dex.trades` spellbook at all.
- xStocks are missing from the DEX price oracle, so `amount_usd` is NULL. USD liquidity of tokenized equities on Mantle is unmeasurable with standard tooling.

The measurement gap is itself an adoption blocker: builders cannot optimize what they cannot see.

Evidence: [DEX query 7863658](https://dune.com/queries/7863658).

### F8. First threshold crossing, detected automatically
On its first multi-token run (2026-07-02 11:40 UTC), the tracker agent alerted that NVDAx had crossed both falsifiable thresholds (top-1 wallet 74.553%, below 75%; holders 629, above 500). NVDAx is the first xStock on Mantle to become distributed by criteria that were set in advance. The framework works: thresholds pre-registered, crossings detected automatically, receipts on-chain.

Evidence: [agent digest 2026-07-02, committed by CI](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/blob/main/agent/reports/2026-07-02.md), [CI run history](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/actions).

---

## Recommendations for Mantle, each with the why and the evidence

### R1. Make the CEX gateway always-on instead of launch-day
Why: the only funnel that has ever produced RWA holders at scale on Mantle is CEX withdrawal to chain, and it only ran while the launch moment lasted. Each active gateway week delivered roughly 200 to 350 new holders; after the window cooled, acquisition fell to single digits. Recurring, localized gateway campaigns would compound what is currently a one-off. Indonesia's roughly 26 million retail stock investors are the natural wedge, and Bybit already operates there.

Evidence: 88% of all holders arrived between April 13 and May 10 ([trend 7865851](https://dune.com/queries/7865851)); the deliveries came from Bybit's Mantle hot wallet ([distributors 7866312](https://dune.com/queries/7866312), [Bybit PoR](https://www.bybit.com/common-static/cht-static/por/Bybit_PoR_Audit_2026_Feb_26.pdf)); the window opens immediately after the [April 10 Bybit and Mantle announcement](https://announcements.bybit.com/en/article/bybit-now-supports-xstocks-deposits-and-withdrawals-on-mantle-bltd6af69aacd874633/); post-window growth is one to eleven wallets per week ([trend 7865851](https://dune.com/queries/7865851)).

### R2. Rebalance incentives from liquidity toward first-holder acquisition
Why: the two experiments the ecosystem has already run point the same way. The CEX-gateway users cost no incentives and 98.3% of them still hold. The LP-rewards campaign (Project X, up to 100,000 MNT) bought pool depth and trading churn but almost no new holders. Budgets follow what gets measured, and today the budget buys liquidity rather than distribution.

Evidence: retention of 802 out of 816, or 98.3% ([retention 7866325](https://dune.com/queries/7866325)); SPCXx after launch shows thousands of transfers but at most 19 active receivers per day and 26 holders ([activity 7863657](https://dune.com/queries/7863657), [concentration 7863618](https://dune.com/queries/7863618)); the June SPCXx launch shipped with [Project X LP rewards](https://chainwire.org/2026/06/12/mantle-and-xstocks-bring-tokenized-spacex-spcxx-to-fluxion-merchant-moe-as-historys-largest-ipo-goes-live/) yet the holder trend barely moved that month ([trend 7865851](https://dune.com/queries/7865851)).

### R3. Fix the measurement stack: Fluxion indexing and xStock price feeds
Why: builders and business development cannot optimize what they cannot see. Mantle's flagship RWA venue is invisible to the standard analytics stack, and tokenized-equity liquidity cannot be quoted in USD at all. This study had to fall back to trade counts.

Evidence: `dex.trades` on Mantle covers merchant_moe, agni, uniswap and fusionx only, with no Fluxion, and `amount_usd` is NULL for xStock trades ([DEX 7863658](https://dune.com/queries/7863658); methodology notes in the [repository README](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker#methodology-and-honesty-notes)).

### R4. Adopt external float and holder count as the RWA KPIs instead of TVL or supply
Why: supply is an issuer decision. SPCXx's entire supply history is one mint of 150,000 and one burn of 120,000, so supply-side KPIs measure the issuer, not the market. Distribution metrics are falsifiable, cheap to monitor continuously, and they already caught the one genuine success.

Evidence: SPCXx mint and burn history ([7863661](https://dune.com/queries/7863661)) against an external float stuck at 0.8% ([7863645](https://dune.com/queries/7863645)); NVDAx crossing both thresholds was detected automatically by the tracker's first multi-token run ([agent digest and alerts, 2026-07-02](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/blob/main/agent/reports/2026-07-02.md)), and the crossing dates to the Bybit window ([trend 7865851](https://dune.com/queries/7865851)), which is the causal chain working end to end once.

## Reuse this research

Everything is public and parameterized.

- Dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker. The token selector switches every single-token panel. Fork any query and change `token_address` to track any ERC-20 on Mantle.
- Queries: `dune/q1.sql` through `dune/q13.sql` in this repository contain the exact deployed SQL, with live query IDs in each header. Queries q11 to q13 are the spike attribution forensics (entry mechanism, distributor identity, cohort retention).
- Agent: the `agent/` directory holds a Python tracker that uses only the standard library (no pip). It produces a weekly digest, threshold alerts, and a Dune-versus-live cross-check. It works for any token on any Routescan-supported chain by editing `config.json` (`chain_id`, `tokens`). A GitHub Actions cron is included and verified.
- Method: exact `decimal(38,0)` balance reconstruction (no float error, no dust heuristics), name-based token-family discovery, contract flagging via `creation_traces`, and first-activity-versus-first-receipt acquisition bucketing.

## Method notes and caveats

- Balances are reconstructed from ERC-20 Transfer logs only, in exact integer math. The zero address and the issuer wallet (`0x5F7A...a2aD`, verified as the top holder across the family) are excluded from holder counts.
- League-table external float uses each token's top holder as the issuer proxy.
- Acquisition "first activity" means the first transaction a wallet initiated that emitted a log. Plain MNT transfers without logs are invisible, which slightly undercounts wallet age.
- The trend total (926) and the acquisition total (923) differ by three wallets (0.3%) due to anomalous per-token flows on non-standard tokens. The difference is immaterial.
- Routescan live counts run 0 to 3% above the same-day Dune snapshot because the live data is fresher. The agent's pagination is exact up to 1,000 holders and reports a lower bound beyond that.
- Spike attribution rests on three independent lines (transfer fingerprint, Bybit PoR wallet match, dated announcement). The long tail of smaller senders (about 40% of cohort entries) is unattributed; plausibly other exchange wallets, OTC desks, or redistribution. Several show identical payout sizes (for example 10.0772 tokens from at least four different wallets), which suggests one programmatic upstream source.
- Retention is measured as "still holds any xStock balance above zero," not "still active on Mantle." A holder can be retained and dormant.

---

## Evidence index

Dashboard with all panels: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker

| Dune query (public, re-runnable) | Content | Supports |
|---|---|---|
| [7863679](https://dune.com/queries/7863679) | Ecosystem summary counters (368 issued, 15 with 10+ holders, 1 distributed) | F1 |
| [7863671](https://dune.com/queries/7863671) | xStock league: every token ranked, with verdicts | F1 |
| [7865851](https://dune.com/queries/7865851) | Holders over time: the four-week window, 926 total | F2, R1, R2, R4 |
| [7865842](https://dune.com/queries/7865842) | Holder acquisition: 45.6% arrived with their first xStock | F4 |
| [7866292](https://dune.com/queries/7866292) | Spike entry mechanism: the CEX-withdrawal fingerprint | F2, R1 |
| [7866312](https://dune.com/queries/7866312) | Spike distributors: Bybit hot wallet `0x5888...836c`, 462 of 816 wallets | F2, R1 |
| [7866325](https://dune.com/queries/7866325) | Bybit-window cohort retention: 98.3% | F3, R2 |
| [7863618](https://dune.com/queries/7863618) | Concentration, parameterized (SPCXx default: 99.2% top-1) | F5, R2 |
| [7863645](https://dune.com/queries/7863645) | External float over time (SPCXx: 0 to 0.8%) | F5, R4 |
| [7863651](https://dune.com/queries/7863651) | Holders over time, single token | F5 |
| [7863661](https://dune.com/queries/7863661) | Mint, burn and net supply (one mint, one burn) | F5, R4 |
| [7863657](https://dune.com/queries/7863657) | Daily activity: transfers versus distinct wallets | F6, R2 |
| [7863658](https://dune.com/queries/7863658) | DEX activity: Merchant Moe only, `amount_usd` NULL | F7, R3 |

External sources:

- [Bybit announcement: xStocks deposits and withdrawals on Mantle (April 10, 2026)](https://announcements.bybit.com/en/article/bybit-now-supports-xstocks-deposits-and-withdrawals-on-mantle-bltd6af69aacd874633/)
- [The Block: Bybit and Backed partner to bring tokenized stocks to Mantle](https://www.theblock.co/post/378030/bybit-backed-xstocks-tokenized-nvidia-mstr-mantle)
- [Mantle, Bybit and Backed joint press release (PR Newswire)](https://www.prnewswire.com/news-releases/mantle-becomes-one-of-the-first-ethereum-l2s-to-bring-tokenized-equities-to-on-chain-liquidity-with-xstocks-and-bybit-302739354.html)
- [Bybit Proof-of-Reserves audit (Mantle wallets, including `0x5888...836c`)](https://www.bybit.com/common-static/cht-static/por/Bybit_PoR_Audit_2026_Feb_26.pdf)
- [Chainwire: SPCXx live on Fluxion and Merchant Moe; Project X, up to 100,000 MNT in LP rewards (June 12, 2026)](https://chainwire.org/2026/06/12/mantle-and-xstocks-bring-tokenized-spacex-spcxx-to-fluxion-merchant-moe-as-historys-largest-ipo-goes-live/)
- Routescan v2 API for live holder pagination and cross-checks: `api.routescan.io/v2/network/mainnet/evm/5000/`
- [Agent digests, committed by CI](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/tree/main/agent/reports) and [CI runs](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/actions)

Author: Yeheskiel Yunus Tame ([@YeheskielTame](https://x.com/YeheskielTame)), UKDW Blockchain Club, OwnaFarm. Part of the Mantle Research Challenge. Not financial advice.
