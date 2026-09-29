"""Venue abstractions.

A `Venue` is the surface BridgeAgent uses to read market data and place
orders against a perps exchange. The current implementation
(`HyperliquidVenue`) targets Hyperliquid directly, which is also the
backend Byreal Perps routes to once the Byreal CLI bootstraps an agent
wallet. New venues only need to implement `Venue` for strategies and
the runtime to use them unchanged.
"""

from bridgeagent.venue.base import TradeResult, Venue

__all__ = ["Venue", "TradeResult"]
