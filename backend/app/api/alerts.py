from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import db_service

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertStatusUpdate(BaseModel):
    status: str  # ACTIVE | ACKNOWLEDGED | RESOLVED


def _serialize(a) -> dict:
    return {
        "id": a.id,
        "prediction_id": a.prediction_id,
        "location_id": a.location_id,
        "location_name": a.location.name if a.location else None,
        "alert_level": a.alert_level,
        "title": a.title,
        "message": a.message,
        "triggered_at": a.triggered_at.isoformat() if a.triggered_at else None,
        "status": a.status,
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
        "risk_probability": a.prediction.risk_probability if a.prediction else None,
        "note": "Automated risk alert - not a certified emergency warning.",
    }


@router.get("")
async def list_alerts(db: Session = Depends(get_db), limit: int = Query(50, le=200), offset: int = 0, status: str | None = None):
    total, items = db_service.list_alerts(db, status=status, limit=limit, offset=offset)
    return {"total": total, "items": [_serialize(a) for a in items]}


@router.get("/active")
async def active_alerts(db: Session = Depends(get_db)):
    total, items = db_service.list_alerts(db, status="ACTIVE", limit=200, offset=0)
    return {"total": total, "items": [_serialize(a) for a in items]}


@router.get("/history")
async def alert_history(db: Session = Depends(get_db), limit: int = Query(100, le=500)):
    total, items = db_service.list_alerts(db, status=None, limit=limit, offset=0)
    return {"total": total, "items": [_serialize(a) for a in items]}


@router.get("/{alert_id}")
async def get_alert(alert_id: int, db: Session = Depends(get_db)):
    a = db_service.get_alert(db, alert_id)
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _serialize(a)


@router.patch("/{alert_id}/status")
async def update_alert_status(alert_id: int, payload: AlertStatusUpdate, db: Session = Depends(get_db)):
    if payload.status.upper() not in ("ACTIVE", "ACKNOWLEDGED", "RESOLVED"):
        raise HTTPException(status_code=422, detail="status must be ACTIVE, ACKNOWLEDGED, or RESOLVED")
    a = db_service.update_alert_status(db, alert_id, payload.status)
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _serialize(a)