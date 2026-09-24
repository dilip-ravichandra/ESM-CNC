from __future__ import annotations

from collections.abc import Iterable
from math import isfinite


def power_mean_kw(values: Iterable[object]) -> float:
    """Convert the repository's POWER channels into a positive kW estimate."""
    numeric = []
    for value in values:
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if isfinite(number) and number > 0:
            numeric.append(number)
    if not numeric:
        return 0.0
    mean = sum(numeric) / len(numeric)
    return mean / 1000 if mean > 100 else mean


def anomaly_score(power_kw: float, baseline_mean: float, baseline_std: float) -> float:
    if baseline_std <= 0:
        return 0.0 if power_kw == baseline_mean else 1.0
    return min(1.0, abs(power_kw - baseline_mean) / (3 * baseline_std))


def state_for_power(power_kw: float) -> str:
    return "idle" if power_kw < 0.5 else "cutting"
