# iUSD Pay: BNB Chain verification

Date: 2026-09-25. Environment: a local anvil fork of BSC testnet (chainId 97), a throwaway local Postgres 16, and the public anvil
test accounts or mnemonic. No real-network writes were made, and no repo keys were used.

**Verdict: works on the fork.** The full monorepo builds with zero type errors, after fixes. The pay flow was proven end-to-end on the
fork through the real services. An encrypted deposit on-chain is followed by API login, account registration and a payment intent.
The relayer worker then decrypts the claim key and submits `sponsorClaim`, and the recipient is paid. Gift deposit and sponsored claim were
proven on-chain.

| Check | Result | Notes |
|---|---|---|
| `pnpm install` | PASS | pnpm 10, native deps (canvas, blake-hash) compile on macOS arm64 |
| `pnpm -r build` (sdk, api, admin, app) | PASS | The first run was green only because admin's `build` was `vite build` (no typecheck). `tsc` on admin showed **61 errors**, now 0 (see fixes). Admin's build now runs `tsc --noEmit` first |
| `tsc -b --force` app / `tsc --noEmit` api | PASS | |
| api `vitest` | PASS | 2 of 2 |
| `forge test` | PASS | 18 of 18 |
| Fork deploy via `scripts/deploy/bsc-deploy.sh testnet` | PASS (after fix) | MockERC20 USDT `0x7b33…F5d7`, IPayPool `0xc890…D1fE`, IPayGiftPool `0xE4F3…c146` (fork only). ~7.8M gas |
| `scripts/deploy/bsc-register-gift-boxes.sh` | PASS | 24 of 24 boxes |
| API server (`dist/index.js`, Postgres) | PASS | `/health`, `/v1/config` (chainId 97, fork addresses), and `/v1/gift/boxes` (24 boxes read on-chain through the fetch shim) |
| Auth | PASS | `/v1/auth/nonce` then an EIP-191 `personal_sign`, then `/v1/auth/verify` returns a session. `/v1/account/register` creates the viewing key |
| Pay E2E (API + relayer worker) | PASS (after fix) | A sender deposits 7 USDT on-chain with an ECIES-wrapped claim key. `/v1/account/payment-intent` is posted, and the `relayer-main` auto-claim decrypts it and calls `sponsorClaim`. The recipient balance goes 0 to 7e18, and `/v1/payment/verify` shows `paid`. The 18-to-6 decimal scaling is correct |
| Relayer sponsor check | PASS | Detects unregistered relayers and prints the `cast send … addSponsor` fix. Re-checks after registering |
| Gift core flow (on-chain) | PASS | `quoteGift`, `sendGift` (auto 0.5% fee), `sponsorClaimDirect` by the gift relayer (recipient +10 USDT). A non-sponsor gets `NotSponsor` |
| Frontend app (`vite preview` :3123, env pointing at the fork) | PASS | `/`, `/gift` and `/claim/:id` return 200. Title "iUSD Pay — Stablecoin Payment & Gift on BNB Chain", and the fork RPC and addresses are baked into the bundle |
| Frontend admin (`vite preview` :3124) | PASS | `/` and `/sponsors` return 200 |
| Address checks | PASS | Mainnet USDT `0x55d3…7955` has code on 56, `decimals()`=18, symbol USDT. The default RPCs answer chainId 56 and 97 respectively |
| Browser wallet signing (MetaMask) | SKIPPED | No browser automation. The viem executor path was previously covered in MIGRATION-BNB.md |

## Bugs fixed
1. **`scripts/deploy/bsc-deploy.sh` crashed on macOS** (bash 3.2 + `set -u`): `"${VERIFY[@]}"` on an empty array raised
   `unbound variable`, so the deploy never ran without `BSCSCAN_API_KEY`. It is now `${VERIFY[@]+"${VERIFY[@]}"}`.
2. **The pay auto-claim never worked on BSC** (`api/src/services/relayer/autoClaim.ts`). The BSC view shim returns `bytes` as `0x…`,
   and `Buffer.from('0x…','hex')` yields an empty buffer, which caused an `Unknown point format` error. Every server-side auto-claim failed and was retried 3 times.
   The fix strips `0x` before decoding. The gift path already normalized this.
3. **The admin Sponsors page threw a ReferenceError** (`API` was undefined; pre-existing upstream) on preview or save. It now uses `API_V1`.
4. **Admin typecheck** (61 errors):
   - `@types/react` was 18 alongside react 19, which broke every lucide icon. Bumped to `^19.2.14` / `^19.2.3` (matching root). The lockfile was updated.
   - viem's types require `strictNullChecks`. It is now enabled in `admin/tsconfig.json`, which surfaced one nullable fix in Sponsors.tsx.
   - `GiftArtworks.tsx`: added the optional `featured`, `featured_sort` and `name` fields that the code already reads.
   - `admin` `build` is now `tsc --noEmit -p . && vite build`, so this cannot regress silently.
5. **Missed rebrand**: 14 visible "INITIA" labels (footers of receipts, invoices, verify, profile and pay-request pages, PDF templates,
   PayLink badges, the identity-card chain badge) now read "BNB CHAIN". The identity card uses a new `public/images/bnb.svg` instead of `initia.png`.
   The API Swagger description no longer says Initia.

## Known gaps (not fixed, pre-existing or by design)
- **Fee display vs chain**: `Deploy.s.sol` defaults `PAY_FEE_BPS=0`, but `/v1/payment/verify` hardcodes a 0.5% fee (cap 5) for display.
  Deploy with `PAY_FEE_BPS=50 PAY_FEE_CAP=5000000000000000000` to match the UI, or change the display.
- `/v1/sponsor-v2/*` is dead legacy code: nothing calls it, and it decodes a bearer JWT **without verifying it**.
  `/v1/account/claim` calls `sponsorClaim` inside the API process, where the relayer pool is never started (the same design as upstream).
  Claims only work through the `relayer-main` worker (auto-claim / gift worker). Consider deleting sponsor-v2.
- The TODOs in MIGRATION-BNB.md still apply: chain-history endpoints use CometBFT `tx_search`, and `.init` usernames and the invoice chain return empty.
  WalletConnect is not wired into `BnbWalletProvider`.
- Fork quirk: the anvil default accounts carry EIP-7702 delegation code on BSC testnet, so they must be cleared with `anvil_setCode`.

## Real BSC testnet deploy: remaining steps
1. **Keys**: a deployer EOA plus one relayer mnemonic (the pay, gift and sweep relayers derive from it at indices 10, 20 and 30). Fund them with
   **about 0.05 tBNB** for the deployer (the deploy is ~7.8M gas, box registration ~24 txs; at 0.1 gwei this is ~0.002 BNB, with margin) and
   **~0.01 tBNB for each relayer**.
2. `DEPLOYER_PK=… RELAYER_ADDRESS=<pay relayer> BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545 PAY_FEE_BPS=50 PAY_FEE_CAP=5000000000000000000 bash scripts/deploy/bsc-deploy.sh testnet`
3. `GIFT_POOL_ADDRESS=… DEPLOYER_PK=… BSC_RPC_URL=… bash scripts/deploy/bsc-register-gift-boxes.sh`
4. Register the gift and sweep relayers: the `relayer-main` startup prints the exact `cast send … addSponsor` commands.
5. Fill `packages/api/.env` (`IPAY_POOL_ADDRESS`, `GIFT_POOL_ADDRESS`, `MODULE_ADDRESS`=IPayPool, `IUSD_FA`=token, `DATABASE_URL`,
   `RELAYER_MNEMONIC`, `SERVER_SECRET`, `JWT_SECRET`, `ADMIN_KEY`) and the `VITE_*` equivalents for app and admin. Then rebuild.
6. Run both `node packages/api/dist/index.js` **and** `node packages/api/dist/relayer-main.js`. The claims depend on the second one.
7. Mint test USDT: `cast send $IUSD_FA "mint(address,uint256)" <you> 1000000000000000000000`.

## Real BSC Testnet deploy (chainId 97, 2026-09-25)

Deployed with `scripts/deploy/bsc-deploy.sh testnet` (RPC `https://bsc-testnet-rpc.publicnode.com`) using
`PAY_FEE_BPS=50 PAY_FEE_CAP=5000000000000000000`, so the on-chain fee now matches the 0.5% (cap 5 USDT) shown by the app and `/v1/payment/verify`.
BscScan verification was **skipped** because no API key was available.

| Contract | Address |
|---|---|
| MockERC20 "USDT" | [0x4DC7AaB064D301711573c636b08c2B7F7BD2133E](https://testnet.bscscan.com/address/0x4DC7AaB064D301711573c636b08c2B7F7BD2133E) |
| IPayPool (`feeBps`=50, `feeCap`=5e18) | [0xa2AeEaA76FCE9D4B0dE56CF58449403cA5DFA34F](https://testnet.bscscan.com/address/0xa2AeEaA76FCE9D4B0dE56CF58449403cA5DFA34F) |
| IPayGiftPool (`getBoxCount`=24) | [0xe17b45A76a7013cE1a0Ff9960287A7b076C02aD3](https://testnet.bscscan.com/address/0xe17b45A76a7013cE1a0Ff9960287A7b076C02aD3) |
| Relayer, `isSponsor`=true on both pools | [0xA23C8C58e9Fe85Aa4b7D0398A49cf2b59b54C46A](https://testnet.bscscan.com/address/0xA23C8C58e9Fe85Aa4b7D0398A49cf2b59b54C46A) |
| Deployer / owner / treasury | [0x4f00eD30da63A09F58235914Af1B6466B3c628cE](https://testnet.bscscan.com/address/0x4f00eD30da63A09F58235914Af1B6466B3c628cE) |

The deploy txs are in `packages/contracts/foundry/broadcast/Deploy.s.sol/97/run-latest.json`. Addresses are in `deployments/bsc-testnet.json`
and `packages/{api,app,admin}/.env.bsc-testnet` (addresses only). The relayer is a single wallet: `RELAYER_MNEMONICS_PAY`, `RELAYER_MNEMONICS_GIFT`
and `RELAYER_MNEMONIC_SWEEP` are all set to the same phrase, which uses the default path `m/44'/60'/0'/0/0`. The phrase is kept outside the repo.

**Smoke flow on the real testnet (PASS).** The API ran on :3120 and `relayer-main` on :3121, with a throwaway local Postgres 16 on :3125.
1. The recipient (a fresh wallet with no gas, `0xaC54…9c82`) logs in with `/v1/auth/nonce` and `/verify` (EIP-191), then `/v1/account/register` and `/v1/account/viewing-pubkey`.
2. The sender mints and approves 10 USDT, then calls `deposit` with `paymentId = sha256(plain)`, the ECIES-wrapped key for the recipient and `claimKeyHash`.
3. The sender posts `/v1/account/payment-intent`. **`relayer-main` auto-claim** decrypts the claim key and calls `sponsorClaim` about 16 s later.
4. The recipient receives **9.95 USDT**, and the treasury gets the 0.05 USDT fee (0.5%). `/v1/payment/verify` then returns `status: paid`, `feeMicro: 50000`.

| Step | Tx | Gas |
|---|---|---|
| mint 10 USDT | [0x7435cca3…4432](https://testnet.bscscan.com/tx/0x7435cca39586f2833cb9e94c76b6518837cbbca43210bc1cf4ef12ce86894432) | 68,108 |
| approve | [0x8dbb01f8…ae5c](https://testnet.bscscan.com/tx/0x8dbb01f8e5b1bf291343bea53abc337d0899ba77a345f06b7493c265a9deae5c) | 45,971 |
| deposit | [0xfda7199f…db6c](https://testnet.bscscan.com/tx/0xfda7199fc4408b2803be54a759bf2e8e221d5aaec45968bf8bce99652302db6c) | 796,226 |
| relayer sponsorClaim | [0x3e99dc46…94f9](https://testnet.bscscan.com/tx/0x3e99dc465b5b9fa944392391e5a0c68da53d2b8a1b95990531876dfbea1094f9) | 77,948 |

Other live checks: `/health`, `/v1/config` (chainId 97 and the live addresses), and `/v1/gift/boxes` (24 boxes, read on-chain) all work. The app is built with
`vite build --mode bsc-testnet` and served by `vite preview` on :3122. `/`, `/gift` and `/claim/:id` return 200, and the live pool address and RPC are in the bundle.
Admin on :3123 returns 200 for `/` and `/sponsors`. All processes were stopped afterwards.

**Gas spent:** about 0.0015 tBNB from the group wallet. That covers the deploy (~0.00078), 24 box registrations (~0.0008) and the smoke txs. Another 0.01 tBNB went to the relayer, and it has used ~0.000008 of it.

**What's left**
- Verify the contracts on BscScan once an API key is available.
- The gift send and claim flow was not repeated live. It was proven on the fork, and the relayer is already a sponsor on the gift pool.
- `/v1/config` still reports the hardcoded `fee.bps: 5` (`routes/public/config.ts`), not the on-chain 50. The app does not read it, but it should be changed to 50 or read from `feeBps()`.
- The `/v1/payment/verify` `txHash` field stays null after auto-claim. The claim tx is stored in `payment_intents.auto_claim_tx`, but it is not surfaced.
- A hosted Postgres and hosted API/relayer are needed for a public demo. `VITE_API_BASE` in `.env.bsc-testnet` points at localhost:3120.
