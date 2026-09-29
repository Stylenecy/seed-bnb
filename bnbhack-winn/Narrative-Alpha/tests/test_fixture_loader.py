"""Tests for the fixture store loader."""

from src.fixtures.loader import FixtureStore
from src.models import NarrativeSnapshot, TASignal, TokenQuote


def _store() -> FixtureStore:
    return FixtureStore(fixtures_dir="fixtures")


def test_get_narratives_returns_all() -> None:
    snapshots = _store().get_narratives()
    assert len(snapshots) >= 10
    assert all(isinstance(s, NarrativeSnapshot) for s in snapshots)


def test_get_narratives_by_timestamp() -> None:
    snapshots = _store().get_narratives(timestamp="2026-01-01")
    assert len(snapshots) == 1
    assert snapshots[0].timestamp == "2026-01-01"


def test_get_quotes_returns_tokens() -> None:
    quotes = _store().get_quotes(["FET", "AGIX"], timestamp="2026-01-01")
    symbols = {q.symbol for q in quotes}
    assert "FET" in symbols
    assert "AGIX" in symbols
    assert all(isinstance(q, TokenQuote) for q in quotes)


def test_get_ta_returns_signals() -> None:
    signals = _store().get_ta(["FET"], timestamp="2026-01-01")
    assert len(signals) >= 1
    assert all(isinstance(s, TASignal) for s in signals)


def test_get_price_series() -> None:
    series = _store().get_price_series()
    assert len(series) >= 2
    first = series[0]
    assert "timestamp" in first
    assert "quotes" in first
