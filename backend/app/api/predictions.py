from __future__ import annotations

import math
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.deps import get_current_user, get_current_user_optional
from app.ml.inference import ModelNotLoadedError, inference_service
from app.schemas.schemas import LocationPredictionRequest, PredictionRequest
from app.services import db_service
from app.services.geo_data_service import geo_data_engine

# Representative sand/silt/clay % for the 4 texture buckets the geo engine itself
# uses (see GeoDataEngine._classify_texture) -- applied only when a user picks a
# texture class manually instead of supplying exact percentages.
TEXTURE_PROFILES = {
    "sandy": (80.0, 12.0, 8.0),
    "silty": (15.0, 70.0, 15.0),
    "clay-rich": (20.0, 25.0, 55.0),
    "loam": (40.0, 40.0, 20.0),
}

router = APIRouter(prefix="/api/predictions", tags=["predictions"])
location_router = APIRouter(prefix="/api/location", tags=["location"])


def _serialize(p) -> dict:
    return {
        "id": p.id,
        "location_id": p.location_id,
        "location_name": p.location.name if p.location else None,
        "timestamp": p.timestamp.isoformat() if p.timestamp else None,
        "predicted_class": p.predicted_class,
        "risk_level": p.risk_level,
        "risk_probability": p.risk_probability,
        "model_version": p.model_version,
        "prediction_source": p.prediction_source,
        "input_features": p.input_features,
    }


@router.post("")
async def create_prediction(
    payload: PredictionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    model_payload = payload.model_dump()
    supplied: dict = {}

    texture = (payload.soil_texture_class or "").strip().lower()
    if texture:
        if texture not in TEXTURE_PROFILES:
            raise HTTPException(status_code=422, detail=f"soil_texture_class must be one of {sorted(TEXTURE_PROFILES)}")
        supplied["soil_texture_class"] = texture
        # Only fill percentages the user did not give explicitly.
        sand, silt, clay = TEXTURE_PROFILES[texture]
        if model_payload.get("sand_pct") is None:
            model_payload["sand_pct"], model_payload["silt_pct"], model_payload["clay_pct"] = sand, silt, clay
    if payload.building_count is not None:
        supplied["building_count"] = payload.building_count
        area_km2 = math.pi * (payload.radius_km or settings.DEFAULT_ANALYSIS_RADIUS_KM) ** 2
        model_payload["building_density_per_km2"] = round(payload.building_count / area_km2, 2)
    if payload.construction_site_count is not None:
        supplied["construction_site_count"] = payload.construction_site_count
        model_payload["construction_site_count"] = payload.construction_site_count

    try:
        result = inference_service.predict(model_payload)
    except ModelNotLoadedError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")
    if supplied:
        result["supplied_site_inputs"] = supplied

    location = db_service.get_or_create_location_by_coords(
        db, f"Manual prediction ({payload.latitude:.2f}, {payload.longitude:.2f})", payload.latitude, payload.longitude
    )
    reading = db_service.record_environmental_reading(db, location.id, result["features"], source="user_input")
    active_model = db_service.get_active_model_run(db)
    pred = db_service.record_prediction(
        db,
        location_id=location.id,
        environmental_reading_id=reading.id,
        model_run_id=active_model.id if active_model else None,
        prediction_result=result,
        source="manual",
        user_id=current_user.id if current_user else None,
    )
    alert = db_service.generate_alert_if_needed(db, pred, location.name)

    result["prediction_id"] = pred.id
    result["alert_generated"] = alert is not None
    return result


@router.post("/location")
async def create_location_prediction(
    payload: LocationPredictionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """Primary live-analysis endpoint (spec sections 12-17, 35-36). The user
    supplies only latitude/longitude/radius -- every environmental feature is
    retrieved automatically by the geo data engine. No manual rainfall/soil
    moisture/slope/elevation entry is accepted here."""
    geo = await geo_data_engine.analyze_location(db, payload.latitude, payload.longitude, payload.radius_km)

    if not geo["model_input_ready"]:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Required live data sources (weather and/or terrain) are currently unavailable for this location. "
                "No prediction was generated rather than substituting fabricated values.",
                "data_status": geo["data_status"],
            },
        )

    features = dict(geo["model_input_features"])
    features["latitude"] = payload.latitude
    features["longitude"] = payload.longitude
    features["trigger_hint"] = payload.trigger_hint
    features["location_accuracy_km"] = geo["radius_km"]
    # Phase 2 (v2 model) fields -- included whenever the source is live; the
    # inference layer defaults any it doesn't need (legacy model) or doesn't
    # receive (source unavailable) and reports that in `features_defaulted`.
    soil = geo.get("soil") or {}
    construction = geo.get("construction") or {}
    elevation_slope = geo.get("elevation_slope") or {}
    if soil.get("status") != "UNAVAILABLE":
        features["soil_ph"] = soil.get("soil_ph")
        features["sand_pct"] = soil.get("sand_pct")
        features["silt_pct"] = soil.get("silt_pct")
        features["clay_pct"] = soil.get("clay_pct")
    if construction.get("status") != "UNAVAILABLE":
        features["building_density_per_km2"] = construction.get("building_density_per_km2")
        features["construction_site_count"] = construction.get("active_construction_site_count")
    if elevation_slope.get("status") != "UNAVAILABLE":
        features["aspect_deg"] = elevation_slope.get("aspect_deg")

    try:
        result = inference_service.predict(features)
    except ModelNotLoadedError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    location_name = payload.location_label or f"Live location ({payload.latitude:.4f}, {payload.longitude:.4f})"
    location = db_service.get_or_create_location_by_coords(db, location_name, payload.latitude, payload.longitude)
    reading = db_service.record_environmental_reading(db, location.id, result["features"], source="live_geo_api")
    active_model = db_service.get_active_model_run(db)
    pred = db_service.record_prediction(
        db,
        location_id=location.id,
        environmental_reading_id=reading.id,
        model_run_id=active_model.id if active_model else None,
        prediction_result=result,
        source="live_location",
        user_id=current_user.id if current_user else None,
    )
    alert = db_service.generate_alert_if_needed(db, pred, location.name)

    result["prediction_id"] = pred.id
    result["alert_generated"] = alert is not None
    result["location"] = {"latitude": payload.latitude, "longitude": payload.longitude, "radius_km": geo["radius_km"], "name": location.name}
    result["data_sources"] = {
        "weather": geo["weather"],
        "elevation_slope": geo["elevation_slope"],
        "soil": geo["soil"],
        "construction": geo["construction"],
        "data_status": geo["data_status"],
        "data_quality": geo["data_quality"],
    }
    result["data_provenance"]["model_training_caveat"] = (
        "The currently active model was trained on real landslide events with SIMULATED "
        "environmental features (see /api/model/info). These inputs are real, live "
        "measurements, so predictions should be read as directionally indicative pending "
        "a retrain on real fused environmental data."
    )
    return result


@router.get("")
async def list_predictions(
    db: Session = Depends(get_db),
    limit: int = Query(20, le=200),
    offset: int = Query(0, ge=0),
    location_id: int | None = None,
    risk_level: str | None = None,
    model_version: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    total, items = db_service.list_predictions(
        db, limit, offset, location_id, risk_level, model_version, date_from, date_to
    )
    return {"total": total, "limit": limit, "offset": offset, "items": [_serialize(p) for p in items]}


@router.get("/mine/points")
async def my_prediction_points(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    limit: int = Query(300, le=1000),
):
    """The logged-in user's OWN predicted locations (latest result per place),
    from any page. Powers the Dashboard 3D terrain."""
    points = db_service.get_user_prediction_points(db, current_user.id, limit)
    counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for p in points:
        counts[p["risk_level"]] = counts.get(p["risk_level"], 0) + 1
    return {"points": points, "total": len(points), "counts": counts}


@router.get("/latest")
async def latest_predictions(db: Session = Depends(get_db), limit: int = Query(10, le=100)):
    return {"items": [_serialize(p) for p in db_service.get_latest_predictions(db, limit)]}


@router.get("/high-risk")
async def high_risk_predictions(db: Session = Depends(get_db), limit: int = Query(50, le=200)):
    return {"items": [_serialize(p) for p in db_service.get_high_risk_predictions(db, limit)]}


@router.get("/location/{location_id}")
async def predictions_for_location(location_id: int, db: Session = Depends(get_db), limit: int = Query(50, le=200)):
    total, items = db_service.list_predictions(db, limit=limit, offset=0, location_id=location_id)
    return {"total": total, "items": [_serialize(p) for p in items]}


@router.get("/{prediction_id}")
async def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    p = db_service.get_prediction(db, prediction_id)
    if not p:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return _serialize(p)


@location_router.get("/features")
async def preview_location_features(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5, ge=0.5, le=25),
    db: Session = Depends(get_db),
):
    """Preview-only: fetch and return live geospatial features for a point
    WITHOUT running a prediction or writing to the database. Used by the map
    picker UI to show 'Rainfall (24h): 42mm' etc. before the user hits
    Analyze."""
    return await geo_data_engine.analyze_location(db, latitude, longitude, radius_km)
