# MUSASHI 武蔵

**Conviction-Weighted Token Intelligence — Built on BNB Chain**

_"Find early, strike with conviction. A thousand tokens watched. One conviction taken. Every call on-chain."_

MUSASHI is a conviction-weighted token intelligence engine. It investigates tokens through a 7-gate elimination pipeline, 4 parallel specialists, cross-domain pattern detection, and adversarial debate — then publishes only the rare survivors as on-chain STRIKEs backed by verifiable evidence. 97% of tokens fail. The philosophy is simple: **if everyone already knows about it, you're too late.**

Because every STRIKE is a transaction on 0G Chain and every analysis is stored on 0G Storage, MUSASHI accumulates an immutable track record as it runs. The agent itself is tokenized as an INFT (ERC-7857) whose on-chain reputation — win rate, cumulative return, past calls — is readable by anyone. No self-reported stats. No trust-me-bro. The reputation layer is a natural consequence of the intelligence engine, not a separate product.

**Live dashboard:** https://musashi-agent.xyz  
**Demo video:** https://www.youtube.com/watch?v=bejjc7FLcfs

---

## Problem

Narrative-driven crypto traders face four problems:

| Problem                | Description                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signal overload        | Hundreds of new tokens daily. No human cross-references contract safety, wallet behavior, social momentum, and market timing simultaneously.                                  |
| Confirmation bias      | Find one bullish signal, stop looking. Existing tools generate signals, not eliminate them.                                                                                   |
| No framework           | Stock traders have P/E ratios. Meme traders have vibes and Telegram alpha.                                                                                                    |
| The specialist problem | Social mentions +400% looks bullish. But 80% of buyers are fresh wallets. No single analyst catches this — the pattern is invisible until someone overlays both perspectives. |

MUSASHI runs 7 elimination gates sequentially (fail-fast), hands the survivors to 4 parallel domain specialists, overlays a cross-domain pattern detector, and puts the result through bull/bear adversarial debate before a conviction judge. Only tokens that clear every filter and survive adversarial cross-examination become a STRIKE.

---

## Contracts (BNB Chain)

MUSASHI's contracts target **BNB Chain** — BSC Testnet (chainId 97) by default, BSC Mainnet (chainId 56) for production.

### Deployments

**BSC Testnet (97)** — deployed 2026-09-25 with `make deploy` (`contracts/script/deploy-and-verify.sh`), block 132984099. Addresses: [`deployments/bsc-testnet.json`](deployments/bsc-testnet.json), [`.env.bsc-testnet`](.env.bsc-testnet). Not yet verified on BscScan.

| Contract               | Proxy (canonical) | Implementation |
| ---------------------- | ----------------- | -------------- |
| ConvictionLog          | [`0x194CAC98f5B66f203944e2047d168e4624418d49`](https://testnet.bscscan.com/address/0x194CAC98f5B66f203944e2047d168e4624418d49) | [`0xFAEF4B46…8DD408`](https://testnet.bscscan.com/address/0xFAEF4B46FE4c142328727b80AB0BAB67298DD408) |
| MusashiINFT (ERC-7857) | [`0xF10dBDF8A385a60F97Eb1843BefcF18edFB57ac5`](https://testnet.bscscan.com/address/0xF10dBDF8A385a60F97Eb1843BefcF18edFB57ac5) | [`0xA589e21A…475D4B`](https://testnet.bscscan.com/address/0xA589e21A0469ada81D8bF6d108951FE08E475D4B) |

BSC Mainnet (56): not deployed.

Token analysis supports BSC (default), Ethereum, Polygon, Arbitrum, Base, and 0G Chain. Evidence blobs and encrypted intelligence stay on **0G Storage** (off-chain DA layer); only their merkle roots are written on BSC.

> The source is **UUPS-upgradeable** (OpenZeppelin v5) — deploy fresh proxies with `make deploy`, then upgrade in place via `make upgrade PROXY=… NEW_IMPL=…`.

---

## Quick Start

### Prerequisites

- Go 1.26+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- `0g-storage-client` CLI (only for evidence upload / publish mode)

### Install & build

```bash
git clone https://github.com/yeheskieltame/musashi.git
cd musashi
make core
cp .env.example .env    # fill in contract addresses (required)
set -a && source .env && set +a
```

Analysis mode (gates, scan, discover, history) works without a private key. Only publishing commands (`strike`, `store`, `mint-agent`, `update-agent`, `set-inft`) need `BSC_PRIVATE_KEY` set to a **dedicated wallet with minimal funds**.

### Run your first scan

```bash
./scripts/musashi-core/musashi-core scan --chain 8453 --limit 10 --gates
./scripts/musashi-core/musashi-core gates 0x1234...abcd --chain 1
```

---

## Runtimes

MUSASHI ships as a single analysis engine runnable from three places. Pick whichever matches your workflow.

### Claude Code

Slash commands in `.claude/commands/` — work out of the box after `make core`.

| Command                   | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| `/hunt [chain]`           | "Just tell me what to strike" — end-to-end funnel, ranked recommendations |
| `/analyze <token>`        | Full 8-step pipeline: gates → specialists → pattern → debate → judge |
| `/scan [chain] [--gates]` | Scan, score, and rank opportunities                                  |
| `/gates <token>`          | Run the 5 automated gates (1,2,3,6,7) via Go binary                  |
| `/discover [chain]`       | Raw token discovery with pre-screening                               |
| `/strike <token>`         | Publish a STRIKE conviction to BNB Chain                             |
| `/status`                 | On-chain reputation and agent state                                  |

Companion skill: `skills/coingecko/` is the official CoinGecko Agent SKILL bundled in the repo. Install once with `cp -r skills/coingecko ~/.claude/skills/` — narrative + market specialists use it for typed access to CoinGecko and GeckoTerminal endpoints.

### OpenClaw

```bash
openclaw skills install musashi
```

Minimal `openclaw.json` config (analysis only, no wallet needed):

```json
{
  "skills": {
    "entries": {
      "musashi": {
        "env": {
          "BSC_RPC_URL": "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
          "CONVICTION_LOG_ADDRESS": "0x<your BSC deploy>",
          "MUSASHI_INFT_ADDRESS": "0x<your BSC deploy>"
        }
      }
    }
  }
}
```

For on-chain publishing add `BSC_PRIVATE_KEY` (and optionally `OG_STORAGE_PRIVATE_KEY`, `OG_STORAGE_RPC`, `OG_STORAGE_INDEXER` for evidence upload). Install the coingecko companion skill with `openclaw skills install ./skills/coingecko`.

Invoke with natural language: _"Scan Base for the best opportunities"_, _"Analyze 0x1234 on Base"_, _"Show my STRIKE history"_.

### Next.js dashboard

The dashboard's analysis API (gates/scan/search/discover/status/history) calls the
read-only `musashi-core serve` daemon over HTTP — it no longer spawns the binary
per request. Start the daemon, then the app:

```bash
make core                                   # build the binary
./scripts/musashi-core/musashi-core serve   # read-only HTTP daemon on :8787 (no private key needed)

# in another terminal
cd frontend && pnpm install && pnpm dev
```

Point the app at a non-default daemon with `MUSASHI_DAEMON_URL`. On-chain
reputation/strike data is read directly from the mainnet contracts in the browser.

**Chat runtimes** (all share the same constrained, daemon-backed tools):

- **Claude via Hermes** — the production path anyone can try. Set `HERMES_API_URL` /
  `HERMES_API_KEY` / `HERMES_MODEL` and the Claude tab routes through an
  OpenAI-compatible gateway (Hermes Agent proxy, Nous Portal, OpenRouter, LiteLLM,
  or self-hosted). Pure HTTP — works on hosted deploys, no per-user install.
- **Gemini online** — set `GEMINI_API_KEY`; another hosted, shareable option.
- **Local Claude Code / OpenClaw** + adversarial **debate** — shell-capable, **off by
  default**; set `MUSASHI_ENABLE_LOCAL_AGENTS=1` only in a trusted local environment.

Canonical deployment lives at [musashi-agent.xyz](https://musashi-agent.xyz).

---

## CLI Reference

All commands live under `./scripts/musashi-core/musashi-core`. Full flag details: `musashi-core <cmd> --help`.

| Command               | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `scan`                | Fetch, score, and rank tokens across chains                        |
| `gates <token>`       | Run elimination gates on a specific token                          |
| `search <query>`      | Search tokens by name/ticker                                       |
| `discover`            | Raw token discovery (new / trending pools)                         |
| `orchestrate <token>` | Gates → 0G Storage → STRIKE in one command, gated on judge verdict |
| `strike <token>`      | Publish STRIKE to ConvictionLog                                    |
| `store <json>`        | Upload evidence JSON to 0G Storage                                 |
| `verify`              | Download + verify evidence with merkle proof                       |
| `status`              | Global or per-agent reputation                                     |
| `history`             | Strike history + reputation (agent memory)                         |
| `record-outcome`      | Record realized STRIKE return (owner only)                         |
| `seal-intelligence`   | Encrypt + upload intelligence bundle, emit sealed key              |
| `mint-agent`          | Mint agent INFT (ERC-7857)                                         |
| `update-agent`        | Rotate agent intelligence + sync reputation                        |
| `transfer-agent`      | Sealed ERC-7857 transfer (oracle-signed re-seal)                   |
| `agent-info`          | Query INFT agent state                                             |

Convenience Makefile targets: `make core`, `make contracts`, `make test`, `make gates TOKEN=... CHAIN=...`, `make scan CHAIN=... LIMIT=...`, `make status`, `make agent-info TOKEN_ID=...`.

### Pipeline example

```bash
# Analyze
./scripts/musashi-core/musashi-core gates 0x2260FA...99 --chain 1 --output json > evidence.json

# Store evidence on 0G Storage, capture root_hash
./scripts/musashi-core/musashi-core store "$(cat evidence.json)"

# Publish STRIKE with evidence hash
./scripts/musashi-core/musashi-core strike 0x2260FA...99 \
  --agent-id 0 --convergence 4 --evidence <root_hash> --token-chain 1

# Record outcome later
./scripts/musashi-core/musashi-core record-outcome --strike-id 0 --return-bps 1200

# Query agent memory for self-calibration
./scripts/musashi-core/musashi-core history --agent-id 0 --limit 12
```

---

## Data sources (all free, no API keys required)

GoPlus Security · DexScreener · GeckoTerminal · DefiLlama · CoinGecko · Farcaster Hub · public chain RPCs.

Social investigation (Gates 4-5) is agent-driven via WebSearch / WebFetch (Claude Code) or `browser` (OpenClaw) — the agent reads real X/Twitter, Farcaster, and Telegram posts instead of querying a paid API.

---

## BNB Chain + 0G Storage Integration

Three components, used for real:

- **BNB Chain — ConvictionLog** — every STRIKE is a transaction. Packed storage (4 slots per strike), O(1) cached reputation, Ownable2Step + Pausable, **UUPS-upgradeable**. Tracks per-agent win rate, returns, and strike history.
- **BNB Chain — MusashiINFT (ERC-7857)** — the agent itself is tokenized. AES-256-GCM-encrypted intelligence bundle on 0G Storage, per-owner ECIES-sealed AES key, oracle-verified transfers/clones (which clear prior usage-auths), dynamic reputation sync from ConvictionLog, **UUPS-upgradeable**. MUSASHI is minted as token ID 0.
- **0G Storage** — evidence archive. Every STRIKE references a merkle root; anyone can download the raw pipeline output and verify it hasn't been tampered with.

Agent memory closes the loop: the judge reads past strikes + outcomes from ConvictionLog before every decision and self-calibrates its conviction threshold based on historical win rate.

---

## Environment Variables

| Variable                 | Mode    | Description                                                        |
| ------------------------ | ------- | ------------------------------------------------------------------ |
| `BSC_RPC_URL`            | both    | BSC RPC (default BSC Testnet `https://data-seed-prebsc-1-s1.bnbchain.org:8545`) |
| `BSC_EXPLORER_URL`       | both    | BscScan base URL (default `https://testnet.bscscan.com`)           |
| `CONVICTION_LOG_ADDRESS` | both    | ConvictionLog contract address                                     |
| `MUSASHI_INFT_ADDRESS`   | both    | MusashiINFT contract address                                       |
| `BSC_PRIVATE_KEY`        | publish | Dedicated wallet key (hex, 0x optional) — pays BNB gas, doubles as INFT oracle |
| `OG_STORAGE_PRIVATE_KEY` | publish | Key paying 0G Storage uploads (falls back to `BSC_PRIVATE_KEY`)    |
| `OG_STORAGE_RPC`         | publish | 0G Storage RPC (default `https://evmrpc.0g.ai`)                    |
| `OG_STORAGE_INDEXER`     | publish | 0G Storage indexer (default `https://indexer-storage-turbo.0g.ai`) |

Without a private key, publishing commands return `analysis_only` / `skipped` instead of erroring.

---

## Credits

Built by [@YeheskielTame](https://x.com/YeheskielTame) originally for the 0G APAC Hackathon 2026; migrated to BNB Chain (see MIGRATION-BNB.md).

Inspiration: [TradingAgents](https://github.com/TauricResearch/TradingAgents) (specialist roles + adversarial debate), [OpenClaw](https://github.com/openclaw/openclaw) (skill system + distribution).

---

## License

[MIT](./LICENSE)
