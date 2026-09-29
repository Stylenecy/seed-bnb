"""Tests for backtest engine."""

import math

from src.backtest import run_backtest
from src.models import (
    BacktestResult,
    Basket,
    BasketEntry,
    ScoredNarrative,
    StrategyCard,
    StrategyConfig,
)


class FakeStore:
    """Stub that provides a minimal price series."""

    def get_price_series(self) -> list[dict]:
        return [
            {
                "timestamp": "2026-01-01",
                "quotes": [
                    {"symbol": "FET", "price": 1.00},
                    {"symbol": "TAO", "price": 400.00},
                ],
            },
            {
                "timestamp": "2026-01-04",
                "quotes": [
                    {"symbol": "FET", "price": 1.10},
                    {"symbol": "TAO", "price": 420.00},
                ],
            },
            {
                "timestamp": "2026-01-07",
                "quotes": [
                    {"symbol": "FET", "price": 1.05},
                    {"symbol": "TAO", "price": 410.00},
                ],
            },
        ]


def _card() -> StrategyCard:
    narrative = ScoredNarrative(
        name="AI Agents", velocity=9.2, acceleration=0.3, rank=1,
        tokens=["FET", "TAO"],
    )
    basket = Basket(
        narrative_name="AI Agents",
        entries=[
            BasketEntry(symbol="FET", weight=0.50, market_cap=1e9),
            BasketEntry(symbol="TAO", weight=0.50, market_cap=2.9e9),
        ],
        total_weight=1.0,
    )
    return StrategyCard(
        basket=basket,
        scored_narrative=narrative,
        config=StrategyConfig(),
        entry_rule="test",
        exit_rule="test",
        position_sizing="test",
        invalidation="test",
    )


def test_backtest_returns_result() -> None:
    result = run_backtest(_card(), FakeStore())
    assert isinstance(result, BacktestResult)


def test_equity_curve_length() -> None:
    result = run_backtest(_card(), FakeStore())
    assert len(result.equity_curve) == 3


def test_max_drawdown_negative_or_zero() -> None:
    result = run_backtest(_card(), FakeStore())
    assert result.max_drawdown <= 0.0


def test_sharpe_ratio_is_finite() -> None:
    result = run_backtest(_card(), FakeStore())
    assert math.isfinite(result.sharpe_ratio)
