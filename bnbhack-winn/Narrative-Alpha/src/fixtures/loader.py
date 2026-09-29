"""Fixture store -- loads CMC-shaped JSON fixtures into model types."""

from __future__ import annotations

import json
from pathlib import Path

from src.models import NarrativeSnapshot, TASignal, TokenQuote


class FixtureStore:
    """Load and query fixture data from JSON files."""

    def __init__(self, fixtures_dir: str = "fixtures") -> None:
        self._dir = Path(fixtures_dir)
        self._narratives: list[dict] = json.loads(
            (self._dir / "narratives.json").read_text()
        )
        self._quotes: list[dict] = json.loads(
            (self._dir / "quotes.json").read_text()
        )
        self._ta: list[dict] = json.loads(
            (self._dir / "ta.json").read_text()
        )

    def get_narratives(
        self, timestamp: str | None = None
    ) -> list[NarrativeSnapshot]:
        """Return narrative snapshots, optionally filtered by *timestamp*."""
        snapshots = self._narratives
        if timestamp is not None:
            snapshots = [s for s in snapshots if s["timestamp"] == timestamp]
        return [
            NarrativeSnapshot(
                timestamp=s["timestamp"], narratives=s["narratives"]
            )
            for s in snapshots
        ]

    def get_quotes(
        self, symbols: list[str], timestamp: str | None = None
    ) -> list[TokenQuote]:
        """Return token quotes for *symbols*, optionally at a *timestamp*."""
        data = self._quotes
        if timestamp is not None:
            data = [d for d in data if d["timestamp"] == timestamp]
        result: list[TokenQuote] = []
        sym_set = set(symbols)
        for snap in data:
            for q in snap["quotes"]:
                if q["symbol"] in sym_set:
                    result.append(
                        TokenQuote(
                            symbol=q["symbol"],
                            price=q["price"],
                            volume_24h=q["volume_24h"],
                            market_cap=q["market_cap"],
                        )
                    )
        return result

    def get_ta(
        self, symbols: list[str], timestamp: str | None = None
    ) -> list[TASignal]:
        """Return TA signals for *symbols*, optionally at a *timestamp*."""
        data = self._ta
        if timestamp is not None:
            data = [d for d in data if d["timestamp"] == timestamp]
        result: list[TASignal] = []
        sym_set = set(symbols)
        for snap in data:
            for sig in snap["signals"]:
                if sig["symbol"] in sym_set:
                    result.append(
                        TASignal(
                            symbol=sig["symbol"],
                            rsi_daily=sig["rsi_daily"],
                            macd=sig["macd"],
                        )
                    )
        return result

    def get_price_series(self) -> list[dict]:
        """Return the raw quote snapshots as a price series for backtesting."""
        return list(self._quotes)
