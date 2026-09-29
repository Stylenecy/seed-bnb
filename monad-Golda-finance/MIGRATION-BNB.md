# Migration: Monad -> BNB Chain

## What changed
- `Contracts/foundry.toml`: replaced `monad-testnet` RPC with `bsc_testnet` / `bsc` endpoints (env-driven) and BscScan verification config.
- `Contracts/script/DeployGolda.s.sol`: removed hard-coded Monad USDC / LI.FI / Uniswap factory addresses. Now env-driven:
  - `STABLE_TOKEN` empty -> deploys `MockUSDT` (18 decimals, like BSC USDT).
  - `PAXG_TOKEN` empty -> deploys `MockPAXG`.
  - `PANCAKE_V3_POOL` -> PAXG/stable PancakeSwap V3 pool for the TWAP (optional; vault values PAXG at 0 until set via `setUniV3Pool`).
  - `LIFI_DIAMOND` defaults to the LI.FI Diamond `0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE` (BSC mainnet).
- `Contracts/src/MockUSDT.sol`: new 18-decimal testnet stable.
- `Contracts/.env.example`: BSC RPCs, BscScan key, token/pool overrides.
- README / CLAUDE.md / PLANNING.md rebranded to BNB Chain; Uniswap V3 TWAP -> PancakeSwap V3 TWAP.
- `GoldaVault.sol` logic unchanged: it reads decimals from the tokens, and PancakeSwap V3 pools expose the same `observe()` / `token0()` / `token1()` interface as Uniswap V3.

## Verification
- `forge build` OK, `forge test`: 24/24 passing (tests still use a 6-dec mock USDC; vault is decimals-agnostic).

## TODO
- Deploy (no deploy was performed). Fund the deployer with testnet BNB from https://www.bnbchain.org/en/testnet-faucet.
- Mainnet: confirm BEP-20 PAXG address and a liquid PancakeSwap V3 PAXG/USDT pool with enough observation cardinality for a 300s TWAP.
- LI.FI has no BSC testnet support: `executeRebalance` can only be exercised on mainnet (or against a mock router on testnet).
- LI.FI selectors: DONE, replaced with `0x4666fc80` / `0x5fd9ae2e` (see VERIFY-BNB.md).
- The `/FE` Next.js app referenced in the README is not in this repo; when added, use `bsc` / `bscTestnet` from `viem/chains` and Privy with BSC.

## Deploy to BSC Testnet
```bash
cd Contracts
cp .env.example .env   # fill PRIVATE_KEY, BSCSCAN_API_KEY
source .env
forge script script/DeployGolda.s.sol:DeployGolda \
  --rpc-url bsc_testnet --private-key $PRIVATE_KEY --broadcast --verify
```
Explorer: https://testnet.bscscan.com
