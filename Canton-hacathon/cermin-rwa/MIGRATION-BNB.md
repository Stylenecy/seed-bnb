# Cermin-RWA — Migration from Canton Network to BNB Chain

Original target: **Canton Network** (Daml smart contracts, CN Quickstart LocalNet / Canton DevNet, JSON Ledger API v1/v2 with OAuth2).
New target: **BNB Smart Chain** — BSC testnet (chainId 97) by default, BSC mainnet (56) via `CHAIN_ID`.

## Summary

| Layer | Before (Canton) | After (BNB Chain) |
|---|---|---|
| Contracts | Daml templates `daml/` | Solidity/Foundry `contracts/` (`CerminRWA.sol`, `RwaPriceFeed.sol`, `MockToken.sol`); Daml moved to `legacy/daml/` |
| Parties | Canton parties hosted on a validator | EOAs: operator (issuer + pool + oracle), Guard Agent, one custodial demo EOA per username |
| Agent | JSON Ledger API v1/v2 clients (JWT / OAuth2) | `agent/src/evmLedger.ts` (viem) behind the unchanged `Ledger` seam; `guard.ts` untouched |
| Backend | JSON API v1/v2 clients, party allocation, Canton faucet | `backend/src/evmLedger.ts` (viem) behind the unchanged `Ledger` seam; HTTP API unchanged |
| Frontend | "Canton DevNet" copy, privacy claims | BNB Chain copy; privacy claims replaced with honest control claims; `0x…` address pill |
| Local dev | `daml start` / LocalNet Docker (`scripts/dev.sh`) | anvil `--chain-id 97` + forge deploy + backend + agent (`scripts/dev.sh`) |

### cn-quickstart — dropped

`Canton-hacathon/cn-quickstart/` was an unmodified clone of Digital Asset's Canton Network quickstart
(LocalNet Docker Compose, licensing sample app, Nix/Gradle tooling). It contained no Cermin logic —
it was pure Canton infrastructure used only by the old `scripts/localnet.sh` — so it was **deleted** from
this copy. (Upstream: https://github.com/digital-asset/cn-quickstart.)

## Daml → Solidity mapping (`contracts/src/CerminRWA.sol`)

| Daml | Solidity |
|---|---|
| `Assets.TreasuryToken` / `StableCoin` (+ propose/accept, Split, Merge) | `MockToken` ERC-20s `mUST` / `mUSD` (18 dec, owner-mint) |
| `TreasuryToken.Lock` / `Unlock` | collateral escrowed in `CerminRWA` on `acceptOffer` / `topUpCollateral`; released by new `closeLoan()` once repaid |
| `Oracle.PriceFeed.UpdatePrice` | `RwaPriceFeed.updatePrice(instrumentId, price)`; `round` counter replaces the changing contract id |
| `Credit.LendingPoolOffer.AcceptOffer` / `WithdrawOffer` | `createOffer` (pool) / `acceptOffer` (borrower) / `withdrawOffer` |
| `Loan.Repay` / `ApplyRepayment` / `TopUpCollateral` | `repay` / internal `_applyRepayment` / `topUpCollateral` |
| `Loan.LastResortDefault` + `GracePeriod` (72h) | `lastResortDefault` (pool, after expired grace; collateral goes to pool — was off-ledger on Canton) |
| `Guard.GuardPolicy` | `setGuardPolicy` |
| `Guard.ShadowVault` TopUp / Withdraw / GuardRepay / StartGracePeriod | `openShadowVault` / `topUpVault` / `withdrawVault` / `guardRepay` / `startGracePeriod` |
| `Guard.RescueEvent` | `RescueEvent[]` per borrower + `Rescued` event |
| `Coupon.CouponDistribution` ClaimCoupon / SweepToLoan, `payCoupon` script | `payCoupon` (issuer, pre-funded in mUSD) / `claimCoupon` / `sweepToLoan` |

Same math and demo numbers: 10,000 mUST @ 1.00 → 0.76, 6,000 mUSD loan, trigger 130% / target 145%,
maxRepay 2,000, vault 1,500 → one `guardRepay` of 758.62 → outstanding 5,241.38 @ 14,500 bps; coupon
sweep 112.50 → 5,128.88 @ 14,818 bps (asserted in `contracts/test/CerminRWA.t.sol`).

Semantic differences (intentional, documented):
- **Privacy is gone.** Canton showed each contract only to its named parties; on BNB Chain all state and
  events are public. UI/README copy was changed from "the pool never sees it" to "the pool can't touch it".
  The narrow-delegation guarantee (guard can only repay below the trigger) is preserved on-chain.
- **Real token flows.** Daml modelled the Shadow Vault as an abstract Decimal; here the vault holds real mUSD,
  the principal is actually disbursed, and repayments are transferred to the pool.
- One live loan / policy / vault per borrower (same as the original backend + agent assumption).

## Custody model (backend)

Canton parties were hosted on a validator and the backend submitted on their behalf. The EVM equivalent here:
each username maps to an EOA derived from `USER_KEY_SECRET` (`keccak256(secret:slug)`), the backend signs that
user's own txs, drips a little tBNB for gas from the operator (`GAS_DRIP_WEI`), and sets token approvals on
onboard. The address → username map is persisted in `USERS_DB_PATH`. **Testnet demo only**; a production
version should have users sign with their own wallet (wagmi/RainbowKit — not implemented).

## Files changed

- Added: `contracts/` (Foundry project, OZ 5.0.2 + forge-std vendored in `contracts/lib`), `agent/src/evmLedger.ts`,
  `agent/src/abi.ts`, `backend/src/evmLedger.ts`, `backend/src/abi.ts` (ABIs generated from `contracts/out`),
  `backend/.gitignore`, `legacy/README.md`, this file.
- Agent: `src/index.ts` (EvmLedger wiring, no overlapping cycles), `src/ledger.ts` (Canton clients removed; `Ledger`
  seam + `MockLedger` kept), `package.json` (+viem), `.env.example`; removed `test/ledger-v2.test.ts`.
- Backend: `src/ledger.ts` (Canton clients removed; seam + `MockLedger` + new `createLedger`), `package.json` (+viem),
  `.env.example`; removed `test/oauth.test.ts`.
- Frontend: copy in `Landing`, `Onboarding`, `Connect`, `Dashboard`, `BorrowFlow`, `Vault`, `NavBar`, `PrivacyBadge`,
  `AddressPill` (0x truncation), `store.ts`, `lib/backend.ts`; `Landing.test.ts` expectation updated.
- Moved to `legacy/`: `daml/`, `deploy/devnet/`, `scripts/{dev.sh,stop.sh,localnet.sh,seed-ledger.mjs,seed-localnet.mjs}`.
- New `scripts/dev.sh` / `scripts/stop.sh` (anvil-based local stack).
- Docs: `README.md` rewritten, `CLAUDE.md` stack/rules updated, banner added to `STATE.md`. `docs/`, `pitch/`,
  `video/`, `SUBMISSION.md` left as historical Canton material.

## Verification

- `forge build` ✅; `forge test` ✅ 15/15 (ports of the Daml Credit/Guard/Coupon scripts; privacy tests have no EVM analogue).
- `forge script script/Deploy.s.sol` simulation ✅.
- Agent: `tsc --noEmit` ✅, tests ✅ 20/20. Backend: `tsc --noEmit` ✅, tests ✅ 43/43. Frontend: `tsc -b` ✅, vitest ✅ 203/203, `vite build` ✅.
- **Local end-to-end on anvil (chain id 97)** via `scripts/dev.sh` + HTTP: onboard → faucet → borrow → `/api/sim/price 0.76`
  → Guard Agent fired `guardRepay` → position 5,241.38 @ 14,500 bps with RescueEvent; coupon sweep path also verified
  (→ 5,128.88). Nothing deployed to BSC; no real transactions.

## TODO

1. Create two funded BSC testnet keys (operator, guard agent) — faucet: https://www.bnbchain.org/en/testnet-faucet.
2. Deploy:
   ```bash
   cd contracts && cp .env.example .env    # PRIVATE_KEY (operator), GUARD_AGENT_ADDRESS, BSCSCAN_API_KEY
   set -a; source .env; set +a
   forge script script/Deploy.s.sol:Deploy --rpc-url bsc_testnet --private-key $PRIVATE_KEY --broadcast \
     --verify --etherscan-api-key $BSCSCAN_API_KEY
   ```
3. Fill `backend/.env` (`MOCK_LEDGER=false`, `CERMIN_RWA_ADDRESS`, `OPERATOR_PRIVATE_KEY`, `GUARD_AGENT_ADDRESS`,
   `USER_KEY_SECRET`) and `agent/.env` (`MOCK_LEDGER=false`, `CERMIN_RWA_ADDRESS`, `GUARD_AGENT_PRIVATE_KEY`); set
   `VITE_API_URL` for the frontend. Record addresses in README.
4. Keep the operator stocked with tBNB (it pays each new user's gas drip).
5. Optional: replace custodial demo accounts with user wallets (wagmi + `bscTestnet`); add BscScan links for tx hashes.
6. Mainnet: mocks (`MockToken` owner-mint, `RwaPriceFeed` owner-set) are testnet-only; a real deployment needs a real
   RWA token + stablecoin (e.g. BSC USDT `0x55d398326f99059fF775485246999027B3197955`, 18 dec) and a real oracle.
7. Update `docs/` / pitch material if they will be presented for the BNB version.
