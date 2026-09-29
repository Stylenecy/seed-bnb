# The Lance Economy: Master Plan

> One economy across three projects on Celo mainnet. Think of it as a small
> republic: **Claudelance** is the labor city (work gets done), **BingoChain** is
> the entertainment city (games are played), and the **Lance Hub** is the central
> bank (issues the currency, holds the reserve, sets the rate). $LANCE is the
> money that flows between them.
>
> **Status (be honest):** this is operator dogfooding. Every wallet (poster,
> workers, players, keeper) is operator-controlled. We are *building and
> validating the machine*, not claiming organic adoption. Phase order: develop
> now (via Claudelance bounties), then wire the value loops, then open to
> outsiders.

> **Multichain:** live on Celo mainnet (addresses below); now expanding to BNB
> Chain (BSC), where the Hub pool asset is WBNB and Claudelance bounties can pay in
> USDT (18 decimals). BSC addresses are TODO until deployed; see `MIGRATION-BNB.md`.

## 1. The three cities

| City | Contract (Celo mainnet) | Role | Money |
|------|------------------------|------|-------|
| **Lance Hub** (central bank) | `0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2` | Issues $LANCE, holds the CELO Redemption Pool, sets NAV, charges redeem fee | mints/burns $LANCE; holds CELO |
| **Claudelance** (labor) | `0x68c83D75Ee95860E83A893Aa13556AdE8411e3c8` | AI-agent task marketplace; bounties paid for real work | pays bounties in cUSD or **$LANCE** |
| **BingoChain** (play) | `0x8bE7c07CCF9FF515d82D4c36aB4EB937941432f1` | Commit-reveal PvP bingo; stake to play, winner takes the pot | stake/settle in CELO or **$LANCE** |

$LANCE: cheap CELO-backed credit. **1 CELO = 1000 $LANCE** (NAV starts 0.001 CELO,
about $0.0003). NAV = pool / supply, only rises. Redeem fee 1% stays in the pool.
Owner = operator Safe (threshold 2).

## 2. The citizen's journey (the loops)

```
            ┌──────────────────────── BUY (mint) ───────────────────────┐
            │  deposit CELO → Lance Hub → mint $LANCE at NAV             │
            ▼                                                            │
        [ $LANCE in wallet ]                                            │
         │            │                                                  │
   PLAY  │            │  WORK / PLAY-TO-EARN                             │
         ▼            ▼                                                  │
  BingoChain      Claudelance bounty:                                   │
  stake $LANCE    "play N games, submit tx proof" → reward $LANCE       │
  win the pot     (or normal dev/work bounty paid in $LANCE)            │
         │            │                                                  │
         └─────┬──────┘                                                  │
               ▼                                                         │
        [ more/less $LANCE ]                                            │
               │                                                         │
       REDEEM  │  $LANCE → Lance Hub → CELO (minus 1% fee) ─────────────┘
               ▼
            [ CELO out ]

  VALUE ENGINE (raises NAV for everyone holding $LANCE):
    game fees + Claudelance fees + redeem fees  →  fundPool(CELO) / burn $LANCE
    → pool grows or supply shrinks → NAV up → every $LANCE worth more CELO
```

### The key cross-city loop (the heart of the economy)
1. Operator posts a **Claudelance bounty**: *"Play 3 BingoChain games in $LANCE, submit the settle tx hashes as proof."*
2. A player **buys $LANCE** (deposit CELO at the Hub), or already holds some.
3. Player **plays BingoChain** games staking $LANCE; games settle on-chain.
4. Player **submits the bounty** with the tx proof (deliverable = the on-chain tx hashes).
5. Bounty resolves, player is **paid the reward in $LANCE**.
6. Player **redeems** $LANCE for CELO, or keeps it to play more.

Every step is real on-chain activity across all three contracts, so the economy
*runs*, not just exists.

## 3. The value engine (why $LANCE is worth holding)

NAV only moves UP. Three pumps, all fed by real activity:
- **Backing:** revenue routed in via `fundPool(CELO)` grows the pool, so NAV rises. Sources: BingoChain protocol fee (1%), Claudelance protocol fee (2%), any CELO revenue.
- **Redeem friction:** the 1% redeem fee stays in the pool, so exits subsidize stayers.
- **Burn (deferred):** $LANCE-denominated fees can be burned, shrinking supply and lifting NAV. Added later via a Safe upgrade (the Hub is UUPS and modular).

Guardrails (locked): never over-issue (every mint is backed at NAV),
sink >= faucet (Earn is revenue-backed; redeem fee and burn are sinks), pool
fully transparent on-chain.

## 4. Roadmap: develop now, monetize the loops next

**Phase A: Development (NOW).** Build the machine, wrap every piece as a
Claudelance dogfood bounty (real merged PRs):
- [x] Lance Hub deployed, cheap rate, whitelisted on both markets
- [x] 90-wallet pool, $LANCE airdropped, 90-player random-arena game run validated
- [ ] **Frontend: buy/redeem $LANCE in each app's Profile** (this milestone)
- [ ] BingoChain lobby plus $LANCE play UX polish
- [ ] Claudelance: post/claim bounties in $LANCE in the UI

**Phase B: Wire the value loops.**
- Route BingoChain and Claudelance protocol fees into `fundPool` (keeper or contract upgrade) so NAV starts rising from real fees
- Ship the **play-to-earn bounty template** (play games, submit tx proof, get $LANCE reward)
- Add the **burn lever** (Safe upgrade) for hybrid value accrual
- Earn flows (revenue-backed) for onboarding

**Phase C: Open the gates.**
- Invite external players and workers (stop being the only citizen)
- Only here does "adoption" become real; until then it stays labeled operator dogfood
- Dashboards: live NAV, pool reserve, supply, volume across all three cities

## 5. Honesty and accounting (non-negotiable)
- Every wallet is operator-controlled today, so this is **operator dogfooding**, never "organic adoption" in any submission or marketing copy.
- $LANCE is a closed-loop internal credit (no DEX/CEX listing), fully backed and transparent, not a public investment token.
- Proof-of-Ship metrics report the verifiable on-chain state, labeled as operator-run validation.

---
*Contracts: Lance Hub `0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2` | BingoChain `0x8bE7c07CCF9FF515d82D4c36aB4EB937941432f1` | Claudelance v3 `0x68c83D75Ee95860E83A893Aa13556AdE8411e3c8` | CELO `0x471EcE3750Da237f93B8E339c536989b8978a438` (pool asset).*
