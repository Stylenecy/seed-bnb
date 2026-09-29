# VERIFY-BNB: bnbhack-winn

Verified 2026-09-25. **Read-only against BSC mainnet (56); no trades, no keys.**

The agent ran in `AGENT_MODE=paper BRIDGE_MODE=mock`, with TWAK disabled via `TWAK_CLI=/usr/bin/false` and `TWAK_WALLET_MODE=skip`. The local `twak` CLI was never invoked, so no wallet was touched.

**Verdict: WORKS (paper mode plus real BSC mainnet reads).** Fixed 15 broken token addresses and one env var name mismatch.

| Check | Result | Notes |
|---|---|---|
| neural-alpha `npm ci` (workspaces) | PASS | |
| Agent `tsc --noEmit` | PASS | |
| Dashboard `tsc --noEmit` + `next build` | PASS | |
| Agent run (paper) on :3171 | PASS | Ran 8 cycles. It used live **Binance Web3 BSC market data**: 69 live quotes and OHLCV. It made 3 PAPER buys (1INCH, 0G, PENGU). `/api/health`, `/api/state`, `/api/wallet` and `/api/competition/status` all returned 200. |
| Dashboard `next start` on :3172, proxying to the agent | PASS | `/` returned 200. `/api/agent/health` and `/api/agent/state` returned 200 through the proxy. |
| BSC RPC trade-history scanner (`fetchRpcRecentTradeHistory`) | PASS | Pointed at a real mainnet trader that has recent ETH/USDT swaps. It returned 4 swaps with correct amounts (ETH to USDT at about $2,685) from `bsc-dataseed`. |
| Hardcoded BEP-20 map (`bsc-token-addresses.ts`) | PASS after fix | All 88 entries now have code on BSC and their `symbol()` matches. The only differences are naming: LUNC is on-chain "LUNA" (Binance-Peg Terra Classic), BANANAS31 is "$BANANA", and IP is "wIP". |
| Narrative-Alpha pytest | PASS | 24/24. Fixture-only, no chain code. |

## Bugs fixed
1. **`neural-alpha/src/integrations/bsc-token-addresses.ts`: 15 wrong addresses.** Most shared a correct prefix but had a corrupted tail, so they had no contract on BSC. The static map takes precedence over the CMC runtime lookup, so `hasBscSwapAddress()` said "routable". Balances, icons and swaps then targeted empty addresses. PENGU, for example, was the agent's top buy signal during the test.
   - Corrected against CoinGecko platform data and verified on-chain with `symbol()` and `decimals()`: BONK (5 dec), DEXE, BRETT, LUNC, PENGU, SUSHI, COMP, AXS, STG, BabyDoge (9 dec), and APE. The APE entry was malformed and only 39 hex characters long.
   - Removed SNX, LDO, RAY and NILA, which have no verifiable BEP-20 deployment. They now fall back to CMC runtime resolution, or are skipped as unroutable. The existing ZRO entry already follows this pattern.
2. **`neural-alpha/.env.example`**: `CMC_API_KEY=` was renamed to `CMC_PRO_API_KEY=`. The code only reads `CMC_PRO_API_KEY`, so a user following the example would silently get mock or x402 data.

## Notes
- Decimals are read on-chain (`bsc-token-decimals.ts`), so the 5- and 9-decimal tokens are handled.
- `bsc-rpc.publicnode.com` returns 403 for some `eth_getTransactionReceipt` calls. The code's default `bsc-dataseed` list works.
- I removed the `node_modules` and `.next` directories I created, because the project would have been over 500 MB.

## Steps remaining for live use (BSC mainnet, real funds)
Nothing to deploy. There are no contracts. To go live:
1. Set `CMC_PRO_API_KEY` in `neural-alpha/.env`.
2. Run `twak init` with the Trust Wallet `TW_ACCESS_ID` and `TW_HMAC_SECRET`, then `twak wallet create` on the host.
3. Fund the agent wallet with USDT for trades, plus about **0.01 BNB** for gas (≥ `MIN_GAS_RESERVE_USD`).
4. Set `AGENT_MODE=live`, set `API_SECRET` for the dashboard proxy, then run `npm run prod:start`.
