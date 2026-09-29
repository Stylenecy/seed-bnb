# LanceHub: BNB Chain verification

Date: 2026-09-25. Method: a local anvil fork of BSC testnet (chain 97) and anvil's public test accounts. Nothing was written to a real network. As instructed, the LANCE feature was verified only; no code was changed in this project.

**Verdict: works on the BSC fork. The Celo contracts and addresses are intact. One Celo regression in `scripts/airdrop-lance.mjs` is reported below and has not been fixed.**

| Check | Result | Notes |
|---|---|---|
| `forge build` | PASS | |
| `forge test` | PASS | 13/13 |
| Fork deploy (`script/DeployBsc.s.sol`) | PASS | Deployed the implementation and ERC-1967 proxy on the BSC testnet fork. The pool asset is the canonical testnet WBNB `0xae13…a7cd`, seeded with 0.01 WBNB for 10 LANCE. |
| Core flow | PASS | A second account wrapped BNB, ran `deposit(0.1 WBNB)` and received about 100 LANCE. `fundPool(0.05)` raised the NAV from 0.001 to 0.00145. `redeem(all)` paid 0.144 WBNB after the 1% fee. Non-owner `pause()` reverted with `OwnableUnauthorizedAccount`. |
| Real-network address checks | PASS | WBNB on mainnet `0xbb4C…095c` and on testnet `0xae13…a7cd` has code, symbol `WBNB` and 18 decimals. The Celo LanceHub proxy `0xb70c…5cA2` still has code on Celo and returns `symbol()` = `LANCE`. |
| Celo path intact | PASS, with one exception | `Deploy.s.sol` (Celo), `src/`, tests and `deployments/celo-mainnet.json` match the original. `foundry.toml` still has the `celo` endpoint. The exception is the airdrop script (next row). |
| `scripts/airdrop-lance.mjs` | FAIL, not fixed | See the bug below. `node --check` passes but does not catch it. |
| Backend / frontend | N/A | This project has none. The LANCE UI lives in Bingo-chain. |

## Bug found (not fixed, per the instruction not to change the LANCE feature)
`scripts/airdrop-lance.mjs` line 25:

```js
42220: { chain: NET.chain, ... }   // NET is declared after CHAINS
```

This throws `ReferenceError: Cannot access 'NET' before initialization` as soon as the module loads. **The script crashes on every chain, including the default Celo path**, so this is a regression from the migration: the original used `chain: celo`. The one-line fix is `chain: celo`. A secondary issue: the script reads the deployer key from `../Claudelance/contracts/.env` (`MAINNET_DEPLOYER_PRIVATE_KEY`), and that file does not exist in this copy.

A minor doc issue: the `notes` field in `contracts/deployments/bsc-testnet.json` says to run `script/Deploy.s.sol`. It should say `script/DeployBsc.s.sol`.

## Steps remaining for a real BSC testnet deploy
1. Fund a deployer with about 0.05 tBNB (from the faucet). Deploy gas is roughly 3M, well under 0.01 tBNB at 1 gwei. Wrap at least 0.01 tBNB into WBNB with `WBNB.deposit()`, which the seed needs.
2. In `contracts/.env`, set `DEPLOYER_PRIVATE_KEY`, `BSC_TESTNET_RPC` and `ETHERSCAN_API_KEY`. Optionally set `OWNER` (a Safe on mainnet) and `SEED_AMOUNT`.
3. Run `forge script script/DeployBsc.s.sol --rpc-url bsc_testnet --broadcast --verify`.
4. Record the proxy and implementation in `deployments/bsc-testnet.json` and in `airdrop-lance.mjs` `CHAINS[97].lance`.
5. Whitelist the BSC LANCE on the BSC BingoChain and Claudelance deployments with `allowToken`.

Note for OWNER: `seed()` is called by the deployer in the same script, so seeding works even when `OWNER` is not the deployer.

## Real BSC Testnet deploy (2026-09-25)

Deployed on the real BSC testnet (chain 97) with `script/DeployBsc.s.sol` (`--rpc-url bsc_testnet`, RPC `https://bsc-testnet-rpc.publicnode.com`, gas price 0.1 gwei). Deployer and owner: group wallet `0x3F46b654035aA92738FE4dC7dc9538Ca9bA07CEA`. `SEED_AMOUNT` was lowered to 0.002 WBNB (2 LANCE) to save budget. The contracts are **not verified** on BscScan, because no `ETHERSCAN_API_KEY` was available.

| Contract | Address |
|---|---|
| LanceHub proxy ($LANCE) | [`0x56a647A62C68BF7228Cb0b876a937a7331a41bf9`](https://testnet.bscscan.com/address/0x56a647A62C68BF7228Cb0b876a937a7331a41bf9) |
| LanceHub implementation | [`0x278d0FbaD0C63335aa05163edA7abd673F2f4a41`](https://testnet.bscscan.com/address/0x278d0FbaD0C63335aa05163edA7abd673F2f4a41) |
| Pool asset (WBNB, canonical) | [`0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd`](https://testnet.bscscan.com/address/0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd) |

Deploy block: 132984102.

Transactions:
- Wrap 0.004 tBNB into WBNB: [`0x69e417b6…`](https://testnet.bscscan.com/tx/0x69e417b60001f2dbf4d03c8140d10280b48af6859032ff97f46c60a1d9fb609f)
- Implementation: [`0xa25aacf7…`](https://testnet.bscscan.com/tx/0xa25aacf76fa30697937d636681de6d95b6b196d942e288cf73a226990c955828)
- Proxy and initialize: [`0x6d2b11b8…`](https://testnet.bscscan.com/tx/0x6d2b11b8486655b12fd751d329bba9b1d7ba377212853dfcdc2e6893cc560ff9)
- Seed approve: [`0x9e3aa7db…`](https://testnet.bscscan.com/tx/0x9e3aa7dba034d33848e03df2f0ad8dfb97239558960007a80a6f383e4b00ac8e)
- Seed: [`0x5849a06f…`](https://testnet.bscscan.com/tx/0x5849a06f7a8bab555bd219096ecb0cdffb8af4188a1cf1172f00f3668970a88f)

Smoke flow, run with cast; every receipt has status 1:

| Step | Tx | Result |
|---|---|---|
| `approve(hub, 0.002 WBNB)` | [`0x06620ff7…`](https://testnet.bscscan.com/tx/0x06620ff791ed79d29d988374ae5ea9b6b70b2e54f53aee7e2f6cf1d63ee6045e) | ok |
| `deposit(0.001 WBNB)` | [`0xb6871618…`](https://testnet.bscscan.com/tx/0xb687161828dd1930fdcfd72eed1fd19a062100958cefe09860c9de86d6ebb443) | Minted about 1 LANCE at a NAV of 0.001, so the balance went from 2 to 3 LANCE. |
| `fundPool(0.0005 WBNB)` | [`0x2ec209a3…`](https://testnet.bscscan.com/tx/0x2ec209a355c3b8d319e9ef3cb7351e993909c85f95799d32e6e6ff261300e776) | NAV went from 0.001 to 0.001167. |
| `redeem(0.5 LANCE)` | [`0x56acfed0…`](https://testnet.bscscan.com/tx/0x56acfed05ea5dda8808b3fc3932f31d5ea6e4f51f3016cad4e857d16ff05425e) | Paid 0.0005775 WBNB, which is 0.5 × 0.001167 less the 1% fee. |

Gas spent: about 0.00029 tBNB. In addition, 0.004 tBNB was wrapped. About 0.0029 WBNB of it sits in the pool, backing the deployer's 2.5 LANCE, and 0.00108 WBNB is left in the wallet.

**Works live:** deploy, initialize, seed, deposit, fundPool (NAV increase), and redeem with the 1% fee.

**Also updated:** `contracts/deployments/bsc-testnet.json` (addresses, deploy block, tx hashes), `scripts/airdrop-lance.mjs` `CHAINS[97]` (LANCE address and the publicnode RPC; Celo entry untouched), and the README BNB table.

**Left to do:** BscScan verification (needs an API key), a Safe owner for any production use, and the BSC mainnet deploy. This project has no frontend.
