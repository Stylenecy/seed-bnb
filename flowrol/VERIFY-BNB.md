# Flowroll: BNB Chain verification

Verified on 2026-09-25 against a local **anvil fork of BSC testnet** (chainId 97). No real-network writes were made. Fork deploys used anvil's public default accounts only.

**Verdict: WORKS on the fork, after one contract fix.** Before the fix, payroll funds got stuck at payday for any group set up with `addEmployee`, and for every recurring cycle after the first.

## Checks

| Check | Result | Notes |
| - | - | - |
| `forge install` (in place) | PASS | Installed `lib/forge-std` v1.15.0 and `lib/openzeppelin-contracts` v5.6.1, the versions pinned in `foundry.lock`, with `--no-git` because this copy is not a git repo. |
| `forge build` | PASS | |
| `forge test` | PASS | 265/265: the original 262 plus 3 new regression tests |
| Fork deploy (`script/Deploy.s.sol`, `NETWORK=testnet`) | PASS | All 12 contracts deployed. |
| `scripts/sh/wire.sh` + `seed.sh` | PASS | All 16 wiring txs and 8 seed txs succeeded. The `bc` 18-decimal math works. |
| Core flow with `cast` | PASS | Employer: `registerEmployer` → `createGroup` (600 s cycle) → `addEmployee` ×2 (5000 / 3000 USDC) → `depositPayroll`. Employee advance: `FlowrollCredit.requestSalary(1000)` paid 985 net (1.5% fee), with a debt of 1000. Zapper: 1 mWBNB → 10,000 USDC + 1 tBNB. |
| Rebalance agent `tsc --noEmit` | PASS | Clean, after `npm install` in `scripts/agent`. |
| Rebalance agent run (`npx ts-node index.ts`) | PASS | It found the employer through `eth_getLogs`, capped by `MAX_LOG_RANGE`. It deployed the idle funds (`Rebalanced`). After a time warp it ran `PaydayTriggered`: PayVault balances came to 4000 (5000 minus the 1000 advance, debt repaid, debt now 0) and 3000. The employee then `claim`ed 4000. **A second cycle** also disbursed (balance 3000 → 6000). `/health` returns ok. |
| FE `tsc --noEmit` + `next build --turbopack` | PASS | 14 routes |
| FE `next start` against the fork | PASS | `/`, `/select-page`, `/onboarding`, `/claim`, `/employee`, `/employee/credit-hub`, `/employer`, `/employer/my-groups`, `/employer/groups/1`, `/vault` all return 200 and say "BSC Testnet / BNB". No Initia strings (the grep hits were `initial-scale` / "initialize"). |
| FE API: `/api/faucet`, `/api/claim-usdc` | PASS | Both sent real txs on the fork (tBNB drip, then 2000 MockUSDC). `chainId: 56` is rejected with 400. |
| Address checks (read-only, BSC mainnet) | PASS | The mainnet tokens in the TODO are correct: USDC `0x8AC7…580d` has code, 18 decimals, symbol USDC. USDT `0x5539…7955` has code, 18 decimals, symbol USDT. The fork MockUSDC also has 18 decimals, matching the FE's `USDC_DECIMALS=18`. |

## Bugs fixed

1. **`src/PayrollManager.sol`: payroll disbursement could revert and lock the cycle's funds.** This bug predates the migration.
   - **Cause:** pending salary was only incremented in the batch `_addEmployees` path, which `setUpPayroll` and `addEmployees` use. At payday, `PayVault.credit()` calls `removeFromTotalPendingSalary`, which reverted with `PayrollManager__InsufficientPendingSalary`.
   - **Effect:** payday reverted for (a) any group whose employees were added with the single `addEmployee` call, and (b) **every cycle after the first** for any group, because pending was only ever added once.
   - **Reproduced on the fork:** the agent's `agentRebalance` failed with error `0xe025cb32`.
   - **Fix:** pending salary is now added per funded cycle in `_depositPayroll`, and released in `cancelCycle`. `removeFromTotalPendingSalary` saturates at 0 instead of reverting, so bookkeeping can never block payroll.
   - **Test:** the new `test/unit/payrollmanager/PayrollManagerPendingSalary.t.sol` has 3 tests. Two of them fail on the original contract and all 3 pass after the fix. Public ABIs are unchanged, so the FE and agent ABIs still match.
2. **`scripts/sh/*.sh`** now honour `ENV_FILE` (`source "${ENV_FILE:-$ROOT_DIR/.env}"`), so wire and seed can run against a `.env.fork` without touching `.env`.
3. **`lib/` submodules** are now populated with `forge install`, so `forge test` works in place.

## Notes

- **Fork gotcha:** anvil's default accounts carry EIP-7702 sweeper delegations on BSC testnet. Run `cast rpc anvil_setCode <acct> 0x` on a fork before sending them BNB.
- `/api/faucet` and `/api/claim-usdc` have no rate limit or per-address cooldown. Anyone can drain the faucet wallet by looping requests. Add a cooldown (for example, a KV/IP or address map) before exposing it publicly.
- `scripts/agent/node_modules` was removed after the check because the project is over 500 MB. Run `npm install` in `scripts/agent` before running the agent.

## Remaining steps for a real BSC testnet deploy

1. **Keys and funds.** The deployer needs about **0.05 tBNB** for gas: 12 contracts plus 24 wire/seed txs is about 20M gas, which is about 0.002 tBNB at the current 0.1 gwei. On top of that:
   - **4 tBNB** for the Zapper in `seed.sh` (`cast to-wei 4`). Lower it if the faucet is tight.
   - About 0.05 tBNB for the agent-operator wallet, for the `agentRebalance` gas it pays every tick.
   - About 0.5 tBNB for the faucet wallet, at 0.005 per drip.
2. From `flowroll-contract/`:
   ```bash
   cp .env.example .env   # NETWORK=testnet, TESTNET_PRIVATE_KEY, PK, DEPLOYER, AGENT_OPERATOR, FEE_RECIPIENT, RPC
   source .env && forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast
   ```
   Add `--verify --etherscan-api-key $BSCSCAN_API_KEY` if you have a key. Paste the printed addresses and `DEPLOYMENT_BLOCK` into `.env`, then run `./scripts/sh/wire.sh && ./scripts/sh/seed.sh`.
3. `scripts/agent/.env`: `PRIVATE_KEY` (must equal `AGENT_OPERATOR`), `YIELD_ROUTER_ADDRESS`, `DEPLOYMENT_BLOCK`, `BSC_RPC_URL`. Then `npm install && npm start`.
4. Frontend `.env.local`: all `NEXT_PUBLIC_*_ADDRESS`, `NEXT_PUBLIC_DEPLOYMENT_BLOCK`, and `FAUCET_PRIVATE_KEY`, which is server-only. The faucet wallet needs tBNB and MockUSDC (the deployer can `mint` to it).
5. Mainnet: replace `MockPool` / `MockUSDC` with real adapters (Venus / PancakeSwap) and real USDC or USDT, as listed in MIGRATION-BNB.md.

## Real BSC Testnet deploy (2026-09-25)

Deployed on **real BSC Testnet (chainId 97)** with `script/Deploy.s.sol` (NETWORK=testnet), then `wire.sh` + `seed.sh` using `ENV_FILE=.env.bsc-testnet`. RPC `https://bsc-testnet-rpc.publicnode.com`, gas 0.1 gwei. Deployment block **132984157**. Not verified on BscScan (no `ETHERSCAN_API_KEY`/`BSCSCAN_API_KEY` available). Broadcast record: `flowroll-contract/broadcast/Deploy.s.sol/97/run-latest.json`.

| Contract | Address |
|---|---|
| MockUSDC (18 dec) | [0x9Bff57e4becEDD645813600d24d44F069eCf2F34](https://testnet.bscscan.com/address/0x9Bff57e4becEDD645813600d24d44F069eCf2F34) |
| mWBNB (onboarding token) | [0xeaD52374a331A27be4e4e15B21d3212b5244DFAB](https://testnet.bscscan.com/address/0xeaD52374a331A27be4e4e15B21d3212b5244DFAB) |
| FlowrollZapper | [0x546af13359C5e71420Fc2622bc38a3b63C46cB5A](https://testnet.bscscan.com/address/0x546af13359C5e71420Fc2622bc38a3b63C46cB5A) |
| MockPool stable / volatile | [0xa997Aa98…771C](https://testnet.bscscan.com/address/0xa997Aa98205e0C9b58Fe49B36D9768370d11771C) / [0x21dB074D…7BCC](https://testnet.bscscan.com/address/0x21dB074D6586DE9677d98e0B9a05E24799fD7BCC) |
| MockPoolAdapter stable / volatile | [0xcf5581b8…E232](https://testnet.bscscan.com/address/0xcf5581b8562B395e973d8D0D38dfDd96a156E232) / [0x4F4BF25A…820F](https://testnet.bscscan.com/address/0x4F4BF25A13eB40920107937A05a46AFe69cD820F) |
| YieldRouter | [0xefE4d6A2bb6359EdB745460130164e4a21DF81d4](https://testnet.bscscan.com/address/0xefE4d6A2bb6359EdB745460130164e4a21DF81d4) |
| PayrollManager | [0xC41a28492C6B07f4f6c97193022A764047fd69D7](https://testnet.bscscan.com/address/0xC41a28492C6B07f4f6c97193022A764047fd69D7) |
| PayrollDispatcher | [0xbc0FA138002504D7cE99c19d159abd352801572B](https://testnet.bscscan.com/address/0xbc0FA138002504D7cE99c19d159abd352801572B) |
| PayVault | [0xDA21296afff7441F13dC123B684d55d150A5861F](https://testnet.bscscan.com/address/0xDA21296afff7441F13dC123B684d55d150A5861F) |
| FlowrollCredit | [0xA2180532601e7C5372DE556b66950A604Bb51bad](https://testnet.bscscan.com/address/0xA2180532601e7C5372DE556b66950A604Bb51bad) |

Roles: deployer/employer/fee recipient `0xE5ACd0f4c449B783f1DddB0C1C6932409b71D33a`; agent operator `0x83edC257CE75Da133C8fFD841544F9bb433d463b` (funded 0.01 tBNB); FE faucet wallet `0xA694bfe24a33CE14e71afd45cB3EfD2BB75346A5` (0.03 tBNB + 100k MockUSDC); test employee `0x7e13A02a488F48901e7D32Cb21D48bf43719D5C0`. Keys are held outside the repo.

**Change:** `scripts/sh/seed.sh` now reads `ZAPPER_SEED_BNB` (default 4). The testnet seed used **0.05 tBNB**.

### Live smoke flow (all receipts status 1)
| Step | Tx |
|---|---|
| wire.sh (16 txs) + seed.sh (8 txs, zapper seed 0.05 tBNB) | e.g. zapper funding [0x0157b500…](https://testnet.bscscan.com/tx/0x0157b500b08d60e7b32d50d3b8a942b201d2237a5f4fd5457d10a2c8b968301c) |
| `createGroup("Testnet Team", 300s)` | [0xd7a30b3b…](https://testnet.bscscan.com/tx/0xd7a30b3b17bd86062d55e145165d8797da5f5d0496f4dc3fe929748c49fae8f6) |
| `addEmployee` 5000 / 3000 USDC | [0x02c3234d…](https://testnet.bscscan.com/tx/0x02c3234d7917b02ffb84d0d04306dc9cdb14a60a04208f2ec3e707f8cf071303), [0x3ccabe5e…](https://testnet.bscscan.com/tx/0x3ccabe5e7b733f4c5763f9b0c026ba4e9902e15685a95eab8067e86b5b9141a0) |
| `depositPayroll(1)` (8000 USDC) | [0x18955d07…](https://testnet.bscscan.com/tx/0x18955d07cf0e24715c697397bdbf0f65f0cc104f2afffa9168d752fe638d2f4a) |
| Zapper `zap(0.01 mWBNB)` → 100 USDC + 0.01 tBNB | [0xf909754e…](https://testnet.bscscan.com/tx/0xf909754ef31276d2e68c4cb288e766458130dbaff542d1aaf1c72ea1b43a2cda) |
| Employee `requestSalary(1000)` → 985 net | [0xd9a528c8…](https://testnet.bscscan.com/tx/0xd9a528c88c054b1578efb49bf56cd3bb0cb63df8fab78526eb86ae4539433a48) |
| Agent `Rebalanced` (discovered employer via eth_getLogs) | [0x56d8b82a…](https://testnet.bscscan.com/tx/0x56d8b82ab92a97e7232123dc1602ba90606418331a1e31b96f556b058d3eb49b) |
| Agent `BufferAdjusted` ×4, `MovedToReserve` | e.g. [0x0d0b8a24…](https://testnet.bscscan.com/tx/0x0d0b8a246746edc6c9a4a6a4d5127612d36add1ca86001f243d725f94753438f) |
| Agent **`PaydayTriggered`** | [0x6038a7e3…](https://testnet.bscscan.com/tx/0x6038a7e3e200e884318d532aad633abb51d764323b41ead8e4afd993832301bb) |
| Employee `PayVault.claim(4000)` | [0xdccb85b2…](https://testnet.bscscan.com/tx/0xdccb85b226ac6ea046a338cc8b517df7c7e9ae58e5573f217802071a91f3258b) |
| FE `/api/faucet` (0.005 tBNB drip) / `/api/claim-usdc` (2000 USDC) | [0x952ba5ba…](https://testnet.bscscan.com/tx/0x952ba5ba391d1f8d29ae8c3fa5e8f8e27a21a7cfefa84c24fb94483e2e228862) / [0x2420e74b…](https://testnet.bscscan.com/tx/0x2420e74bda1a202be050ae51f2085d8fde030f9c9d78f3f881b4f1aa68836ceb) |

After payday, PayVault balances were **4000** (5000 minus the 1000 advance; debt repaid, `getEmployeeDebt` = 0) and **3000**. The employee claimed 4000 and ended with 6985 MockUSDC (985 advance + 2000 faucet + 4000 salary). The payday fix from the fork run holds on the live chain.

Agent: ran with `PRIVATE_KEY` passed via shell env (no `scripts/agent/.env` written), `HEALTH_PORT=3171`, `/health` returned ok. Stopped after payday. Note that it sends an `agentRebalance` tx on **every** tick, including `NoActionNeeded` (~157k gas), so it costs about 0.00002 tBNB per 30 s tick. 11 ticks cost 0.00021 tBNB.

Frontend: `next build --turbopack` with `.env.bsc-testnet` (addresses only; `FAUCET_PRIVATE_KEY` passed via shell env at `next start`). Served on :3170. All 10 routes returned 200 and show "BSC Testnet". The faucet routes sent real txs, and `chainId: 56` was rejected. Stopped.

### Gas / tBNB spent
- Deploy (12 contracts): 0.00172 tBNB. Wire + seed + smoke from the deployer: about 0.0004 tBNB.
- Agent gas: 0.00021 tBNB. Faucet and employee gas: under 0.0001.
- Value moved (not burned): zapper seed 0.05 (0.04 is left in the zapper after the test zap; recover it with `emergencyWithdraw`), agent 0.01, faucet 0.03, employee 0.003.
- **Total burned as gas: about 0.0025 tBNB.**

### What's left
- BscScan verification: needs an API key.
- The agent sends a tx on every tick even when nothing changes. Consider a `staticCall` pre-check to save gas.
- The faucet API has no rate limit (see Notes).
- Mainnet: MockPool/MockUSDC need real adapters (see MIGRATION-BNB.md).
