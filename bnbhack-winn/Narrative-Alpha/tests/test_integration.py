"""End-to-end integration test for the full Narrative Alpha pipeline."""

import yaml

from src.backtest import run_backtest
from src.basket import assemble_basket
from src.emitter import emit_strategy, render_yaml
from src.fixtures.loader import FixtureStore
from src.models import BacktestResult, StrategyConfig
from src.scorer import rank_narratives


def test_full_pipeline() -> None:
    store = FixtureStore(fixtures_dir="fixtures")

    snapshots = store.get_narratives()
    assert len(snapshots) >= 10

    ranked = rank_narratives(snapshots)
    assert len(ranked) >= 1
    top = ranked[0]
    assert top.velocity > 0

    quotes = store.get_quotes(top.tokens, timestamp=snapshots[-1].timestamp)
    basket = assemble_basket(top, quotes)
    assert len(basket.entries) >= 1

    config = StrategyConfig()
    card = emit_strategy(basket, top, config)

    yaml_text = render_yaml(card)
    parsed = yaml.safe_load(yaml_text)
    assert "strategy" in parsed
    assert "basket" in parsed["strategy"]

    result = run_backtest(card, store)
    assert isinstance(result, BacktestResult)
    assert len(result.equity_curve) >= 2
