# Narrative Alpha

Narrative Alpha is a fixture-backed Track 2 Strategy Skill for rotating into the strongest CMC-style market narrative. It reads bundled narrative-velocity, quote, and technical-analysis snapshots; ranks narratives by latest velocity and short-term acceleration; builds a capped market-cap-weighted basket for the leading narrative; emits reviewable strategy cards; and replays the basket against fixture prices.

The current checked-in fixture run selects **Memecoins** as the top narrative and produces a four-token basket of RNDR, TAO, HNT, and AGIX with a 40% per-token cap.

## Track 2 Fit

This project turns market evidence into a concrete strategy specification instead of a trading bot. The output is a judge-readable card with:

- Narrative rank, velocity, and acceleration.
- Basket constituents, market caps, and capped weights.
- Entry and exit rules tied to narrative velocity and rank.
- Position-sizing language and a hard drawdown invalidation rule.
- Fixture-backed replay metrics printed by the CLI.

It is designed for strategy review, reproducible evaluation, and risk discussion. It does not place orders or connect to wallets.

## Evidence Inputs

All judge-path inputs are local fixtures under `fixtures/`:

- `fixtures/narratives.json` has 31 timestamped snapshots from `2026-01-01` through `2026-04-01`, covering three narrative velocity/rank histories.
- `fixtures/quotes.json` has 31 matching quote snapshots for FET, AGIX, OCEAN, TAO, RNDR, and HNT, including price, 24h volume, and market cap.
- `fixtures/ta.json` has 31 matching technical-analysis snapshots with daily RSI and MACD values. The loader exposes these signals, although the current CLI strategy path scores narratives from velocity and quotes.

The fixture path is deterministic and requires no credentials.

## Quick Start

From `01-narrative-alpha`:

```bash
python -m pip install -e ".[dev]"
python -m src run --mode fixture --output-dir output
python -m pytest tests -v
```

Useful options:

```bash
python -m src run --mode fixture --output-dir output --basket-size 4 --velocity-threshold 7.0
```

The CLI prints the top narrative, basket weights, output directory, and replay metrics including total return, max drawdown, Sharpe ratio, trade count, and equity-curve start/end.

## Generated Outputs

Running the fixture command writes:

- `output/strategy.yaml`
- `output/strategy.md`

The checked-in sample strategy card contains:

- Top narrative: `Memecoins`
- Latest velocity: `9.4`
- Acceleration: `0.50`
- Rank: `1`
- Basket: RNDR, TAO, HNT, AGIX
- Entry: narrative velocity above `7.0`
- Exit: narrative velocity below `3.0` or narrative rank outside the top 3
- Invalidation: `-15%` portfolio drawdown

## Project Map

- `src/__main__.py` wires the CLI pipeline: load fixtures, rank narratives, assemble the basket, emit cards, and run the replay.
- `src/fixtures/loader.py` loads CMC-shaped fixture JSON into typed model objects.
- `src/scorer.py` computes latest velocity, two-period acceleration, and descending narrative rank.
- `src/basket.py` filters tokens to the selected narrative, sorts by market cap, applies basket size, caps weights at 40%, and redistributes excess.
- `src/emitter.py` builds the strategy card and renders YAML and Markdown.
- `src/backtest.py` replays weighted basket returns over fixture prices and reports return, drawdown, Sharpe, trades, and equity curve.
- `src/models.py` defines the typed snapshots, basket, strategy card, config, and backtest result.
- `tests/` covers the fixture loader, scorer, basket construction, emitter, CLI, backtest, and full integration path.

## CMC and Live-Mode Boundary

Fixture mode is the supported submission path. `--mode live` currently enforces that `CMC_API_KEY` is present, but the command still uses the local `FixtureStore`; there is no live network fetcher in this project. Treat live mode as a credential boundary placeholder, not as live ingestion.

## Safety Constraints

- No live trading.
- No wallet connection or wallet execution.
- No swaps, leverage, perps, order routing, or capital deployment.
- No capital is required to run or evaluate the project.
- Outputs are strategy-review artifacts, not execution instructions.

## Verification

Run the test suite from `01-narrative-alpha`:

```bash
python -m pytest tests -v
```

The suite verifies module behavior and the end-to-end fixture pipeline. For a no-write smoke test, run the CLI with a temporary output directory instead of `output`.
