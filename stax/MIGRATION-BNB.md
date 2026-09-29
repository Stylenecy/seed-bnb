# Stax: Mantle to BNB Chain migration

Stax was built on Mantle (chainId 5000). It now targets **BNB Smart Chain**:
**BSC testnet (97) by default** and BSC mainnet (56) through `NEXT_PUBLIC_CHAIN_ID=56`.
Stax was already an EVM app, so the Solidity contracts did not change. Only the chain
wiring, token and DEX addresses, decimals and copy changed.

## What changed

### Contracts (`contracts/`)
- `hardhat.config.ts`: the `mantle`/`mantleSepolia` networks are replaced with `bscTestnet` (97) and `bsc` (56). Etherscan V2 custom chains now point at bscscan.com and testnet.bscscan.com. The EVM target is still `cancun`, which BSC supports since the Tycho hardfork.
- New `contracts/MockERC20.sol` is an 18-decimal, freely mintable "Mock USDC". It is for testnet only.
- `scripts/deploy.js` is now fully env-driven:
  - Stablecoin comes from `STABLE_ADDRESS`. On 56 it defaults to Binance-Peg USDC `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`. On 97 it deploys the MockERC20.
  - Router comes from `DEX_ROUTER`. It defaults to the PancakeSwap V3 SwapRouter `0x1b81D678ffb9C0263b24A97847620C99d213eB14`.
  - Assets come from `ASSET_TOKENS`.
  - The script prints a ready-to-paste `web/.env.local` block, including the deploy block.
- `scripts/deploy.ts` is removed. It duplicated the old Mantle version of deploy.js.
- `scripts/enable-assets.js` now reads `STAX_EXECUTOR`, `EXTRA_ROUTERS` and `EXTRA_ASSETS` from env. The hard-coded Mantle Agni and Merchant Moe addresses are gone.
- npm scripts: `deploy:testnet`, `deploy:bsc`, `enable:testnet`, `enable:bsc`.
- Solidity comments were rebranded. The contract logic is unchanged.

### Web (`web/`)
- `src/lib/mantle.ts` is renamed to **`src/lib/chain.ts`** and every import was updated. It exports:
  - `CHAIN_ID`, `IS_MAINNET`, `RPC_URL`, `EXPLORER_URL` and `CHAIN`, all BSC-based and built from `viem/chains` `bsc`/`bscTestnet`.
  - `USDC`, with its address, symbol and decimals taken from env. It is **18 decimals**.
  - `usdToRaw()` / `rawToUsd()` helpers.
  - `PANCAKE_V3_ROUTER`. `FLUXION_ROUTER` and `AGNI_ROUTER` are kept as aliases so the diff stays small.
- **Decimals fix:** every hard-coded 6-decimal conversion was replaced with `usdToRaw`/`rawToUsd`/`USDC.decimals`. The old code used `* 1_000_000`, `/ 1e6` and `pow10(6)` in these files:
  - invest-plan route
  - useSwap, useQuote, useInvest
  - prices
  - onchainHistory, executorLogs
  - autopilotExecutor
  - demoData
- **Asset registry:** the Mantle xStock, sUSDe, mETH, FBTC, USDY and mUSD addresses were removed because they do not exist on BSC. Per-asset addresses and pools now come from the JSON env var `NEXT_PUBLIC_ASSET_ADDRESSES`. An asset without an address is listed but not buyable, and the existing guards already handle that case. `ASSET_ROUTES` is now empty. The default fee tier is 2500, which is PancakeSwap V3's tier; Uniswap-style chains use 3000.
- `src/lib/abis.ts`: the V3 pool `slot0.feeProtocol` type is now `uint32` to match PancakeSwap V3.
- `src/lib/wagmi.ts`: exports `bnbChain`, which replaces `mantle`. Privy's `defaultChain`/`supportedChains`, the Pimlico AA client, and the server smart-account and autopilot clients all use BSC. Pimlico's default chain id is now 97.
- `src/lib/eip712.ts`: the EIP-712 domain `chainId` now comes from `CHAIN_ID` instead of the hard-coded 5000.
- Explorer links (`format.ts`) now point at bscscan.com or testnet.bscscan.com.
- Transaction history:
  - Etherscan V2 is queried with `chainid=56/97`.
  - The Alchemy fallback uses `bnb-mainnet` / `bnb-testnet`.
- Fallback contract addresses that pointed at the Mantle deployments are now the zero address, with TODO comments. The default deploy block is now 0.
- UI and copy: Mantle → BNB Chain and Mantlescan → BscScan. Network labels, the send/receive warnings ("USDC on BNB Smart Chain (BEP-20)") and the landing page were updated. The partner logo is now `public/brand/partners/bnb.svg` and `mantle.png` was removed. SEO, manifest, OG alt text, llms.txt, the agent card, the FAQ and the AI system prompt were updated too.
- `scripts/register-vera-8004.mjs` now targets BSC. The registry can be overridden with `ERC8004_IDENTITY_REGISTRY`, and the script aborts if there is no code at that address.
- `scripts/swap-mnt-usdc.mjs` is removed. It was a Mantle-only MNT→WMNT→Agni smoke test.
- `.env.example` has the BSC variables.
- The README was rebranded. The docs in `docs/` got a header note saying they describe the original Mantle build.

## Remaining TODOs
1. **Deploy** to BSC testnet: `cd contracts && cp .env.example .env`, then fill in `PRIVATE_KEY` and `AGENT_SIGNER_ADDRESS`, then run `npm run deploy:testnet`. Paste the printed block into `web/.env.local`.
2. **Tokenized-stock addresses on BSC.** Find the tokenized stocks available on BSC (for example xStocks/Backed, if listed) and their PancakeSwap V3 USDC pools. Then:
   - fill in `NEXT_PUBLIC_ASSET_ADDRESSES` in the web env
   - fill in `ASSET_TOKENS` / `EXTRA_ASSETS` in the contracts env
   - on testnet, deploy mock tokens and create pools, or the app shows everything as "not buyable"
3. **SAFE/CRYPTO routes.** Add validated PancakeSwap V3 `ASSET_ROUTES` in `web/src/lib/chain.ts`, for example USDC→ETH or USDC→BTCB. Consider renaming the `mETH`/`FBTC` symbols to BSC-native assets; `displayAssets.ts` and the `marketData.ts` CoinGecko ids depend on them.
4. **Pimlico.** Enable a sponsorship policy for chain 97/56 and fund it.
5. **Privy.** Allow BSC / BSC testnet in the Privy dashboard.
6. **Etherscan V2.** Confirm your API plan covers BSC chain ids. Without it, the wallet history falls back to Alchemy log scans.
7. Update `public/.well-known/agent-card.json`, which still has `TODO_AFTER_BSC_DEPLOY` placeholders, and re-register Vera with ERC-8004 on BSC. First check that the canonical ERC-8004 registry is deployed on BSC.
8. Check PancakeSwap V3 on BSC testnet: confirm the SwapRouter address and that pools exist.

## Verification done
- `contracts`: `npm ci` then `npx hardhat compile`. All 34 files compiled, including MockERC20.
- `web`: `npm ci --ignore-scripts` then `npx tsc --noEmit`. It passes with no errors.
- `eslint` shows 2 errors. Both are in `lib/haptics.ts`, which this migration did not touch, so they were there before.
- Nothing was deployed and no transactions were sent.
