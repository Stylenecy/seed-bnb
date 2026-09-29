# Zero Arena — BNB Chain migration

Zero Arena used to run on **0G mainnet (chainId 16661)**. Its contracts, SDK, backend and dashboard now target **BNB Smart Chain**:

| | BSC testnet (default) | BSC mainnet |
| - | - | - |
| chainId | 97 | 56 |
| RPC | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` | `https://bsc-dataseed.bnbchain.org` |
| Explorer | https://testnet.bscscan.com | https://bscscan.com |
| Gas token | tBNB ([faucet](https://www.bnbchain.org/en/testnet-faucet)) | BNB |

## Design decision: contracts on BSC, blobs still on 0G Storage

The five Solidity contracts (`AgentCertificate`, `ReencryptionOracle`, `ZeroArenaINFT`, `LiveCertificate`, `Season`) are plain EVM and needed **no logic changes**. Seasons pay prizes in the chain's native token, so they now pay in BNB.

Encrypted run logs, datasets and iNFT metadata are still stored on **0G Storage**, which is content-addressed and works with any chain. Only the storage *upload fee* is paid on 0G Chain. So the SDK now has a separate `storageRpc` / `ZA_STORAGE_RPC` (default `https://evmrpc.0g.ai`). The same private key signs on both chains, so the wallet needs BNB for contract txs and a little 0G for uploads. The on-chain `storageRootHash` values are unchanged.
TODO: add a BNB Greenfield `StorageAdapter` to remove the 0G dependency completely.

## What changed

**contracts/**
- `foundry.toml`: `rpc_endpoints` / `etherscan` now `bsc_testnet` + `bsc` (BscScan, `BSCSCAN_API_KEY`), replacing the 0G `mainnet` + `galileo` entries.
- `.env.example`: `BSC_TESTNET_RPC_URL`, `BSC_RPC_URL`, `BSCSCAN_API_KEY`.
- Deploy script docs (`script/*.s.sol`) use `$BSC_TESTNET_RPC_URL` / `$BSC_RPC_URL` and drop the 0G-specific `--legacy --with-gas-price`.
- The old 0G deployment records moved to `deployments/legacy-0g/` (along with the `.synced-addresses.json` lockfile).
- `scripts/build-abi.mjs`: network slugs are now `97 → bsc-testnet` and `56 → bsc`.
- `scripts/sync-addresses.mjs`: `CHAIN_ID` defaults to 97 (`ZA_CHAIN_ID=56` for mainnet) and it warns on leftover 0G RPC URLs.

**sdk/** (`zeroarena`)
- `ZeroArenaConfig.rpc` is now the BNB Chain RPC. There is a new optional `storageRpc`, and `makeStorageConfig` signs uploads against the 0G storage RPC instead of the contracts RPC.
- `configFromEnv`: `ZA_RPC` defaults to BSC testnet. New `ZA_STORAGE_RPC`.
- `npx zeroarena init` scaffolds a BSC testnet `.env` that includes `ZA_STORAGE_RPC`. Contract addresses are empty until deploy, or taken from `ZA_ADDR_*` in your shell. Explorer links point to BscScan.
- Copy and comments rebranded (CLI description, `package.json` description and keywords).

**zero-arena-bacend/**
- `ZA_RPC` default is BSC testnet in paper / onboard / season / transfer-oracle. `ZA_CHAIN_ID` default is **97**, and the oracle rejects requests for any other chain.
- `.env.*.example`: BSC endpoints, `ZA_CHAIN_ID`, and empty contract addresses (TODO). The transfer-oracle example now documents `ZA_RPC` / `ZA_CHAIN_ID`.
- `scripts/e2e-onboard-test.mjs` reads `ZA_ADDR_CERT` / `ZA_RPC` from env.

**zero-arena-fe/**
- `lib/chain/zerog.ts` was replaced by `lib/chain/bnb.ts`: viem `bscTestnet` / `bsc`, chosen with `NEXT_PUBLIC_CHAIN_ID` (97 default). It also reads `NEXT_PUBLIC_BSC_RPC_URL`, `NEXT_PUBLIC_DEPLOY_BLOCK` and `NEXT_PUBLIC_LOGS_CHUNK`, and exports `CHAIN_LABEL` and a BscScan `explorerUrl`.
- wagmi/RainbowKit and the viem publicClient now use `bnbChain`. The wrong-network / switch-chain UI names the BSC network.
- `readAgentMints` pages `eth_getLogs` in `LOGS_CHUNK` windows, because BSC RPCs cap the log range.
- Contract address defaults are now the zero-address sentinel, so the dashboard falls back to placeholder data until you deploy and fill them in. Env fallbacks use `||`, so empty values count as unset.
- Season prize amounts are labelled BNB. UI copy says BNB Chain / BscScan.

**docs / examples**
- The README, CLAUDE.md, ENV.md, docs/*, sub-READMEs and INTEGRATION docs are rebranded and carry a banner. **Lines that contain the old 0G contract addresses are left as-is on purpose, as a legacy record.**
- `examples/.env.example` points at BSC. Explorer links in the example scripts now go to BscScan testnet.

## Not changed / out of scope
- Contract logic, ABIs, the determinism contract and the backtest engine.
- Trading data sources (Binance/Bybit candles). The `0G/USDT` market pair is a trading symbol, not the chain.
- T3 / TEE plans still mention 0G Compute. Choosing a TEE backend for BNB is a TODO.
- The demo video, tweets and `.claude` skills.

## TODO before it works end-to-end
1. **Deploy to BSC testnet** (from `contracts/`, with `.env` filled):
   ```bash
   source .env
   forge script script/DeployAll.s.sol:DeployAll --rpc-url $BSC_TESTNET_RPC_URL \
     --private-key $DEPLOYER_PRIVATE_KEY --broadcast --verify --etherscan-api-key $BSCSCAN_API_KEY
   # set ZA_ADDR_INFT from deployments/97.json, then:
   forge script script/DeployPaperEngine.s.sol:DeployPaperEngine --rpc-url $BSC_TESTNET_RPC_URL \
     --private-key $DEPLOYER_PRIVATE_KEY --broadcast --verify --etherscan-api-key $BSCSCAN_API_KEY
   npm run build:abi   # writes dist/addresses.json with a "bsc-testnet" entry
   ```
2. Copy the addresses from `deployments/97.json` and `97-paper-engine.json` into:
   - FE: `lib/chain/contracts.ts` or `NEXT_PUBLIC_*`, plus `NEXT_PUBLIC_DEPLOY_BLOCK`
   - backend `.env` / Railway: `ZA_ADDR_*`, `ZA_RPC`, `ZA_CHAIN_ID=97`
   - `examples/.env`
   - optionally the SDK `init` defaults

   Then run `node scripts/sync-addresses.mjs --write` once to record a new lockfile baseline.
3. Fund the wallets:
   - deployer, operator and examples wallets: tBNB
   - any wallet that uploads (certify / mint): a little 0G on 0G Chain for storage fees
4. Redeploy the backend services (transfer-oracle, onboard, season-keeper) with the BSC env, and the FE with the `NEXT_PUBLIC_*` values.
5. Bump and publish the `zeroarena` SDK (the backend currently depends on the npm `zeroarena@^0.5.1`) and `@zero-arena/contracts`.
6. Optional: a BNB Greenfield storage adapter, and a BSC mainnet (56) deploy with a fresh admin key or multisig.

## Verification done
- `forge build` passes (no contract changes).
- SDK: `tsc --noEmit` is clean and `vitest run` passes (13 files, 109 tests).
- FE: `tsc --noEmit` is clean.
- Backend: `tsc --noEmit` reports 3 errors that are **not caused by this migration**. `transfer-oracle` uses `TransferProofRequest.nonce`, and the published `zeroarena` npm version it installs does not have that field yet. The local SDK does. Fix: publish the SDK or link it locally.
