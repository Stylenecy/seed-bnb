# bridgeagent (Python CLI)

This directory contains the Python CLI / TUI for **BridgeAgent** — the autonomous perps trader that signs locally, runs deterministic risk checks, and mirrors every settled trade to BSC Testnet.

For the full project overview, architecture diagram, deployed contract addresses, and demo, see the **[root README](../README.md)**.

## What's in here

```
src/bridgeagent/
  venue/          Venue protocol + venue implementation
  bnb/            On-chain mirror: client, IdentityRegistry helper, TradeJournal helper
  strategies/     7 quant strategies (trend, momentum, funding, vol, pairs, cascade, orderbook)
  core/           Risk layer, regime detector, candle cache, agent state
  tui/            Textual UI (dashboard, journal, analytics)
  onboarding/     Setup wizard
scripts/
  bnb_smoke_test.py        register agent + sanity write
  runtime_mirror_smoke.py     runtime → BNB Chain bridge test
```

## Run it

See **[`../docs/setup.md`](../docs/setup.md)** for the full local-run runbook (prereqs, env vars, funding, smoke tests, troubleshooting).

Quick install:

```bash
python3 -m venv venv && source venv/bin/activate
pip install -e .
bridgeagent setup     # interactive wizard for agent key + BNB Chain config
bridgeagent           # launch TUI
```

## License

MIT.
