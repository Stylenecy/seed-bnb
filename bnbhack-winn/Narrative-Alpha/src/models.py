"""Data models for Narrative Alpha."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class NarrativeSnapshot:
    """A timestamped snapshot of trending narratives."""

    timestamp: str
    narratives: list[dict]


@dataclass(frozen=True)
class TokenQuote:
    """Latest quote data for a single token."""

    symbol: str
    price: float
    volume_24h: float
    market_cap: float


@dataclass(frozen=True)
class TASignal:
    """Technical-analysis signals for a single token."""

    symbol: str
    rsi_daily: float
    macd: float


@dataclass(frozen=True)
class ScoredNarrative:
    """A narrative scored by velocity and acceleration."""

    name: str
    velocity: float
    acceleration: float
    rank: int
    tokens: list[str]


@dataclass(frozen=True)
class BasketEntry:
    """A single token entry in a basket."""

    symbol: str
    weight: float
    market_cap: float


@dataclass(frozen=True)
class Basket:
    """A weighted token basket for a narrative."""

    narrative_name: str
    entries: list[BasketEntry]
    total_weight: float


@dataclass(frozen=True)
class StrategyConfig:
    """Configuration parameters for the strategy."""

    velocity_entry: float = 7.0
    velocity_exit: float = 3.0
    basket_size: int = 4
    max_weight: float = 0.40
    max_drawdown_stop: float = -0.15


@dataclass(frozen=True)
class StrategyCard:
    """A fully specified strategy card."""

    basket: Basket
    scored_narrative: ScoredNarrative
    config: StrategyConfig
    entry_rule: str
    exit_rule: str
    position_sizing: str
    invalidation: str


@dataclass(frozen=True)
class BacktestResult:
    """Results from backtesting a strategy against fixture data."""

    equity_curve: list[tuple[str, float]]
    total_return: float
    max_drawdown: float
    sharpe_ratio: float
    trades: list[dict] = field(default_factory=list)
