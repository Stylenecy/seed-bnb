# Gridora: BNB Chain verification

Date: 2026-09-25. Environment: a local anvil fork of BSC testnet (`--chain-id 97`, forked at block ~132,964,014), using the public anvil test accounts.
No real-network writes were made, and no keys from the repo were used.

**Verdict: works on the fork.** Contracts, the backend chain writer (BscMirror), the control API and the frontend verifier
were exercised together. The UI rendered a trade that the backend journaled on the fork.

| Check | Result | Notes |
|---|---|---|
| `forge build` | PASS | solc 0.8.24 |
| `forge test` | PASS | 20 of 20 (IdentityRegistry 8, TradeJournal 5, StrategyLedger 7, incl. fuzz) |
| Fork deploy (`script/Deploy.s.sol`, chainId guard 97) | PASS | IdentityRegistry `0x7b33…F5d7`, TradeJournal `0xc890…D1fE`, StrategyLedger `0xE4F3…c146` (fork only). ~2.07M gas total |
| Core flow with `cast` | PASS | register (soulbound mint), `record` x2 (`totalTrades=2`), commit then attest (`isAttested=true`). Negative cases: `transferFrom` reverts `NonTransferable`, and `record` from a non-owner reverts `NotAgentOwner` |
| Backend `pytest` | PASS | 130 of 130, offline |
| Backend chain writer (`adapters/chain/bsc_mirror.py`) against the fork | PASS | `register`, then `commit_strategy`, then `attest` (StrategyLedger.attest plus TradeJournal.record). The `status` CLI reads agentId=2, totalAgents=2, tradeCount=1 |
| Control API (`runner --mode dry --serve`) | PASS | `/api/state` (chain_id 97), `/api/autopilot`, `/api/trades` and `/api/auth/nonce` return 200. An EIP-191 login by an allowlisted owner returns a token, and a non-owner gets 401 |
| Frontend `tsc --noEmit` and `next build` | PASS | Next 15.5, 7 static pages |
| Frontend run against the fork (`next start -p 3120`) | PASS | `/` returns 200. The page renders the fork's contract addresses, "journaled trades 1" and the +57 bps episode written by BscMirror, with no chain-mismatch errors. `/verifier` returns 307 (redirect) |
| Mainnet addresses: tokens in `bsc_twak/bsc_tokens.py` | PASS | All 49 unique token addresses have code on BSC mainnet, and every `decimals()` matches the table (incl. BONK = 5) |
| PancakeSwap V2 router/factory (56 and 97) and the x402 U-token (56 and 97) | PASS | Code on both chains, U-token decimals 18 |
| Competition registry `0x212c…aed5` | PASS | Code on 56 |
| Deployed mainnet verifier contracts (README) | PASS | `0x400B…CA5A` / `0xE946…d409` / `0x56D4…D79d` have code. Their bytecode sizes (6426/933/1135) match the fork deploy byte-for-byte. Live: totalAgents=1, totalTrades=38 |
| TWAK live execution / CMC x402 | SKIPPED | Needs TWAK credentials and a funded agent wallet (real money), which is out of scope |

## Bugs fixed
None. No code changes were needed.

## Housekeeping
- The fork deploy wrote `contracts/broadcast/Deploy.s.sol/97/run-latest.json`. It was restored from the previous
  real testnet run (`run-1781888785634.json`), and the fork run file was removed.
- `frontend/web/.env.fork` holds the fork env (localhost RPC plus fork addresses, no secrets). Delete it or ignore it as needed.
- Fork quirk: on real BSC testnet the anvil default accounts carry EIP-7702 delegation code (sweeper bots). As a result
  `_safeMint` to them reverts until `cast rpc anvil_setCode <acct> 0x` is run. This is not a contract bug.

## Notes (not bugs, worth knowing)
- `BscMirror` reads its RPC from `GRIDORA_MAINNET_RPC` (default mainnet), not `GRIDORA_BSC_RPC_URL`. For a testnet mirror,
  set `GRIDORA_MAINNET_RPC` to the testnet RPC. The CLI's printed explorer link is always `bscscan.com`.

## Real BSC testnet deploy: remaining steps
1. Get a deployer key with about **0.01 tBNB** from https://www.bnbchain.org/en/testnet-faucet. The deploy is about 2.1M gas, roughly 0.0002 BNB at 0.1 gwei, so the rest is margin for the mirror writes.
2. `cd contracts && BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545 forge script script/Deploy.s.sol --rpc-url bsc_test --broadcast --private-key $DEPLOYER_PK` (add `--verify` with `BSCSCAN_API_KEY`).
3. backend `.env`: `GRIDORA_IDENTITY_ADDR/JOURNAL_ADDR/LEDGER_ADDR`, `GRIDORA_MAINNET_RPC=<testnet rpc>`, `DEPLOYER_PRIVATE_KEY` (the mirror signer)
   and `GRIDORA_AGENT_ADDRESS`. Then run `python -m gridora.adapters.chain.bsc_mirror register`.
4. frontend `.env`: `NEXT_PUBLIC_TESTNET=true`, `NEXT_PUBLIC_*_ADDR`, and `NEXT_PUBLIC_JOURNAL_FROM_BLOCK=<deploy block>`.
   The default from-block is the mainnet journal's deploy block.
5. Live trading additionally needs TWAK credentials (`TWAK_ACCESS_ID`, `TWAK_HMAC_SECRET`, wallet password) and a funded agent wallet.
   Mainnet is already deployed and live.
