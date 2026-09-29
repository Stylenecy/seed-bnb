# Equinox Agent: Sui to BNB Chain migration

Equinox was a Sui Move package, a mock-data Next.js frontend and a backend that existed only as a spec (a README). It now targets **BNB Smart Chain**. The default network is BSC Testnet (chain 97), and mainnet (chain 56) is a config switch.

## What changed

### Contracts (`contracts/`): Move ported to Solidity (Foundry + OpenZeppelin 5.1)

| Move module | Solidity |
|---|---|
| `access`, `registry` | `src/EquinoxRegistry.sol`. The AdminCap, AgentCap and OracleCap capabilities became AccessControl roles. |
| `oracle` (Pyth) | `src/PriceOracle.sol`. Prices come from a keeper push or a Chainlink AggregatorV3 read. Everything is normalized to 8 decimals. Max age is in seconds, not milliseconds. |
| `vault`, `agent`, `defense`, `strategy` | `src/EquinoxVaults.sol`. Vaults are stored in one mapping. The Sui hot-potato ticket became an atomic `IStrategyAdapter` call with a `minReturn` check. The action log hash chain uses keccak256 instead of blake2b. |
| `native_pool` | `src/NativePool.sol`. It is both a venue adapter and the debt lender. `borrow` and `repayLoan` are operator-only (EquinoxVaults), replacing Move's `public(package)`. |
| `shadow` | `src/ShadowPool.sol` |
| `strategies/scallop`, `strategies/navi` | `src/adapters/VenusAdapter.sol`. It targets a Venus vToken passed in the constructor, so no addresses are hard-coded. |
| test coins | `src/mocks/MockERC20.sol` (18 decimals) |

Three behavior changes were made for safety in the EVM setting:

- `skimToReserve` and `defend` use an admin-registered lender per debt token (`setLender`). Callers can no longer pass any pool, which on EVM would let an attacker's contract pull the approved buffer.
- The Move test-only `increase_debt` is not exposed. Tests use a harness contract instead.
- `openVault` requires both assets to be registered and enabled.

Other contract changes:

- `script/Deploy.s.sol` does the deploy and bootstrap. On testnet it deploys tWBNB/tUSDT mocks, grants roles, registers assets and venues, and wires the operators.
- `foundry.toml` has the `bsc_testnet` and `bsc` RPC and Etherscan V2 entries. `.env.example` is new.
- The original Move package, its docs (`DEPLOYMENTS.md`, `INTEGRATIONS.md`, README) and the Sui agent skills (`.agents`, `skills-lock.json`) moved to `legacy/sui-move/`.
- Deleted the Sui toolchain Docker/Makefile and the vendored 190 MB `sui` binary and build output.

### Frontend (`frontend/`)

The frontend is still a mock-data UI with no wallet SDK, and it had no Sui SDK dependency before either. Changes are copy and mock data only:

| Before (Sui) | After (BNB Chain) |
|---|---|
| Sui, SUI | BNB Chain, BNB |
| stSUI | slisBNB |
| USDC debt | USDT debt |
| Suilend | Venus |
| Scallop | Lista |
| Cetus | PancakeSwap |
| Walrus | BNB Greenfield |
| Pyth | Chainlink |
| zkLogin | social login / wallet |
| Mysten SDK | viem / wagmi |
| Move | Solidity |
| "Sui Wallet", "Phantom" in the wallet list | "Binance Wallet", "Trust Wallet" |

- Mock amounts were rescaled so the USD values stay the same. The mock BNB price is $700: 5 BNB = $3,500, the liquidation price is $490, and the minimum deposit is 0.05 BNB.
- Identifiers were renamed to match, for example `SUI_PRICE` became `BNB_PRICE`, `formatSUI` became `formatBNB`, and `allocations.scallop/cetus` became `allocations.lista/pancake`.

### Docs

- `README.md` and `frontend/README.md` (the UX spec) were rebranded, and the root README links to the contracts and this file.
- `equinox-backend/README.md` was rewritten for EVM (viem, roles, Solidity function table, BSC env).
- `BLUEPRINT.md` has a mapping note at the top. The body is kept as the historical Sui design doc.

## TODO

1. **Deploy** to BSC Testnet (see below) and record the addresses in `contracts/README.md` and the backend `.env`. No deployment was made.
2. **Chainlink feeds.** Set `COLLATERAL_PRICE_FEED` and `DEBT_PRICE_FEED`. The addresses are not included. Get them from https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb-chain. Until then, use keeper `setPrice`.
3. **VenusAdapter** has not been tested against live Venus. Add a BSC fork test before registering a Venus venue. vToken addresses come from the Venus docs.
4. **Frontend wallet.** Wire `wagmi`/`viem` (`bsc`, `bscTestnet`) plus RainbowKit or injected connectors. Replace the mock data with contract reads.
5. **Frontend coin asset.** Replace `public/sui-crypto-coin.json`, a Lottie animation of the Sui coin, with a BNB coin animation.
6. **Backend.** It is still unimplemented. Follow `equinox-backend/README.md`.
7. **Audit** before any mainnet deployment.

## Deploy to BSC Testnet

```bash
cd contracts
cp .env.example .env        # set PRIVATE_KEY (fund it at https://www.bnbchain.org/en/testnet-faucet)
source .env
forge build && forge test
forge script script/Deploy.s.sol:Deploy --rpc-url bsc_testnet --broadcast
```

For mainnet, also set `COLLATERAL_TOKEN=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` (WBNB) and `DEBT_TOKEN=0x55d398326f99059fF775485246999027B3197955` (USDT, 18 decimals), then use `--rpc-url bsc`.

## Verification done

- `forge build`: OK. `forge test`: 14/14 pass. All 11 Move unit tests are ported with identical expected values, plus 3 new tests (Chainlink normalization, hash chain, agent-only guard).
- `forge script script/Deploy.s.sol` simulated on a local in-memory chain: all contracts deploy and bootstrap succeeds.
- Frontend `tsc --noEmit`: OK (after `npm ci`; `node_modules` was removed afterwards).
