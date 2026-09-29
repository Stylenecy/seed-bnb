# Migration: Mantle Sepolia -> BNB Chain

BridgeAgent trades on Hyperliquid (via Byreal Perps); only the on-chain identity/provenance layer (ERC-8004 `IdentityRegistry` + `TradeJournal`) lived on Mantle. That layer now targets BNB Smart Chain: BSC Testnet (97) by default, BSC Mainnet (56) optional.

## What changed
- **contracts/**: `foundry.toml` RPC + verification entries `bsc_testnet` / `bsc` (BscScan); `Deploy.s.sol` usage comment updated; new `.env.example`. Solidity logic unchanged. The Mantle broadcast record (`broadcast/Deploy.s.sol/5003`) moved to `legacy/mantle-sepolia-broadcast/`.
- **bridgeagent/** (Python):
  - Package `bridgeagent.mantle` renamed to `bridgeagent.bnb`; `MantleClient` renamed to `BnbClient`; `run_mantle_flush` / `_init_mantle` / `_enqueue_mantle_mirror` renamed to `*_bnb*`; log tag `[MANTLE]` is now `[BNB]`.
  - Env vars `MANTLE_*` renamed to `BNB_*` (`BNB_RPC_URL`, `BNB_CHAIN_ID` default 97, `BNB_PRIVATE_KEY`, `BNB_IDENTITY_REGISTRY`, `BNB_TRADE_JOURNAL`, `BNB_AGENT_ID`, `BNB_FLUSH_INTERVAL`). Default RPC is the BSC testnet RPC. **Existing `.env` files must be updated.**
  - `scripts/mantle_smoke_test.py` renamed to `scripts/bnb_smoke_test.py`; balances print in BNB.
- **web/** (Next.js + viem): `lib/chain.ts` now uses `bsc` / `bscTestnet` from `viem/chains` (picked by `NEXT_PUBLIC_CHAIN_ID`, RPC override `NEXT_PUBLIC_BSC_RPC_URL`); explorer links go to BscScan. Env vars renamed to `NEXT_PUBLIC_BSC_*`. The Mantle contract address fallbacks were removed (zero-address placeholder until deployed). UI labels show BSC Testnet / chain id dynamically. New `web/.env.example`.
- README files rebranded to BNB Chain.

## Verification
- `forge build` OK, `forge test` 13/13 passing.
- `python3 -m compileall` OK for `bridgeagent/src` and `scripts` (runtime deps not installed, so no import/run test).
- `web`: `pnpm install --frozen-lockfile` + `tsc --noEmit` passes.

## TODO
- Deploy `IdentityRegistry` + `TradeJournal` to BSC Testnet (not done), then fill the addresses in `bridgeagent/.env`, `web/.env.local`, and the README table.
- Run `bnb_smoke_test.py` to register the agent and set `BNB_AGENT_ID` / `NEXT_PUBLIC_BSC_AGENT_ID`.
- Optional: use the canonical ERC-8004 registry on BSC instead of the custom one (check the official address first).
- `docs/` (setup, demo script) is gitignored/not in this copy; update any Mantle references there if restored.

## Deploy to BSC Testnet
```bash
cd contracts
cp .env.example .env   # set PRIVATE_KEY (funded with tBNB) and BSCSCAN_API_KEY
source .env
forge script script/Deploy.s.sol --rpc-url bsc_testnet --private-key $PRIVATE_KEY --broadcast --verify
```
Faucet: https://www.bnbchain.org/en/testnet-faucet, explorer: https://testnet.bscscan.com
