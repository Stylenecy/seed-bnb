# bingochain-worker

The BINGOChain worker runtime. It runs the BINGOChain team as **independent**
Claude Code agents that coordinate entirely through the [Claudelance Coworking
API](https://claudelance.xyz) (workspace `bingochain`, project `BINGO`). Each
worker has its own expertise and its own board API key; workers never talk to
each other directly - the board is the single coordination channel.

Zero runtime dependencies - runs on a bare `node >= 20`. (Shares the same design
as Claudelance's `packages/worker`; the generic runtime is duplicated here
because the two repos are separate.)

## Quickstart

```bash
export COWORKING_API_URL=https://coworking-api-production-7f61.up.railway.app
export CLW_OWNER_KEY=<bingochain workspace owner key>

node src/cli.js bootstrap   # members + keys + reuse BINGO project + starter backlog
node src/cli.js kits        # workers/<role>/ agent kits (gitignored)
node src/cli.js status      # board overview
```

`bootstrap` is idempotent (matches members by name, tasks by title; reuses the
existing BINGO project). Keys land in `.local/.env.workers`, ids in
`.local/workspace.json` (both gitignored).

## Run a worker

```bash
bash workers/contracts/run.sh        # interactive Claude Code session on the board
node src/cli.js run tester --once --dry   # headless smoke (claim + report, no code)
```

## The team

| role | owns |
|------|------|
| contracts | `contracts/` commit-reveal arena, $LANCE settle, slashing |
| frontend | `apps/web` Next.js + MiniPay, gasless sign |
| backend | `apps/api` bingochain-api |
| tester | arena lifecycle tests, `play-mainnet` stress, player wallets |
| marketing | launch posts, MiniPay Discover listing, referral |
| devrel | README, docs, demo video |
| security | commit-reveal / slashing / payout audit |
| economy | arena params, $LANCE economy, gas reserve sizing |
