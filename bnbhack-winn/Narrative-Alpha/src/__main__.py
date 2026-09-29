"""CLI entry point for Narrative Alpha."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from src.backtest import run_backtest
from src.basket import assemble_basket
from src.emitter import emit_strategy, render_markdown, render_yaml
from src.fixtures.loader import FixtureStore
from src.models import StrategyConfig
from src.scorer import rank_narratives


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="narrative_alpha",
        description="CMC narrative-velocity basket-rotation strategy skill",
    )
    sub = parser.add_subparsers(dest="command")
    run_p = sub.add_parser("run", help="Run the full pipeline")
    run_p.add_argument(
        "--mode",
        choices=["fixture", "live"],
        default="fixture",
        help="Data mode (default: fixture)",
    )
    run_p.add_argument(
        "--output-dir",
        default="output",
        help="Directory for strategy card files (default: output)",
    )
    run_p.add_argument("--top-n", type=int, default=1, help="Narratives to scan")
    run_p.add_argument("--basket-size", type=int, default=4, help="Tokens per basket")
    run_p.add_argument(
        "--velocity-threshold", type=float, default=7.0, help="Entry velocity threshold"
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command != "run":
        parser.print_help()
        return 1

    if args.mode == "live":
        if not os.environ.get("CMC_API_KEY"):
            print("ERROR: --mode live requires CMC_API_KEY environment variable", file=sys.stderr)
            return 1

    store = FixtureStore(fixtures_dir="fixtures")
    snapshots = store.get_narratives()
    ranked = rank_narratives(snapshots)

    if not ranked:
        print("No narratives found.")
        return 1

    top = ranked[0]
    print(f"Top narrative: {top.name} (velocity={top.velocity:.1f}, acceleration={top.acceleration:.2f})")

    quotes = store.get_quotes(top.tokens, timestamp=snapshots[-1].timestamp)
    basket = assemble_basket(top, quotes, basket_size=args.basket_size)

    print(f"\nBasket ({basket.narrative_name}):")
    for entry in basket.entries:
        print(f"  {entry.symbol}: {entry.weight:.2%} (mcap=${entry.market_cap:,.0f})")

    config = StrategyConfig(
        velocity_entry=args.velocity_threshold,
        basket_size=args.basket_size,
    )
    card = emit_strategy(basket, top, config)

    yaml_text = render_yaml(card)
    md_text = render_markdown(card)

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "strategy.yaml").write_text(yaml_text)
    (out_dir / "strategy.md").write_text(md_text)
    print(f"\nStrategy card written to {out_dir}/")

    result = run_backtest(card, store)
    print(f"\nBacktest Results:")
    print(f"  Total Return: {result.total_return:.2%}")
    print(f"  Max Drawdown: {result.max_drawdown:.2%}")
    print(f"  Sharpe Ratio: {result.sharpe_ratio:.4f}")
    print(f"  Trades: {len(result.trades)}")
    if result.equity_curve:
        print(f"  Equity Curve: {result.equity_curve[0][0]} -> {result.equity_curve[-1][0]}")
        print(f"    Start: {result.equity_curve[0][1]:.4f}")
        print(f"    End:   {result.equity_curve[-1][1]:.4f}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
