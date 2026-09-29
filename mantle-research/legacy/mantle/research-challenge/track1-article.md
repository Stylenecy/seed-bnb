# 926 Wallets, One Door: The On-Chain Anatomy of Mantle's Tokenized Stock Market

*I reconstructed every holder of all 368 tokenized equities on Mantle, in exact integer math, from raw logs. 88% of them arrived through a single gateway that stayed open for four weeks. This is who opened that door, why the buyers never left, and where the next wave is standing.*

**Every claim in this piece is verifiable before you read it:**

- **Live dashboard, 13 public queries:** https://dune.com/yeheskiel/mantle-rwa-distribution-tracker
- **Open-source tracker agent and full findings:** https://github.com/yeheskieltame/mantle-rwa-distribution-tracker

The research runs on an automated tracker: an open-source agent that re-checks the live numbers daily against thresholds set in advance. On its first multi-token run it caught the story's ending on its own, flagging NVDAx as the first and only xStock on Mantle to cross both distribution thresholds. Everything below links to the query or document that proves it.

*Data as of July 2, 2026. Not financial advice.*

![The research at a glance: a grid of stat cards showing 368 issued to 1 distributed, the 88% four-week window, 98.3% retention, 926 holders, 421 new wallets, the April 10 gateway date, and the NULL measurement gap.](track1-assets/fig-cover.png)
*The research at a glance. Every number is measured on-chain and linked to a public query in the sections below.*

---

## The chart nobody plotted

There is a chart the RWA headlines never show. Take all 368 tokenized US equities that Backed's xStocks has issued on Mantle, reconstruct every wallet balance from raw Transfer logs, and count distinct holders per week since launch.

The line does three things. It crawls: three to six holders in the first three and a half months. It explodes: 816 new holder wallets between April 13 and May 10, 2026, with 353 in a single week. Then it flatlines: one to eleven new holders per week ever since, and 926 in total today.

One four-week window created 88% of every tokenized-stock holder Mantle has ever had ([trend query 7865851](https://dune.com/queries/7865851)).

![Figure 1: line chart of total xStock holders with the Bybit window highlighted, plus weekly first-time holder bars and summary stat cards.](track1-assets/fig-trend.png)
*Figure 1. Holder growth, December 2025 to July 2026. The marker is the April 10 Bybit announcement; the shaded band is the four-week window that produced 88% of all holders. Source: Dune query 7865851.*

A spike like that is not organic adoption. It is a door opening. So I went looking for the door.

## The move: Mantle won the supply side

First, credit where the headlines are right. In two quarters Mantle became a serious issuance venue for tokenized equities:

- RWA TVL grew 27.4% QoQ to $247.5M in Q1 2026, driven by Maple's syrupUSDT, the MI4 index fund, and xStocks ([Messari via Chainwire, June 9, 2026](https://chainwire.org/2026/06/09/mantle-posts-27-rwa-growth-in-q1-2026-reaching-247-5m-according-to-messari/)).
- Tokenized SpaceX (SPCXx) went live on Mantle the same day SpaceX completed the largest IPO in history, tradable on Fluxion and Merchant Moe, 1:1 backed, with issuer-direct pricing ([Chainwire, June 12, 2026](https://chainwire.org/2026/06/12/mantle-and-xstocks-bring-tokenized-spacex-spcxx-to-fluxion-merchant-moe-as-historys-largest-ipo-goes-live/)).
- Franklin Templeton's USPX ETF came on-chain via xStocks, one of the first tokenized ETFs from a top-tier TradFi asset manager on any Ethereum L2 ([PR Newswire](https://www.prnewswire.com/news-releases/mantle-becomes-one-of-the-first-ethereum-l2s-to-bring-franklin-templetons-uspx-etf-on-chain-with-xstocks-302808048.html)).

Issuers choose venues the way CFOs choose banks, and Mantle's institutional credibility (the largest DAO treasury in the world, deep exchange relationships) won that competition. Supply followed.

But supply is a decision made by an issuer. Distribution is a verdict delivered by the market. So instead of quoting TVL, I measured the verdict.

## The method: count holders, not headlines

I rebuilt the balance of every wallet that ever touched any of the 368 xStocks on Mantle, from raw `mantle.logs` Transfer events, in exact 256-bit integer arithmetic (`decimal(38,0)`: no floating-point rounding, no dust thresholds, a zero balance is exactly zero). Coverage runs from Mantle genesis (July 2, 2023) to the snapshot date. I cross-validated against the Routescan API: concentration figures matched to the decimal, and live holder counts agreed within 3% (live data is a few hours fresher).

Everything is public and re-runnable:

- A live dashboard with 13 parameterized queries: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker
- An open-source tracker agent that re-checks the numbers daily and alerts on threshold crossings: https://github.com/yeheskieltame/mantle-rwa-distribution-tracker

Six findings came out of it, and together they explain the chart.

## Finding 1: 368 issued, 1 distributed

Set falsifiable thresholds before looking: a token counts as distributed when it has more than 500 holders and its top wallet holds less than 75% of supply.

- Exactly one of 368 xStocks passes: NVDAx, with 612 holders and a 74.55% top wallet ([league 7863671](https://dune.com/queries/7863671)).
- Only 15 of 368 (4.1%) have even ten holders ([summary 7863679](https://dune.com/queries/7863679)).
- The median xStock has one to three holders: issued, not adopted.

![Figure 2: funnel cards showing 368 issued, 15 with at least ten holders, 1 genuinely distributed.](track1-assets/fig-funnel.png)
*Figure 2. The adoption funnel across all 368 xStocks. Sources: Dune queries 7863671 and 7863679.*

The full ranking makes the cliff visible. After NVDAx, TSLAx and CRCLx, holder counts collapse into double and single digits:

![Figure 3: horizontal bar ranking of the top ten xStocks by exact holder count, with top-wallet share and verdict for each.](track1-assets/fig-league.png)
*Figure 3. The top ten of 368 xStocks by exact holders. The remaining 358 have fewer than 15 holders each. Source: Dune query 7863671.*

The flagship makes the point sharply. Tokenized SpaceX has 26 holders. Its issuer wallet still holds 99.2% of supply; external float is 0.8% after three weeks of trading ([concentration 7863618](https://dune.com/queries/7863618)). Its entire supply history is one mint of 150,000 tokens and one burn of 120,000 ([mint and burn 7863661](https://dune.com/queries/7863661)). SPCXx also logged 5,686 transfers in 21 days while never reaching more than about 19 distinct receiving wallets in a day ([activity 7863657](https://dune.com/queries/7863657)): transaction counts there are arbitrage churn, not people. Any adoption metric built on activity or TVL will overstate reality.

## Finding 2: the door has a name

Who opened the tap in April? The on-chain evidence answers this three independent ways.

**The fingerprint.** The spike cohort's entry transfers are overwhelmingly direct `token.transfer()` calls where the transaction was initiated by a third party, not by the receiving wallet. That is the signature of centralized-exchange withdrawals: not DEX swaps, and not an airdrop, because amounts vary widely ([mechanism 7866292](https://dune.com/queries/7866292)).

**The wallet.** One hot wallet, `0x5888...836c`, delivered first xStocks to 462 of the 816 cohort wallets, across seven tickers, active every single day from April 13 to May 10, and then stopped. It has 2.76 million lifetime transactions on Mantle, and it appears in Bybit's Proof-of-Reserves reports for the Mantle network. It is Bybit's Mantle hot wallet ([distributors 7866312](https://dune.com/queries/7866312); [Bybit PoR](https://www.bybit.com/common-static/cht-static/por/Bybit_PoR_Audit_2026_Feb_26.pdf)).

**The date.** On April 10, 2026, Mantle, Bybit and Backed announced the xStocks integration, with Bybit enabling xStocks deposits and withdrawals on the Mantle network ([Bybit announcement](https://announcements.bybit.com/en/article/bybit-now-supports-xstocks-deposits-and-withdrawals-on-mantle-bltd6af69aacd874633/); [The Block](https://www.theblock.co/post/378030/bybit-backed-xstocks-tokenized-nvidia-mstr-mantle)). The on-chain wave starts the first Monday after.

![Figure 4: three evidence cards (the fingerprint, the wallet, the date) above a day-by-day strip showing the hot wallet active every day of the window, then stopping.](track1-assets/fig-gateway.png)
*Figure 4. The attribution, summarized. The delivery-day strip is the hot wallet's activity from April 1 to May 24: nothing, then every single day of the window, then nothing. Sources: Dune queries 7866292 and 7866312, Bybit PoR.*

So the entire mystery of Mantle's RWA holder base resolves into one sentence: people bought tokenized stocks on Bybit and withdrew them to Mantle for four weeks, and then the moment passed. Even NVDAx's threshold crossing, the ecosystem's single distribution success, dates to this window.

## Finding 3: the buyers stayed, the funnel did not

Retention: 802 of the 816 wallets from the Bybit window, 98.3%, still hold their xStocks today ([retention 7866325](https://dune.com/queries/7866325)). These are not reward farmers who dumped and left. They are buy-and-hold investors who came for the product.

Now the contrast that turns this into strategy. In June, the SPCXx launch shipped with Merchant Moe's Project X campaign, up to 100,000 MNT in liquidity-provider rewards ([Chainwire](https://chainwire.org/2026/06/12/mantle-and-xstocks-bring-tokenized-spacex-spcxx-to-fluxion-merchant-moe-as-historys-largest-ipo-goes-live/)). It bought pool depth and trading churn. It produced almost no new holders; ecosystem-wide first-time holders stayed in single digits to low double digits every week of June ([trend 7865851](https://dune.com/queries/7865851)). The un-incentivized CEX gateway produced 816 holders who stick at 98.3%.

Mantle's ecosystem is spending on liquidity while its only proven holder-acquisition channel runs unattended.

![Figure 5: a 98.3% retention gauge for the Bybit-window cohort next to a supply tank showing 99.2% of SPCXx still in the issuer wallet.](track1-assets/fig-retention.png)
*Figure 5. Left: retention of the Bybit-window cohort, eight weeks later. Right: SPCXx supply concentration after three weeks and a 100,000 MNT LP campaign. Sources: Dune queries 7866325, 7863618, 7863661, 7863657.*

## Finding 4: tokenized stocks acquire real users, just not enough of them

Classifying all 923 current external holder wallets by their full on-chain history (coverage from Mantle genesis, contracts flagged via `creation_traces`):

| Wallet origin | Wallets | Share |
|---|---|---|
| Existing Mantle user (median 459 days on Mantle before first xStock) | 458 | 49.6% |
| Arrived on Mantle with their first xStock | 421 | 45.6% |
| Contract (DEX pool or vault) | 30 | 3.3% |
| Passive receiver (never initiated a transaction) | 14 | 1.5% |

Two implications. First, tokenized stocks are a genuine user-acquisition product: nearly half the holders are wallets that showed up for the RWA. Second, 421 new wallets in seven months is the entire acquisition result. For scale, Indonesia alone has roughly 26 million retail stock investors.

![Figure 6: donut chart of holder origin, 45.6% arrived on Mantle with their first xStock, with legend cards for each group.](track1-assets/fig-origin.png)
*Figure 6. Where the 923 current holder wallets came from. Source: Dune query 7865842.*

## Finding 5: the ecosystem cannot yet measure its own RWA liquidity

While building the dashboard I hit three measurement gaps worth naming, because they hide the problem this article documents:

- SPCXx trades on one indexed venue only (Merchant Moe: 418 trades, peaking at 208 per week and decaying to about 42).
- Fluxion, Mantle's RWA-focused DEX and the official execution venue in Mantle's own announcements, is not indexed in Dune's `dex.trades` spellbook at all.
- xStocks are missing from the DEX price oracle, so `amount_usd` comes back NULL: the USD liquidity of tokenized equities on Mantle is unmeasurable with standard tooling ([DEX 7863658](https://dune.com/queries/7863658)).

Builders cannot optimize what they cannot see. Until Fluxion is indexed and xStocks are priced, even Mantle cannot quote the liquidity of its flagship RWA product in dollars.

## Finding 6: the framework catches successes automatically

The research ships with an open-source tracker agent (Python, standard library only, so a student can run it without installing anything). Every day it pulls live holder data from the Routescan API with exact pagination, checks the falsifiable thresholds, cross-checks Dune against the live chain, writes a digest, and fires webhook alerts on crossings. It runs free on GitHub Actions, and its alert path is tested end to end.

On its first multi-token run (July 2, 2026, 11:40 UTC), it flagged: NVDAx top wallet 74.553%, below the 75% threshold, and 629 live holders, above 500. The first xStock on Mantle to become distributed, detected by criteria that were set before the answer was known ([agent digest, committed by CI](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/blob/main/agent/reports/2026-07-02.md)).

That is what "distribution becomes a KPI" looks like in practice: thresholds pre-registered, crossings detected automatically, receipts on-chain.

## What Mantle should do next

Each recommendation comes with its why and its evidence.

![Figure 7: four playbook cards, each recommendation paired with the on-chain number that backs it.](track1-assets/fig-playbook.png)
*Figure 7. The playbook: four moves, each backed by a number measured on-chain in this study.*

**1. Make the CEX gateway always-on instead of launch-day.**
Why: the only funnel that has ever produced RWA holders at scale on Mantle is CEX withdrawal to chain, and it only ran while the launch moment lasted. On current evidence each active gateway week is worth roughly 200 to 350 sticky holders.
Evidence: 88% of all holders arrived April 13 to May 10 ([7865851](https://dune.com/queries/7865851)); the deliveries came from Bybit's Mantle hot wallet ([7866312](https://dune.com/queries/7866312); [Bybit PoR](https://www.bybit.com/common-static/cht-static/por/Bybit_PoR_Audit_2026_Feb_26.pdf)); the window opens immediately after the April 10 announcement ([Bybit](https://announcements.bybit.com/en/article/bybit-now-supports-xstocks-deposits-and-withdrawals-on-mantle-bltd6af69aacd874633/)); growth since is one to eleven wallets per week.

**2. Rebalance incentives from liquidity toward first-holder acquisition.**
Why: the two experiments the ecosystem already ran point the same way. Gateway users cost no incentives and 98.3% still hold; the 100,000 MNT LP campaign bought churn, not holders. Budgets follow what gets measured.
Evidence: retention 802 of 816 ([7866325](https://dune.com/queries/7866325)); SPCXx churn profile ([7863657](https://dune.com/queries/7863657), [7863618](https://dune.com/queries/7863618)); flat holder growth through the campaign month ([7865851](https://dune.com/queries/7865851)).

**3. Fix the measurement stack.**
Why: Finding 5. The flagship venue is invisible to standard analytics and tokenized-equity liquidity cannot be quoted in USD.
Evidence: `dex.trades` coverage and NULL `amount_usd` ([7863658](https://dune.com/queries/7863658)).

**4. Adopt external float and holder count as the RWA KPIs, not TVL or supply.**
Why: supply is an issuer decision (SPCXx: one mint, one burn), so supply-side KPIs measure the issuer, not the market. Distribution metrics are falsifiable and cheap to monitor continuously, and they already caught the one genuine success in real time.
Evidence: [7863661](https://dune.com/queries/7863661), [7863645](https://dune.com/queries/7863645), and the agent digest above.

## What comes next: a falsifiable forecast

- **Distribution becomes the reported KPI.** After VM Crypta's single-token analysis and this ecosystem-wide one, holder count and external float start appearing next to TVL in ecosystem reporting. My dashboard already tracks the thresholds continuously.
- **The gateway becomes deliberate or the market stays flat.** If Mantle and Bybit run recurring gateway campaigns, expect step-changes like April's; if not, expect single-digit weekly growth to continue. Either way the trend query will show it.
- **The regulatory catalyst to watch is OJK.** Indonesian crypto supervision has consolidated under OJK, and tokenized foreign securities sit in a gray zone between capital-market and crypto-asset rules. A clear OJK position, even a sandbox, would be the single biggest unlock for compliant local distribution; until then, access runs through global exchanges, which is exactly why the Bybit rail matters.
- **Southeast Asia decides who wins the retail lane.** The forecast I have skin in, below.

## The next wave is standing outside the door

Here is what makes the 98.3% retention number strategic rather than trivia: the gateway model works, the users it delivers stay, and the gateway's biggest untapped market is one where Bybit already operates.

Indonesia has 26.7 million capital-market investors ([OJK, May 2026](https://www.bareksa.com/berita/saham/2026-05-20/ojk-sebut-jumlah-investor-pasar-modal-capai-267-juta-54-berusia-di-bawah-30-tahun)), about 54% of them under 30, with roughly 80% of new entrants under 30 ([KSEI and IDX data](https://databoks.katadata.co.id/pasar/statistik/69e049f4a9230/investor-muda-mendominasi-pasar-modal-indonesia-awal-2026)). It also has 21.7 million registered crypto users, now regulated under OJK itself ([OJK, April 2026](https://www.viva.co.id/gaya-hidup/digilife/1907455-investor-kripto-indonesia-tembus-217-juta-orang)). For millions of young Indonesians the crypto account came before the brokerage account, and the stocks they actually talk about are Nvidia, Tesla, and now SpaceX. What blocks them from US equities is everything tokenization removes: USD conversion, foreign-broker KYC, fees that dwarf a $20 position, and market hours that run 21:30 to 04:00 local time.

![Figure 8: proportional circles comparing 26.7M Indonesian capital-market investors and 21.7M crypto users with the 926 wallets holding xStocks on Mantle today.](track1-assets/fig-indonesia.png)
*Figure 8. The scale of the demand pool: Mantle's entire tokenized-stock holder base is a single small dot against Indonesia's investor population. Sources: OJK, KSEI; holders from Dune query 7865851.*

The pipe from "Indonesian student with a Bybit account" to "tokenized-stock holder on Mantle" already exists. I watched it move 816 people in four weeks without a word of Bahasa marketing behind it. A deliberate version, localized education, campus programs, IDR on-ramps through licensed exchanges, has no incumbent. Whoever runs it first takes the lane; the honest risks (tokenized equities are price exposure without shareholder rights, OJK's position on tokenized foreign securities is unresolved, small wallets bring breadth rather than depth) belong in the curriculum, not in the fine print.

Mantle built the supply side and proved, for four weeks in April, that the demand side shows up when someone opens the door. The distribution layer needs distributors. I am writing this from a campus where they meet every week.

---

## Reproduce everything

- **Live dashboard** (all findings as interactive panels, with a token selector for any xStock): https://dune.com/yeheskiel/mantle-rwa-distribution-tracker
- **Repository** (exact SQL for all 13 queries, the tracker agent, CI workflow, full findings with method notes and caveats): https://github.com/yeheskieltame/mantle-rwa-distribution-tracker
- **Findings document** (the long-form evidence version of this article): [FINDINGS.md](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/blob/main/FINDINGS.md)

All of it is open for the ecosystem to adopt: fork the queries for any token family on any chain Dune indexes, point the agent's webhook at an ecosystem alert channel, or lift the external-float metric and thresholds straight into official reporting. That is the point of publishing the tooling and not just the conclusions.

Claim-by-claim evidence:

| Claim in this article | Public source |
|---|---|
| 368 xStocks issued; 15 with 10+ holders; 1 distributed | Dune [7863671](https://dune.com/queries/7863671), [7863679](https://dune.com/queries/7863679) |
| 926 holders; 88% acquired Apr 13 to May 10; single digits since | Dune [7865851](https://dune.com/queries/7865851) |
| Entry mechanism = third-party direct transfers (CEX withdrawals) | Dune [7866292](https://dune.com/queries/7866292) |
| Bybit hot wallet delivered to 462 of 816 cohort wallets | Dune [7866312](https://dune.com/queries/7866312), [Bybit PoR](https://www.bybit.com/common-static/cht-static/por/Bybit_PoR_Audit_2026_Feb_26.pdf) |
| Integration announced April 10, 2026 | [Bybit](https://announcements.bybit.com/en/article/bybit-now-supports-xstocks-deposits-and-withdrawals-on-mantle-bltd6af69aacd874633/), [The Block](https://www.theblock.co/post/378030/bybit-backed-xstocks-tokenized-nvidia-mstr-mantle) |
| 98.3% cohort retention (802 of 816) | Dune [7866325](https://dune.com/queries/7866325) |
| Holder origin split (45.6% arrived with first xStock, median age 459 days) | Dune [7865842](https://dune.com/queries/7865842) |
| SPCXx: 26 holders, 99.2% issuer, 0.8% float, one mint and one burn | Dune [7863618](https://dune.com/queries/7863618), [7863645](https://dune.com/queries/7863645), [7863661](https://dune.com/queries/7863661) |
| SPCXx activity is churn (5,686 transfers, max 19 receivers/day) | Dune [7863657](https://dune.com/queries/7863657) |
| Fluxion unindexed; xStock USD volume unmeasurable | Dune [7863658](https://dune.com/queries/7863658) |
| Project X, up to 100,000 MNT LP rewards | [Chainwire, Jun 12, 2026](https://chainwire.org/2026/06/12/mantle-and-xstocks-bring-tokenized-spacex-spcxx-to-fluxion-merchant-moe-as-historys-largest-ipo-goes-live/) |
| NVDAx threshold crossing detected automatically | [Agent digest via CI](https://github.com/yeheskieltame/mantle-rwa-distribution-tracker/blob/main/agent/reports/2026-07-02.md) |
| RWA TVL +27.4% QoQ to $247.5M | [Messari via Chainwire](https://chainwire.org/2026/06/09/mantle-posts-27-rwa-growth-in-q1-2026-reaching-247-5m-according-to-messari/) |
| Indonesia: 26.7M investors, 54% under 30; 21.7M crypto users | [OJK/Bareksa](https://www.bareksa.com/berita/saham/2026-05-20/ojk-sebut-jumlah-investor-pasar-modal-capai-267-juta-54-berusia-di-bawah-30-tahun), [KSEI/Databoks](https://databoks.katadata.co.id/pasar/statistik/69e049f4a9230/investor-muda-mendominasi-pasar-modal-indonesia-awal-2026), [OJK/Viva](https://www.viva.co.id/gaya-hidup/digilife/1907455-investor-kripto-indonesia-tembus-217-juta-orang) |

Prior art: VM Crypta's ["The 99.54% Problem"](https://paragraph.com/@vmcrypta/the-9954percent-problem-spcxx-and-the-distribution-gap-in-mantles-rwa-thesis) (June 16, 2026) documented SPCXx's concentration first; this study extends the question to the full 368-token ecosystem, attributes the demand that does exist, and measures its retention.

*Disclosure. I lead a university blockchain community in Indonesia and I build OwnaFarm, an RWA project on Mantle, so I have a stake in the ecosystem this piece analyzes. The research itself is independent work for the Mantle Research Challenge, and it is built to be checked rather than trusted: every number links to a public, re-runnable query, and the tracker agent that produced the monitoring results is open source. Nothing here is financial advice.*
