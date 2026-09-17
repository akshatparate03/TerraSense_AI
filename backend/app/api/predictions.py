from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.ml.inference import ModelNotLoadedError, inference_service
from app.schemas.schemas import PredictionRequest
from app.services import db_service

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


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
async def create_prediction(payload: PredictionRequest, db: Session = Depends(get_db)):
    try:
        result = inference_service.predict(payload.model_dump())
    except ModelNotLoadedError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

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
    )
    alert = db_service.generate_alert_if_needed(db, pred, location.name)

    result["prediction_id"] = pred.id
    result["alert_generated"] = alert is not None
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
