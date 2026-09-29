"""Tests for strategy emitter."""

import yaml

from src.basket import assemble_basket
from src.emitter import emit_strategy, render_markdown, render_yaml
from src.models import (
    BasketEntry,
    Basket,
    ScoredNarrative,
    StrategyCard,
    StrategyConfig,
    TokenQuote,
)


def _card() -> StrategyCard:
    narrative = ScoredNarrative(
        name="AI Agents", velocity=9.2, acceleration=0.3, rank=1,
        tokens=["FET", "AGIX", "OCEAN", "TAO"],
    )
    quotes = [
        TokenQuote("FET", 1.25, 85e6, 1.05e9),
        TokenQuote("AGIX", 0.82, 62e6, 0.82e9),
        TokenQuote("OCEAN", 0.95, 45e6, 0.61e9),
        TokenQuote("TAO", 420.0, 38e6, 2.9e9),
    ]
    basket = assemble_basket(narrative, quotes)
    config = StrategyConfig()
    return emit_strategy(basket, narrative, config)


def test_emit_returns_card() -> None:
    card = _card()
    assert isinstance(card, StrategyCard)


def test_entry_rule_contains_velocity() -> None:
    card = _card()
    assert "velocity" in card.entry_rule.lower()


def test_yaml_valid() -> None:
    card = _card()
    text = render_yaml(card)
    parsed = yaml.safe_load(text)
    assert "strategy" in parsed
    assert "basket" in parsed["strategy"]
    assert "entry_rule" in parsed["strategy"]


def test_markdown_contains_sections() -> None:
    card = _card()
    md = render_markdown(card)
    for section in ("Entry", "Exit", "Basket"):
        assert section in md
