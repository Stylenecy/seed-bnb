# Flowroll: The Payroll That Pays Itself

> **BNB Chain migration:** this BUIDL write-up describes the original Initia hackathon build. Flowroll now runs on **BNB Smart Chain**; Initia-specific features (`.init` usernames, Interwoven Bridge, Auto-Sign, InitiaDEX) were removed or replaced — see [`../MIGRATION-BNB.md`](../MIGRATION-BNB.md).

🔗 [Video Demo](https://youtu.be/nCA1GxCEMrs) &nbsp;|&nbsp; 💻 [GitHub](https://github.com/LanreAkintayo/flowroll)

---

## The Problem

Crypto payroll forces a brutal choice: let funds sit idle earning nothing, or take on risky complexity to put them to work.

Every payroll cycle, thousands or millions in employer capital waits in a wallet for payday and earns absolutely zero. The money is doing nothing.

Employees have it no better. They are locked into rigid payment cycles that offer zero flexibility. Accessing salary before payday is unnecessarily complex, growing earnings passively requires extra steps most people never take, and moving money to a preferred chain after disbursement is more friction than it should be.

The tools exist. The infrastructure exists. What has been missing is a protocol that ties it all together seamlessly.

That is Flowroll.

---

## What Is Flowroll?

Flowroll is an omnichain, yield-bearing payroll protocol built natively on Initia. It autonomously routes idle employer deposits into risk-adjusted USDC stable pools between deposit and payday, generating yield before a single salary is paid out.

**For employers**, payday stops being just an expense. It becomes a revenue event.

**For employees**, salary stops being an endpoint. It becomes a starting line.

---

## How It Works

### For Employers

1. Create a payroll group and add employees by their `.init` username or wallet address
2. Set salaries and a payday, then call `setupPayroll()` to fund the cycle
3. Flowroll's yield engine immediately gets to work on the idle capital
4. On payday, every employee is paid in full and on time
5. The yield generated during the cycle flows back to the employer

**No complexity. No disruption. Just capital that works while it waits.**

> Flowroll takes a flat protocol fee strictly from generated yield. The principal is never touched.

---

### For Employees

Flowroll treats employees as first-class participants, not just recipients:

- **FlowrollCredit**: Request a salary advance before payday with zero approvals or HR hurdles. The advance is automatically deducted from the final payday disbursement.
- **Auto-Save**: When salary lands in `PayVault`, employees can choose to deposit a portion back into a new yield cycle and earn on their own earnings.
- **Bridge Anywhere**: Employees are not stuck on the appchain. Claim salary and bridge it to any chain of choice directly from the Flowroll frontend via the Initia Bridge widget.

---

## Full Cycle Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          EMPLOYER SIDE                              │
│                                                                     │
│  1. Employer creates a payroll group                                │
│  2. Adds employees by .init username or wallet address,             │
│     sets salaries and a payday                                      │
│  3. Calls setupPayroll() → funds flow to YieldRouter                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          YIELD FARMING                              │
│                                                                     │
│  4. Agent runs continuously at a configured interval                │
│  5. Scores all registered pools (APY × Liquidity × Risk × IL)       │
│  6. Deploys idle capital to the highest-scoring pool via adapter    │
│  7. Rebalances if a significantly better pool appears               │
│  8. Buffer ladder ensures liquidity is always ready for payday      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                         FLOWROLLCREDIT                              │
│                                                                     │
│  9.  Employee calls requestAdvance(amount) to request salary early  │
│  10. Employee calls repayDebt() to repay before payday              │
│      (unpaid balance is deducted automatically on payday)           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                             PAYDAY                                  │
│                                                                     │
│  11. Agent detects timeLeft == 0                                    │
│  12. YieldRouter withdraws all funds from pools                     │
│  13. Sends funds to PayrollDispatcher                               │
│  14. Dispatcher takes protocol fee from yield only                  │
│  15. Returns remaining yield to employer                            │
│  16. Credits each employee's salary to PayVault                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          EMPLOYEE SIDE                              │
│                                                                     │
│  17. Employee calls PayVault.claim() to claim full balance, or      │
│      PayVault.claimAndSave(amount, savePct, duration) to save a     │
│      portion and earn yield on their own earnings                   │
│  18. Auto-Save portion → starts a new YieldRouter cycle             │
│  19. Remainder → employee wallet                                    │
│  20. Employee bridges to any preferred chain via Initia Bridge      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Engine Under the Hood

### 1. Smart Pool Scoring

Idle capital is never deployed blindly. Every registered pool is scored in real time across four dimensions before any deployment decision:

```
Score = APY × LiquidityFactor × RiskMultiplier × ILRiskFactor
```

| Factor | Role |
|---|---|
| **APY** | The pool's current yield in basis points |
| **LiquidityFactor** | Penalizes shallow pools that cannot absorb the full deposit |
| **RiskMultiplier** | Tightens automatically as payday approaches — HIGH / MED / LOW |
| **ILRiskFactor** | Discounts volatile pairs (0.7×) relative to stable pairs (1.0×) |

The protocol does not just chase the highest APY. It chases the highest *safe* APY given how close payday is.

---

### 2. The Dynamic Buffer Ladder

To guarantee every employee is paid on time without slippage or liquidity crunches, Flowroll runs a 6-tier buffer ladder alongside the scoring engine. As payday approaches, the protocol progressively forces more capital into liquid reserves:

| Cycle Remaining | Minimum Liquid Buffer |
|---|---|
| 70%+ | 5% of principal |
| 50%+ | 10% of principal |
| 30%+ | 15% of principal |
| 25%+ | 40% of principal |
| 10%+ | 80% of principal |
| Below 10% | 105% of principal (hard cap) |

By the final moments before payday, full liquidity is already guaranteed. Payday never fails.

---

### 3. The Autonomous Yield Agent

An off-chain agent runs continuously and calls `agentRebalance()` at configured intervals. It is stateless and event-driven: it discovers new employer cycles automatically by listening for `CycleStarted` events on-chain. Before broadcasting any transaction, it simulates the rebalance locally — if a cycle is dead or inactive, the revert is caught off-chain, saving gas.

All logic lives on-chain. The agent is purely an executor. The contract responds correctly whenever it is called.

---

### 4. The Adapter Pattern

`YieldRouter` never interacts with pools directly. Every pool has a deployed adapter implementing `IPoolAdapter`. Adding a new pool requires only writing an adapter and calling `addPool()` — zero changes to core routing logic. Switching from testnet mocks to live InitiaDEX pools on mainnet is a single adapter registration.

---

### 5. Atomic Settlement

Settlement on payday happens in a single atomic transaction:

- `YieldRouter` redeems all shares from pools
- Calculates exact yield generated
- Takes the protocol fee from yield only
- Credits every employee's salary to `PayVault` instantly

Zero principal risk. Zero settlement failure.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      PayrollManager                          │
│          Employer-facing entry point. Manages groups,        │
│          employees, salaries, and cycle lifecycle.           │
└──────────────────────┬───────────────────────────────────────┘
                       │ startCycle() / cancelCycle()
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                       YieldRouter                            │
│       Core yield engine. Manages buffer ladder, pool         │
│       scoring, rebalancing, and payday settlement.           │
└──────────┬──────────────────────────────┬────────────────────┘
           │ deposit() / withdraw()        │ disburse()
           ▼                              ▼
┌─────────────────────┐      ┌───────────────────────────────┐
│   IPoolAdapter      │      │      PayrollDispatcher        │
│   (per pool)        │      │  Splits funds, takes fee,     │
│                     │      │  credits employees.           │
│  MockPoolAdapter    │      └──────────────┬────────────────┘
│  (local dev)        │                     │ credit()
└────────┬────────────┘                     ▼
         │                     ┌────────────────────────────┐
         ▼                     │          PayVault          │
┌─────────────────────┐        │  Employee savings layer.   │
│      MockPool       │        │  claim() or claimAndSave() │
│   (ERC4626 vault)   │        │  into new YieldRouter      │
│   Local dev only    │        │  cycles on employee's      │
└─────────────────────┘        │  behalf.                   │
                               └────────────────────────────┘

┌──────────────────────┐   ┌──────────────────────────────────┐
│   FlowrollCredit     │   │        FlowrollZapper            │
│  Salary advances and │   │  Entry point for multi-step      │
│  debt repayment.     │   │  token routing and wrapping.     │
└──────────────────────┘   └──────────────────────────────────┘
```

---

## Built on Initia, Built *for* Initia

Flowroll did not just deploy on Initia. Its architecture was designed around what the Initia ecosystem uniquely offers..

### Auto-Sign (Session Keys)

Without session keys, every payroll action would demand a wallet signature. Flowroll uses Auto-Sign so employers sign once to authorize a session, and the protocol silently handles all batch payroll operations from that point. Employees benefit equally: claiming salary, activating Auto-Save, requesting advances, and repaying debt all happen without repeated wallet prompts. Flowroll feels like a Web2 payroll tool. It runs entirely on-chain.

### `.init` Username Resolution

Raw wallet addresses are a barrier for non-crypto-native HR workflows. Flowroll lets employers add employees by their `.init` handle instead of a 42-character hex address. Onboarding an employee into payroll looks identical to adding them in any traditional HR system.

### Interwoven Bridge

Employees receive salary in `PayVault` on Initia. When they claim, they can bridge their payout to any preferred chain directly from the Flowroll frontend via the Initia bridge widget. The protocol has no dependency on IBC channel IDs or chain-specific token denoms. Bridging lives at the frontend layer, giving employees full control with zero added contract complexity.

> Cross-chain bridging is fully designed at the frontend layer. It will be fully operational on a live Initia testnet or mainnet deployment where IBC channels are active.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity, deployed on Initia EVM module |
| Testing | Foundry |
| Frontend | Next.js 15, Initia InterwovenKit |
| Yield Agent | Custom Node.js daemon |
| DeFi Primitives | Two custom ERC4626 liquidity pools |
| Initia Integrations | Auto-Sign, `.init` resolution, Interwoven Bridge |

---


## What Comes Next

- Full cross-chain bridging shipping immediately once appchain is fully deployed
- Expanded yield strategies across more external protocols
- Custom risk profiles per employer and employee: conservative, balanced, or aggressive
- Native mobile experience for employees to manage salary on the go

---

> Payroll infrastructure has not been reimagined in decades. Flowroll is the start of that reimagination.

> Built for **INITIATE: Initia Hackathon Season 1**