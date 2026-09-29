"""Strategy emitter -- produces YAML + Markdown strategy cards."""

from __future__ import annotations

import yaml

from src.models import Basket, ScoredNarrative, StrategyCard, StrategyConfig


def emit_strategy(
    basket: Basket,
    scored_narrative: ScoredNarrative,
    config: StrategyConfig,
) -> StrategyCard:
    """Build a fully specified StrategyCard."""
    entry_rule = (
        f"Enter when narrative velocity > {config.velocity_entry} "
        f"(current: {scored_narrative.velocity:.1f})"
    )
    exit_rule = (
        f"Exit when narrative velocity < {config.velocity_exit} "
        f"or narrative rank drops below top-3"
    )
    position_sizing = (
        f"Market-cap weighted, max {config.max_weight*100:.0f}% per token, "
        f"proportional to narrative velocity"
    )
    invalidation = (
        f"Hard stop at {config.max_drawdown_stop*100:.0f}% portfolio drawdown"
    )
    return StrategyCard(
        basket=basket,
        scored_narrative=scored_narrative,
        config=config,
        entry_rule=entry_rule,
        exit_rule=exit_rule,
        position_sizing=position_sizing,
        invalidation=invalidation,
    )


def render_yaml(card: StrategyCard) -> str:
    """Serialize a StrategyCard to a YAML string."""
    data = {
        "strategy": {
            "narrative": card.scored_narrative.name,
            "velocity": card.scored_narrative.velocity,
            "acceleration": card.scored_narrative.acceleration,
            "rank": card.scored_narrative.rank,
            "basket": [
                {"symbol": e.symbol, "weight": round(e.weight, 4), "market_cap": e.market_cap}
                for e in card.basket.entries
            ],
            "entry_rule": card.entry_rule,
            "exit_rule": card.exit_rule,
            "position_sizing": card.position_sizing,
            "invalidation": card.invalidation,
            "config": {
                "velocity_entry": card.config.velocity_entry,
                "velocity_exit": card.config.velocity_exit,
                "basket_size": card.config.basket_size,
                "max_weight": card.config.max_weight,
                "max_drawdown_stop": card.config.max_drawdown_stop,
            },
        }
    }
    return yaml.dump(data, default_flow_style=False, sort_keys=False)


def render_markdown(card: StrategyCard) -> str:
    """Render a StrategyCard as a Markdown document."""
    lines = [
        f"# Strategy Card: {card.scored_narrative.name}",
        "",
        f"**Narrative:** {card.scored_narrative.name}  ",
        f"**Velocity:** {card.scored_narrative.velocity:.1f}  ",
        f"**Acceleration:** {card.scored_narrative.acceleration:.2f}  ",
        f"**Rank:** {card.scored_narrative.rank}",
        "",
        "## Basket",
        "",
        "| Token | Weight | Market Cap |",
        "|-------|--------|------------|",
    ]
    for e in card.basket.entries:
        lines.append(f"| {e.symbol} | {e.weight:.2%} | ${e.market_cap:,.0f} |")
    lines += [
        "",
        "## Entry",
        "",
        card.entry_rule,
        "",
        "## Exit",
        "",
        card.exit_rule,
        "",
        "## Position Sizing",
        "",
        card.position_sizing,
        "",
        "## Invalidation",
        "",
        card.invalidation,
        "",
    ]
    return "\n".join(lines)
