# iUSD Pay: Initia to BNB Chain migration

Status: **contracts + backend + frontend wired for BSC; not yet deployed.**
Default network: **BSC testnet (chainId 97)**. Mainnet (56) is supported by env.

## What changed

### Contracts (Move to Solidity)
| Before (Initia Move) | After (BNB Chain, Foundry) |
|---|---|
| `ipay::pay_v3` | `packages/contracts/foundry/src/IPayPool.sol` |
| `ipay::gift_v3` | `packages/contracts/foundry/src/IPayGiftPool.sol` |
| iUSD fungible asset (6 dec) | ERC-20 stablecoin: USDT `0x55d398326f99059fF775485246999027B3197955` on mainnet (18 dec), `MockERC20.sol` on testnet |
| `initiad move deploy` + `03-init.sh` | `script/Deploy.s.sol` via `scripts/deploy/bsc-deploy.sh` |
| `re-register-gift-boxes-baked.sh` | `scripts/deploy/bsc-register-gift-boxes.sh` (same 24 boxes, `cast send`) |

The logic is the same: state machine, fees and caps, multi-owner, sponsor (relayer)
allowlist, freeze registry, emergency withdraw, direct / group-random / group-equal gifts,
and the random-split algorithm. The on-chain hashing is **byte-compatible** with the
Move version, so the existing client crypto is unchanged:
`sha256(claimKey)`, slot proofs `sha256(secret || 32-byte padded address)`, and the seed `sha256(seed || u64 LE)`.

Deliberate differences:
- One contract per pool, so the Move `pool: Object<...>` argument is gone.
- Expiry uses `block.timestamp`. The Move version compared a **block height** against a TTL in **seconds**.
- Amount limits (0.1 min / 100k max / 1000 cap / 0.01 slot share) scale with `token.decimals()`.
- `refund` needs a token approval from the claimer, and it emits a `PaymentRefunded` event.
- Custom errors replace the Move abort codes.
- The Move sources now live in `packages/contracts/legacy/move/` (reference only).
- The old Initia-rollup Hardhat helper (`packages/contracts/evm`, OPinit bridge wrapper) was removed.

Tests: `cd packages/contracts/foundry && forge test` passes all 18 tests (10 pay, 8 gift).

### Compatibility layer (`src/lib/bnb/`)
Most of the app and API was written against Initia shapes: BCS `MsgExecute` messages, the
`/initia/move/v1/.../view_functions` REST endpoints and `/cosmos/bank` balances. Rewriting
~80 call sites would have been a redesign. Instead, one table maps each Move function to its
Solidity twin: `moveCompat.ts`, with identical copies in app, admin and api.
- **Writes**: `executor.ts` (app/admin, viem) and `evm.ts` (api, ethers) decode the BCS or `MoveArg`
  args and call the contract. Before `deposit`, `send_gift*` and `refund` they check the ERC-20
  allowance and approve it first if needed.
- **Reads**: `installBnbFetchShim()` intercepts the legacy Initia REST URLs on any host.
  It answers them from BSC in the same JSON shape: view functions, bank balances, tx lookup,
  account lookup and feegrant.
- **Amounts**: the app, DB and API keep 6-decimal "micro" units. The adapter scales them by `10^(TOKEN_DECIMALS-6)` at the chain boundary.

### Frontend (`packages/app`, `packages/admin`)
- InterwovenKit, wagmi and Privy were replaced by `BnbWalletProvider`. It works with any injected
  EIP-1193 wallet (MetaMask, Trust Wallet, Binance Web3 Wallet) through viem, and it
  auto-switches or adds BSC. `useInterwovenKit()` is kept as a compatible hook, so pages did not change.
- The `@initia/interwovenkit-react`, `wagmi` and `@cosmjs/*` dependencies were removed.
- The Interwoven Bridge deposit modal (`DepositModal.tsx`, `services/deposit.ts`) was removed. The "+" buttons
  open the BSC faucet on testnet or the token page on mainnet. The InterwovenKit demo page was removed.
- Chain config comes from `src/lib/bnb/chain.ts`. Explorer links point to BscScan (`/tx/`, `/address/`).
- Rebranding: "Initia" becomes "BNB Chain" and "INIT" becomes "BNB" in all 19 locales, in the legal text, PDFs,
  `index.html` meta and the admin pages. The token label "iUSD" becomes "USDT". The product name **iUSD Pay** is unchanged.

### Backend (`packages/api`)
- `RelayerInstance` signs and sends EVM transactions with ethers on BSC. Callers still submit
  Move-shaped params. Fee grants are a no-op because BSC has no feegrant: users pay their own BNB gas, and
  relayer `sponsor*` claims still cover claim gas.
- The sponsor-registration check reads `isSponsor` on-chain. The printed fix is now a `cast send ... addSponsor` command.
- Login signature verification is now **strict** (EIP-191). The Privy bypass was removed.
- The unused Cosmos tx signer (`lib/txSigner.ts`) was deleted, and the `@cosmjs/*` deps were removed.
- `.env.example` files were added for app, admin, api and contracts.

## Deploying to BSC testnet
```bash
# 0. test BNB: https://www.bnbchain.org/en/testnet-faucet
cd packages/contracts/foundry
forge install foundry-rs/forge-std --no-git                          # lib/ is gitignored
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge test

# 1. deploy MockERC20 "USDT" + IPayPool + IPayGiftPool (adds RELAYER_ADDRESS as sponsor)
cd ../../..
DEPLOYER_PK=0x... RELAYER_ADDRESS=0x... \
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
  bash scripts/deploy/bsc-deploy.sh testnet

# 2. gift box catalog
GIFT_POOL_ADDRESS=0x... DEPLOYER_PK=0x... BSC_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
  bash scripts/deploy/bsc-register-gift-boxes.sh

# 3. copy packages/{api,app,admin}/.env.example -> .env and fill:
#    IPAY_POOL_ADDRESS, GIFT_POOL_ADDRESS, MODULE_ADDRESS (= IPayPool), IUSD_FA (= token)
#    (VITE_* equivalents for app/admin). Fund relayer wallets with test BNB.
# 4. mint test USDT: cast send $IUSD_FA "mint(address,uint256)" <you> 1000000000000000000000 ...
```
Mainnet: `TOKEN_ADDRESS=0x55d398326f99059fF775485246999027B3197955 bash scripts/deploy/bsc-deploy.sh mainnet`,
then set `EVM_CHAIN_ID=56` / `VITE_EVM_CHAIN_ID=56`.

## Verification done
- `forge build` and `forge test`: 18 of 18 pass.
- A standalone `tsc --strict` check on the new `lib/bnb/*` modules (app, admin, api) and the rewritten `RelayerInstance.ts` passes.
- End-to-end on a local anvil (chain id 97) with a real deploy through the adapters:
  - api/ethers: `deposit`, the `get_payment_full` view through the fetch shim, relayer `sponsor_claim`, balance shim, and the feegrant no-op.
  - app/viem: admin `register_box`, auto-approve plus `send_gift_group_equal`, a proof-bound `claim_slot`,
    the `get_slots_summary` view, and rejection of a wrong proof (`InvalidProof`).
  - `bsc-register-gift-boxes.sh` registered all 24 boxes.
- The edited TSX/TS files pass an esbuild syntax check. **The full `tsc`/`vite build` of app, admin and api was
  not run**, because the monorepo dependencies are not installed (heavy: canvas, snarkjs, and so on).

## TODO / known gaps
- **Deploy** to BSC testnet and fill the env vars. Nothing is deployed and no keys are in the repo.
- Run `pnpm install && pnpm -r build` once and fix any type errors in untouched pages.
- **Chain-history endpoints**: `routes/user/account.ts` uses CometBFT `tx_search`, and `app/src/lib/chainHistory.ts`
  (unused) does the same. On BSC these return empty, so history relies on the DB. Port them to
  `eth_getLogs` on the `PaymentCreated` and `PaymentClaimed` events.
- **Initia-only features with no BSC equivalent** (these now return 404 or empty): `.init` usernames
  (`lib/usernames.ts`, `routes/internal/usernames.ts`), `invoice_v1` routes (`routes/internal/invoiceChain.ts`;
  the module was already deprecated), fee grants, Interwoven bridge deposit/withdraw, and auto-sign.
- Mobile WalletConnect login (`lib/walletConnectMobile.ts`) now targets `eip155:97/56`. The session it creates
  is not yet fed into `BnbWalletProvider`, which only uses the injected `window.ethereum`. Add a
  WalletConnect/EIP-1193 provider there for in-app browsers without an injected wallet.
- The Dashboard gas panel still shows a "USDC" (IBC denom) row that is always 0 on BSC. Remove it or map it to FDUSD/USDC.
- CI (`.github/workflows/*.yml`) needs the new vars: `EVM_CHAIN_ID`, `BSC_RPC_URL`, `TOKEN_DECIMALS`,
  `GIFT_POOL_ADDRESS`, `VITE_EVM_CHAIN_ID`, `VITE_BSC_RPC_URL`, `VITE_GIFT_POOL_ADDRESS`, `VITE_TOKEN_*`.
- `packages/sdk` (unused by app/api) still has the Initia chain registry. `.initia/submission.json` is kept as history.
- Consider moving the per-payment ciphertext off-chain or into events. On BSC, storing large `bytes` in state costs more gas than it did on Initia.
