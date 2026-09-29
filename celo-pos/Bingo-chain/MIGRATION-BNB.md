# BINGOChain: multichain expansion to BNB Chain

BINGOChain stays **live on Celo mainnet**: proxy `0x8bE7c07CCF9FF515d82D4c36aB4EB937941432f1`,
Safe-owned, verified on Celoscan. The Celo addresses, MiniPay support, fee abstraction,
operator scripts and track record are all unchanged. This expansion adds **BNB Chain**
(BSC testnet 97 by default, BSC mainnet 56) as a second network. Celo is still the
default everywhere.

## What was added

### Contracts (`contracts/`)
- `foundry.toml`: added `bsc_testnet` / `bsc` RPC endpoints and Etherscan V2 verify entries (chainid 97/56).
- `script/Deploy.s.sol`: the "owner must not be the deployer" mainnet guard now covers BSC mainnet (56) as well as Celo (42220).
- `.env.example`: added `BSC_TESTNET_RPC` and `BSC_MAINNET_RPC`.
- `deployments/bsc-testnet.json` and `deployments/bsc-mainnet.json`: placeholders listing the BSC token map. On mainnet that is WBNB, USDT `0x55d3…7955` and USDC `0x8AC7…580d`, **all 18 decimals**.
- The contract sources did not change. The contract is token-agnostic: tokens are whitelisted per deployment through `allowToken(token, minStake)`.

### Web (`apps/web/`)
- New `lib/networks.ts` holds per-chain config for 42220 / 56 / 97: RPC, explorer, BingoChain and LANCE addresses, the LANCE pool asset (CELO or WBNB), tokens with decimals, min stakes, and session-key gas tokens.
- The active chain is chosen with `NEXT_PUBLIC_CHAIN_ID`, which defaults to `42220`. `lib/bingo.ts` (`CHAIN_ID`, `BINGO_ADDRESS`, `TOKENS`, `MIN_STAKE`, plus new `EXPLORER_URL` and `NATIVE_SYMBOL`), `lib/lance.ts`, `lib/session.ts` and the Footer explorer links now read from it.
- `lib/wagmi.ts`: chains are `[celo, bsc, bscTestnet]`, each with its own transport.
- `lib/minipay.ts`: `isMiniPay()` returns false on non-Celo builds.
- On BSC there is no fee abstraction, so the session key is funded in native BNB only.
- LancePanel labels use the pool-asset symbol, and the OG image knows the BSC token symbols.
- A tagline and keywords now mention BNB Chain.
- `.env.example` is new and lists all the per-chain vars.

### API / indexer (`apps/api/`)
- `src/indexer.ts` is parameterized by `CHAIN_ID` (42220 default, 97, 56), with `RPC_URL`, `BINGO_ADDRESS` and `INDEX_START_BLOCK`. Run **one API instance and one database per chain**, because arena ids are per deployment.
- `.env.example` has the new vars.

### Docs
- README: added "Live on Celo, now also on BNB Chain" and a BNB Chain section.

## Deploy to BSC testnet (not executed)

```sh
cd contracts
# .env: DEPLOYER_PRIVATE_KEY, OWNER_ADDRESS, TREASURY_ADDRESS, PROTOCOL_FEE_BPS=100, ETHERSCAN_API_KEY, BSC_TESTNET_RPC
source .env
forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast --verify --private-key $DEPLOYER_PRIVATE_KEY
# whitelist tokens (as owner), e.g. a MockERC20 USDT (18 dec) and WBNB testnet:
cast send <proxy> "allowToken(address,uint256)" <USDT_MOCK> 500000000000000000 --rpc-url $BSC_TESTNET_RPC --private-key <owner>
cast send <proxy> "allowToken(address,uint256)" 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd 1000000000000000 --rpc-url $BSC_TESTNET_RPC --private-key <owner>
```

Then set `NEXT_PUBLIC_CHAIN_ID=97` and `NEXT_PUBLIC_BSC_TESTNET_BINGO_ADDRESS` / `_LANCE_ADDRESS` / `_USDT_ADDRESS`
for a BSC build of the web app. For the API, set `CHAIN_ID=97`, `BINGO_ADDRESS` and `INDEX_START_BLOCK`, and use a separate database.

## TODO
- Deploy the BingoChain proxy to BSC testnet, then mainnet (Safe owner on mainnet), and fill in `deployments/bsc-*.json`.
- Deploy a MockERC20 USDT (18 decimals) on testnet, and LanceHub on BSC (`lance-hub/contracts/script/DeployBsc.s.sol`), then call `allowToken` for each token.
- The web app picks its chain at build time, so it needs one deployment per chain. A runtime chain switch inside a single build would need `CHAIN_ID` / `BINGO_ADDRESS` in hooks to come from `useChainId()`.
- The operator scripts in `scripts/` and `tools/worker` are still Celo-only on purpose.
- MiniPay and CIP-64 gas payment are Celo-only, with no BSC equivalent.

## Verification
- `forge build` succeeded and `forge test` passed 95/95.
- `apps/web` passed `tsc --noEmit` after a quick `pnpm install --frozen-lockfile` (node_modules removed afterwards).
- `apps/api` passed `tsc --noEmit` after `npm ci` (node_modules removed afterwards).
