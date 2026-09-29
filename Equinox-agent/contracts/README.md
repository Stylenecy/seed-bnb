# Equinox contracts (BNB Smart Chain)

These are the Solidity contracts for Equinox Agent, built with Foundry and OpenZeppelin 5.1. They port the original Sui Move package, which is kept for reference in `../legacy/sui-move/`.

- Default network: BSC Testnet (chain 97).
- Mainnet (chain 56) is a config switch.

## Module map (Move to Solidity)

| Sui Move module | Solidity | Notes |
|---|---|---|
| `access` (AdminCap / AgentCap) | `EquinoxRegistry` (AccessControl) | The capabilities become roles: `DEFAULT_ADMIN_ROLE`, `AGENT_ROLE` and `ORACLE_ROLE`. Each role is revocable. |
| `registry` | `EquinoxRegistry` | Registers venues and assets. Assets are keyed by ERC-20 address instead of `TypeName`. Includes the pause switch. |
| `oracle` (Pyth) | `PriceOracle` | Prices can come from a keeper push (`setPrice`) or from a Chainlink `refreshFromChainlink` call, which anyone can make. All prices are USD with 8 decimals. Maximum age is in seconds. |
| `vault` + `strategy` + `agent` + `defense` | `EquinoxVaults` | Holds one mapping of vaults, each with collateral token `C` and debt token `Q`. Also covers agent state, the `recordAction` hash chain (keccak256), `skimToReserve` and `defend` (which anyone can call). |
| `strategy` hot-potato ticket | `IStrategyAdapter` | On Sui, a ticket forced the position to come back. Here the round-trip is one atomic call with a `minReturn` slippage check. |
| `native_pool` | `NativePool` | Equinox's own lending pool, one per token. It is both a venue adapter and the lender for the debt asset. Only the operator (EquinoxVaults) can call `borrow` and `repayLoan`. |
| `shadow` | `ShadowPool` | Per-user spendable balance. The agent credits it and the user withdraws. |
| `strategies/scallop`, `strategies/navi` | `adapters/VenusAdapter` | Venus vToken adapter (mint/redeem). The vToken address is a constructor argument. It has not been tested against live Venus. |
| test coins | `mocks/MockERC20` | 18 decimals by default, matching BSC stablecoins. |

Behavior matches the Move version. The Foundry tests port every Move unit test and use the same decimals (9 and 6), so the expected values are identical. For example, the defense case repays exactly `127_273`, leaving debt at `872_727`.

## Build and test

```bash
forge build
forge test -vv
```

## Deploy to BSC Testnet

```bash
cp .env.example .env   # fill in PRIVATE_KEY (and optionally AGENT_ADDRESS / ORACLE_KEEPER_ADDRESS)
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url bsc_testnet --broadcast
# verify (Etherscan V2 key works for BscScan):
forge verify-contract <ADDR> src/EquinoxVaults.sol:EquinoxVaults --chain 97 --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" <REGISTRY> <ORACLE>)
```

When `COLLATERAL_TOKEN` and `DEBT_TOKEN` are empty, the script deploys `tWBNB` and `tUSDT` mocks (18 decimals). It then:

- grants the agent and oracle roles
- registers both assets (60/80 and 90/95 LTV/liquidation thresholds)
- wires the lender and shadow operators
- registers the `native-usdt` and `native-wbnb` venues

### Post-deploy bootstrap (from the agent and keeper keys)

1. Push prices: `PriceOracle.setPrice(token, price8dp)`. If a Chainlink feed is configured, call `refreshFromChainlink(token, maxAgeSecs)` instead.
2. Fund the lender: approve the tokens, then call `NativePool.fundRewards(amount)` on the debt-token pool.
3. User flow: `openVault(C, Q)` → `deposit` → `openAgent` / `applyTemplate` → agent `skimToReserve`. Anyone can call `defend`.

## Deployed: BSC Testnet (chain 97)

Addresses are in `deployments/bsc-testnet.json` and the root `README.md` "Deployments" section (with BscScan links). EquinoxVaults: [0x5735380DD9Fa22f2c6f5B5e34A6Cb0619CA90B32](https://testnet.bscscan.com/address/0x5735380DD9Fa22f2c6f5B5e34A6Cb0619CA90B32).

## Mainnet (chain 56)

- Set `COLLATERAL_TOKEN=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` (WBNB).
- Set `DEBT_TOKEN=0x55d398326f99059fF775485246999027B3197955` (USDT, 18 decimals).
- Set the Chainlink BNB/USD and USDT/USD feed addresses. They are not included here, so look them up at https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb-chain.
- Get an audit first.
