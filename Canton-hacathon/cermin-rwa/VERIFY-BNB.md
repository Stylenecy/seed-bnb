# Cermin-RWA — BNB Chain verification (2026-09-25)

Verdict: **WORKS on a BSC testnet fork.** The contracts deploy with the real script, and the backend and Guard Agent
run against the fork and drive the whole product flow on-chain. No real-network writes were made (no funded key).

Environment: `anvil --fork-url https://bsc-testnet-rpc.publicnode.com --chain-id 97` (fork block 132,964,018),
anvil default keys (operator = #0, guard = #1). The env files were written to a scratch dir, not the repo.

## Checks

| Check | Result | Notes |
|---|---|---|
| `forge build` | PASS | Only lint notes |
| `forge test` | PASS | 15/15 |
| Fork deploy (`script/Deploy.s.sol --broadcast`) | PASS | CerminRWA, mUST, mUSD, RwaPriceFeed all have code; 4.84M gas total |
| Backend typecheck + tests | PASS | `tsc --noEmit`, 43/43 |
| Agent typecheck + tests | PASS | `tsc --noEmit`, 20/20 |
| Backend on fork (`MOCK_LEDGER=false`) | PASS | `/api/onboard` derived a user EOA and dripped gas; `/api/faucet` minted 10,000 mUST; `/api/borrow` accepted 10,000 mUST collateral, disbursed 6,000 mUSD and funded a 1,500 vault; `/api/vault/withdraw` and `/api/price-history` returned 200 |
| Core flow: Guard rescue | PASS | `/api/sim/price 0.76` → health 12,667 bps → Guard Agent called `guardRepay` on its own → outstanding **5,241.38 @ 14,500 bps**, RescueEvent recorded (matches the Daml/forge numbers) |
| Core flow: coupon sweep | PASS | `cast send payCoupon(user, guard, 10000e18)` as issuer → agent `sweepToLoan` → outstanding **5,128.88 @ 14,818 bps** |
| Frontend `tsc -b` + vitest + `vite build` | PASS | 203/203 tests; bundle 419 kB |
| Frontend run (`vite preview` :3131, `VITE_API_URL` → fork backend) | PASS | `/` and `/dashboard` return 200; the backend URL is baked into the bundle; no chain-mismatch text. The only "Canton" strings are the intentional "originally built for…" credits |
| Address checks (real BSC) | PASS | The only hardcoded BSC address is in the docs: USDT `0x55d398326f99059fF775485246999027B3197955` has code on BSC mainnet, symbol USDT, **18 decimals** (as documented). Default testnet RPC `data-seed-prebsc-1-s1` returns chainId 97 |

## Bugs fixed

None needed; everything passed as migrated.

## Notes / gotchas

- On real BSC testnet and mainnet, anvil's well-known default accounts (#0–#4) carry **EIP-7702 delegation code**
  (`0xef0100…`, sweeper bots). A fork inherits it, so any BNB sent to those addresses is forwarded away. The operator's
  gas drips go *out* to fresh derived user EOAs, so this flow wasn't affected. For other fork tests, first run
  `cast rpc anvil_setCode <addr> 0x`.
- The frontend never talks to the chain directly (everything goes through the backend), so it has no wallet or RPC config.

## Steps remaining for a real BSC testnet deploy

1. Create two fresh keys: an operator (issuer + pool + oracle + gas-drip funder) and a Guard Agent.
2. Fund them from https://www.bnbchain.org/en/testnet-faucet:
   - Deploy: ~4.84M gas × 0.1 gwei ≈ **0.0005 tBNB**.
   - Gas drips: the operator sends each new user `GAS_DRIP_WEI` (default 0.003 tBNB), so budget about **0.003 tBNB per demo user**.
   - Guard Agent: ~0.01 tBNB is plenty.
   - Recommended total: **~0.1 tBNB for the operator and 0.01 for the guard**.
3. `cd contracts && PRIVATE_KEY=… GUARD_AGENT_ADDRESS=… forge script script/Deploy.s.sol:Deploy --rpc-url https://bsc-testnet-rpc.publicnode.com --broadcast [--verify --etherscan-api-key $BSCSCAN_API_KEY]`
4. `backend/.env`: set `MOCK_LEDGER=false`, `CHAIN_ID=97`, `BSC_RPC_URL`, `CERMIN_RWA_ADDRESS`, `OPERATOR_PRIVATE_KEY`,
   `GUARD_AGENT_ADDRESS`, `USER_KEY_SECRET` (a new random value) and `USERS_DB_PATH`.
   `agent/.env`: set `MOCK_LEDGER=false`, `CHAIN_ID=97`, `BSC_RPC_URL`, `CERMIN_RWA_ADDRESS` and `GUARD_AGENT_PRIVATE_KEY`.
5. Frontend: build with `VITE_API_URL=<public backend URL>`.

## Real BSC Testnet deploy (2026-09-25)

Deployed with `script/Deploy.s.sol` to **real BSC testnet (chainId 97)** at 0.1 gwei, deploy block 132,984,577, 4,837,995 gas (~0.00048 tBNB).
The operator and Guard Agent are separate fresh wallets: the operator was funded with 0.05 tBNB and the guard with 0.01 tBNB.
Addresses are in `contracts/deployments/bsc-testnet.json` and `.env.bsc-testnet` (addresses only; `.env.*` is gitignored here, so the json is the committed copy). Not verified on BscScan (no API key in env).

| Name | Address |
|---|---|
| CerminRWA | [0x8651515462D17b6f4E7AEDe854E4C872C9eB64F2](https://testnet.bscscan.com/address/0x8651515462D17b6f4E7AEDe854E4C872C9eB64F2) |
| mUST | [0x3cf630d564b7ebEf6ff89D1aDACBA05CE9C03fC4](https://testnet.bscscan.com/address/0x3cf630d564b7ebEf6ff89D1aDACBA05CE9C03fC4) |
| mUSD | [0x11a430cf299dA0962783cB9851a81BB3Af20Ef50](https://testnet.bscscan.com/address/0x11a430cf299dA0962783cB9851a81BB3Af20Ef50) |
| RwaPriceFeed | [0x76B6F4b25216CD5e234d3D59A0e11fCA6790177E](https://testnet.bscscan.com/address/0x76B6F4b25216CD5e234d3D59A0e11fCA6790177E) |
| Operator EOA | [0x486a0a8A3Da3a2d752697BE8270976FCC3d36B7d](https://testnet.bscscan.com/address/0x486a0a8A3Da3a2d752697BE8270976FCC3d36B7d) |
| Guard Agent EOA | [0x5be38f0754454e7fbD93EB6615E33cE009070130](https://testnet.bscscan.com/address/0x5be38f0754454e7fbD93EB6615E33cE009070130) |

### Smoke flow on real testnet

The backend (`MOCK_LEDGER=false`, :3131) and the Guard Agent ran against real testnet with their keys passed through the shell env (no key files in the repo). The flow was driven over HTTP, as in the fork run.

| Step | Tx / result |
|---|---|
| `/api/onboard` `bsc-smoke-1` | user EOA [0xe9f695E8…F28f](https://testnet.bscscan.com/address/0xe9f695E817561a5EAc0ed4353A7a7801AC24F28f); operator dripped 0.003 tBNB |
| `/api/faucet` | minted 10,000 mUST |
| `/api/borrow` (10,000 mUST, 6,000 mUSD, trigger 130%, vault 1,500) | acceptOffer [0x5a73fd33…](https://testnet.bscscan.com/tx/0x5a73fd33373e9451223b44dd8a1ab2d991f1177d23a1a80401a98ed55e53c46c), guard policy [0x012e0347…](https://testnet.bscscan.com/tx/0x012e03470c113197725fdfd4ac3b54dee93df5c84f6fc66d7d4d10d62bddba57), shadow vault [0x991f09ee…](https://testnet.bscscan.com/tx/0x991f09ee9e70773ca5b113a4c397bc0681bd0ed2e8410ed1c619e6cd38d4da92); health 16,667 bps |
| `/api/sim/price 0.76`, then the Guard Agent `guardRepay` on its own | [0x22f39dad…](https://testnet.bscscan.com/tx/0x22f39dadf24feb2fc677bb4b7d2778475e7fde04cd54173394ea44dbdc28eaf5), which repaid 758.62, giving **5,241.38 @ 14,500 bps** plus a RescueEvent |
| `payCoupon(user, guard, 10000e18)` as issuer (cast) | [0x91fa1002…](https://testnet.bscscan.com/tx/0x91fa1002c3a5417d8b06dc4d48bb3d6f273b0abb626040adc21d87808246a75d) |
| Guard Agent `sweepToLoan` | [0x51259d1b…](https://testnet.bscscan.com/tx/0x51259d1bf8bdba3b8e8ebfdb688a6cb26d9bf61a145b5a4b97fbfbbbfc1d71bc), which applied 112.50, giving **5,128.88 @ 14,818 bps** |

Every receipt has status 1, and the numbers match the forge tests and the fork run exactly.

**Gas spent (tBNB):** the operator went from 0.05 to 0.046472, which is ~0.0035 including the 0.003 user drip. The guard went from 0.01 to 0.009946 (~0.000054). The demo user used ~0.00007 of its drip. The group wallet also paid ~0.00000004 of transfer gas. Total burned as gas is ~0.0006; the rest is still held by the role wallets.

**Frontend:** built with `VITE_API_URL=http://localhost:3131` and served with `vite preview --port 3132`. `/` and `/dashboard` returned 200, the backend URL is baked into the bundle, and `/api/price-history` on the live backend returned 200. All processes were stopped afterwards.

**What works live:** deploy, custodial onboard with gas drip, faucet, borrow (collateral escrow, disbursal, shadow vault), autonomous Guard rescue, and coupon sweep.
**What's left:** BscScan verification; hosting the backend, agent and frontend publicly; users signing with their own wallets instead of custodial derived EOAs; a real RWA token, stablecoin and oracle for mainnet. The operator needs a top-up of ~0.003 tBNB per new demo user, and ~0.046 tBNB now covers about 15 users.
