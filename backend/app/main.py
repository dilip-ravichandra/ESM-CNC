from __future__ import annotations

import asyncio
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from .features import anomaly_score
from .stream import EnergyReplay

DATASET_DIR = Path(os.getenv("ECOLEAN_DATASET_DIR", r"C:\Users\dilip\Downloads\dataset"))
replay = EnergyReplay(DATASET_DIR)
app = FastAPI(title="EcoLean Energy Stream", version="1.0.0")


class PredictRequest(BaseModel):
    powerKw: float = Field(ge=0)
    expectedMinKw: float = Field(ge=0)
    expectedMaxKw: float = Field(ge=0)


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "source": "mendeley_replay", "dataset": str(DATASET_DIR)}


@app.post("/predict/anomalyscore")
def predict(request: PredictRequest) -> dict[str, Any]:
    center = (request.expectedMinKw + request.expectedMaxKw) / 2
    spread = max((request.expectedMaxKw - request.expectedMinKw) / 4, 0.001)
    score = anomaly_score(request.powerKw, center, spread)
    return {"anomalyScore": round(score, 4), "energyAnomaly": score >= 0.7}


@app.get("/jobs/{job_id}/summary")
def summary(job_id: str) -> dict[str, Any]:
    return replay.summary(job_id)


@app.websocket("/ws/telemetry")
async def telemetry(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(replay.next_tick())
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return
