"""Narrative scorer -- velocity and acceleration computation."""

from __future__ import annotations

from src.models import NarrativeSnapshot, ScoredNarrative


def compute_velocity(
    snapshots: list[NarrativeSnapshot], narrative_name: str
) -> float:
    """Extract velocity for *narrative_name* from the latest snapshot.

    Returns 0.0 if the narrative is not found.
    """
    if not snapshots:
        return 0.0
    latest = snapshots[-1]
    for narr in latest.narratives:
        if narr["name"] == narrative_name:
            return float(narr.get("velocity", 0.0))
    return 0.0


def compute_acceleration(velocities: list[float]) -> float:
    """Delta of velocity over the last two periods.

    Returns 0.0 if fewer than 2 values are provided.
    """
    if len(velocities) < 2:
        return 0.0
    return velocities[-1] - velocities[-2]


def rank_narratives(
    snapshots: list[NarrativeSnapshot],
) -> list[ScoredNarrative]:
    """Score and rank all narratives by velocity (descending).

    For each narrative found across the snapshots, computes velocity from the
    latest snapshot and acceleration from the last two snapshots.
    """
    if not snapshots:
        return []

    narrative_names: dict[str, list[str]] = {}
    for snap in snapshots:
        for narr in snap.narratives:
            name = narr["name"]
            if name not in narrative_names:
                narrative_names[name] = narr.get("tokens", [])

    scored: list[ScoredNarrative] = []
    for name, tokens in narrative_names.items():
        velocities: list[float] = []
        for snap in snapshots:
            for narr in snap.narratives:
                if narr["name"] == name:
                    velocities.append(float(narr.get("velocity", 0.0)))
                    break

        velocity = velocities[-1] if velocities else 0.0
        acceleration = compute_acceleration(velocities)
        scored.append(
            ScoredNarrative(
                name=name,
                velocity=velocity,
                acceleration=acceleration,
                rank=0,
                tokens=list(tokens),
            )
        )

    scored.sort(key=lambda s: s.velocity, reverse=True)

    ranked: list[ScoredNarrative] = []
    for idx, s in enumerate(scored, start=1):
        ranked.append(
            ScoredNarrative(
                name=s.name,
                velocity=s.velocity,
                acceleration=s.acceleration,
                rank=idx,
                tokens=s.tokens,
            )
        )
    return ranked
