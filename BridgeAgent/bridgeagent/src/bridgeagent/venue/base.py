"""Venue protocol — the interface every trading venue must satisfy.

Strategies and core/ depend only on this Protocol. Concrete venues
(currently `HyperliquidVenue`) live in sibling modules.

Return shapes intentionally mirror Hyperliquid's API responses because
that's what every caller already knows how to parse. A future
non-Hyperliquid venue would translate its native shapes into these
shapes inside its own implementation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Protocol, runtime_checkable


@dataclass
class TradeResult:
    """Outcome of a single order placement attempt.

    Mirrors the previous `core.client.TradeResult` so existing call sites
    continue to work without modification.
    """

    success: bool
    order_id: Optional[str]
    executed_price: float
    executed_size: float
    error_message: Optional[str]
    timestamp: float


@runtime_checkable
class Venue(Protocol):
    """Async venue interface used by strategies, regime detection, and the
    candle cache. All methods are async so a Textual event loop never blocks
    on network I/O.

    Read methods absorb transient rate-limit errors at the venue level and
    return empty/None sentinels so callers don't need to special-case 429.
    """

    # ------- Identity / config -------
    address: Optional[str]
    """The trading address (master account) when a key is configured.
    None when the venue is read-only."""

    # ------- Market data (public) -------

    async def get_prices(self) -> dict[str, float]:
        """Mid price for every listed perpetual. Returns {} when rate-limited."""
        ...

    async def get_meta_and_asset_ctxs(self) -> dict[str, Any]:
        """Universe metadata + per-asset context (funding, OI, oracle px).

        Returns {} when rate-limited so callers can handle "no fresh data"
        and "rate limited" the same way.
        """
        ...

    async def get_candles(
        self, coin: str, interval: str = "1h", count: int = 100
    ) -> list[dict[str, Any]]:
        """OHLCV candles for *coin* over the last `count` bars of `interval`."""
        ...

    async def get_candles_window(
        self, coin: str, interval: str, start_ms: int, end_ms: int
    ) -> list[dict[str, Any]]:
        """OHLCV candles for *coin* over an explicit [start_ms, end_ms] window.
        Strategies that need a precise lookback (e.g., funding-aware windows
        anchored to settlement times) use this instead of `get_candles`."""
        ...

    async def get_l2_book(self, coin: str) -> dict[str, Any]:
        """Level-2 orderbook snapshot for *coin*. Used by orderbook-imbalance
        strategy. Returns {} on transient failure."""
        ...

    # ------- Account state (network-matched, may need address) -------

    async def get_user_state(self, address: str) -> dict[str, Any]:
        """Margin / position state for an arbitrary address."""
        ...

    async def get_account_info(self) -> dict[str, Any]:
        """User state for the venue's own configured `address`. Returns {}
        if no address is configured."""
        ...

    async def get_open_orders(self) -> list[dict[str, Any]]:
        """Open orders for the venue's own configured `address`. Returns []
        if no address is configured."""
        ...

    # ------- Order placement (requires key) -------

    async def place_market_order(
        self,
        coin: str,
        side: str,
        size: float,
        reduce_only: bool = False,
    ) -> TradeResult:
        """Aggressive limit (IOC) order at mid +/- slippage.
        *side* is ``"buy"``/``"long"`` or ``"sell"``/``"short"``."""
        ...

    async def place_trigger_order(
        self,
        coin: str,
        side: str,
        size: float,
        trigger_price: float,
        is_tp: bool = False,
    ) -> dict[str, Any]:
        """Native TP or SL trigger order. *side* is the closing side."""
        ...

    async def close_position(self, coin: str) -> TradeResult:
        """Close the entire open position in *coin* via a market order."""
        ...

    async def cancel_all_orders(self, coin: str) -> bool:
        """Cancel every open order for *coin*. True on success."""
        ...

    # ------- Formatting helpers (sync, exchange-specific) -------

    def format_price(self, price: float, coin: str = "BTC") -> float:
        """Round a price to the exchange tick size for *coin*."""
        ...

    def format_size(self, size: float, coin: str = "BTC") -> float:
        """Round a size to an acceptable lot increment for *coin*."""
        ...
