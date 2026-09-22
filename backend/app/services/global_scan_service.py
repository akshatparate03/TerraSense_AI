"""
Live Global Risk Scan
========================

Replaces the misleading "Live Monitoring" page (which actually replayed 500
historical catalog records under one fake location called "Simulated
Monitoring Point") with a genuinely live feature: on demand, check the
CURRENT estimated landslide risk at every real, named location on
TerraSense's watchlist (the 27 curated landslide-prone regions seeded by
scripts/seed_database.py -- Shimla, Kathmandu Valley, Wayanad, Rio de
Janeiro Hillsides, etc.), using the exact same live geo-data-engine +
inference pipeline as `/api/predictions/location`.

Honesty note (important): this checks a curated watchlist of real,
named, landslide-prone regions -- it does NOT scan literally every point on
Earth (that would mean millions of API calls and isn't how any real
early-warning system works either; national agencies also monitor curated
watch-lists of known-vulnerable regions, not an unbounded grid). The
watchlist can be extended any time via `POST /api/locations`.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.ml.inference import ModelNotLoadedError, inference_service
from app.models.db_models import Location
from app.services import db_service
from app.services.geo_data_service import geo_data_engine

logger = logging.getLogger(__name__)


async def scan_one_location(db: Session, location: Location) -> dict:
    """Runs one real live check for one watchlist location and persists a
    real EnvironmentalReading + Prediction + (if warranted) Alert tied to
    that location's REAL name -- never a placeholder like 'Simulated
    Monitoring Point'."""
    result = {
        "location_id": location.id,
        "name": location.name,
        "country": location.country,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        geo = await geo_data_engine.analyze_location(db, location.latitude, location.longitude, radius_km=5)
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Global scan: geo fetch failed for {location.name}: {e}")
        result.update(status="error", message=str(e))
        return result

    if not geo["model_input_ready"]:
        result.update(status="data_unavailable", data_status=geo["data_status"])
        return result

    features = dict(geo["model_input_features"])
    features["latitude"] = location.latitude
    features["longitude"] = location.longitude
    features["trigger_hint"] = "rain"
    features["location_accuracy_km"] = 5
    soil, construction, elevation_slope = geo.get("soil") or {}, geo.get("construction") or {}, geo.get("elevation_slope") or {}
    if soil.get("status") != "UNAVAILABLE":
        features.update(soil_ph=soil.get("soil_ph"), sand_pct=soil.get("sand_pct"), silt_pct=soil.get("silt_pct"), clay_pct=soil.get("clay_pct"))
    if construction.get("status") != "UNAVAILABLE":
        features.update(
            building_density_per_km2=construction.get("building_density_per_km2"),
            construction_site_count=construction.get("active_construction_site_count"),
        )
    if elevation_slope.get("status") != "UNAVAILABLE":
        features["aspect_deg"] = elevation_slope.get("aspect_deg")

    try:
        prediction = inference_service.predict(features)
    except ModelNotLoadedError as e:
        result.update(status="error", message=str(e))
        return result

    reading = db_service.record_environmental_reading(db, location.id, prediction["features"], source="live_geo_api")
    active_model = db_service.get_active_model_run(db)
    pred_row = db_service.record_prediction(
        db,
        location_id=location.id,
        environmental_reading_id=reading.id,
        model_run_id=active_model.id if active_model else None,
        prediction_result=prediction,
        source="global_scan",
    )
    alert = db_service.generate_alert_if_needed(db, pred_row, location.name)

    result.update(
        status="ok",
        probability=prediction["landslide_probability"],
        risk_level=prediction["risk_level"],
        data_quality=geo["data_quality"],
        alert_generated=alert is not None,
    )
    return result


async def run_global_scan(db: Session) -> dict:
    """One full pass over every active watchlist location. Returns results
    sorted by probability (highest risk first) -- one location's failure
    never stops the rest (spec section 97 pattern, same as monitoring_service)."""
    locations = db_service.list_locations(db, active_only=True)
    results = []
    for loc in locations:
        try:
            results.append(await scan_one_location(db, loc))
        except Exception as e:  # noqa: BLE001
            logger.error(f"Global scan: unhandled error for {loc.name}: {e}")
            results.append({"location_id": loc.id, "name": loc.name, "status": "error", "message": str(e)})

    results.sort(key=lambda r: r.get("probability") if r.get("probability") is not None else -1, reverse=True)
    ok_count = sum(1 for r in results if r["status"] == "ok")
    return {
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "total_locations": len(locations),
        "successful": ok_count,
        "results": results,
    }
