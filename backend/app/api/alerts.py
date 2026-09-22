from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.db_models import User
from app.services import db_service, monitoring_service

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertStatusUpdate(BaseModel):
    status: str  # ACTIVE | ACKNOWLEDGED | RESOLVED


class AlertTestRequest(BaseModel):
    subscription_id: int


def _serialize(a) -> dict:
    return {
        "id": a.id,
        "prediction_id": a.prediction_id,
        "location_id": a.location_id,
        "location_name": a.location.name if a.location else None,
        "latitude": a.location.latitude if a.location else None,
        "longitude": a.location.longitude if a.location else None,
        "country": a.location.country if a.location else None,
        "alert_level": a.alert_level,
        "title": a.title,
        "message": a.message,
        "triggered_at": a.triggered_at.isoformat() if a.triggered_at else None,
        "status": a.status,
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
        "risk_probability": a.prediction.risk_probability if a.prediction else None,
        "prediction_source": a.prediction.prediction_source if a.prediction else None,
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


@router.post("/test")
async def send_test_alert(
    payload: AlertTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Spec section 35/75: let a user verify their monitoring/email setup
    works by forcing one immediate check-and-send for a subscription they
    own, bypassing the alert_threshold/cooldown gate (force_email=True)."""
    sub = db_service.get_subscription_for_user(db, payload.subscription_id, current_user.id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found for this user")
    result = await monitoring_service.check_subscription(db, sub, force_email=True)
    return result


@router.get("/email-history")
async def email_alert_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(100, le=500),
):
    """Spec section 86 'Alert History' -- the real email send log, distinct
    from the in-app /api/alerts list above."""
    items = db_service.list_email_alert_history(db, current_user.id, limit=limit)
    return {
        "total": len(items),
        "items": [
            {
                "id": i.id,
                "subscription_id": i.subscription_id,
                "email": i.email,
                "probability": i.probability,
                "risk_level": i.risk_level,
                "threshold_at_send": i.threshold_at_send,
                "delivery_status": i.delivery_status,
                "sent_at": i.sent_at.isoformat() if i.sent_at else None,
            }
            for i in items
        ],
    }


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