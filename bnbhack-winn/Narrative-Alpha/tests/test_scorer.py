"""Tests for narrative scorer."""

from src.models import NarrativeSnapshot
from src.scorer import compute_acceleration, compute_velocity, rank_narratives


def _make_snapshots() -> list[NarrativeSnapshot]:
    return [
        NarrativeSnapshot(
            timestamp="2026-01-01",
            narratives=[
                {"name": "AI Agents", "rank": 1, "velocity": 9.2, "tokens": ["FET", "AGIX"]},
                {"name": "DePIN", "rank": 2, "velocity": 6.5, "tokens": ["RNDR", "HNT"]},
            ],
        ),
        NarrativeSnapshot(
            timestamp="2026-01-04",
            narratives=[
                {"name": "AI Agents", "rank": 1, "velocity": 9.5, "tokens": ["FET", "AGIX"]},
                {"name": "DePIN", "rank": 2, "velocity": 6.8, "tokens": ["RNDR", "HNT"]},
            ],
        ),
    ]


def test_velocity_positive_for_trending() -> None:
    snapshots = _make_snapshots()
    vel = compute_velocity(snapshots, "AI Agents")
    assert vel > 0


def test_velocity_zero_for_missing() -> None:
    snapshots = _make_snapshots()
    vel = compute_velocity(snapshots, "Unknown")
    assert vel == 0.0


def test_acceleration_positive_when_increasing() -> None:
    acc = compute_acceleration([5.0, 7.0, 9.5])
    assert acc > 0


def test_acceleration_zero_with_single_value() -> None:
    acc = compute_acceleration([5.0])
    assert acc == 0.0


def test_rank_narratives_sorted_by_velocity() -> None:
    snapshots = _make_snapshots()
    ranked = rank_narratives(snapshots)
    assert len(ranked) >= 2
    assert ranked[0].velocity >= ranked[1].velocity
    assert ranked[0].rank == 1
