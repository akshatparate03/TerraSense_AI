from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import db_service

router = APIRouter(prefix="/api/landslide-events", tags=["landslide-events"])


def _serialize(e) -> dict:
    return {
        "id": e.id,
        "location_id": e.location_id,
        "event_date": e.event_date.isoformat() if e.event_date else None,
        "latitude": e.latitude,
        "longitude": e.longitude,
        "severity": e.severity,
        "category": e.category,
        "trigger": e.trigger,
        "country": e.country,
        "title": e.title,
        "fatality_count": e.fatality_count,
        "source": e.source,
    }


@router.get("")
async def list_events(
    db: Session = Depends(get_db),
    limit: int = Query(50, le=500),
    offset: int = Query(0, ge=0),
    country: str | None = None,
    location_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    total, items = db_service.list_landslide_events(db, limit, offset, country, location_id, date_from, date_to)
    return {"total": total, "limit": limit, "offset": offset, "items": [_serialize(e) for e in items]}


@router.get("/{event_id}")
async def get_event(event_id: int, db: Session = Depends(get_db)):
    e = db_service.get_landslide_event(db, event_id)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    return _serialize(e)
