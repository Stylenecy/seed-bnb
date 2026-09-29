# Stax: BNB Chain verification (2026-09-25)

**Verdict: works on a fork, for both BSC mainnet and BSC testnet.** The AI-invest buy flow (sign the plan, `approve`, then `StaxExecutor.investWithAI` swapping through PancakeSwap V3) was executed on-chain using Stax's real server and client code. On a **BSC mainnet fork** it went through the **real PancakeSwap V3 router and pools**. On a **BSC testnet fork** it used mock xStock assets and PancakeSwap V3 pools that I created. No real-network writes were made.

## Checks

| Check | Result | Notes |
|---|---|---|
| `hardhat compile` | PASS | All 34 files compile (0.8.24, viaIR, cancun). |
| `hardhat test` | SKIPPED | The project has no test files (0 passing). Coverage comes from the fork flows below. |
| Fork deploy, mainnet fork (56) | PASS | Ran `scripts/deploy.js --network bsc` with `BSC_RPC_URL`=fork. It deployed InferenceVerifier, IdentityRegistry (agentId 1) and StaxExecutor, whitelisted the PancakeSwap V3 router, and whitelisted BTCB, ETH and WBNB through `ASSET_TOKENS`. Stable defaults to Binance-Peg USDC. |
| Fork deploy, testnet fork (97) | PASS | Ran `scripts/deploy.js --network bscTestnet`. It auto-deployed MockERC20 USDC (18 dec) and the full stack. `scripts/enable-assets.js` then whitelisted the mock assets. |
| **Buy flow on mainnet fork (real PancakeSwap V3)** | PASS | The real `lib/legBuilder.buildLegs` (slot0 spot quote plus 1% minOut plus the sqrtPriceLimit guard), `lib/eip712.signRiskInference`, the `fees.netOf` fee split, and `useInvest`'s call encoding (fee transfer → approve → `investWithAI`) were run against the fork. Three legs (USDC→BTCB 0.05%, USDC→ETH 0.05%, USDC→WBNB 0.01%) bought **0.00039 BTCB, 0.0122 ETH and 0.0435 WBNB for $99.75**, every leg at or above minOut. Gas was 530k, and the 18-decimal math was correct. |
| **Buy flow on testnet fork (mock assets)** | PASS | I deployed mock tokens `AAPLx` and `TSLAx` (MockERC20), created PancakeSwap V3 pools at the 0.25% fee tier priced at $230 and $250, and added full-range liquidity. `investWithAI` for $500 bought 1.080 AAPLx and 0.994 TSLAx, each at or above minOut. An unsupported NVDA leg was skipped and the remaining weights re-normalized, which is the intended behavior. |
| Inference gate | PASS | `verify()` reverts on a forged signature (`ECDSAInvalidSignature`) and when risk is above maxRisk (`RiskCeilingBreached`). |
| Web `tsc --noEmit` | PASS | |
| Web `next build` | PASS (after fix 1) | 14 static and 13 dynamic routes. |
| Web run (`next start -p 3142`, testnet-fork env) | PASS | `/`, `/app`, `/demo`, `/offline`, `/robots.txt`, `/manifest.webmanifest`, `/.well-known/agent-card.json` and `/llms.txt` all return 200, with no Mantle or chain-mismatch strings. |
| Web APIs read fork state | PASS | `/api/prices` returns AAPL $230.50 and TSLA $250.50 from pool slot0. `/api/portfolio?address=` shows the purchased AAPLx/TSLAx holdings plus $500 cash. `/api/activity` lists the `investWithAI` tx from the executor logs. `/api/invest-plan` correctly returns 401 without a Privy session. |
| ERC-8004 registration script | PASS (after fix 2) | `scripts/register-vera-8004.mjs --go` on the testnet fork registered Vera in the canonical registry (agentId `97:2472` on the fork). |
| `eslint` | FAIL (pre-existing) | 20 errors, all React-compiler rules (`react-hooks/purity`, `refs`, `set-state-in-effect`) in UI components that the migration didn't touch (Charts, Surfaces, LiteApp, Toast, SiteLanding, haptics, useDragDismiss). They don't block the build. |
| Privy login, Pimlico AA sponsorship, Anthropic `/api/allocate`, Supabase autopilot, Etherscan/Alchemy history | SKIPPED | These need third-party credentials. The on-chain part of the invest flow was driven directly, without the Privy smart account. |

### Address checks (read-only, real RPCs)

| Address | Chain | Result |
|---|---|---|
| PancakeSwap V3 SwapRouter `0x1b81D678ffb9C0263b24A97847620C99d213eB14` | 56 and 97 | Has code. `factory()` is `0x0BFbCF9f…1865` on both. `WETH9()` is WBNB on 56 and `0xae13d989…a7cd` (tBNB) on 97. Its ABI is the `ISwapRouter` with `deadline`, which matches `FLUXION_ROUTER_ABI` in `abis.ts`. |
| PancakeSwap V3 Factory `0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865` | 56 and 97 | Has code. USDC pools with liquidity exist on 56: WBNB (100/500/2500), BTCB (100/500/2500/10000), ETH (500/2500), USDT (all tiers). |
| NonfungiblePositionManager | 56: `0x46A15B0b…4364`, **97: `0x427bF5b37357632377eCbEC9de3626C71A5396c1`** | The mainnet address holds a *different* contract on testnet (`mint` reverts there). Use `0x427b…` to seed testnet liquidity. |
| Binance-Peg USDC `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | 56 | Has code, `decimals=18`. |
| USDT `0x55d398326f99059fF775485246999027B3197955` | 56 | Has code, `decimals=18`. |
| Multicall3 `0xcA11bde05977b3631167028862bE2a173976CA11` | 56 and 97 | Has code. |
| ERC-8004 IdentityRegistry | 56: `0x8004A169…a432` has code ("AgentIdentity"). 97: `0x8004A818BFB912233c491871b3d84c89A494BD9e` has code ("AgentIdentity"). | The mainnet address has **no code on 97**, which is fixed below. |
| Default fee treasury `0xc6D7709dD8bA53832bd578A88260f8b8E59Fb4C7` (`lib/fees.ts`) | 56 | This is the old Mantle deployer EOA, and it currently has an EIP-7702 delegation on BSC. **Set `NEXT_PUBLIC_STAX_TREASURY` explicitly** to a wallet you control on BSC. |

## Bugs fixed

1. **`web/src/app/providers.tsx`: the no-Privy fallback crashed every page.** When `NEXT_PUBLIC_PRIVY_APP_ID` is unset in production, the fallback rendered children with no `QueryClientProvider`/`WagmiProvider`, so the build's prerender of `/` failed with "No QueryClient set". The fallback now keeps react-query and wagmi mounted, which is what its own comment says it should do. With this change, `next build` succeeds without Privy credentials.
2. **`web/scripts/register-vera-8004.mjs`: the default registry was mainnet-only.** The default chain is 97, but the default registry address `0x8004A169…` has no code on BSC testnet, so the script always aborted. It now picks `0x8004A818…BD9e` on 97 and `0x8004A169…a432` on 56. `ERC8004_IDENTITY_REGISTRY` still overrides both.

## Fork notes (not project bugs)

- Anvil's well-known test accounts carry EIP-7702 sweeper delegations on real BSC (mainnet and testnet). IdentityRegistry's `_safeMint` to such an account reverts, so on a fork run `anvil_setCode <acct> 0x` first. Real deploys should use a plain EOA as `PRIVATE_KEY` (it owns agentId 1).
- `bsc-rpc.publicnode.com` refuses non-recent state ("Archive requests require a personal token"), so a mainnet fork breaks after about a minute. `https://bsc-mainnet.public.blastapi.io` serves archive state and worked.
- The fork-only `web/.env.local` was deleted after the run. Its contents were: `NEXT_PUBLIC_CHAIN_ID=97`, the RPC set to the fork, the MockUSDC, executor, verifier and registry addresses from the testnet-fork deploy, and `NEXT_PUBLIC_ASSET_ADDRESSES={"AAPL":{"address":…,"pool":…,"feeTier":2500},"TSLA":{…}}`.

## Steps left for a real BSC testnet deploy

1. **Keys.** You need a plain-EOA deployer `PRIVATE_KEY` and an agent signer key. `AGENT_SIGNER_ADDRESS` goes in the contracts env, and `AGENT_SIGNER_PRIVATE_KEY` goes in the web server env.
2. **tBNB: about 0.2 tBNB to be safe.** The measured cost on the fork is about 5M gas for the stack deploy (MockUSDC, verifier, registry, executor, register, whitelist). Seeding each mock asset takes about 0.7M for the token, about 4.5M to create the V3 pool, and about 0.6M for the liquidity mint, so roughly 12M gas for two assets. Each invest is 0.4–0.53M. That totals about 17–20M gas, or around 0.02–0.1 tBNB depending on the testnet gas price.
3. Run `cd contracts && cp .env.example .env`, fill it in, then run `npm run deploy:testnet`. Paste the printed block into `web/.env.local`.
4. **Seed testnet assets**, since BSC testnet has no tokenized stocks. For each asset:
   1. Deploy a `MockERC20`.
   2. Call `createAndInitializePoolIfNecessary(token0, token1, 2500, sqrtPriceX96)` on NPM **`0x427bF5b37357632377eCbEC9de3626C71A5396c1`**.
   3. `mint` a full-range position (ticks ±887250, where tickSpacing is 50).
   4. Whitelist the asset with `STAX_EXECUTOR=… EXTRA_ASSETS=… npm run enable:testnet`.
   5. Add the asset to `NEXT_PUBLIC_ASSET_ADDRESSES` as `{"AAPL":{"address":…,"pool":…,"feeTier":2500}}`.
5. **Third-party services.** Enable the Privy app for BSC testnet, and fund a Pimlico sponsorship policy for chain 97. Set `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_STAX_TREASURY`, Supabase (autopilot) and `ETHERSCAN_API_KEY`/`ALCHEMY_API_KEY` (history).
6. **ERC-8004.** Run `node web/scripts/register-vera-8004.mjs --go` (it now defaults to the correct registry per chain), then fill the `TODO_AFTER_BSC_DEPLOY` placeholders in `public/.well-known/agent-card.json`.
7. **Mainnet.** Real pools already exist, so you can map assets to BSC-native tokens (BTCB/ETH/WBNB pools above) or to real tokenized stocks if any get listed. `ASSET_ROUTES` (the SAFE/CRYPTO multi-hop) is still empty.

## Real BSC Testnet deploy (2026-09-25)

Deployed to real BSC testnet (chain 97) with the project's own `npm run deploy:testnet` (`scripts/deploy.js`) and `scripts/enable-assets.js`, from the group deployer `0xE2D654a82893c5F97A40332D0f0ACb6Ad34318b5` (a plain EOA with no 7702 code). Full record: `contracts/deployments/bsc-testnet.json`. Public env block: `web/.env.bsc-testnet` (gitignored) and the filled-in `web/.env.example`.

### Wallets
| Role | Address | Notes |
|---|---|---|
| Deployer / executor owner | `0xE2D654a82893c5F97A40332D0f0ACb6Ad34318b5` | also owns Stax IdentityRegistry agentId 1 |
| Agent signer (EIP-712, `InferenceVerifier` trusted signer, ERC-8004 owner of Vera) | [`0x71a909625BA8B0c67BA16a9B620De41FB2488D95`](https://testnet.bscscan.com/address/0x71a909625BA8B0c67BA16a9B620De41FB2488D95) | new wallet, funded 0.002 tBNB for the ERC-8004 register tx |
| Fee treasury (`NEXT_PUBLIC_STAX_TREASURY`) | [`0xeAAedEae0d96f2155062c8B47832af87A5d4797A`](https://testnet.bscscan.com/address/0xeAAedEae0d96f2155062c8B47832af87A5d4797A) | new wallet; replaces the old Mantle `0xc6D7…b4C7` default |

Keys live outside the repo (`~/.seed-bnb-indo/`), never in project files.

### Contracts
| Contract | Address | Deploy tx |
|---|---|---|
| MockERC20 "Mock USDC" (18 dec) | [`0x83f2dd51…68bb`](https://testnet.bscscan.com/address/0x83f2dd5155dfe7d8eaa3d390c21fe89e2f1968bb) | [`0x420fd9ab…71ac`](https://testnet.bscscan.com/tx/0x420fd9ab048bc5dd20c1d5ac6077e9c91834fe93949ea29ade5e6e92699371ac) |
| InferenceVerifier | [`0x674031d2…96ec`](https://testnet.bscscan.com/address/0x674031d24b0b7874f1b9b278b98ebfebbdaa96ec) | [`0xedc9abfa…5c88`](https://testnet.bscscan.com/tx/0xedc9abfaec5fb8f9bedf8813ee1e81d0a4843bb0986fa8a434a4df970a1a5c88) |
| IdentityRegistry (Stax agentId 1) | [`0x5dd8fcb6…55ea`](https://testnet.bscscan.com/address/0x5dd8fcb6a206b9f24847fbbc925e642b836555ea) | [`0xb5f89789…d933`](https://testnet.bscscan.com/tx/0xb5f89789e2cbb28c8ccd83a64c237d65f5d79a129771059e8c2bef2802f0d933), register [`0x15103c12…d34c`](https://testnet.bscscan.com/tx/0x15103c12cec56c9869a451e177f60dfee51b0243ef447d8b72b0e5966c83d34c) |
| StaxExecutor (block 132984398) | [`0x8d684d9e…2bdf`](https://testnet.bscscan.com/address/0x8d684d9efcd779e69c29901292bd88266d5d2bdf) | [`0xbf054a35…2f29`](https://testnet.bscscan.com/tx/0xbf054a35c4752c836562699544c01e95f6de16fe2cf17b77f7d0d14e5e112f29), setRouter [`0xce4e1bda…e658`](https://testnet.bscscan.com/tx/0xce4e1bda20dd4aef532dc3e72b0d43e146c416ff194984b718dafd21edc5e658), setAssets [`0x4d09ad73…b964`](https://testnet.bscscan.com/tx/0x4d09ad73596757b451a0ff251f68521011df7ca0c09f359a6146ade87771b964) |
| Mock AAPLx | [`0xfc66023e…2258`](https://testnet.bscscan.com/address/0xfc66023ef47b05bfd192cda3619e4f34db882258) | [`0x88e85823…a836`](https://testnet.bscscan.com/tx/0x88e85823dac3cf02afacf96aebc4d66a76289e2efd76fca86dceb0eafec4a836) |
| Mock TSLAx | [`0x1affa0ee…0b9e`](https://testnet.bscscan.com/address/0x1affa0ee05549c777772a100cb32877dd1390b9e) | [`0x74c19bf4…dc7e`](https://testnet.bscscan.com/tx/0x74c19bf49bcf34580cefbf70270da92e9af8b6a27d9db3e4e34ce7d16b0bdc7e) |
| PancakeSwap V3 pool USDC/AAPLx 0.25% (init $230) | [`0x36497480…13b4`](https://testnet.bscscan.com/address/0x3649748053A842c65A0f0Fdb9F932f5A542b13b4) | create [`0x2c86d220…14bd`](https://testnet.bscscan.com/tx/0x2c86d220830bbeca1961b642f187bb925680504a9886be8fb9f6bf035ed714bd), LP [`0x91f106bc…11f2`](https://testnet.bscscan.com/tx/0x91f106bc9f8185b9c613055c9e5feb214c51570565febbf90f1cd708e20d11f2) (50 AAPLx + 11.5k mUSDC, full range) |
| PancakeSwap V3 pool TSLAx/USDC 0.25% (init $250) | [`0x77ebB0FA…a582`](https://testnet.bscscan.com/address/0x77ebB0FAFb1BE749C5055E9bB81EaD2210BFa582) | create [`0xe013d8f7…d2c7`](https://testnet.bscscan.com/tx/0xe013d8f7d1394f102dbf6f4e5529296cc8c39fcc8e4a1130a735b2928749d2c7), LP [`0xbe1f2790…87ff`](https://testnet.bscscan.com/tx/0xbe1f2790e2337b1bfe252444d1cd5aefddbfabac43a6f18e2e9ca1ec910387ff) (50 TSLAx + 12.5k mUSDC, full range) |

Pools were created through NPM `0x427bF5b37357632377eCbEC9de3626C71A5396c1` via factory `0x0BFbCF9f…1865`. BscScan source verification was **skipped** (no `ETHERSCAN_API_KEY` in env).

### ERC-8004
Vera registered in the canonical testnet IdentityRegistry `0x8004A818BFB912233c491871b3d84c89A494BD9e` with `node web/scripts/register-vera-8004.mjs --go` (dry run passed first; agent card at stax.best was live): **agentId `97:2473`**, tx [`0xe9b4271e…4957`](https://testnet.bscscan.com/tx/0xe9b4271eb5553cd8a0801769663afa198238265a59189ece9f1f347836794957), owner = agent signer, [8004scan](https://www.8004scan.io/agents/97/2473). `public/.well-known/agent-card.json` placeholders are now filled with the testnet addresses (`chain: bsc-testnet`, `chainId: 97`, plus `erc8004AgentId`). The live stax.best card still has the old placeholders until the site is redeployed.

### Smoke flow on real testnet
Driven by a temporary tsx script (deleted afterwards) that used the real `lib/legBuilder.buildLegs`, `lib/eip712.signRiskInference/buildPlanId/recHash`, `lib/fees.feeOf/netOf` and `STAX_EXECUTOR_ABI`, mirroring `useInvest` (fee transfer → approve → `investWithAI`). Allocation: AAPL 50 / TSLA 40 / NVDA 10, $20 gross.

| Step | Tx | Result |
|---|---|---|
| Fee 0.05 USDC → treasury | [`0xa9954c92…e530`](https://testnet.bscscan.com/tx/0xa9954c92a7188a2beb1d245c8e7fc86a96989f9704567bb4c0442b365e1be530) | success, treasury balance 0.05 |
| approve executor 19.95 | [`0x0698ed2e…c7a8`](https://testnet.bscscan.com/tx/0x0698ed2ea54fe3874d7b61a9592ec33e264932d452bb25a74bf71a789ea3c7a8) | success |
| `investWithAI` (2 legs via PancakeSwap V3 SwapRouter) | [`0x5c5b05d7…2d48`](https://testnet.bscscan.com/tx/0x5c5b05d7e67616839913505497bd1105f2ec551ff4a234ea32d9b3a187812d48) | success, 368k gas. Got 0.04803 AAPLx (minOut 0.04771) and 0.03535 TSLAx (minOut 0.03511). NVDA skipped and weights re-normalized, as designed. |
| Risk gate (eth_call, risk 9500 > max 7000, reused sig) | — | reverted, as expected |

### Web on real testnet
`next build` with `web/.env.bsc-testnet` succeeded. `next start -p 3142` returned 200 on `/`, `/app`, `/demo`, `/offline`, `/robots.txt`, `/manifest.webmanifest`, `/.well-known/agent-card.json` and `/llms.txt`. `/api/prices` read AAPL $230.44 and TSLA $250.35 from the live pools; `/api/portfolio?address=` showed the AAPLx/TSLAx holdings; `/api/activity?address=` listed the `investWithAI` tx from the executor logs; `/api/invest-plan` returned 401 without a Privy session. The server was stopped afterwards.

### Gas spent
About **0.00165 tBNB** in gas (deploy + 2 mock tokens + 2 pools + LP + whitelist + smoke + ERC-8004 register) at 0.1 gwei, plus 0.002 tBNB moved to the agent signer (0.00198 of it left).

### What's left
- BscScan source verification (needs `ETHERSCAN_API_KEY`).
- Privy app for chain 97, Pimlico sponsorship policy, `ANTHROPIC_API_KEY`, Supabase autopilot, Etherscan/Alchemy history keys: still need credentials; the gasless smart-account path wasn't exercised (the smoke used an EOA directly).
- Set `AGENT_SIGNER_PRIVATE_KEY` (the agent-signer key above) in the web server env of the hosted deploy; redeploy stax.best so the live agent card carries the new addresses.
- Mainnet deploy (`npm run deploy:bsc`) and `ASSET_ROUTES` are unchanged TODOs.
