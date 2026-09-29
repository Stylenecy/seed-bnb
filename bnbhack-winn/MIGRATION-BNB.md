# bnbhack-winn: BNB Chain audit

**Already BNB-native. Audit only, plus two small documentation fixes.**

## What is here

- `neural-alpha/`: an autonomous trading agent built for BNB Hack. It trades on **BSC mainnet
  (chainId 56)** through the Trust Wallet Agent Kit. USDT on BSC is the base currency. It uses
  Binance Web3 wallet and market APIs with `chainId=56`, BSC RPC trade history (bsc-dataseed
  endpoints), BscScan / Etherscan v2 with `chainid=56`, and BscScan links in the dashboard. It also
  has a Next.js dashboard.
- `Narrative-Alpha/`: a Python strategy and backtest tool that works from fixtures. It has no chain
  code.

## Audit findings

| Area | Status |
| --- | --- |
| Chain ids | 56 everywhere (`BSC_CHAIN_ID`) |
| RPC | BSC dataseed plus publicnode, overridable with `BSC_RPC_URL(S)` |
| Tokens / base currency | BEP-20 addresses (`bsc-token-addresses.ts`), USDT on BSC |
| Explorer | bscscan.com (dashboard), bsctrace.com (register script) |
| Native gas | BNB |
| Multi-chain code in `twak-mcp-bridge.ts` | SLIP-44 lookup table for reading TWAK holdings. `bsc` is used, and the other entries are only lookup data. Left unchanged. |
| x402 (CMC Agent Hub) | CMC's x402 facilitator settles in USDC on Base. That is a third-party payment rail, not the trading chain, and `X402_NETWORK` is not read by the code. Left unchanged, and now documented. |

## Changes made

- `neural-alpha/.env.example`:
  - Documented `BSC_RPC_URL` / `BSC_RPC_URLS`. The code reads both, but neither was listed.
  - Clarified that the CMC x402 comment (USDC on Base) is a data-payment rail, and that all trading
    happens on BNB Smart Chain.

No code changes. Nothing to deploy.

## Verification

- A grep over the whole project for other chains (Celo, Monad, Mantle, Stellar, Sepolia, Arbitrum,
  Base, Solana, Polygon, and others) found only the cases in the table above.
- No build was run, because no code changed.

## TODO

None needed for BNB. Optional: if CMC ever offers x402 settlement on BSC, point `X402_NETWORK` at
`eip155:56`.
