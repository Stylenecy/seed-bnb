# VERIFY-BNB: BridgeAgent

Verified 2026-09-25 against a local anvil fork of **BSC Testnet** (chain 97), port 8671, forked from `bsc-testnet-rpc.publicnode.com`. Key: anvil account #0. No real-network writes. Hyperliquid trading was not exercised, because it needs a Hyperliquid agent wallet. Only the BNB identity and journal layer was tested.

**Verdict: WORKS on the fork.** Found and fixed 3 bugs; 2 of them broke the CLI at import time.

| Check | Result | Notes |
|---|---|---|
| `forge build` | PASS | |
| `forge test` | PASS | 13/13 |
| Fork deploy (`script/Deploy.s.sol --broadcast`) | PASS | IdentityRegistry and TradeJournal deployed; code present |
| Python deps (py3.12 venv, `pip install -e .`) | PASS after fix | Missing `httpx` (see bugs) |
| `bridgeagent` CLI import / launch | PASS after fix | `NameError: Info` (see bugs) |
| `scripts/bnb_smoke_test.py` | PASS | Registered ERC-8004 agent #1 and read back owner, URI and metadata. `record_now` wrote a trade; `pnl_bps` = 150 as expected. |
| `scripts/runtime_mirror_smoke.py` | PASS | Path is RiskManager, then `_enqueue_bnb_mirror`, then flush, then on-chain. Trade #2 landed with `pnl_bps` = 75. |
| web `tsc --noEmit` | PASS | |
| web `next build` | PASS | |
| web `next start` on :3170 against fork addresses | PASS | HTTP 200. The SSR HTML shows "BSC Testnet", the registry address, owner `0xf39F…`, and both trade hashes read from the fork. No Mantle strings. |
| Hardcoded BSC addresses | N/A | None. Everything is env-driven. |

## Bugs fixed
1. `bridgeagent/pyproject.toml`: added `httpx` as an explicit dependency. `core/hypedexer_client.py` imports it, but it was only ever pulled in transitively by `anthropic`, and current `anthropic` (1.8.x) no longer depends on it. A fresh install crashed with `ModuleNotFoundError: httpx`.
2. `bridgeagent/src/bridgeagent/strategies/liquidation_cascade_v2.py`: the type hint `mainnet_info: Info` referenced an undefined name. That was a `NameError` at import, so `bridgeagent` could not start at all. Changed it to `Venue`, which is already imported and is what `app.py` passes.
3. `scripts/bnb_smoke_test.py` and `scripts/runtime_mirror_smoke.py`: `os.environ.setdefault("BNB_PRIVATE_KEY", os.environ.get("PRIVATE_KEY",""))` wrote an empty `BNB_PRIVATE_KEY` into the environment when `PRIVATE_KEY` was unset. That masked a `BNB_PRIVATE_KEY` supplied via the `.env` file. It now only maps when `PRIVATE_KEY` is set.
4. `bridgeagent/.gitignore`: now ignores `.venv/` and `.env.*`, except `.env.example`.

## Gotcha for fork testing
On BSC Testnet, anvil's default accounts (`0xf39F…`, `0x7099…`, and others) carry **EIP-7702 delegation code** (`0xef0100…`). `IdentityRegistry.register` uses `_safeMint`, which calls `onERC721Received` on the delegated code and reverts with empty data. On the fork, clear it first with `cast rpc anvil_setCode 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0x`. A fresh real key is unaffected.

## Reproduce
`bridgeagent/.env.fork` is local and gitignored. It points to `127.0.0.1:8671` with the fork addresses and the anvil key. Run it with `BRIDGEAGENT_ENV_FILE=$PWD/bridgeagent/.env.fork python bridgeagent/scripts/bnb_smoke_test.py`.

## Steps remaining for a real BSC testnet deploy
1. `cd contracts && cp .env.example .env`, then set `PRIVATE_KEY` (a fresh key funded with tBNB) and `BSCSCAN_API_KEY`.
2. `forge script script/Deploy.s.sol --rpc-url bsc_testnet --private-key $PRIVATE_KEY --broadcast --verify`. That is about 3M gas, roughly 0.01 tBNB.
3. Put the addresses in `~/.config/bridgeagent/.env` (`BNB_IDENTITY_REGISTRY`, `BNB_TRADE_JOURNAL`, `BNB_PRIVATE_KEY`) and in `web/.env.local` (`NEXT_PUBLIC_BSC_*`).
4. Run `python bridgeagent/scripts/bnb_smoke_test.py`, then set `BNB_AGENT_ID` / `NEXT_PUBLIC_BSC_AGENT_ID`.
5. Budget about **0.05 tBNB** in total, which covers the deploy and a few hundred journal writes at ~100k gas each.
6. Hyperliquid testnet agent wallet (`BRIDGE_AGENT_PRIVATE_KEY`, `BRIDGE_MAIN_ADDRESS`) for the trading loop itself.

## Real BSC Testnet deploy (2026-09-25)

Deployed on **real BSC Testnet (chainId 97)** with `contracts/script/Deploy.s.sol`. RPC `https://bsc-testnet-rpc.publicnode.com`, gas 0.1 gwei. Not verified on BscScan (no API key available). Broadcast record: `contracts/broadcast/Deploy.s.sol/97/run-latest.json`.

| Contract | Address | Deploy tx |
|---|---|---|
| IdentityRegistry | [0xf8280D3A28dD94682b1F97a6A3fa1c8CbC9C018C](https://testnet.bscscan.com/address/0xf8280D3A28dD94682b1F97a6A3fa1c8CbC9C018C) | [0x8b055125…](https://testnet.bscscan.com/tx/0x8b05512583bb09a9e3aae13c341839a6d58540c8fa00a6f2aa1543cf321e45ae) |
| TradeJournal | [0x108A8347484E2b2A88D4b732F0CdB4Ada742F45E](https://testnet.bscscan.com/address/0x108A8347484E2b2A88D4b732F0CdB4Ada742F45E) | [0x485c0060…](https://testnet.bscscan.com/tx/0x485c0060fb0093a53a2265c91cdd2e5cc4ae1a9d1677fbd09e29b46759005401) |

The agent signer (`BNB_PRIVATE_KEY`) is a separate fresh wallet, `0xa5663b2511456460c6dc9858D14d1f33a156cC61`, funded with 0.005 tBNB. Its key is held outside the repo and was passed via shell env. The addresses-only config is `bridgeagent/.env.bsc-testnet` (gitignored via `.env.*`; run with `BRIDGEAGENT_ENV_FILE`) and `web/.env.bsc-testnet`.

### Bug found on the live chain (fixed)
`bridgeagent/src/bridgeagent/bnb/client.py`: web3.py 7 raised `ExtraDataLengthError` ("extraData is 279 bytes, but should be 32") on the first block read from **real** BSC. BSC is PoSA, and anvil forks mint blocks with short extraData, so the fork run never hit this. The fix injects `ExtraDataToPOAMiddleware` (web3 ≥7), or `geth_poa_middleware` on web3 6, at layer 0. Without it, `bnb_smoke_test.py` crashed right after registering.

### Live smoke (both scripts PASS)
- `scripts/bnb_smoke_test.py`: registered ERC-8004 **agent #1** ([0xa2fbf2b6…](https://testnet.bscscan.com/tx/0xa2fbf2b68ff172f78d5d1172fb6a5db6ce42a09042bfcc0f04333d9f3569be46)). It read back ownerOf, tokenURI and metadata `venue=hyperliquid`, then recorded trade #1 with `pnl_bps` = 150 ([0x74febe54…](https://testnet.bscscan.com/tx/0x74febe544c9a79187d0f711b8e8b952c7b183b9d1b323cde402ae0e97535fb79)).
- `scripts/runtime_mirror_smoke.py` (`BNB_AGENT_ID=1`): RiskManager ran `_enqueue_bnb_mirror`, then flushed trade #2 with `pnl_bps` = 75 ([0xb50a0231…](https://testnet.bscscan.com/tx/0xb50a0231ff483295ca226a6e13c15f45f04173b101c931a20716f2b2a1de4067)).
- Harmless noise: web3 prints `MismatchedABI` UserWarnings while decoding the register receipt (Transfer events against the wrong event ABI).
- web: `next build` with the testnet env, then `next start` on :3172 returned HTTP 200. The SSR HTML shows "BSC Testnet", the registry address, owner `0xa5663b25…`, and both on-chain trade hashes, with no Mantle strings. Stopped afterwards.

### Gas / tBNB spent
Deploy: 0.000206 tBNB. Agent gas for register + 2 journal writes: 0.000052 tBNB. Funding moved to the agent wallet: 0.005, and 0.00495 of it remains.

### What's left
BscScan verification, which needs a key. A Hyperliquid agent wallet for the live trading loop. `BNB_AGENT_ID=1` is set in the env files; add it to `~/.config/bridgeagent/.env` for the TUI.
