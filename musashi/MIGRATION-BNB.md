# MUSASHI → BNB Chain migration

MUSASHI was built on **0G** (0G Chain mainnet 16661 for contracts + 0G Storage for evidence).
It now targets **BNB Chain**: contracts deploy to **BSC Testnet (97)** by default and **BSC Mainnet (56)**
for production. Evidence blobs and encrypted INFT intelligence **stay on 0G Storage** as an off-chain
data-availability layer. Only their merkle roots go on-chain (on BSC now).

## What changed

### Contracts (`contracts/`)
- Solidity logic is unchanged apart from a NatSpec title. `MusashiINFT.transferDigest` already binds `block.chainid`, so it works on any chain.
- `foundry.toml`: the 0G RPC/verifier entries are replaced with `bsc`, `bsc_testnet`, `bsc_mainnet` RPC endpoints and `[etherscan]` entries for chains 97 and 56, keyed by `ETHERSCAN_API_KEY` (Etherscan V2 covers BscScan).
- `script/Deploy.s.sol`: reads `BSC_PRIVATE_KEY`. `forge script` works on BSC (the 0G limitation no longer applies).
- `script/deploy-and-verify.sh`: uses `BSC_RPC_URL` (default testnet) and `BSC_PRIVATE_KEY`, and gets the chain id via `cast chain-id`. The chainscan curl verification is replaced by `forge verify-contract --chain $CHAIN_ID` (skipped if `ETHERSCAN_API_KEY` is unset). BscScan links are printed at the end.
- `Makefile`: `BSC_DEFAULT_RPC` / `BSC_RPC_URL` / `BSC_PRIVATE_KEY` replace the `OG_*` vars. `gates`/`discover` default to chain 56.

### Go engine (`scripts/musashi-core/`)
- `internal/chain`: RPC is `BSC_RPC_URL` (default `https://data-seed-prebsc-1-s1.bnbchain.org:8545`), the explorer is `BSC_EXPLORER_URL` (default `https://testnet.bscscan.com`), and the key is `BSC_PRIVATE_KEY` (`chain.PrivateKeyEnv`). Constants `BSCTestnetChainID`/`BSCMainnetChainID` replace `OGMainnetChainID`. There is a new `chain.ChainID(ctx)`.
- **Fix:** `transfer-agent` used to sign the oracle digest with the hardcoded 0G chain id 16661. It now uses the chain id reported by the RPC, so proofs verify on 97 and 56.
- `internal/storage`: 0G Storage upload uses `OG_STORAGE_PRIVATE_KEY`, falling back to `BSC_PRIVATE_KEY`. Storage tx links use `OG_STORAGE_EXPLORER_URL` (0G chainscan, since storage flow txs settle on 0G). `internal/journal` is gated on the same key.
- Token-analysis CLI defaults (`gates`, `hunt`, `discover`, `orchestrate`, `strike --token-chain`, `journal check`) are now **56 (BSC)** instead of 1. BSC analysis RPC is now `https://bsc-dataseed.bnbchain.org`. Token analysis still supports ETH/Polygon/Arbitrum/Base/0G tokens.
- `scripts/publish_strike.sh` uses the BSC vars.

### Frontend (`frontend/`)
- `src/lib/contracts.ts`: `CHAIN_ID` (97 by default, 56 if `NEXT_PUBLIC_CHAIN_ID=56`), `CHAIN_NAME`, `RPC_URL` (`NEXT_PUBLIC_BSC_RPC_URL` override) and `EXPLORER` (BscScan). The old 0G contract fallback addresses are replaced with the zero address and a TODO, so set `NEXT_PUBLIC_CONVICTION_LOG_ADDRESS` / `NEXT_PUBLIC_MUSASHI_INFT_ADDRESS`.
- `src/lib/chain.ts` / `wagmi.ts`: use viem's `bsc` / `bscTestnet` with the injected connector (the custom 0G `defineChain` is gone).
- Components (StrikePublisher: wrong-network switch to BSC; StrikeLedger, ReputationPanel, AgentIntelligencePanel): BscScan links and "BNB Chain" copy. Chain selectors default to BSC.
- `next.config.ts` CSP `connect-src`: BSC RPCs and the 0G Storage indexer (the browser fetches evidence from it).
- `env.ts` strips `BSC_PRIVATE_KEY` / `OG_STORAGE_PRIVATE_KEY` from child processes.
- Landing page, metadata, manifest and system prompt are rebranded to BNB Chain. 0G Storage mentions are kept because the storage layer still exists.

### Config / docs
- `.env.example`: a new BNB Chain section (`BSC_RPC_URL`, `BSC_EXPLORER_URL`, `BSC_PRIVATE_KEY`, `ETHERSCAN_API_KEY`, `NEXT_PUBLIC_CHAIN_ID`, contract address placeholders) and a separate 0G Storage section.
- CI builds the frontend with `NEXT_PUBLIC_CHAIN_ID=97` and zero-address placeholders.
- README, SKILL.md, ARCHITECTURE.md, `.claude/commands/*`, `references/API_ENDPOINTS.md` and the frontend README are updated. `AUDIT.md` and `contracts/broadcast/` are historical and left as-is.

## Verification (done locally, no network writes)
- `forge build` and `forge test`: 48/48 pass.
- `go build ./... && go vet ./... && go test ./...` (musashi-core) passes.
- Frontend: `tsc --noEmit` is clean, `pnpm lint` has 0 errors (11 pre-existing warnings), `pnpm test` passes 10/10, and `pnpm build` succeeds.

## TODO
1. **Deploy to BSC Testnet** (nothing was deployed):
   ```bash
   cp .env.example .env          # set BSC_PRIVATE_KEY (dedicated wallet, funded from the faucet)
   # optional: ETHERSCAN_API_KEY for verification
   make deploy                   # contracts/script/deploy-and-verify.sh → writes proxy addrs into .env
   # or: cd contracts && forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast \
   #       --verify --etherscan-api-key $ETHERSCAN_API_KEY
   ```
   Then copy the proxy addresses into `NEXT_PUBLIC_CONVICTION_LOG_ADDRESS` / `NEXT_PUBLIC_MUSASHI_INFT_ADDRESS`
   (Vercel env + `frontend/.env.local`) and CI.
2. Re-mint the MUSASHI agent INFT on BSC (`make seal-intelligence` then `make mint-agent`). The 0G on-chain history (strikes, reputation) does not carry over.
3. Mainnet: set `BSC_RPC_URL=https://bsc-dataseed.bnbchain.org`, `BSC_EXPLORER_URL=https://bscscan.com`, `NEXT_PUBLIC_CHAIN_ID=56`, and run `make deploy` again.
4. Storage decision: 0G Storage still needs a wallet funded with 0G gas (`OG_STORAGE_PRIVATE_KEY`). For a fully BNB-native stack, port `internal/storage` to **BNB Greenfield**. That was not done here because it is a larger change (new SDK, bucket/object model, different proof flow).
5. The oracle is still the deployer key (hackathon shortcut, unchanged).
