"""Tests for basket assembler."""

import math

from src.basket import assemble_basket
from src.models import ScoredNarrative, TokenQuote


def _narrative() -> ScoredNarrative:
    return ScoredNarrative(
        name="AI Agents",
        velocity=9.2,
        acceleration=0.3,
        rank=1,
        tokens=["FET", "AGIX", "OCEAN", "TAO", "EXTRA"],
    )


def _quotes() -> list[TokenQuote]:
    return [
        TokenQuote(symbol="FET", price=1.25, volume_24h=85e6, market_cap=1.05e9),
        TokenQuote(symbol="AGIX", price=0.82, volume_24h=62e6, market_cap=0.82e9),
        TokenQuote(symbol="OCEAN", price=0.95, volume_24h=45e6, market_cap=0.61e9),
        TokenQuote(symbol="TAO", price=420.0, volume_24h=38e6, market_cap=2.9e9),
        TokenQuote(symbol="RNDR", price=7.5, volume_24h=120e6, market_cap=2.8e9),
    ]


def test_basket_size_capped() -> None:
    basket = assemble_basket(_narrative(), _quotes(), basket_size=3)
    assert len(basket.entries) <= 3


def test_weights_sum_to_one() -> None:
    basket = assemble_basket(_narrative(), _quotes())
    assert math.isclose(basket.total_weight, 1.0, abs_tol=1e-9)


def test_max_weight_enforced() -> None:
    basket = assemble_basket(_narrative(), _quotes(), max_weight=0.40)
    for entry in basket.entries:
        assert entry.weight <= 0.40 + 1e-9


def test_empty_quotes_returns_empty_basket() -> None:
    basket = assemble_basket(_narrative(), [])
    assert len(basket.entries) == 0
    assert basket.total_weight == 0.0
