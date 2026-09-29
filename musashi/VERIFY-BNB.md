# MUSASHI: BNB Chain verification

Date: 2026-09-25. Contracts, the Go engine and the frontend ran against a local **anvil fork of BSC Testnet**
(`--chain-id 97`, port 8650) using anvil's public test accounts. Token analysis used **live BSC mainnet**
data (read-only). No real-network writes were made.

## Checks

| Check | Result | Notes |
|---|---|---|
| `forge build` / `forge test` | PASS | 48/48 tests |
| Fork deploy via `forge script script/Deploy.s.sol --broadcast` | PASS | ConvictionLog impl + proxy, MusashiINFT impl + proxy. All 4 addresses have code. `inft()` is linked and `oracle()` = deployer |
| Fork deploy via `script/deploy-and-verify.sh` (the `make deploy` path) | PASS | Receipt/bytecode asserts, link, oracle, and `.env.local` write all worked. Verify skipped (no `ETHERSCAN_API_KEY`). The fork `.env.local` was deleted afterwards |
| Core flow with `cast` | PASS | mint, logStrike ×2 (BSC USDT/USDC, tokenChain 56), recordOutcome +2500 / −800, reputation = (2 filled, 1 W, 1 L, +1700). updateIntelligence synced winRate to 10000 bps. Oracle-signed `transfer` on chainId 97 succeeded and ownership moved. A proof signed for the old 0G chainId 16661 was rejected with `BadOracleSignature`, so the chain-id fix is confirmed |
| Go engine `go build` / `vet` / `test` | PASS | chain and gates tests pass |
| Go CLI write path on fork | PASS | `mint-agent`, `strike`, `record-outcome` (−350), `update-agent`, and `transfer-agent` (signs the digest with the RPC-reported chain id 97, verified on-chain). Read path: `status`, `status --per-agent`, `agent-info`, `history` |
| Go CLI token analysis on live BSC (56) | PASS | `gates` on CAKE correctly FAILs gate 1 (mintable). `gates` on ARIA `0x5d3a…5238` PASSes gates 1-3, 6 and 7 (79.6k holders). `search CAKE` resolves the BSC address |
| Daemon `serve` (127.0.0.1:3152) | PASS | `/healthz`, `/v1/status`, `/v1/status?perAgent`, `/v1/agent-info`, `/v1/history`, `/v1/gates`, `/v1/search` all return 200 with fork or BSC data |
| Frontend `tsc --noEmit`, `pnpm test` (10/10), `pnpm lint` (0 errors, 11 warnings) | PASS | |
| Frontend `next build` with fork env | PASS | Fork RPC and addresses are baked into the client bundle. CSP `connect-src` includes the custom RPC |
| Frontend `next start` (port 3153) | PASS | `/` and `/dashboard` return 200. `/api/status`, `/api/agent-info`, `/api/gates` and `/api/search` return 200 with fork/BSC data through the daemon. No wrong-network text. "0G"/16661 appears only as a token-analysis chain option, which is intentional |
| Address checks | PASS / fixed | BSC USDT/USDC (18 decimals) were used as strike tokens. ARIA (`RecentFindings`, chain 56) has code, symbol ARIA, 18 decimals. The old ConvictionLog `0x2B84…2A15` and MusashiINFT `0x74BC…1d4c` have **no code on BSC 56 or 97** (they exist only on 0G). See the bugs below |
| 0G Storage writes (`seal-intelligence`, `store`, `verify`) | SKIPPED | Out of scope: needs a 0G-funded `OG_STORAGE_PRIVATE_KEY`. On-chain calls took arbitrary bytes32 roots |

## Bugs fixed

1. `frontend/src/lib/musashi-system-prompt.ts`: the agent chat persona hardcoded the old **0G mainnet** contract
   addresses, so the LLM would have queried and cited contracts that don't exist on BSC. It now interpolates
   `CHAIN_NAME`, `CHAIN_ID`, `CONVICTION_LOG_ADDRESS` and `MUSASHI_INFT_ADDRESS` from `src/lib/contracts.ts` (env-driven).
2. `frontend/README.md`: the address table listed the same 0G addresses as current. It now says the contracts are not deployed on BSC yet and points to the env vars.
3. `contracts/script/deploy-and-verify.sh`: the error path used `${name^^}` (bash 4 only). macOS ships bash 3.2, so on
   a reverted deploy the script would die with "bad substitution" instead of printing the hint. The line now names the real
   `CL_GAS` / `INFT_GAS` vars.

## Steps remaining for a real BSC Testnet deploy

1. Create a dedicated deployer wallet and fund it with **~0.1 tBNB** from the BNB faucet. The whole deploy is about 6M gas
   (two impls of ~11.7 KB and ~21.3 KB bytecode, two proxies, two setup txs), so about 0.006-0.06 tBNB depending on gas price.
   Each strike, outcome, mint or transfer costs under 250k gas.
2. `cp .env.example .env` and set `BSC_PRIVATE_KEY` (optionally `ETHERSCAN_API_KEY` for BscScan verify), then run `make deploy`.
3. Put the printed proxy addresses into `CONVICTION_LOG_ADDRESS` / `MUSASHI_INFT_ADDRESS` (Go engine / daemon) and
   `NEXT_PUBLIC_CONVICTION_LOG_ADDRESS` / `NEXT_PUBLIC_MUSASHI_INFT_ADDRESS` (Vercel + CI), and set `NEXT_PUBLIC_CHAIN_ID=97`.
4. To mint the agent INFT with real sealed intelligence, `make seal-intelligence` needs `OG_STORAGE_PRIVATE_KEY` funded
   with 0G gas. Otherwise mint with a placeholder root, as done on the fork.
5. Mainnet: repeat with `BSC_RPC_URL=https://bsc-dataseed.bnbchain.org`, `BSC_EXPLORER_URL=https://bscscan.com`, and
   `NEXT_PUBLIC_CHAIN_ID=56` (similar gas, paid in real BNB).

## Real BSC Testnet deploy (2026-09-25)

Deployed to the real **BSC Testnet (chainId 97)** with the project script `contracts/script/deploy-and-verify.sh` (the `make deploy` path), RPC `https://bsc-testnet-rpc.publicnode.com`, gas price 0.1 gwei. The deployer is also the oracle and the contract owner: `0xb4fDcF406c50a789B125a1C27Fdf9ADDaC333308`. Deploy block: 132984099. BscScan verification was **skipped** because no `ETHERSCAN_API_KEY` was available.

| Contract | Proxy (canonical) | Implementation |
|---|---|---|
| ConvictionLog | [0x194CAC98f5B66f203944e2047d168e4624418d49](https://testnet.bscscan.com/address/0x194CAC98f5B66f203944e2047d168e4624418d49) | [0xFAEF4B46FE4c142328727b80AB0BAB67298DD408](https://testnet.bscscan.com/address/0xFAEF4B46FE4c142328727b80AB0BAB67298DD408) |
| MusashiINFT | [0xF10dBDF8A385a60F97Eb1843BefcF18edFB57ac5](https://testnet.bscscan.com/address/0xF10dBDF8A385a60F97Eb1843BefcF18edFB57ac5) | [0xA589e21A0469ada81D8bF6d108951FE08E475D4B](https://testnet.bscscan.com/address/0xA589e21A0469ada81D8bF6d108951FE08E475D4B) |

The script's on-chain asserts passed: `inft()` is linked to the MusashiINFT proxy and `oracle()` is the deployer.

The addresses are recorded in `deployments/bsc-testnet.json`, `.env.bsc-testnet` (addresses only), `contracts/.env.local` (which the script writes and is gitignored), and `frontend/.env.local` (gitignored). The README "Deployments" section and the `frontend/README.md` table were updated.

### Smoke flow on the real testnet (cast)

| Step | Tx | Gas |
|---|---|---|
| `MusashiINFT.mint("MUSASHI", root, meta, 0x01)` → agent 0 | [0xc97fd51a…6ae82](https://testnet.bscscan.com/tx/0xc97fd51a03bc8d9b19816c63398c78a5eea1f004a006435ccf4fda1f1bd6ae82) | 222,322 |
| `ConvictionLog.logStrike(0, BSC USDT, 56, 4, evidenceHash)` → strike 0 | [0x2b53b069…b5b0d](https://testnet.bscscan.com/tx/0x2b53b0691d77d62e2b22b704223653829df6604953e6a3a943fcffdc876b5b0d) | 188,897 |
| `ConvictionLog.recordOutcome(0, +2500)` | [0x7d91cff2…13918](https://testnet.bscscan.com/tx/0x7d91cff21236ed2ef2e7d22801de1101ed298c0dd8727b4d216b17ffc9f13918) | 105,369 |

All receipts have status 1. `reputation()` reads (1 strike, 1 filled, 1 win, 0 losses, +2500 bps). The mint used a placeholder storage root (`keccak("musashi-placeholder-intelligence-root")`) because 0G Storage writes are skipped.

### Gas spent

The deploy (4 creates + `setINFT` + `setOracle`) cost about 0.00078 tBNB. The smoke flow cost about 0.00005 tBNB. **Total: 0.000834 tBNB.**

### What works live

- The Go daemon `musashi-core serve` (127.0.0.1:3150, with `.env.bsc-testnet`): `/healthz`, `/v1/status`, `/v1/agent-info?tokenId=0` and `/v1/history` all return the live testnet data (the strike, the outcome and agent 0).
- Frontend `pnpm build` with the testnet addresses passes, and the proxy address is baked into the client bundle. `next start -p 3151`: `/`, `/dashboard`, `/api/status` and `/api/agent-info?tokenId=0` all return 200. `/api/status` returns the live on-chain reputation through the daemon.
- Both processes were stopped afterwards.

### What's left

- Verify the implementations on BscScan once an `ETHERSCAN_API_KEY` is available: `forge verify-contract <impl> src/ConvictionLog.sol:ConvictionLog --chain 97` and the same for `src/MusashiINFT.sol:MusashiINFT`.
- Real sealed intelligence and evidence need a 0G-funded `OG_STORAGE_PRIVATE_KEY` for `make seal-intelligence` / `store`. Agent 0 currently points at a placeholder root.
- Set `NEXT_PUBLIC_*` addresses in Vercel/CI. The oracle is still the deployer key (hackathon shortcut).
- The oracle-signed INFT `transfer` was not run live (it was proven on the fork).
