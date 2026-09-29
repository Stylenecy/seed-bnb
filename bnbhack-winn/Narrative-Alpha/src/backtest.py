"""Backtest engine -- fixture replay and equity-curve computation."""

from __future__ import annotations

import math
from typing import Protocol

from src.models import BacktestResult, StrategyCard


class PriceSource(Protocol):
    """Protocol for anything that can provide a price series."""

    def get_price_series(self) -> list[dict]:
        ...


def run_backtest(
    strategy: StrategyCard,
    fixture_store: PriceSource,
) -> BacktestResult:
    """Replay *strategy* against the price series from *fixture_store*.

    Returns a BacktestResult with equity curve, total return, max drawdown,
    Sharpe ratio, and trade log.
    """
    price_series = fixture_store.get_price_series()
    if not price_series:
        return BacktestResult(
            equity_curve=[],
            total_return=0.0,
            max_drawdown=0.0,
            sharpe_ratio=0.0,
            trades=[],
        )

    basket_symbols = [e.symbol for e in strategy.basket.entries]
    basket_weights = {e.symbol: e.weight for e in strategy.basket.entries}

    equity = 1.0
    equity_curve: list[tuple[str, float]] = []
    returns: list[float] = []
    peak = equity
    max_drawdown = 0.0
    trades: list[dict] = []

    prev_prices: dict[str, float] = {}

    for point in price_series:
        ts = point["timestamp"]
        prices: dict[str, float] = {
            q["symbol"]: q["price"] for q in point.get("quotes", [])
        }

        if prev_prices:
            period_return = 0.0
            for sym in basket_symbols:
                cur = prices.get(sym)
                prev = prev_prices.get(sym)
                if cur is not None and prev is not None and prev > 0:
                    token_ret = (cur - prev) / prev
                    weight = basket_weights.get(sym, 0.0)
                    period_return += weight * token_ret

            equity *= 1.0 + period_return
            returns.append(period_return)

            if period_return != 0.0:
                trades.append({
                    "timestamp": ts,
                    "type": "rebalance",
                    "return": round(period_return, 6),
                })

        if equity > peak:
            peak = equity
        dd = (equity - peak) / peak if peak > 0 else 0.0
        if dd < max_drawdown:
            max_drawdown = dd

        equity_curve.append((ts, round(equity, 6)))
        prev_prices = prices

    total_return = equity - 1.0
    sharpe_ratio = _sharpe(returns)

    return BacktestResult(
        equity_curve=equity_curve,
        total_return=round(total_return, 6),
        max_drawdown=round(max_drawdown, 6),
        sharpe_ratio=round(sharpe_ratio, 4),
        trades=trades,
    )


def _sharpe(returns: list[float], risk_free: float = 0.0) -> float:
    """Annualized Sharpe ratio from a list of periodic returns."""
    if len(returns) < 2:
        return 0.0
    mean = sum(returns) / len(returns) - risk_free
    variance = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
    std = math.sqrt(variance)
    if std == 0:
        return 0.0
    return mean / std
