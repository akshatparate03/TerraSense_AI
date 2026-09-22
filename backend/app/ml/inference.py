from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.core.config import settings
from app.ml.data_pipeline import ALL_FEATURE_COLS

logger = logging.getLogger(__name__)

# Neutral fallback values used ONLY when a field the currently-active
# model's feature_columns needs is not present in the caller's payload
# (e.g. the legacy manual-entry form does not collect soil/construction
# values). These are never presented as measurements -- rows built this
# way are marked in `features_defaulted` in the response so the caller
# can tell which inputs were real vs. filled in.
V2_FIELD_DEFAULTS = {
    "aspect_deg": 180.0,
    "soil_ph": 6.5,
    "sand_pct": 33.0,
    "silt_pct": 33.0,
    "clay_pct": 34.0,
    "building_density_per_km2": 100.0,
    "construction_site_count": 0,
}


class ModelNotLoadedError(RuntimeError):
    pass


class InferenceService:
    """Loads the persisted training pipeline once and serves predictions.
    Raises ModelNotLoadedError (handled by the API as HTTP 503) if the model
    or metadata has not been trained/persisted yet -- never silently returns
    fake numbers."""

    def __init__(self):
        self.pipeline = None
        self.metadata: dict = {}
        self.feature_importance: dict = {}
        self._load()

    def _load(self):
        try:
            if Path(settings.MODEL_PATH).exists():
                self.pipeline = joblib.load(settings.MODEL_PATH)
            if Path(settings.MODEL_METADATA_PATH).exists():
                self.metadata = json.loads(Path(settings.MODEL_METADATA_PATH).read_text())
            fi_path = Path(settings.ARTIFACTS_DIR) / "feature_importance.json"
            if fi_path.exists():
                self.feature_importance = json.loads(fi_path.read_text())
        except Exception as e:  # pragma: no cover
            logger.error(f"Failed loading model artifacts: {e}")

    @property
    def is_ready(self) -> bool:
        return self.pipeline is not None and bool(self.metadata)

    def _classify_risk(self, probability: float) -> str:
        if probability >= settings.RISK_THRESHOLD_HIGH:
            return "HIGH"
        if probability >= settings.RISK_THRESHOLD_MEDIUM:
            return "MEDIUM"
        return "LOW"

    def predict(self, payload: dict) -> dict:
        if not self.is_ready:
            raise ModelNotLoadedError(
                "Model is not trained/loaded yet. Run `python train_model.py` first."
            )

        month = payload.get("month") or datetime.now(timezone.utc).month
        trigger_hint = (payload.get("trigger_hint") or "rain").lower()
        trigger_is_rain = int(trigger_hint == "rain")
        trigger_is_seismic = int(trigger_hint == "seismic")
        trigger_is_other = int(trigger_hint not in ("rain", "seismic"))

        row = {
            "latitude": payload["latitude"],
            "longitude": payload["longitude"],
            "month": month,
            "trigger_is_rain": trigger_is_rain,
            "trigger_is_seismic": trigger_is_seismic,
            "trigger_is_other": trigger_is_other,
            "location_accuracy_km": payload.get("location_accuracy_km", 1.0),
            "rainfall_mm": payload["rainfall_mm"],
            "soil_moisture_pct": payload["soil_moisture_pct"],
            "slope_deg": payload["slope_deg"],
            "elevation_m": payload["elevation_m"],
            "temperature_c": payload["temperature_c"],
            "humidity_pct": payload["humidity_pct"],
        }

        # The active model's OWN recorded feature_columns decide what goes
        # into X -- not a hardcoded constant -- so this works unmodified
        # whether the currently-loaded model is the legacy 13-feature model
        # or the Phase-2 20-feature master-dataset model (spec sections 55,
        # 80-81: live/training feature consistency + no silent schema
        # mismatch). Any v2-only field the caller didn't supply (e.g. a
        # legacy manual-entry request against a promoted v2 model) is
        # filled from V2_FIELD_DEFAULTS and reported in `features_defaulted`
        # rather than silently passed off as a real measurement.
        feature_cols = self.metadata.get("feature_columns", ALL_FEATURE_COLS)
        features_defaulted = []
        for col in feature_cols:
            if col in row:
                continue
            if col in payload and payload[col] is not None:
                row[col] = payload[col]
            else:
                row[col] = V2_FIELD_DEFAULTS.get(col, 0.0)
                features_defaulted.append(col)

        X = pd.DataFrame([row])[feature_cols]

        proba = float(self.pipeline.predict_proba(X)[0, 1])
        risk_level = self._classify_risk(proba)
        confidence = float(max(proba, 1 - proba))

        drivers = []
        for feat, importance in sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]:
            drivers.append({"feature": feat, "importance": float(importance), "value": float(row.get(feat, 0))})

        return {
            "landslide_probability": round(proba, 4),
            "prediction_confidence": round(confidence, 4),
            "risk_level": risk_level,
            "model": self.metadata.get("selected_model", "unknown"),
            "model_version": self.metadata.get("model_version", "v1_legacy"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "features": row,
            "features_defaulted": features_defaulted,
            "risk_drivers": drivers,
            "data_provenance": {
                "real_fields": ["latitude", "longitude", "month", "trigger_hint", "location_accuracy_km"],
                "simulated_demo_fields": [
                    c for c in self.metadata.get("simulated_feature_columns", [])
                ],
                "geo_feature_fields": self.metadata.get("geo_feature_columns", []),
                "note": (
                    "Environmental inputs are either live-retrieved (via /api/predictions/location), "
                    "user-supplied (legacy manual entry), or simulated demo values -- see "
                    "features_defaulted above for any fields this specific request did not supply. "
                    f"Active model dataset: {self.metadata.get('dataset_version', 'unknown')}."
                ),
            },
        }

    def get_info(self) -> dict:
        return {
            "ready": self.is_ready,
            "selected_model": self.metadata.get("selected_model"),
            "dataset_version": self.metadata.get("dataset_version"),
            "training_samples": self.metadata.get("training_samples"),
            "testing_samples": self.metadata.get("testing_samples"),
            "trained_at": self.metadata.get("trained_at_iso"),
            "feature_columns": self.metadata.get("feature_columns"),
            "candidates_evaluated": self.metadata.get("all_candidates_evaluated"),
        }

    def get_metrics(self) -> dict:
        comparison_path = Path(settings.ARTIFACTS_DIR) / "model_comparison.json"
        comparison = json.loads(comparison_path.read_text()) if comparison_path.exists() else {}
        return {
            "selected_model": self.metadata.get("selected_model"),
            "selected_model_metrics": self.metadata.get("metrics"),
            "all_model_comparison": comparison,
        }

    def get_feature_importance(self) -> dict:
        return self.feature_importance

    def _read_artifact_json(self, filename: str) -> dict:
        path = Path(settings.ARTIFACTS_DIR) / filename
        return json.loads(path.read_text()) if path.exists() else {}

    def get_confusion_matrix(self) -> dict:
        return self._read_artifact_json("confusion_matrix.json")

    def get_roc_curve(self) -> dict:
        return self._read_artifact_json("roc_curve.json")

    def get_precision_recall_curve(self) -> dict:
        return self._read_artifact_json("precision_recall_curve.json")

    def get_correlation_matrix(self) -> dict:
        return self._read_artifact_json("correlation_matrix.json")


inference_service = InferenceService()