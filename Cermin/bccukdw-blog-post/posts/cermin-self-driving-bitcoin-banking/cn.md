---
title: "Cermin：在 Mezo 黑客松上获得第一名的全自动比特币银行"
date: "2026-07-01"
author: "yeheskieltame"
authorName: "Yeheskiel Yunus Tame"
authorAvatar: "https://github.com/yeheskieltame.png"
category: "Blockchain"
tags: ["bitcoin", "mezo", "defi", "solidity", "hackathon"]
excerpt: "两个智能合约和一个确定性代理，如何让比特币持有者在不卖出一聪的情况下，自动借款、储蓄并防御自己的仓位。"
cover: "https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/cover.jpg"
readTime: 7
---

我刚刚发布了两个智能合约、一个确定性的 keeper 代理，以及一个建立在比特币之上的银行应用。Supernormal Foundation 和 Mezo 刚刚宣布，这个项目在他们的全球黑客松上获得了第一名，并获得 5,000 美元（约合 9000 万印尼盾）的奖金。

这是这次开发的记录：问题、解决方案、我最自豪的部分，以及我们刻意没有做的部分。

![Cermin 交付了什么：第一名、5,000 美元奖金、两个链上合约，以及一个无 LLM 的约 200 行 keeper](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/at-a-glance.png)
*在 Supernormal 与 Mezo 全球黑客松上获得第一名。两个合约，一个 keeper，没有 LLM。*

## 每个比特币持有者都逃不开的取舍

如果你持有比特币又需要现金，你只有两个不太好的选择。

卖掉它，你获得了流动性,但永远失去了上涨空间。继续持有，你保住了上涨空间,但手里没有任何可以花的钱。

![卖出则永远失去上涨空间，持有则资金被冻结，Cermin 改为以 BTC 作抵押借款，让你两者兼得](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/sell-or-hold.png)
*卖出，上涨空间就没了；持有，又没有可花的钱。Cermin 选择借款，让你两者兼得。*

Mezo 解决了问题的一半。它让你可以用 BTC 作抵押,以固定 1% 的年化利率借出 MUSD（一种由比特币背书的稳定币），而不需要卖出。这是一个真正的突破。但 Mezo 给你的只是一个原始的借贷工具,而不是一个完整的产品。要安全地使用它，你必须自己持续地做专业的资金管理工作：

时刻盯着抵押率，避免被清算。决定借多少、什么时候借。把借出来的钱放到能产生收益的地方，而不是让它闲置。一旦价格下跌，要尽快偿还债务。

大多数人不会这么做。他们要么干脆不借，要么在 BTC 第一次大跌的时候就被清算。

## Cermin：你的 BTC 保持完整，Shadow 才是你真正花的钱

Cermin 是 Mezo 仓位的自动驾驶系统。你只需要提供 BTC 和一个目标，剩下的资金管理工作由它自动、透明地在链上完成。

当你开启一个 vault 时，Cermin 会用你的 BTC 在 Mezo 上开一个 trove，并按照你设定的目标贷款价值比（LTV）借出 MUSD。这笔 MUSD 会被分成两部分：一部分是随时可以提取的可花费资金,另一部分进入年化约 5% 的储蓄仓位（sMUSD）。从那之后，两个自动化动作会一直运行，直到你关闭 vault、把完整的 BTC 取回为止。

我把你真正用来生活的那笔美元余额称为 **Shadow**。Shadow = 可花费的 MUSD ＋ sMUSD 储蓄的价值。你的 BTC 抵押品从未被卖出，哪怕一聪都没有。收益来自利率差（借款利率 1%，储蓄利率约 5%），再加上每次 BTC 上涨时 Cermin 捕获的新增借贷额度。

![Shadow 如何构成：BTC 作为抵押品被锁定，借出的 MUSD 拆分为可花费资金与 sMUSD 储蓄](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/the-shadow.png)
*你的 BTC 作为抵押品被锁定，从不卖出。借出的美元，也就是可花费部分加上 sMUSD 储蓄，正是你赖以生活的 Shadow。*

## 自动驾驶循环

两个无需许可的函数完成了所有工作。它们可以由用户本人、Cermin 的 keeper，或者任何关注链上数据的人调用。没有任何特权角色可以动用别人的资金。

**Skim（撇取）**：当 BTC 价格上涨超过设定阈值时，提取你不断上升的抵押品刚刚解锁的新借贷额度，并将其拆分为可花费资金和储蓄。你的 Shadow 增长了，而你什么都没有卖出。

**Defend（防御）**：当你的抵押率向危险区间下滑时，自动偿还债务，优先消耗储蓄仓位，其次才是可花费资金，把抵押率拉回安全区间。你的 BTC 始终待在原地。

![Cermin 的自动驾驶循环：上涨时撇取，下跌时防御](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/skim-defend-flow.png)
*BTC 上涨，skim 让 Shadow 增长；BTC 下跌，defend 保护仓位。无论哪种方向，BTC 本身都不会被动用。*

这两个函数都直接从 Mezo 的合约里读取实时的债务、抵押品和价格，所以你的 trove 始终是唯一的真相来源，不存在需要信任的链下状态。

## 策略是数字，不是代码

每个 vault 都携带一个结构体 `VaultParams`：目标 LTV、触发防御的 ICR、紧急 ICR 下限、触发撇取的价格变动幅度，以及可花费与储蓄的分配比例。五个 `uint16` 字段，打包进同一个存储槽。

合约里没有风险等级枚举，没有策略分支，也没有模式开关。行为上的差异完全来自这五个数字，在创建 vault 时由链上逻辑校验。前端提供三种预设，全部映射到同一个合约：

| 预设 | 目标 LTV | 防御 ICR | 紧急 ICR | 撇取阈值 | 可花费比例 |
|---|---|---|---|---|---|
| 保守型 | 40% | 170% | 140% | 8% | 30% |
| 平衡型 | 50% | 140% | 120% | 5% | 50% |
| 激进型 | 70% | 125% | 118% | 3% | 70% |

链上校验执行的是真实的边界条件，而不只是合理的默认值：紧急 ICR 必须不低于 115%，防御 ICR 必须严格高于紧急 ICR，并且防御阈值必须比开仓时的 ICR 至少低出 1000 个基点的缓冲。你无法配置出一个开仓那一刻就已经站在清算边缘的 vault。

## 只有两个合约，仅此而已

这是这次开发中我最坚持的一点。Mezo 已经审计并上线了 trove、稳定币、价格预言机和清算引擎。Cermin 的工作是编排，而不是重新发明轮子。所以整个链上表面只有两个合约。

`CerminFactory` 是一个单例合约。它为每个新用户克隆一份 `CerminVault` 的 EIP-1167 最小代理，因为 Mezo 按地址锁定一个 trove，我们需要让每个用户对应一个 vault。`CerminVault` 是具体实现，恰好持有一个 trove、一份可花费的 MUSD 余额，以及一份 sMUSD 仓位。仅限所有者的操作是 `deposit`、`withdrawSpendable` 和 `close`；无需许可的操作是 `skim` 和 `defend`；其余都是只读视图。

![Cermin 建立在 Mezo 原生协议之上的两合约架构](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/architecture.png)
*CerminFactory 为每个用户克隆一个 CerminVault。每个 vault 都直接与 Mezo 经过审计的 BorrowerOperations、TroveManager、PriceFeed 和 MUSD 合约交互。*

没有 Guardian 合约，没有 Treasury，没有 StrategyEngine 库，也没有可升级代理。每个实现合约都被刻意设计为不可升级。如果未来发布 v2，那将是一个新的工厂和新的实现合约，由用户自主选择是否迁移，而不是由某个管理员密钥在用户不知情的情况下悄悄改变合约的行为。除了 vault 的所有者，没有任何人能够提取资金。Cermin 团队从不托管任何用户资产。

## Keeper 代理没有自己的看法

链下部分是一个确定性的 TypeScript 服务，核心逻辑大约 200 行，运行在定时循环中。每个周期，它从 Mezo 的 PriceFeed 读取 BTC 价格，从工厂合约列出所有 vault，并对每一个执行完全相同的逻辑：如果 ICR 低于防御阈值，调用 `defend()`；否则，如果价格变动超过了撇取阈值，调用 `skim()`；否则，什么都不做。

这就是全部的决策树。没有大语言模型，没有多代理辩论，没有推理循环。我曾经考虑过给它包上一层更花哨的东西，但最终刻意决定不这么做：这个决策本质上就是 `if (icr < threshold) defend()`，给它包上模型调用只会增加成本、延迟和新的失败方式，却带不来任何额外的判断价值。用户真正想要的"为什么会发生这件事"的体验，用一段模板化的原因文案就足够覆盖，比如：

> BTC 跌到了 87,200 美元。ICR 跌到 132%，低于你设定的 140% 防御阈值。已从储蓄中偿还 850 MUSD。新的 ICR：148%。

读起来像是在推理，却没有额外成本，而且每次都是准确的，因为它不是生成出来的，而是直接用合约刚刚使用的同一组数字模板化出来的。

因为 `defend()` 和 `skim()` 都是公开函数，keeper 并不是拥有特殊权力的可信运营方，它只是一种便利。任何人，包括你自己，都可以调用它所调用的同一个函数。

## 哪些是真实的，哪些是模拟的，为什么

测试网上有一个合约是模拟的：储蓄金库。Mezo 还没有在 Matsnet 上部署它的生产级储蓄合约（`MUSDSavingsRate`），所以那里暂时没有可以存入 sMUSD 的地方。我构建了 `MockSavingsVault`，作为 Mezo 真实合约严格的行为镜像：同样的 1:1 存取款逻辑，同样的按比例分配的收益指数，同样的 `claimYield()` 接口。在测试网上，keeper 会按时间比例向其中注入少量 MUSD，用来模拟 Mezo 协议自身控制的资金本应产生的收益。

由于接口完全一致，迁移到主网只需要替换一行：把储蓄金库的地址作为构造函数参数，指向 Mezo 真实的 `MUSDSavingsRate`。`CerminVault` 里的其他任何地方都不需要改动。

除此之外，trove、借款、还款、价格预言机，以及稳定币本身，全部使用 Matsnet 上真实的、经过审计的 Mezo 基础设施。开仓、撇取、防御和关闭，全部在真实合约上端到端跑通过，而不是在本地分叉上。

## 目前的进展

两个合约已经部署在 Mezo Matsnet 上线运行。Keeper 作为一个常驻守护进程运行，确定性强，并加固了交易队列、gas 预检、按 vault 统计的连续失败计数器，以及一个健康检查端点。Next.js 仪表盘展示 BTC 抵押品、Shadow 余额和 ICR，活动信息流直接基于链上事件构建，不需要任何索引器。

接下来的里程碑是第三方安全审计，以及主网上线——届时被模拟的储蓄金库会被替换成真实的那一个。整个架构在设计之初就是为了让这次替换只需要改一个构造函数参数，而不是重写整个系统。

如果你想深入研究合约代码、keeper 逻辑或部署脚本，仓库是公开的。如果你是一个亲身体验过"卖还是不卖"这种取舍的比特币持有者，这正是这个项目想要消除的问题。

> **你的 BTC 保持完整，Shadow 才是你真正花的钱。**
