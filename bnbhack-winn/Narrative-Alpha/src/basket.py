"""Basket assembler -- token selection and weighting."""

from __future__ import annotations

from src.models import Basket, BasketEntry, ScoredNarrative, TokenQuote


def assemble_basket(
    narrative: ScoredNarrative,
    quotes: list[TokenQuote],
    basket_size: int = 4,
    max_weight: float = 0.40,
) -> Basket:
    """Assemble a market-cap-weighted basket for *narrative*.

    Filters *quotes* to tokens in the narrative, sorts by market_cap descending,
    takes top *basket_size*, weights proportional to market_cap, caps each weight
    at *max_weight* and redistributes excess equally among remaining entries.
    """
    token_set = set(narrative.tokens)
    relevant = [q for q in quotes if q.symbol in token_set]
    relevant.sort(key=lambda q: q.market_cap, reverse=True)
    relevant = relevant[:basket_size]

    if not relevant:
        return Basket(narrative_name=narrative.name, entries=[], total_weight=0.0)

    total_mcap = sum(q.market_cap for q in relevant)
    raw_weights = [q.market_cap / total_mcap for q in relevant]

    capped = _redistribute(raw_weights, max_weight)

    entries = [
        BasketEntry(symbol=q.symbol, weight=w, market_cap=q.market_cap)
        for q, w in zip(relevant, capped)
    ]
    return Basket(
        narrative_name=narrative.name,
        entries=entries,
        total_weight=round(sum(capped), 10),
    )


def _redistribute(weights: list[float], cap: float) -> list[float]:
    """Cap each weight at *cap* and redistribute excess equally."""
    n = len(weights)
    result = list(weights)
    for _ in range(n * 2):
        excess = 0.0
        under_count = 0
        for i in range(n):
            if result[i] > cap:
                excess += result[i] - cap
                result[i] = cap
            else:
                under_count += 1
        if excess == 0.0 or under_count == 0:
            break
        share = excess / under_count
        for i in range(n):
            if result[i] < cap:
                result[i] += share
    return result
