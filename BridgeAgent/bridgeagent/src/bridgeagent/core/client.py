"""Backwards-compat shim.

The Hyperliquid client lives at `bridgeagent.venue.hyperliquid.HyperliquidVenue`.
This module re-exports it under the legacy name `HyperLiquidClient` to keep
older imports compiling during the refactor. New code should import directly
from `bridgeagent.venue`.

Once all call sites have been migrated, this file can be deleted.
"""

from bridgeagent.venue.base import TradeResult
from bridgeagent.venue.hyperliquid import HyperliquidVenue as HyperLiquidClient

__all__ = ["HyperLiquidClient", "TradeResult"]
