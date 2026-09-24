from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
from pathlib import Path

from app.features import anomaly_score, power_mean_kw, state_for_power


def preprocess(dataset_dir: Path, output_path: Path) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    baseline: list[float] = []
    count = 0
    with output_path.open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "timestamp", "machine_id", "power_kw", "energy_kwh_cum",
                "state", "anomaly_score",
            ],
        )
        writer.writeheader()
        cumulative = {"CNC-01": 0.0, "CNC-02": 0.0}
        for machine_id, filename in (("CNC-01", "partA.csv"), ("CNC-02", "partB.csv")):
            path = dataset_dir / filename
            if not path.exists():
                continue
            with path.open(encoding="utf-8-sig", newline="") as source:
                for row in csv.DictReader(source):
                    power = power_mean_kw(row.get(f"POWER|{i}") for i in range(1, 8))
                    if power <= 0:
                        continue
                    recent = baseline[-20:]
                    mean = sum(recent) / len(recent) if recent else power
                    variance = sum((value - mean) ** 2 for value in recent) / len(recent) if recent else 0.01
                    std = variance ** 0.5
                    score = anomaly_score(power, mean, max(std, 0.1))
                    cumulative[machine_id] += power / 3600
                    writer.writerow({
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "machine_id": machine_id,
                        "power_kw": round(power, 6),
                        "energy_kwh_cum": round(cumulative[machine_id], 6),
                        "state": state_for_power(power),
                        "anomaly_score": round(score, 6),
                    })
                    baseline.append(power)
                    count += 1
    return count


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-dir", type=Path, default=Path(r"C:\Users\dilip\Downloads\dataset"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/energy_windows.csv"))
    args = parser.parse_args()
    print(f"Wrote {preprocess(args.dataset_dir, args.output)} rows to {args.output}")
