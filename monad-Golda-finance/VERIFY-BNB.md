# VERIFY-BNB: Golda Finance

Verified 2026-09-25 against a local anvil fork of **BSC mainnet** (chain 56). Fork RPC: `https://bsc-mainnet.public.blastapi.io`. `bsc-rpc.publicnode.com` refuses archive reads, so it breaks anvil forks after a few minutes. Deployer and agent: anvil account #0. No real-network writes.

**Verdict: WORKS on the mainnet fork.** One bug fixed: the LI.FI selectors. One blocker for mainnet: there is no PAXG liquidity on BSC.

| Check | Result | Notes |
|---|---|---|
| `forge build` | PASS | |
| `forge test` | PASS | 24/24 |
| Fork deploy (`DeployGolda.s.sol --broadcast`) | PASS | `STABLE_TOKEN` = real BSC USDT, `PAXG_TOKEN` = real Binance-Peg PAXG. Vault code present. |
| Deposit (ERC-4626) | PASS | Impersonated a USDT whale and sent 10k USDT to acct #0. Deposited 5,000 USDT and got 5,000 gVAULT. `totalAssets` = 5,000e18. |
| Rebalance via real LI.FI Diamond | PASS | Took a real `li.quest/v1/quote` (USDT to WBNB, fromAddress = vault). It returned selector `0x5fd9ae2e`. `approveForRebalance`, then `executeRebalance`, succeeded on the fork: 1,000 USDT became 1.277 WBNB in the vault. |
| Redeem (pro-rata) | PASS | Redeemed 2,500 shares for 2,000 USDT. The vault held only 4,000 USDT after the swap. |
| TWAP on PancakeSwap V3 | PASS | Second vault with a stand-in "gold" = WBNB and pool = PCS V3 USDT/WBNB 0.01% (`0x172fcD41…f849`). `getTwapPrice()` = 778.97 USDT, which is a sane price. The `observe()` interface is compatible. |
| PAXG BEP-20 on BSC | PASS (exists) / WARN | `0x7950865a9140cB519342433146Ed5b40c6F210f7`: "PAX Gold", PAXG, 18 decimals. **totalSupply is only 50 PAXG.** |
| PancakeSwap V3 PAXG pool | **FAIL: none exists** | Checked PCS V3 factory `0x0BFb…1865` with USDT, USDC, WBNB and BUSD at fees 100/500/2500/10000. Also checked PCS V2 factory pairs and the Uniswap V3 BSC factory. No pool anywhere. |
| LI.FI Diamond `0x1231…EaE` | PASS | Has code on BSC. |
| USDT `0x55d3…7955` | PASS | 18 decimals. |
| Backend / frontend | SKIPPED | No FE or agent code in this repo; the README's `/FE` is absent. |

## Bugs fixed
- `Contracts/script/DeployGolda.s.sol`: the whitelisted LI.FI selectors `0x4630a0d8` (swapTokensGeneric) and `0xd6a4bc50` (standardizedCall) are **not registered** on the BSC LI.FI Diamond. `facetAddress()` returns 0 for both. With them, every rebalance would revert. On the fork, calling the old selector reverted with `RebalanceFailed`. The script now whitelists GenericSwapFacetV3 `0x4666fc80` (swapTokensSingleV3ERC20ToERC20) and `0x5fd9ae2e` (swapTokensMultipleV3ERC20ToERC20). Both are registered, and the live LI.FI API uses them.

## Design caveats (not changed)
- `totalAssets()` counts only the stable and PAXG. A rebalance into any other token, like the WBNB used in this test, is invisible to share pricing and stays stranded on withdraw. The agent must only swap stable to PAXG.
- On BSC today the PAXG leg cannot work. There is no DEX liquidity for LI.FI to route through, and no pool for the TWAP. Until a liquid PAXG pool exists, options are: use a different gold token that has BSC liquidity, or replace the TWAP with a Chainlink/Binance oracle feed.

## Steps remaining for a real BSC testnet deploy
1. `cd Contracts && cp .env.example .env`, then set `PRIVATE_KEY` and `BSCSCAN_API_KEY`. Leave `STABLE_TOKEN` and `PAXG_TOKEN` empty so the script deploys MockUSDT and MockPAXG.
2. Fund the deployer with about **0.05 tBNB**. The deploy is about 3.5M gas; at 1-3 gwei that costs ≤0.01 tBNB, and the rest is headroom for smoke txs.
3. `forge script script/DeployGolda.s.sol:DeployGolda --rpc-url bsc_testnet --private-key $PRIVATE_KEY --broadcast --verify`
4. LI.FI is not on BSC testnet, so rebalances cannot run there. Use mainnet for rebalances, or `setLifiDiamond` to a mock router.
5. Mainnet: blocked on a liquid PAXG pool (see above).

## Real BSC Testnet deploy (2026-09-25)

Deployed on **real BSC Testnet (chainId 97)** with `DeployGolda.s.sol`, using the mock path: `STABLE_TOKEN` and `PAXG_TOKEN` were empty, so the script deployed MockUSDT and MockPAXG. `PANCAKE_V3_POOL` was unset, and `LIFI_DIAMOND` was left at its default. RPC `https://bsc-testnet-rpc.publicnode.com`, gas 0.1 gwei. Not verified on BscScan (no API key available). Broadcast record: `Contracts/broadcast/DeployGolda.s.sol/97/run-latest.json`. Addresses-only env: `Contracts/.env.bsc-testnet`.

| Contract | Address |
|---|---|
| GoldaVault (gVAULT) | [0x8b91743bA458eb322DdAd7F75f265382581c95e0](https://testnet.bscscan.com/address/0x8b91743bA458eb322DdAd7F75f265382581c95e0) |
| MockUSDT | [0xeA200bD121a2AE2B149E0B46aDd2e3C620F1457A](https://testnet.bscscan.com/address/0xeA200bD121a2AE2B149E0B46aDd2e3C620F1457A) |
| MockPAXG | [0x2790a5B7c8fe75F346d6932edd4e491E0FdFce43](https://testnet.bscscan.com/address/0x2790a5B7c8fe75F346d6932edd4e491E0FdFce43) |

Deployer, owner and agent: `0xE5ACd0f4c449B783f1DddB0C1C6932409b71D33a`. The script ran 7 txs, including mints and both `setAllowedSelector` calls (`0x4666fc80`, `0x5fd9ae2e`). All succeeded. Deploy tx for the vault: [0xfda7146d…](https://testnet.bscscan.com/tx/0xfda7146d4e744082dab7725d1a1af694e64dcf6c918f5a15677485eb6717aecd).

### Live smoke (PASS)
| Step | Tx | Result |
|---|---|---|
| approve 1000 USDT | [0x5fea4b60…](https://testnet.bscscan.com/tx/0x5fea4b60bf281684d7b36b83f60dfff1f0db25b034e01cfa1067e4667b9c7597) | |
| `deposit(1000)` | [0x2978f8f4…](https://testnet.bscscan.com/tx/0x2978f8f4ae850a5a119d051b710fe46383347f98505863890bc461cef5d861d6) | 1000 gVAULT, `totalAssets` = 1000e18 |
| `redeem(400 shares)` | [0xca73731d…](https://testnet.bscscan.com/tx/0xca73731dd3272b4e9d93f2fff3fb4ff9530dadce777a82aec87cabfc8844df1a) | 400 USDT back; 600 shares and `totalAssets` = 600e18 remain |

**LI.FI rebalance: SKIPPED on testnet.** LI.FI does not support BSC testnet. A diamond with only core facets exists at `0x1231DEB6…EaE` on chain 97, but `facetAddress(0x4666fc80)` returns `0x0`, so the whitelisted GenericSwapFacetV3 selector is not registered there. The LI.FI quote API also does not serve chain 97. No PancakeSwap V3 pool is set, so PAXG is valued at 0 and `getTwapPrice` is unusable on testnet.

### Gas / tBNB spent
Deploy (7 txs): 0.000397 tBNB. Smoke (3 txs): about 0.000022 tBNB.

### What's left
BscScan verification, which needs a key. Rebalance testing needs mainnet or a mock LI.FI router set via `setLifiDiamond`. There is no FE or agent in this repo. The mainnet PAXG liquidity blocker is unchanged (see above).
