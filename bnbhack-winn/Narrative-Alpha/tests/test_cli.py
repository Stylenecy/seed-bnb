"""Tests for the CLI entry point."""

import subprocess
import sys


def test_cli_fixture_mode() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "src", "run", "--mode", "fixture"],
        capture_output=True,
        text=True,
        cwd=".",
    )
    assert result.returncode == 0, f"stderr: {result.stderr}"
    assert "Top narrative" in result.stdout
    assert "Backtest Results" in result.stdout
