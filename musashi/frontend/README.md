# MUSASHI Frontend

Next.js dashboard for the MUSASHI reputation protocol on BNB Chain.

**Live:** [https://musashi-agent.xyz](https://musashi-agent.xyz)

## Setup

The analysis API routes call the read-only `musashi-core serve` daemon over HTTP
(they do not spawn the binary). Start the daemon first:

```bash
# from the repo root
make core && ./scripts/musashi-core/musashi-core serve   # :8787, no private key needed
```

Then the app:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Override the daemon location with
`MUSASHI_DAEMON_URL` (default `http://127.0.0.1:8787`). Local Claude Code / OpenClaw
chat and debate are off by default — set `MUSASHI_ENABLE_LOCAL_AGENTS=1` to enable.

## Configuration

Contract addresses and chain config are in `src/lib/contracts.ts` and `src/lib/wagmi.ts`. Both point to BNB Chain — BSC Testnet (97) by default, BSC Mainnet (56) via `NEXT_PUBLIC_CHAIN_ID=56`.

| Contract | Address |
|----------|---------|
| ConvictionLog | BSC Testnet: [`0x194CAC98f5B66f203944e2047d168e4624418d49`](https://testnet.bscscan.com/address/0x194CAC98f5B66f203944e2047d168e4624418d49) (set `NEXT_PUBLIC_CONVICTION_LOG_ADDRESS`) |
| MusashiINFT (ERC-7857) | BSC Testnet: [`0xF10dBDF8A385a60F97Eb1843BefcF18edFB57ac5`](https://testnet.bscscan.com/address/0xF10dBDF8A385a60F97Eb1843BefcF18edFB57ac5) (set `NEXT_PUBLIC_MUSASHI_INFT_ADDRESS`) |

The previous 0G mainnet addresses (`0x2B84…2A15`, `0x74BC…1d4c`) have no code on BSC. Set via env vars: `NEXT_PUBLIC_CONVICTION_LOG_ADDRESS`, `NEXT_PUBLIC_MUSASHI_INFT_ADDRESS`.

## Components

- **TokenScanner** -- Search and scan tokens across 6 chains
- **GatePipeline** -- Visual gate results display
- **StrikeLedger** -- Browse published STRIKEs from ConvictionLog
- **StrikePublisher** -- Publish STRIKEs from the browser
- **ReputationPanel** -- Per-agent and global reputation stats
- **AgentChat** -- Interactive agent analysis interface
- **CommandBar** -- Quick command interface
- **WalletConnect** -- MetaMask / injected wallet connection
