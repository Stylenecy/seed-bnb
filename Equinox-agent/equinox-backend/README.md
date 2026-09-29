# Equinox Backend

Equinox Backend is the off-chain agent for Equinox. It runs as an always-on keeper service on BNB Smart Chain. It watches prices, computes the health of each position, and sends transactions that defend and optimize positions.

The service holds the `AGENT_ROLE` (and optionally the `ORACLE_ROLE`) and is non-custodial. It can only call functions the contracts expose, and the contracts enforce every invariant.

Read this together with the Solidity contracts in `../contracts` (see `README.md` for the module map, and `../MIGRATION-BNB.md` for what changed from the Sui version).

> Status: this is a spec. The service is not implemented yet (same as before the migration).

## Trust model

There is no verifiable compute. Trust rests on two things:

- **The `AGENT_ROLE` gate.** The admin can revoke it on `EquinoxRegistry`.
- **An on-chain action hash chain.** `EquinoxVaults.recordAction` stores a keccak256 chain. The full decision record is stored off-chain in BNB Greenfield (or IPFS) and referenced by its hash. Every action the backend takes should be logged with `recordAction`.

The backend never holds user funds. It cannot withdraw to itself or change owners, and it cannot exceed the LTV or health-factor limits the contracts enforce.

```
      price feeds (Chainlink on BSC / keeper push)
                  |
                  v
   +-------------------------------+      reads state (JSON-RPC, viem)
   |        EQUINOX BACKEND        |<--------------------------+
   |  indexer, risk, executor      |                           |
   +-------------------------------+                           |
                  | signs txs with the AGENT_ROLE key          |
                  v                                            |
   BSC: EquinoxVaults / EquinoxRegistry / PriceOracle / NativePool
                  ^
                  | reads same state
              Frontend
```

## Core concepts

All ratios are in basis points (bps), where 10000 = 100%, the same as `EquinoxMath`.

- **Vault.** Each vault is identified by `vaultId` in `EquinoxVaults`. It holds collateral in `collateralToken` (for example WBNB). Its debt and reserve fund are in `debtToken` (for example USDT, which has 18 decimals on BSC). The oracle values both in USD, so a move in the BNB price changes the health factor.
- **Reserve fund.** This is `vault.buffer`, held in the debt token. `defend` repays from it and skim proceeds land in it. The owner can withdraw it as spendable balance with `withdrawReserve`.
- **Health factor (HF).** `collateralUsd * liqThresholdBps / debtUsd`. At `HF = 10000` the position is exactly at liquidation, and higher values are safer.
- **Liquidation line.** `registry.liqThresholdBps(collateralToken)`. A position must never reach it.
- **Defense line.** `agentState(vaultId).minHfBps`. This is the floor the agent defends, for example 11000 (1.1x).
- **Target LTV.** `agentState(vaultId).targetLtvBps`. This is the LTV the agent borrows up to.

## Price feed

Two paths feed `PriceOracle`:

1. **Chainlink (trustless, preferred).** Anyone can call `refreshFromChainlink(token, maxAgeSecs)`. It reads the AggregatorV3 feed stored in the registry for that asset and normalizes the price to 8 decimals.
2. **Keeper push (fallback).** The `ORACLE_ROLE` key calls `setPrice(token, price8dp)`. Use this for assets without a feed, or on testnet with mock tokens.

## The four tasks

1. **Monitor prices and health.**
   - Keep each asset price fresh.
   - Track the live HF of each vault with `healthFactorPriced(vaultId, maxAgeSecs)`.
   - Discover vaults from the `VaultCreated` event.
2. **Auto-repay near the defense line.** When the HF is within `WARN_BAND` of `minHfBps`, call `defend(vaultId, maxAgeSecs)`. Anyone can call it. Then call `recordAction(vaultId, 1, payloadHash)`.
3. **Auto-skim.** When the LTV drops below `targetLtv - SKIM_BAND`, call `skimToReserve(vaultId, maxAgeSecs)`. Then call `recordAction(vaultId, 2, payloadHash)`.
4. **Reserve management.** Keep `buffer` above `BUFFER_FLOOR` of debt.

## Contract interface

| Purpose | Function | Caller |
|---|---|---|
| Read HF | `EquinoxVaults.healthFactorPriced(vaultId, maxAgeSecs)` | anyone |
| Chainlink price update | `PriceOracle.refreshFromChainlink(token, maxAgeSecs)` | anyone |
| Keeper price push | `PriceOracle.setPrice(token, price8dp)` | ORACLE_ROLE |
| Auto-repay | `EquinoxVaults.defend(vaultId, maxAgeSecs)` | anyone |
| Skim / borrow | `EquinoxVaults.skimToReserve(vaultId, maxAgeSecs)` | AGENT_ROLE |
| Deploy to venue | `EquinoxVaults.enterStrategy(vaultId, venue, amount, minReturn)` | AGENT_ROLE |
| Exit venue | `EquinoxVaults.exitStrategy(vaultId, venue, minReturn)` | AGENT_ROLE |
| Log action | `EquinoxVaults.recordAction(vaultId, code, payloadHash)` | AGENT_ROLE |
| Pick venues / template | `setVenues`, `applyTemplate` | vault owner |
| Withdraw spendable | `withdrawReserve(vaultId, amount)` | vault owner |
| Read state | `vaults(id)`, `agentState(id)`, `collateralValue(id)`, `registry.asset(token)` | anyone |

The action code convention (`uint8`) is shared with the frontend:

| Code | Action |
|---|---|
| 1 | defend/repay |
| 2 | skim |
| 3 | enter strategy |
| 4 | exit strategy |
| 5 | rebalance |

## Architecture and stack

**Stack**

- TypeScript with `viem` (`bsc` / `bscTestnet` from `viem/chains`)
- node-cron as the scheduler
- Postgres or SQLite
- pino for logging

**Components**

- `indexer`: reads contract logs.
- `oracle`: Chainlink refresh or keeper push.
- `risk`: pure math that mirrors `EquinoxMath`.
- `executor`: builds transactions and handles nonces, gas, retries and idempotency.
- `scheduler`: runs the control loop.
- `audit`: writes the payload to Greenfield/IPFS and passes its hash to `recordAction`.

### Config (.env)

```
BSC_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545   # mainnet: https://bsc-dataseed.bnbchain.org
CHAIN_ID=97                                                    # mainnet: 56
EXPLORER_URL=https://testnet.bscscan.com                       # mainnet: https://bscscan.com
EQUINOX_REGISTRY=0x...        # from forge script output (TODO after deploy)
EQUINOX_VAULTS=0x...
PRICE_ORACLE=0x...
NATIVE_POOL_DEBT=0x...
COLLATERAL_TOKEN=0x...        # tWBNB mock on testnet; WBNB on mainnet
DEBT_TOKEN=0x...              # tUSDT mock on testnet; USDT (18 dec) on mainnet
AGENT_PRIVATE_KEY=            # holds AGENT_ROLE, keep secret (KMS / multisig recommended)
# tuning
TICK_INTERVAL_MS=15000
PRICE_MAX_AGE_SECS=60
WARN_BAND_BPS=1500
SKIM_BAND_BPS=1000
BUFFER_FLOOR_BPS=2000
```

## Control loop

```ts
for (const id of watchlist) {                 // every TICK_INTERVAL_MS
  const hf = await vaults.read.healthFactorPriced([id, MAX_AGE]);
  const st = await vaults.read.agentState([id]);
  if (hf <= BigInt(st.minHfBps + WARN_BAND_BPS)) {
    await vaults.write.defend([id, MAX_AGE]);
    await vaults.write.recordAction([id, 1, payloadHash]);
    continue;
  }
  if (ltv(id) <= st.targetLtvBps - SKIM_BAND_BPS) {
    await vaults.write.skimToReserve([id, MAX_AGE]);
    await vaults.write.recordAction([id, 2, payloadHash]);
  }
}
```

## Local dev

1. Deploy the contracts on BSC Testnet (see `../contracts/README.md`). You can also use `anvil` for a local chain.
2. Put the contract addresses in `.env`.
3. Run `pnpm install && pnpm dev`.

## Checklist

- [ ] Scaffold (TypeScript, viem, config, logger).
- [ ] Log indexer and persisted vault watchlist.
- [ ] Oracle refresh/push and `risk` math that mirrors `EquinoxMath`.
- [ ] Tasks 1 and 2: live HF per vault per tick and auto-defend, plus `recordAction`.
- [ ] Audit logger (Greenfield/IPFS payload, then hash, then `recordAction`).
- [ ] Tasks 3 and 4: skim and reserve management.
- [ ] Idempotency, retries, gas management and alerting.
- [ ] Integration test against BSC Testnet.
