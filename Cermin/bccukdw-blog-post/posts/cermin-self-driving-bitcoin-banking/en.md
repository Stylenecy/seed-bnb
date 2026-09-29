---
title: "Cermin: Self-Driving Bitcoin Banking That Won 1st Place at the Mezo Hackathon"
date: "2026-07-01"
author: "yeheskieltame"
authorName: "Yeheskiel Yunus Tame"
authorAvatar: "https://github.com/yeheskieltame.png"
category: "Blockchain"
tags: ["bitcoin", "mezo", "defi", "solidity", "hackathon"]
excerpt: "How two smart contracts and one deterministic agent let Bitcoin holders borrow, save, and defend their position automatically, without ever selling a single satoshi."
cover: "https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/cover.jpg"
---

I just shipped two smart contracts, one deterministic keeper, and a banking app on top of Bitcoin. The Supernormal Foundation and Mezo just told me it took 1st place at their global hackathon, with a $5,000 prize attached.

This is the build log. Problem, solution, the parts I'm proud of, and the parts we deliberately did not build.

![What Cermin shipped: first place, a $5,000 prize, two on-chain contracts, and a ~200-line keeper with no LLM](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/at-a-glance.png)
*First place at the Supernormal and Mezo global hackathon. Two contracts, one keeper, no LLM.*

## The trade-off every Bitcoin holder is stuck with

If you hold Bitcoin and need cash, you have two bad options.

Sell, and you get liquidity but you give up the upside forever. Hold, and you keep the upside but you have nothing to spend.

![Sell and the upside is gone. Hold and the wealth is frozen. Cermin borrows against the BTC instead, so you keep both](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/sell-or-hold.png)
*Sell and the upside is gone. Hold and you have nothing to spend. Cermin borrows instead, so you keep both.*

Mezo solves half of this. It lets you borrow MUSD, a Bitcoin-backed stablecoin, against your BTC at a fixed 1% APR, without selling. That's a real unlock. But Mezo hands you a raw lending primitive, not a product. To use it safely, you have to do professional treasury work yourself, continuously:

Watch your collateral ratio so you don't get liquidated. Decide how much to borrow and when. Put the borrowed dollars somewhere productive instead of letting them sit idle. Repay debt fast the moment price drops.

Most people will not do that. They will either avoid borrowing altogether, or they will get liquidated the first time BTC has a bad week.

## Cermin: your BTC stays whole, the Shadow is what you live on

Cermin is the autopilot for a Mezo position. You give it BTC and a goal. It runs the treasury work for you, automatically and transparently on-chain.

When you open a vault, Cermin opens a Mezo trove with your BTC and borrows MUSD up to your target loan-to-value. It splits that MUSD into a spendable bucket you can withdraw any time, and a savings position (sMUSD) earning roughly 5% APR. From there it runs two automated actions, forever, until you close the vault and take your full BTC back.

I call the dollar balance you actually live on the **Shadow**. Shadow = spendable MUSD + the value of your sMUSD savings. Your BTC collateral is never sold, not even a satoshi of it. Income comes from the interest-rate spread (you borrow at 1%, you save at roughly 5%) plus the new borrow capacity Cermin captures every time BTC goes up.

![How the Shadow is built: BTC stays locked as collateral while borrowed MUSD splits into spendable dollars and sMUSD savings](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/the-shadow.png)
*Your BTC is locked as collateral and never sold. The borrowed dollars, spendable plus sMUSD savings, are the Shadow you live on.*

## The autopilot loop

Two permissionless functions do all the work. Either of them can be called by the user, by Cermin's keeper, or by anyone else watching the chain. There's no privileged role that can move your funds.

**Skim**, when BTC appreciates past a threshold, draws the new borrow headroom your rising collateral just unlocked and splits it into spendable dollars and savings. Your Shadow grows. You didn't sell anything.

**Defend**, when your collateral ratio drops toward the danger zone, repays debt automatically, draining the savings position first and the spendable bucket second, to pull your ratio back to safety. Your BTC stays exactly where it was.

![The Cermin autopilot loop: skim on the way up, defend on the way down](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/skim-defend-flow.png)
*BTC goes up, skim grows the Shadow. BTC goes down, defend protects the position. Either way, the BTC itself never moves.*

Both functions read live debt, collateral, and price straight from Mezo's contracts, so your trove stays the single source of truth. No off-chain state to trust.

## Strategy as numbers, not code

Every vault carries one struct, `VaultParams`: target LTV, the ICR that triggers defense, an emergency ICR floor, the price move that triggers a skim, and the spendable-versus-savings split. Five `uint16` fields, packed into a single storage slot.

There's no risk-level enum, no strategy branch, no mode switch in the contract. Behavior diversity comes entirely from these five numbers, validated on-chain at vault creation. The frontend ships three presets that map to the same contract:

| Preset | Target LTV | Defend ICR | Emergency ICR | Skim threshold | Spendable share |
|---|---|---|---|---|---|
| Conservative | 40% | 170% | 140% | 8% | 30% |
| Balanced | 50% | 140% | 120% | 5% | 50% |
| Aggressive | 70% | 125% | 118% | 3% | 70% |

On-chain validation enforces real bounds, not just sane defaults: emergency ICR must sit at or above 115%, defend ICR strictly above that, and the defend threshold must carry at least a 1000 bps buffer below the ICR you opened at. You cannot configure a vault that's already standing at the edge of liquidation the moment it opens.

## Two contracts, nothing else

This is the part of the build I'm most stubborn about. Mezo already audited and shipped the trove, the stablecoin, the price feed, and the liquidation engine. Cermin's job is to orchestrate, not to reinvent. So the entire on-chain surface is two contracts.

`CerminFactory` is a singleton. It clones an EIP-1167 minimal proxy of `CerminVault` for every new user, because Mezo keys one trove per address and we need one vault per user to match. `CerminVault` is the implementation, holding exactly one trove, one spendable MUSD balance, and one sMUSD position. Owner-only actions are `deposit`, `withdrawSpendable`, and `close`. Permissionless actions are `skim` and `defend`. Everything else is a view.

![Cermin's two-contract architecture sitting on top of Mezo's native protocol](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/architecture.png)
*CerminFactory clones one CerminVault per user. Every vault talks directly to Mezo's audited BorrowerOperations, TroveManager, PriceFeed, and MUSD contracts.*

No Guardian contract, no Treasury, no StrategyEngine library, no upgradeable proxy. Each implementation is non-upgradeable on purpose. If we ship a v2, it's a new factory and a new implementation, and users opt in by choice, not by an admin key quietly changing what their contract does underneath them. No one but the vault owner can withdraw. The Cermin team never custodies a single asset.

## The keeper agent has no opinions

The off-chain piece is a deterministic TypeScript service, about 200 lines of core logic, running on a cron loop. Every cycle it reads BTC price from Mezo's PriceFeed, lists every vault from the factory, and for each one runs exactly this: if ICR is below the defend threshold, call `defend()`. Else if price has moved past the skim threshold, call `skim()`. Else, hold.

That's the entire decision tree. No LLM, no multi-agent debate, no reasoning loop. I considered wrapping this in something fancier and decided against it on purpose: the decision is `if (icr < threshold) defend()`, and dressing that up with model calls only adds cost, latency, and new ways to fail, for zero judgment value. The "why did this happen" experience users actually want is covered with a templated reason string instead, something like this:

> BTC dropped to $87,200. ICR fell to 132%, below your defend threshold of 140%. Repaid 850 MUSD from savings. New ICR: 148%.

It reads like reasoning, costs nothing extra, and it's accurate every single time, because it's not generated. It's templated from the same numbers the contract just used.

Because `defend()` and `skim()` are public, the keeper isn't a trusted operator with special powers. It's a convenience. Anyone, including you, can call the same function it does.

## What's real, what's mocked, and why

One contract on testnet is mocked: the savings vault. Mezo hasn't deployed its production savings contract (`MUSDSavingsRate`) on Matsnet yet, so there is nothing to deposit sMUSD into there. I built `MockSavingsVault` as a strict behavioral mirror of Mezo's real contract: same 1:1 deposit and withdraw, same pro-rata yield index, same `claimYield()` interface. On testnet the keeper streams a small, time-proportional MUSD trickle into it to simulate the yield Mezo's protocol-controlled value would otherwise produce.

Because the interface matches exactly, mainnet launch is a one-line swap, the savings vault address becomes a constructor argument pointed at Mezo's real `MUSDSavingsRate`. Nothing else in `CerminVault` changes.

Everything else, the trove, the borrowing, the repayment, the price feed, the stablecoin itself, is real, audited Mezo infrastructure on Matsnet. Open, skim, defend, and close have all been run end to end against live contracts, not a local fork.

## Where it stands

Two contracts live on Mezo Matsnet. A keeper runs as an always-on daemon, deterministic, hardened with a transaction queue, gas preflight checks, a consecutive-failure counter per vault, and a health endpoint. A Next.js dashboard reads BTC collateral, Shadow balance, and ICR, with an activity feed built straight off on-chain events, no indexer required.

The next milestones are a third-party security audit and a mainnet launch where the mocked savings vault gets swapped for the real one. Everything about the architecture was built so that swap costs us one constructor argument, not a rewrite.

If you want to dig into the contracts, the keeper logic, or the deploy scripts, the repository is public. And if you're a Bitcoin holder who has felt that sell-or-hold trade-off personally, that's exactly the problem this was built to remove.

> **Your BTC stays whole. The Shadow is what you live on.**
