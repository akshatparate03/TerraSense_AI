from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import db_service

router = APIRouter(prefix="/api/locations", tags=["locations"])


class LocationIn(BaseModel):
    name: str = Field(..., max_length=200)
    region: str | None = None
    country: str | None = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    elevation: float | None = None


class LocationUpdate(BaseModel):
    name: str | None = None
    region: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    elevation: float | None = None


def _serialize(loc, db: Session) -> dict:
    total_preds, recent_preds = db_service.list_predictions(db, limit=200, offset=0, location_id=loc.id)
    latest_risk = recent_preds[0].risk_level if recent_preds else None
    active_alerts = sum(1 for p in recent_preds for a in p.alerts if a.status == "ACTIVE")
    return {
        "id": loc.id,
        "name": loc.name,
        "region": loc.region,
        "country": loc.country,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "elevation": loc.elevation,
        "is_active": loc.is_active,
        "prediction_count": total_preds,
        "latest_risk_level": latest_risk,
        "active_alert_count": active_alerts,
        "created_at": loc.created_at.isoformat() if loc.created_at else None,
    }


@router.get("")
async def list_locations(db: Session = Depends(get_db)):
    return {"items": [_serialize(loc, db) for loc in db_service.list_locations(db)]}


@router.post("")
async def create_location(payload: LocationIn, db: Session = Depends(get_db)):
    loc = db_service.create_location(db, payload.model_dump())
    return _serialize(loc, db)


@router.get("/{location_id}")
async def get_location(location_id: int, db: Session = Depends(get_db)):
    loc = db_service.get_location(db, location_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return _serialize(loc, db)


@router.put("/{location_id}")
async def update_location(location_id: int, payload: LocationUpdate, db: Session = Depends(get_db)):
    loc = db_service.update_location(db, location_id, payload.model_dump(exclude_unset=True))
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return _serialize(loc, db)


@router.delete("/{location_id}")
async def delete_location(location_id: int, db: Session = Depends(get_db)):
    ok = db_service.delete_location(db, location_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location removed (soft-deleted if it had prediction/event history)."}
