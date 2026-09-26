from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import pandas as pd

from app.core.config import settings
from app.core.database import SessionLocal
from app.ml.data_pipeline import (
    build_training_dataset,
    clean_catalog,
    load_raw_catalog,
)
from app.ml.inference import inference_service
from app.services import db_service

logger = logging.getLogger(__name__)

TOTAL_SIM_RECORDS = 500
SPEED_OPTIONS = [0.5, 1, 2, 5, 10, 50, 75, 100]


class SimulationEngine:
    """Historical Data Simulation: replays exactly 500 real catalog records (with
    the same documented simulated environmental features used in training)
    sequentially to emulate a live monitoring feed, persisting every reading /
    prediction / alert to PostgreSQL. This is explicitly NOT live sensor data --
    every payload is labeled `"mode": "historical_data_simulation"`.

    Per requirements: the simulation auto-stops after the 500th record and does
    NOT auto-restart. It must be explicitly reset/started again."""

    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self.index = 0
        self.speed = 1.0
        self.is_running = False
        self.is_paused = False
        self.completed = False
        self._subscribers: list[asyncio.Queue] = []
        self._task: Optional[asyncio.Task] = None
        self._sim_location_id: Optional[int] = None
        self._active_model_run_id: Optional[int] = None

    def _ensure_loaded(self):
        if self._df is None:
            raw = load_raw_catalog(str(settings.DATASET_PATH))
            clean = clean_catalog(raw)
            ds = build_training_dataset(clean, negative_ratio=0.0)
            ds = ds.sort_values("month").reset_index(drop=True)
            self._df = ds.head(TOTAL_SIM_RECORDS)

    @property
    def total_records(self) -> int:
        self._ensure_loaded()
        return len(self._df)

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=20)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

    async def _broadcast(self, payload: dict):
        for q in list(self._subscribers):
            if q.full():
                continue
            await q.put(payload)

    def _record_at(self, idx: int) -> dict:
        self._ensure_loaded()
        row = self._df.iloc[idx]
        return {
            "rainfall_mm": float(row["rainfall_mm"]),
            "soil_moisture_pct": float(row["soil_moisture_pct"]),
            "temperature_c": float(row["temperature_c"]),
            "humidity_pct": float(row["humidity_pct"]),
            "slope_deg": float(row["slope_deg"]),
            "elevation_m": float(row["elevation_m"]),
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "month": int(row["month"]),
            "trigger_hint": "rain" if row["trigger_is_rain"] else ("seismic" if row["trigger_is_seismic"] else "other"),
            "location_accuracy_km": float(row["location_accuracy_km"]),
        }

    def get_full_history(self) -> list[dict]:
        """All 500 records with their ML predictions, for the scrollable
        full-run chart (index 1..500) with hover on all three series."""
        self._ensure_loaded()
        results = []
        for i in range(len(self._df)):
            record = self._record_at(i)
            try:
                prediction = inference_service.predict(record)
            except Exception:
                prediction = None
            results.append(
                {
                    "index": i + 1,
                    "rainfall_mm": record["rainfall_mm"],
                    "soil_moisture_pct": record["soil_moisture_pct"],
                    "temperature_c": record["temperature_c"],
                    "humidity_pct": record["humidity_pct"],
                    "slope_deg": record["slope_deg"],
                    "elevation_m": record["elevation_m"],
                    "probability": prediction["landslide_probability"] * 100 if prediction else None,
                    "risk_level": prediction["risk_level"] if prediction else None,
                }
            )
        return results

    def _persist_tick(self, record: dict, prediction: dict):
        db = SessionLocal()
        try:
            if self._sim_location_id is None:
                loc = db_service.get_or_create_location_by_coords(
                    db, "Historical Simulation Archive", record["latitude"], record["longitude"]
                )
                self._sim_location_id = loc.id
            location = db_service.get_location(db, self._sim_location_id)

            reading = db_service.record_environmental_reading(
                db, self._sim_location_id, record, source="simulated_demo"
            )
            active_model = db_service.get_active_model_run(db)
            pred_row = db_service.record_prediction(
                db,
                location_id=self._sim_location_id,
                environmental_reading_id=reading.id,
                model_run_id=active_model.id if active_model else None,
                prediction_result=prediction,
                source="simulation_archive",
            )
            # IMPORTANT: this replay is a historical/training-data demo, not
            # a live warning -- it deliberately does NOT call
            # generate_alert_if_needed(). Real alerts only come from real
            # live checks: /api/predictions/location, the Live Global Scan
            # (app/services/global_scan_service.py), and email-monitoring
            # subscriptions. Mixing this archive's replayed 500 records into
            # the Alert Center was confusing (every alert showed the same
            # fake "Simulated Monitoring Point" name) and has been removed.
            return pred_row, None
        finally:
            db.close()

    async def _run_loop(self):
        self._ensure_loaded()
        try:
            while self.is_running and self.index < self.total_records:
                if self.is_paused:
                    await asyncio.sleep(0.3)
                    continue
                record = self._record_at(self.index)
                try:
                    prediction = inference_service.predict(record)
                except Exception as e:
                    prediction = {"error": str(e)}

                alert_payload = None
                if "error" not in prediction:
                    pred_row, alert_row = await asyncio.to_thread(self._persist_tick, record, prediction)
                    if alert_row:
                        alert_payload = {
                            "id": alert_row.id,
                            "alert_level": alert_row.alert_level,
                            "title": alert_row.title,
                        }

                message = {
                    "type": "prediction_update",
                    "mode": "historical_data_simulation",
                    "index": self.index + 1,
                    "total_records": self.total_records,
                    "observation": record,
                    "prediction": prediction,
                    "alert": alert_payload,
                    "server_time": datetime.now(timezone.utc).isoformat(),
                }
                await self._broadcast(message)
                self.index += 1
                await asyncio.sleep(max(0.03, 2.0 / self.speed))

            # Reached the end of the 500 records (or stopped) -> do NOT loop
            # back to the start automatically.
            if self.index >= self.total_records:
                self.is_running = False
                self.completed = True
                await self._broadcast(
                    {
                        "type": "simulation_completed",
                        "mode": "historical_data_simulation",
                        "message": "Historical data simulation finished after 500 records. Press Reset to run again.",
                        "total_records": self.total_records,
                    }
                )
        except asyncio.CancelledError:
            pass

    def start(self, speed: Optional[float] = None):
        self._ensure_loaded()
        if self.completed or self.index >= self.total_records:
            # Do not silently auto-restart; caller must reset first.
            return self.status()
        if speed:
            self.set_speed(speed)
        self.is_running = True
        self.is_paused = False
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run_loop())
        return self.status()

    def pause(self):
        self.is_paused = True
        return self.status()

    def resume(self):
        if not self.completed:
            self.is_paused = False
        return self.status()

    def stop(self):
        self.is_running = False
        self.is_paused = False
        if self._task:
            self._task.cancel()
            self._task = None
        return self.status()

    def reset(self):
        self.stop()
        self.index = 0
        self.completed = False
        return self.status()

    def set_speed(self, speed: float):
        # snap to nearest supported option, capped at 50x
        self.speed = max(0.25, min(100.0, speed))
        return self.status()

    def status(self) -> dict:
        return {
            "status": "completed" if self.completed else ("running" if self.is_running and not self.is_paused else ("paused" if self.is_paused else "stopped")),
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "completed": self.completed,
            "speed": self.speed,
            "current_index": self.index,
            "total_records": self.total_records,
            "speed_options": SPEED_OPTIONS,
        }


simulation_engine = SimulationEngine()
