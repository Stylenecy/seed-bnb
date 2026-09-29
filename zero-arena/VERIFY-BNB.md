# Zero Arena: BNB Chain verification

Verified on 2026-09-25 against a local **anvil fork of BSC testnet** (chainId 97, forked from `bsc-testnet-rpc.publicnode.com`). No real-network writes were made. Fork deploys used anvil's public default accounts only.

**Verdict: WORKS on the fork.** The contracts, SDK, all four backend services and the dashboard work end to end on chainId 97. The only part not exercised is 0G Storage uploads, which need a funded 0G wallet.

## Checks

| Check | Result | Notes |
| - | - | - |
| `forge build` | PASS | |
| `forge test` | PASS | 78/78 tests |
| Fork deploy: `DeployAll.s.sol` + `DeployPaperEngine.s.sol` | PASS | All 5 contracts have code on the fork. `deployments/97*.json` were written, then removed because they were fork-only (addresses below). |
| Core flow with `cast` | PASS | cert `submit` → iNFT `mint` → `LiveCertificate.start` (genesis = runHash) → `authorizeUpdater(operator)` → operator `update` ×2. The cumulative hash matches `keccak(keccak(runHash‖e0)‖e1)`. Then `createSeason` (0.1 BNB) → `enroll` → warp → `settle`: the winner received 0.05 BNB, the remainder was refunded, and the Season balance is 0. `stop` worked. |
| iNFT transfer (ERC-7857) through the backend oracle | PASS | `transfer-oracle` signed a proof, `ZeroArenaINFT.transfer` accepted it, the owner changed and `transferNonce` went 0→1. The oracle correctly rejected a wrong chainId (56), a non-owner `from`, and a stale nonce (409). |
| SDK `tsc --noEmit` / `vitest` / `build` | PASS | Clean. 13 files, 109 tests. `dist/` is built. |
| Backend `tsc --noEmit` | PASS | It had 3 errors because it used the published `zeroarena@0.5.1`. It now links the local SDK (`"zeroarena": "file:../sdk"`). |
| Backend `transfer-oracle serve` | PASS | `/health` returns ok. Signing works on the fork (after the bug fix below). |
| Backend `season status/settle/keep` | PASS | `settle 3` (0 participants: full refund) and `settle 4` (1 participant: 0.1 BNB paid) both mined. `keep` polls cleanly. |
| Backend `paper backfill` | PASS | Replayed 95 real Binance 15m bars with the `01-rsi-spot-btc` agent. It committed 3 epochs to `LiveCertificate` on the fork, and the on-chain `cumulativeHash` equals the daemon's. |
| Backend `onboard serve` | PASS (health only) | `/health` and `/status` respond with the operator pubkey. I did not POST `/onboard`: `scripts/e2e-onboard-test.mjs` is hardwired to production token 5 and to `.env`. |
| FE `tsc --noEmit` + `next build` | PASS | 7 routes |
| FE `next start` against the fork | PASS | `/`, `/leaderboard`, `/season`, `/season/1`, `/season/4`, `/agent/rsi-classic`, `/agent/rsi-classic-alt-a`, `/agent/.../live` all return 200. The leaderboard shows exactly the 2 fork-minted agents (source `chain`, not mock). The pages say "BNB Chain / BSC Testnet". No fallback errors in the logs. |
| RPC / chain-id checks (read-only) | PASS | The default `ZA_RPC` (bnbchain.org testnet) is chainId 97. The mainnet RPC is 56. The `ZA_STORAGE_RPC` default `evmrpc.0g.ai` is 16661 (0G, intended). |
| Hardcoded BSC contract addresses | N/A | None. FE defaults are the zero-address sentinel. The only hardcoded addresses are mock/demo EOAs and `KNOWN_OPERATORS` (see TODO). |
| 0G Storage uploads (certify/mint blobs) | SKIPPED | Needs a 0G-funded wallet. Out of scope. The fork flow used synthetic storage roots. |

Fork addresses (for reference only; they do not exist on the real testnet): AgentCertificate `0x7b33…F5d7`, ReencryptionOracle `0xc890…D1fE`, ZeroArenaINFT `0xE4F3…c146`, LiveCertificate `0x9c30…584D`, Season `0xFd4F…0667`.

## Bugs fixed

1. **`zero-arena-bacend/src/log.ts`**: the logger passed `bigint` fields to `JSON.stringify`, which throws. After signing, `transfer-oracle` logs `tokenId` / `deadline` as bigints, so **every successful sign request returned HTTP 500** and the signature was dropped. Fix: `formatVal` now stringifies bigints. This bug was in the code before the migration.
2. **Backend used the published SDK**: `zero-arena-bacend/package.json` now depends on `"zeroarena": "file:../sdk"`, which is symlinked. `tsc` is clean. Note: `sdk/dist` must be built (`npm --prefix ../sdk ci && npm --prefix ../sdk run build`) before the backend is installed or deployed. Otherwise, publish `zeroarena@0.5.2` and switch back to a semver range.

## Notes and caveats

- **Fork gotcha:** on BSC testnet, anvil's default accounts carry EIP-7702 delegations to sweeper contracts. Any BNB sent to them is swept, which is why the first season payout appeared to be 0. Run `cast rpc anvil_setCode <acct> 0x` on a fork first. This is not a project bug.
- The season keeper uses wall-clock `Date.now()` to decide readiness. On a time-warped fork it doesn't see ended seasons, so use `season settle <id>`. On a real chain this is fine.

## Remaining steps for a real BSC testnet deploy

1. **Keys and funds**
   - The deployer/admin needs about **0.01 tBNB**. The whole 5-contract deploy is about 7M gas, and the testnet gas price is currently 0.1 gwei, so it costs roughly 0.001 tBNB.
   - Add the prize pool for each season you create.
   - Give the operator wallet about 0.01 tBNB for `update` / `settle` gas.
   - Separate keys are needed for `ORACLE_SIGNER_ADDRESS` / `ORACLE_PRIVATE_KEY` and for the operator.
   - Any wallet that certifies or mints also needs a little **0G** on 0G Chain for storage fees.
2. Deploy from `contracts/`:
   ```bash
   export DEPLOYER_ADDRESS=… ORACLE_SIGNER_ADDRESS=… OPERATOR_ADDRESS=…
   forge script script/DeployAll.s.sol:DeployAll --rpc-url $BSC_TESTNET_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast
   export ZA_ADDR_INFT=$(jq -r .addresses.ZeroArenaINFT deployments/97.json)
   forge script script/DeployPaperEngine.s.sol:DeployPaperEngine --rpc-url $BSC_TESTNET_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast
   npm run build:abi && node scripts/sync-addresses.mjs --write
   ```
   Add `--verify --etherscan-api-key $BSCSCAN_API_KEY` if you have a key.
3. Set the backend env: `ZA_RPC`, `ZA_CHAIN_ID=97`, `ZA_ADDR_INFT`, `ZA_ADDR_LIVE_CERT`, `ZA_ADDR_SEASON`, `OPERATOR_PRIVATE_KEY`, `ORACLE_PRIVATE_KEY`. Build `sdk/` before installing the backend (see bug 2).
4. Set the FE env: `NEXT_PUBLIC_*_ADDRESS`, `NEXT_PUBLIC_DEPLOY_BLOCK`, `NEXT_PUBLIC_TRANSFER_ORACLE_URL`, `NEXT_PUBLIC_ONBOARD_URL`.
5. Update `zero-arena-fe/lib/chain/operators.ts` `KNOWN_OPERATORS` with the new BSC operator address. It still lists the 0G-era operator EOA.
6. Point `ROSTER_OVERLAY` (tokenId → display name) at the new token IDs, if you want the demo names.

## Real BSC Testnet deploy (2026-09-25)

Deployed to the real **BSC testnet (chainId 97)** with the project scripts `script/DeployAll.s.sol` and `script/DeployPaperEngine.s.sol` (`forge script --broadcast --slow`). RPC: `https://bsc-testnet-rpc.publicnode.com`. Gas price: 0.1 gwei. BscScan verification was **skipped** because no `BSCSCAN_API_KEY` / `ETHERSCAN_API_KEY` was available.

Roles:

- Deployer/admin: `0xb4fDcF406c50a789B125a1C27Fdf9ADDaC333308`.
- Operator (LiveCertificate updater and settle gas): `0x38C0152976ff5B392A6CDcF5Afe3BDDE1B6653a5`, funded with 0.005 tBNB.
- Oracle signer: `0xE1e0a0AAEF3bB23ef9D111B0bCf19D738e255423`. It signs off-chain only and holds no funds.

The keys live outside the repo.

| Contract | Address | Deploy tx |
|---|---|---|
| AgentCertificate | [0x4927B51f574035622826d8E703b712Bb5F12bDC8](https://testnet.bscscan.com/address/0x4927B51f574035622826d8E703b712Bb5F12bDC8) | [0x527b4720…b32a](https://testnet.bscscan.com/tx/0x527b4720dc097ce5b812c2d3ef881211fe02a539b16559fd4e9d107145ecb32a) |
| ReencryptionOracle | [0x90D159C2d0d247BAafbd865a6FdD664E397eD984](https://testnet.bscscan.com/address/0x90D159C2d0d247BAafbd865a6FdD664E397eD984) | [0x68df8b5a…9c4b](https://testnet.bscscan.com/tx/0x68df8b5ae22242a7248954f1a56a8948a6cd165d4a35a953971aba26a7549c4b) |
| ZeroArenaINFT | [0x6d0fda52C480E96D2Da3aB0e071d4c6A27Cd263c](https://testnet.bscscan.com/address/0x6d0fda52C480E96D2Da3aB0e071d4c6A27Cd263c) | [0x487938ef…476c](https://testnet.bscscan.com/tx/0x487938ef08de13ff4a01f13237e725112bad6b3147e922ff4be1f84d3593476c) |
| LiveCertificate | [0xc013bf70429B079D076e36D966A16F382b9c7e46](https://testnet.bscscan.com/address/0xc013bf70429B079D076e36D966A16F382b9c7e46) | [0x075fa94d…bb02](https://testnet.bscscan.com/tx/0x075fa94d9e008bf715e8b4267f8e17d9ba138726196512dab816f8b63285bb02) |
| Season | [0xA50314e3d9Abd8f35134a91Fe117a18e06461a55](https://testnet.bscscan.com/address/0xA50314e3d9Abd8f35134a91Fe117a18e06461a55) | [0x24a5120e…7984](https://testnet.bscscan.com/tx/0x24a5120ef42edace695037e8d906ed43803f5e650fa79daaac26448fa9477984) |

The first deploy tx landed in block 132984371, which is used as `NEXT_PUBLIC_DEPLOY_BLOCK`. The `deployBlock` fields in the JSON files come from the forge simulation and are a few blocks earlier, which is harmless.

The addresses are recorded in several places:

- `contracts/deployments/97.json` and `97-paper-engine.json`, plus the broadcast files.
- `contracts/deployments/.synced-addresses.json`, a new baseline written by `sync-addresses.mjs --write`.
- `contracts/dist/addresses.json`, which `npm run build:abi` writes as `bsc-testnet`.
- `zero-arena-fe/.env.example`, `zero-arena-bacend/.env.paper.example`, `.env.onboard.example` and `examples/.env.example`.
- The README "Smart contracts → Deployments" section. The old 0G addresses are kept there as a legacy record.

### Smoke flow on the real testnet

| Step | Signer | Tx | Gas |
|---|---|---|---|
| `AgentCertificate.submit` (T1, spot, +1500 bps, Sharpe 1.8) → cert 1 | deployer | [0x90f001a9…3fb0](https://testnet.bscscan.com/tx/0x90f001a9faaca1dfd5fabd6fad8d820cbec66f1125e4e1056513c302daf73fb0) | 148,030 |
| `ZeroArenaINFT.mint(1, meta, root)` → token 1 | deployer | [0xa77f9ef9…8909](https://testnet.bscscan.com/tx/0xa77f9ef94ad035d2e86e74b07c3e684b46973a105150c97da937b571cf858909) | 165,520 |
| `LiveCertificate.start(1, runHash)` | deployer | [0x05dc8c44…1f1d](https://testnet.bscscan.com/tx/0x05dc8c448b163b441600955f1654115564b98268ca929cea2a5a0b5012e61f1d) | 101,040 |
| `authorizeUpdater(1, operator, true)` | deployer | [0xf579064b…3307](https://testnet.bscscan.com/tx/0xf579064b92f166a29ca1de67432952a42f83929b353368338cd55aa8dc0a3307) | 51,846 |
| `update(1, epoch 0, …)` | operator | [0x1f939f4a…63c7](https://testnet.bscscan.com/tx/0x1f939f4ab692837b44320042ebf0d0a7f11d49a2a9e6e94c7b7febe4818763c7) | 67,041 |
| `Season.createSeason` (prize pool **0.002 tBNB**, 60 s enroll + 60 s window) → season 1 | deployer | [0x50560f56…3c727](https://testnet.bscscan.com/tx/0x50560f56878ec0a8ecfcdb335ed8ca62ae8f03d23f6c1bb0ab659fb3020c3727) | 126,630 |
| `Season.enroll(1, 1)` | deployer | [0xc76e645c…08bf](https://testnet.bscscan.com/tx/0xc76e645c21196f7f820e986ff054b020cc24942913ce179d73f6806586e408bf) | 160,283 |
| `update(1, epoch 1, …)` (in-season) | operator | [0xaba9c7c4…6890](https://testnet.bscscan.com/tx/0xaba9c7c45e9c7388641de691dcb48893fccdbc4a09084904158311bbda206890) | 49,977 |
| `Season.settle(1, [1])` via **backend** `season settle 1` | operator | [0x4c3a8431…114d](https://testnet.bscscan.com/tx/0x4c3a84312d92d4b49aab52587289205ed0fc5e4dabb130ba615ba6438c93114d) | — |

Results:

- Every receipt has status 1.
- After epoch 0 the on-chain `cumulativeHash` equals `keccak(runHash ‖ keccak("epoch-0"))` (`0xf3f7…debf`).
- Settle paid 0.001 tBNB (50%) to the token owner and refunded the other 0.001 tBNB to the creator. The Season balance is 0 and `settled` is true.
- The storage roots are placeholders (`keccak(...)`) because 0G Storage uploads are skipped. The `certify`/`mint` SDK paths that upload blobs were not run.

**Backend on the live testnet:**

- `transfer-oracle serve` (127.0.0.1:3160, new oracle key): `/health` is ok. `POST /sign-transfer-proof` for token 1 returned a signature. chainId 56 was rejected (400), and a non-owner `from` was rejected (403, the live `ownerOf` was checked).
- The signed proof was **not** submitted on-chain. That would move token 1, and the full transfer was already proven on the fork.
- `season status` / `season settle` work against the live contracts.

### Frontend

- `lib/chain/operators.ts` `KNOWN_OPERATORS` now lists the new BSC operator `0x38c0…53a5`. The 0G-era `0x0dce…1654` entry and its stale onboard `href` were removed.
- `lib/chain/bnb.ts`: the default testnet RPC changed from the bnbchain.org dataseed, which rejects `eth_getLogs` and would break the leaderboard mint scan, to `https://bsc-testnet-rpc.publicnode.com`.
- `tsc --noEmit` is clean. `next build` with `.env.local` (gitignored, copied from the filled `.env.example`) passes.
- `next start -p 3161`: `/`, `/leaderboard`, `/season` and `/season/1` return 200, as do `/agent/rsi-classic` and `/agent/rsi-classic/live`. The agent page shows the live owner (the deployer) and the LiveCertificate address. `/season/1` shows "Settled". The pages say "BSC Testnet". The process was stopped afterwards.

### Gas spent

- Deploy: 6,126,472 gas, about 0.000613 tBNB.
- Smoke flow: deployer about 0.000077 tBNB, operator about 0.000020 tBNB.
- **Total gas: about 0.00071 tBNB.** The 0.002 tBNB prize pool came back in full, as the payout plus the refund, both to the deployer.
- The operator still holds 0.00498 tBNB for future `update`/`settle`.

### What's left

- Verify all 5 contracts on BscScan when a key is available (`forge verify-contract … --chain 97`).
- 0G Storage uploads for certify/mint blobs need a 0G-funded wallet. For a BNB-native stack, add a Greenfield adapter.
- Redeploy the transfer-oracle, onboard and season-keeper services on Railway with the new BSC env and keys. Then update `NEXT_PUBLIC_TRANSFER_ORACLE_URL` / `NEXT_PUBLIC_ONBOARD_URL`, which still point at the 0G-era Railway services, and add the onboard `href` back to `KNOWN_OPERATORS`.
- ENV.md still lists the 0G-era wallets and addresses. That is intentional (legacy record), but it needs a BSC section once the services are redeployed.
- Point `ROSTER_OVERLAY` at real agent names for the new token IDs. Token 1 currently shows as "RSI Classic 30/70".
