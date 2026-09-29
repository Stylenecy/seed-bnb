# Equinox: BNB Chain verification

Run date: 2026-09-25. Local forks only; no real-network writes. Accounts were anvil's public test accounts.

Verdict: **WORKS on fork** for the contracts. The frontend builds and serves, but it is still mock-only. The backend does not exist yet (spec only).

## Checks

| Check | Result | Notes |
|---|---|---|
| `forge build` | PASS | solc 0.8.24 |
| `forge test` (unit) | PASS | 15/15. This is the original 14 plus a new test for the withdraw solvency guard. |
| Deploy script on a BSC Testnet fork (chain 97) | PASS | `script/Deploy.s.sol` deploys the tWBNB/tUSDT mocks, Registry, Oracle, Vaults, 2 NativePools and ShadowPool, then bootstraps roles, assets and venues. All contracts have code. |
| Core flow on the testnet fork (cast) | PASS | The flow ran in this order: open vault, deposit 5 tWBNB, open agent, `enterStrategy` (native-wbnb, 2 tWBNB), then `skimToReserve`, which borrowed 1,400 tUSDT at HF 2.00. The price then crashed from $700 to $400 (HF 1.14). A permissionless `defend` restored HF to exactly 1.50 (minHf). Then `exitStrategy`, `recordAction` (hash chain), `withdraw` and `withdrawReserve`. An undercollateralizing withdraw reverts with `Undercollateralized`. |
| Deploy script on a BSC **mainnet** fork (chain 56, real WBNB/USDT + Chainlink) | PASS | `refreshFromChainlink` succeeded for both assets: BNB/USD $778.69 and USDT/USD $0.9996. |
| **VenusAdapter fork test (BSC mainnet)** | PASS | This is the new `test/VenusFork.t.sol`, 3/3 passing, run against a live RPC and against a local anvil mainnet fork. (1) The adapter used directly with vUSDT: mint, then about 1 day of accrual, then redeem. 1,000 USDT came back as 1,000.0137 USDT. `NotVaults` guard OK. (2) Full vault round trip through Venus vBTC: 1 BTCB collateral, 0.5 BTCB entered into Venus, 33,711 USDT skimmed at HF 2.0, exit, idle BTCB >= 1e18 (interest earned). (3) Chainlink BTC/USD and USDT/USD refresh. |
| Backend (`equinox-backend/`) | SKIPPED | Not implemented. The folder only has a README spec. |
| Frontend `tsc --noEmit` | PASS | |
| Frontend `next build` | PASS | |
| Frontend run (`next start -p 3110`) | PASS | `/`, `/dashboard`, `/onboarding`, `/withdraw`, `/settings` and `/manifesto` all return 200. There are no Sui/Suilend/Scallop/Cetus/Walrus strings in the HTML. There is no chain wiring (mock data), so no chain mismatch is possible. |
| Address checks (BSC mainnet, `cast code` + reads) | PASS | WBNB `0xbb4C…095c` has code. USDT `0x55d3…7955` has code, 18 dp. BTCB `0x7130…ad9c` has code. vUSDT `0xfD58…0255` has underlying = USDT. vBTC `0x882C…847B` has underlying = BTCB. vBNB `0xA07c…ea36` **has no `underlying()`**. Chainlink BNB/USD `0x0567…2aeE`, USDT/USD `0xB97A…4320` and BTC/USD `0x2649…5Ebf` all have code, the right `description()` and 8 dp. The RPCs in `.env.example` return chain ids 97 and 56. |

## Bugs fixed

1. **Collateral withdraw ignored open debt** (`EquinoxVaults.withdraw`). This was inherited from the Move original. The owner could withdraw all idle collateral while the vault still owed the NativePool, leaving the lender unbacked (bad debt). `withdraw` now checks the vault when `debt > 0`: the remaining collateral must still cover the debt at the asset's max LTV, priced with `WITHDRAW_MAX_PRICE_AGE = 1 hours`. Otherwise it reverts with `Undercollateralized()`. New test: `test_RevertWhen_withdraw_leaves_debt_unbacked`.
2. `.env.example`: replaced the Chainlink "TODO" with verified BSC mainnet feed addresses and added the Venus vToken addresses.
3. `VenusAdapter.sol`: replaced the "UNTESTED" note with the fork-test reference and the vBNB limitation.

## Findings / caveats

- **Venus plus WBNB collateral is not possible.** Venus's BNB market (vBNB) is native BNB with no `underlying()`, so `VenusAdapter` cannot target it. The default mainnet config uses WBNB collateral and therefore cannot use a Venus venue. Options: use BEP-20 collateral (BTCB, ETH, slisBNB via a Venus isolated pool, and so on), or write a vBNB adapter that unwraps WBNB and calls `mint{value:}`.
- The deploy script registers Venus nowhere. After a deploy, the admin must call `registry.registerVenue(...)` with `new VenusAdapter(vToken, vaults)`.
- Public BSC RPCs (publicnode, bnbchain dataseed) are not archive nodes. An anvil fork older than a few minutes starts failing with "Archive requests require a personal token". Run fork tests against a fresh fork, or use an archive RPC.
- `withdrawReserve` intentionally lets the owner take borrowed USDT out, because the debt stays backed by collateral. Liquidation of vaults is still not implemented (the same as in Move). Only `defend` from the buffer exists.

## Re-run

```bash
cd contracts
forge test                                                   # unit
BSC_FORK_URL=https://bsc-dataseed.bnbchain.org forge test --match-contract VenusForkTest -vv
anvil --fork-url https://bsc-testnet-rpc.publicnode.com --chain-id 97 --port 8610 &
PRIVATE_KEY=<anvil key 0> forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8610 --broadcast
```

## Remaining steps for a real BSC Testnet deploy

1. Fund a deployer key with about **0.02 tBNB**. The deploy uses about 11.5M gas: 0.0012 BNB at 0.1 gwei, or about 0.012 BNB at 1 gwei. Faucet: https://www.bnbchain.org/en/testnet-faucet
2. `cp contracts/.env.example contracts/.env` and set `PRIVATE_KEY`, plus `AGENT_ADDRESS` and `ORACLE_KEEPER_ADDRESS` if they differ from the deployer. Leave the token and feed variables empty on testnet (mocks and keeper prices).
3. `forge script script/Deploy.s.sol:Deploy --rpc-url bsc_testnet --broadcast` (add `--verify` with `ETHERSCAN_API_KEY`).
4. As keeper, call `PriceOracle.setPrice` for tWBNB and tUSDT. Mint tUSDT and `fundRewards` it into the debt NativePool so `skimToReserve` has liquidity.
5. Record the addresses in `contracts/README.md`. Build the backend agent (`equinox-backend/README.md`) and wire the frontend to wagmi/viem. Neither exists yet.
6. Mainnet: set WBNB/USDT plus the Chainlink feeds listed in `.env.example`, get an audit first, and see the Venus/WBNB caveat above.

## Real BSC Testnet deploy

Run date: 2026-09-25. Real BSC Testnet (chain 97), RPC `https://bsc-testnet-rpc.publicnode.com`, gas price 0.1 gwei (legacy). The deployer, admin, agent and oracle keeper are all the same group wallet `0xE85f64383Fd58ddC0b7eC64EF1557317B91Ac0B1`. Not verified on BscScan because no `ETHERSCAN_API_KEY` was available.

Command: `forge script script/Deploy.s.sol:Deploy --rpc-url bsc_testnet --broadcast --with-gas-price 100000000 --legacy --slow`. The broadcast is in `contracts/broadcast/Deploy.s.sol/97/run-latest.json`, and the addresses are in `contracts/deployments/bsc-testnet.json`, `equinox-backend/.env.bsc-testnet` and `frontend/.env.bsc-testnet`. The `.env.*` files are gitignored and hold addresses only.

### Addresses

| Contract | Address |
|---|---|
| EquinoxRegistry | [0x3295b8931F72D98D426334f8266aDC0a7c661537](https://testnet.bscscan.com/address/0x3295b8931F72D98D426334f8266aDC0a7c661537) |
| PriceOracle | [0xcC4041A339686d812aFB0d8697ce2EBeEaC5e95d](https://testnet.bscscan.com/address/0xcC4041A339686d812aFB0d8697ce2EBeEaC5e95d) |
| EquinoxVaults | [0x5735380DD9Fa22f2c6f5B5e34A6Cb0619CA90B32](https://testnet.bscscan.com/address/0x5735380DD9Fa22f2c6f5B5e34A6Cb0619CA90B32) |
| NativePool (debt lender) | [0xEbC610e820f6997bF8BC53C596B6fB00799E2d49](https://testnet.bscscan.com/address/0xEbC610e820f6997bF8BC53C596B6fB00799E2d49) |
| NativePool (collateral venue) | [0x647A40014401B65c23518D9d11772a0530d49549](https://testnet.bscscan.com/address/0x647A40014401B65c23518D9d11772a0530d49549) |
| ShadowPool | [0x3D8bC76c19257E5f56b21Bfcc08f01845c193C89](https://testnet.bscscan.com/address/0x3D8bC76c19257E5f56b21Bfcc08f01845c193C89) |
| tWBNB (mock) | [0xe3768ca9E91B43F9f96f1A5d37848e2568023923](https://testnet.bscscan.com/address/0xe3768ca9E91B43F9f96f1A5d37848e2568023923) |
| tUSDT (mock) | [0x3Ba7BFdFe0D3a5435665839e4F8F57Fd874Cb6d4](https://testnet.bscscan.com/address/0x3Ba7BFdFe0D3a5435665839e4F8F57Fd874Cb6d4) |

### Smoke flow (cast, all receipts status 1)

| Step | Tx |
|---|---|
| Keeper `setPrice` tWBNB = $700 | [0xe9bc3653…89e2](https://testnet.bscscan.com/tx/0xe9bc3653d861edb11aafcb76f88771c715e92a58ab0d98c7e1ec070ce99e89e2) |
| Keeper `setPrice` tUSDT = $1 | [0x41a0c4c9…c11f](https://testnet.bscscan.com/tx/0x41a0c4c9f0715d266b67ca4727b891fada9f825efe7345fb54f8a7046909c11f) |
| Mint 5 tWBNB | [0x688db7b8…65ca](https://testnet.bscscan.com/tx/0x688db7b8a34992566c217674cfe1fa840cb746077b306b7f1df274bf3cae65ca) |
| Mint 10,000 tUSDT | [0xc602efb0…e5e5](https://testnet.bscscan.com/tx/0xc602efb011be5f3d12927a140ea34b722a008d35d909f38f1b58d987ae2df5e5) |
| Approve tUSDT to the lender | [0xa69425ab…c722](https://testnet.bscscan.com/tx/0xa69425ab183d301aee690a802038d7204feccef241226550453f9026c88ec722) |
| `fundRewards` 10,000 tUSDT into the lender | [0x2be98c94…09d6](https://testnet.bscscan.com/tx/0x2be98c943f4ee204ad9403fb916bef9e1d8652aa075f903bc6a26494044709d6) |
| Approve tWBNB to the vaults | [0x232f0b0b…5c89](https://testnet.bscscan.com/tx/0x232f0b0b1fb6496d6f4a09a996ff9714867291eb3874131935943350bd015c89) |
| `openVault(tWBNB, tUSDT)`, vault 1 | [0x7752a7c0…00e5](https://testnet.bscscan.com/tx/0x7752a7c0f68e466b891e41e5cb2728eebb631944ecf0d439ce082ebf507400e5) |
| `deposit(1, 5 tWBNB)` | [0x12d11f27…b309](https://testnet.bscscan.com/tx/0x12d11f2719a1dee9229e346bea09336b50e8e0df0afa65055b078029a890b309) |
| `openAgent(1, mode 0, risk 1, targetLtv 40%, recycle 50%, minHf 1.5)` | [0x3fe39bae…da26](https://testnet.bscscan.com/tx/0x3fe39baef509f9220c7664e55fef20aa2d3cd17cae04d77df3e0ac7a2889da26) |
| Agent `skimToReserve(1)`: borrowed 1,400 tUSDT, HF 2.00 | [0xeaea3333…9eac](https://testnet.bscscan.com/tx/0xeaea3333480f38e0152c9251e465b86b11b1bdd3b5b363880878ab89cb859eac) |
| Agent `recordAction` (hash chain) | [0x4bec85f2…e03b](https://testnet.bscscan.com/tx/0x4bec85f211fbb225c51052f92b52089f1c530f6926ad4b4b7d33a32cb1e4e03b) |
| Price crash: tWBNB = $400, HF 1.14 | [0x5586676c…df85](https://testnet.bscscan.com/tx/0x5586676c58569140a3d45679c1e80595c5641357b60a48d0120f0d2b2543df85) |
| Permissionless `defend(1)`: HF restored to 1.50 | [0xe5edc92a…eaa4](https://testnet.bscscan.com/tx/0xe5edc92ad34b6eb18b210b6b8543e665d74fb5b507ea56c82f11b9e7896eeaa4) |

The live results match the fork run: vault 1 holds 5 tWBNB and 1,400 tUSDT of debt after the skim, `healthFactorPriced` is 20000 bps, then 11428 after the crash, then 15000 after `defend`.

### Gas

The deploy plus 14 smoke txs cost **0.000997 tBNB**. The group wallet went from 0.08 to 0.079003 tBNB. The deploy alone was about 11.56M gas, or 0.00116 tBNB estimated at 0.1 gwei.

### Frontend

`next build` with `frontend/.env.bsc-testnet` loaded passed. `next start -p 3112`: `/`, `/dashboard`, `/onboarding`, `/withdraw`, `/settings` and `/manifesto` all returned 200. The server was then stopped. The UI is still mock data, so it does not read the addresses yet.

### What works live

Deploy and bootstrap, the keeper oracle, the vault lifecycle, the agent skim (borrow into the reserve), the action hash chain, and the permissionless defense after a price crash.

### What's left

- BscScan source verification (needs `ETHERSCAN_API_KEY`).
- The backend agent (`equinox-backend/`) is still only a spec.
- The frontend is still mock data, with no wagmi/viem wiring.
- There is no live Venus venue on testnet. Vault 1 is left open with debt and a buffer, as a demo position.
