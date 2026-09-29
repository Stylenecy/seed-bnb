# Gridora: BNB Chain migration

Status: **nothing to migrate. Gridora is already BNB Chain-native.**

An audit of the project found that every chain-specific piece already targets BNB Smart Chain:
- `contracts/foundry.toml`: RPC aliases `bsc` / `bsc_test` and BscScan verification for chainIds 56 and 97.
- `contracts/script/Deploy.s.sol` has a guard: `require(block.chainid == 56 || block.chainid == 97)`.
- `frontend/web/lib/chain.ts` uses viem `bsc` / `bscTestnet`. It defaults to testnet, and the explorer comes from the chain config (BscScan).
- `frontend/web/.env.example` and `backend/.env.example` use BSC testnet RPC, `GRIDORA_CHAIN_ID=97` and `GRIDORA_TESTNET=true`.
- Backend execution runs through the Trust Wallet Agent Kit adapter `bsc_twak`. Market data comes from CoinMarketCap via x402.
- README, CLAUDE.md and the video scenes already describe BNB Smart Chain (the ERC-8004 agent lives on BSC mainnet).

A grep for Celo, Monad, Mantle, Stellar, Soroban, Canton, Flow, Base, Sepolia, Arbitrum, Initia and Polygon found no
chain references outside unrelated words (for example "flowchart" and "initial").

## Changes
None, apart from this file.

## Verification
- `cd contracts && forge build`: compiles. The artifacts were up to date, and `lib/` (forge-std, OpenZeppelin) is present.

## Deploy to BSC testnet (unchanged flow)
```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url bsc_test --broadcast --private-key $DEPLOYER_PK
# copy the printed addresses into backend/.env (GRIDORA_*_ADDR) and frontend/web/.env (NEXT_PUBLIC_*_ADDR)
```

## TODO
- None related to the chain migration. The mainnet contracts are already deployed and verified (see README).
