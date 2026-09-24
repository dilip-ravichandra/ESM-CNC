from __future__ import annotations

import csv
import statistics
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .features import anomaly_score, power_mean_kw, state_for_power


class EnergyReplay:
    def __init__(self, dataset_dir: Path, window_size: int = 20, max_rows_per_file: int = 10000) -> None:
        self.dataset_dir = dataset_dir
        self.window_size = window_size
        self.max_rows_per_file = max_rows_per_file
        self.rows = self._load_rows()
        self.index = 0
        self.cumulative_kwh = {"CNC-01": 0.0, "CNC-02": 0.0}
        self.history: list[dict[str, Any]] = []

    def _load_rows(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for machine_id, filename in (("CNC-01", "partA.csv"), ("CNC-02", "partB.csv")):
            path = self.dataset_dir / filename
            if not path.exists():
                continue
            with path.open(encoding="utf-8-sig", newline="") as handle:
                for row_number, row in enumerate(csv.DictReader(handle)):
                    if row_number >= self.max_rows_per_file:
                        break
                    values = [row.get(f"POWER|{channel}") for channel in range(1, 8)]
                    power_kw = power_mean_kw(values)
                    if power_kw > 0:
                        rows.append({"machineId": machine_id, "powerKw": power_kw})
        if not rows:
            raise FileNotFoundError(
                f"No usable partA.csv or partB.csv files found in {self.dataset_dir}"
            )
        return rows

    def next_tick(self) -> dict[str, Any]:
        row = self.rows[self.index % len(self.rows)]
        self.index += 1
        machine_id = row["machineId"]
        recent = [
            item["powerKw"]
            for item in self.history[-self.window_size :]
            if item["machineId"] == machine_id
        ]
        baseline_mean = statistics.fmean(recent) if recent else row["powerKw"]
        baseline_std = statistics.pstdev(recent) if len(recent) > 1 else 0.1
        score = anomaly_score(row["powerKw"], baseline_mean, baseline_std)
        self.cumulative_kwh[machine_id] += row["powerKw"] / 3600
        tick = {
            "machineId": machine_id,
            "ts": datetime.now(timezone.utc).isoformat(),
            "powerKw": round(row["powerKw"], 4),
            "energyTodayKwh": round(self.cumulative_kwh[machine_id], 4),
            "expectedMinKw": round(max(0.0, baseline_mean - 2 * baseline_std), 4),
            "expectedMaxKw": round(baseline_mean + 2 * baseline_std, 4),
            "anomalyScore": round(score, 4),
            "energyAnomaly": score >= 0.7,
            "state": state_for_power(row["powerKw"]),
            "source": "mendeley_replay",
        }
        self.history.append(tick)
        return tick

    def summary(self, job_id: str) -> dict[str, Any]:
        ticks = [tick for tick in self.history if tick["machineId"] == job_id]
        return {
            "jobId": job_id,
            "samples": len(ticks),
            "energyKwh": round(sum(tick["powerKw"] for tick in ticks) / 3600, 4),
            "peakKw": round(max((tick["powerKw"] for tick in ticks), default=0), 4),
            "anomalyCount": sum(1 for tick in ticks if tick["energyAnomaly"]),
        }
