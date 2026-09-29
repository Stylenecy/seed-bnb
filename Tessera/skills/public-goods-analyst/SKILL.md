---
name: public-goods-analyst
description: An autonomous agent for Ethereum public-goods funding intelligence (Octant, Gitcoin, Optimism RetroPGF). A real tool-calling agent (Claude Opus 4.8) plus a Go CLI — cross-epoch funding history, composite ranking (k-means + scoring), trust-graph forensics (Jaccard, Shannon entropy), mechanism simulation (4 QF variants incl. Trust-Weighted QF), temporal anomaly detection, multi-chain on-chain scanning (11 EVM chains, BNB Chain first), Octant-forum sentiment, OSO + GitHub corroboration, and branded PDF reports. Powered by Claude Opus 4.8 via Hermes with an Anthropic API fallback.
homepage: https://github.com/yeheskieltame/Tessera
user-invocable: true
disable-model-invocation: false
command-dispatch: tool
command-tool: Bash
command-arg-mode: raw
metadata: {"openclaw": {"always": false, "os": ["darwin", "linux"], "requires": {"bins": ["tessera"]}, "primaryEnv": "ANTHROPIC_API_KEY", "skillKey": "public-goods-analyst", "homepage": "https://github.com/yeheskieltame/Tessera", "install": [{"id": "go-build", "kind": "shell", "command": "go build -o tessera ./cmd/tessera/", "os": ["darwin", "linux"]}]}}
---

# Tessera — Public Goods Analyst

An autonomous agent for evaluating Ethereum public-goods projects with evidence, not narrative. It ships as a single Go binary (`tessera`) that is both a CLI and an HTTP/SSE server. The agent (Claude Opus 4.8) runs a tool-calling loop over live data — Octant, on-chain RPCs across 11 EVM chains (BNB Chain first), OSO, GitHub, the Octant forum, and Optimism RetroPGF — and every figure it reports is traced to a real tool call.

**GitHub:** https://github.com/yeheskieltame/Tessera

## When to use this skill

- Evaluating a public-goods project (Octant / Gitcoin / RetroPGF) or proposal
- Analyzing an Octant epoch (funding, allocations, rewards, composite ranking)
- Detecting funding anomalies, whale concentration, or coordination/Sybil patterns
- Comparing quadratic-funding mechanisms
- Building trust profiles from donor behavior
- Scanning an address across EVM chains (balances, txs, contracts, USDC/USDT/DAI)
- Generating evidence-based evaluation reports (PDF)

## Setup

The agent needs one AI backend — set either in `.env`:

```bash
cp .env.example .env
# HERMES_BASE_URL (+ HERMES_TOKEN)  — relay to a real Claude Code Opus 4.8 agent, or
# ANTHROPIC_API_KEY                 — direct Anthropic API (fallback / simplest)
```

Quantitative commands and on-chain scanning work without any AI backend.

## Commands

### Flagship

```bash
./tessera analyze-project <0xaddr> [-e <epoch>] [-n <oso-name>]      # multi-source project intelligence + PDF
./tessera evaluate "Project Name" -d "Description" [-g <github-url>] # 8-dimension proposal evaluation + PDF
```

### Quantitative (no AI backend needed)

```bash
./tessera status                 # connectivity (Octant, Gitcoin, OSO, 9 RPCs) + agent backend
./tessera providers              # agent model + backends (Hermes → Anthropic)
./tessera list-projects -e 5
./tessera analyze-epoch -e 5     # k-means clustering + composite scoring
./tessera detect-anomalies -e 5  # whale concentration + coordinated patterns
./tessera trust-graph -e 5       # donor diversity, Jaccard overlap, coordination risk
./tessera simulate -e 5          # compare 4 QF mechanisms
./tessera track-project <addr>   # cross-epoch timeline + temporal anomalies
./tessera scan-chain <addr>      # 11 EVM chains incl. BSC/opBNB (balance, txs, USDC/USDT/DAI/FDUSD)
./tessera gitcoin-rounds -r ID
```

### Qualitative (requires an AI backend)

```bash
./tessera deep-eval <addr> [-n name]
./tessera scan-proposal "Name" -d "text"
./tessera extract-metrics "text"
./tessera report-epoch -e 5
./tessera collect-signals <name-or-repo>
```

### Server

```bash
./tessera serve                  # HTTP API on :8080 (set PORT to override)
```

Exposes fast JSON endpoints plus streaming agent endpoints:

- `GET /api/agent/analyze?address=…` — **SSE**: live tool-calls → report + PDF
- `GET /api/agent/evaluate?name=…&description=…&githubURL=…` — **SSE**
- `GET /api/agent/chat?message=…` — **SSE**: open-ended agent
- `GET /api/analyze-epoch?epoch=…`, `/api/trust-graph`, `/api/simulate`, `/api/detect-anomalies`
- `GET /api/reports`, `GET /api/reports/{name}`

## AI backend

| Priority | Backend | Activation |
|----------|---------|------------|
| 1 | Hermes relay | `HERMES_BASE_URL` (+ `HERMES_TOKEN`) — relays the Anthropic Messages API to Claude Opus 4.8 |
| 2 | Anthropic API | `ANTHROPIC_API_KEY` — automatic fallback |

Model: `claude-opus-4-8` (override with `TESSERA_MODEL`).

## Data sources

| Source | Protocol | Data |
|--------|----------|------|
| Octant | REST | Projects, allocations, rewards, epochs, patrons, budgets |
| Gitcoin | GraphQL | Rounds, applications, donations |
| OSO | GraphQL | GitHub metrics, on-chain activity, funding |
| Blockchain RPC | JSON-RPC | Balance, txs, contracts, ERC-20 tokens (11 chains) |
| GitHub | REST | Repo metrics, contributors, README |
| Octant Discourse | REST | Community threads, engagement |
| Optimism RetroPGF | REST | Cross-ecosystem validation |

## Multi-chain support

Scans 11 EVM chains concurrently: BNB Smart Chain, opBNB, Ethereum, Base, Optimism, Arbitrum, Mantle, Scroll, Linea, zkSync Era (mainnets) + BSC Testnet (chainId 97). Tracks USDC/USDT (6 decimals on most chains, 18 on BSC), FDUSD (BSC, 18) and DAI (18).

## Interpreting results

- **Composite score**: 0–100, weighted 40% allocated + 60% matched
- **Donor diversity**: Shannon entropy 0–1 (1 = perfectly even)
- **Whale dependency**: fraction from the top donor (>50% flagged)
- **Coordination risk**: max Jaccard donor overlap (>0.7 flagged)
- **Gini coefficient**: 0 = equality, 1 = one project takes everything
- **Trust-Weighted QF**: multiplier = 0.5 + 0.5 × diversity score

## Build from source

```bash
go build -o tessera ./cmd/tessera/
```

Requires Go ≥ 1.25. Produces a single static binary with no runtime dependencies.
