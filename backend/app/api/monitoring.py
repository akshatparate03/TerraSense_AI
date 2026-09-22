"""
Monitoring API (spec section 35): lets an authenticated user enable/disable
location-based email-alert monitoring, matching the exact endpoint names
requested -- POST /api/monitoring/start, POST /api/monitoring/stop,
GET /api/monitoring/status.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.db_models import User
from app.schemas.schemas import MonitoringStopRequest, MonitoringSubscribeRequest
from app.services import db_service

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


def _serialize(sub) -> dict:
    return {
        "id": sub.id,
        "label": sub.label,
        "email": sub.email,
        "latitude": sub.latitude,
        "longitude": sub.longitude,
        "radius_km": sub.radius_km,
        "alert_threshold": sub.alert_threshold,
        "reset_threshold": sub.reset_threshold,
        "cooldown_minutes": sub.cooldown_minutes,
        "is_active": sub.is_active,
        "alert_state": sub.alert_state,
        "last_checked_at": sub.last_checked_at,
        "last_probability": sub.last_probability,
        "last_alert_sent_at": sub.last_alert_sent_at,
    }


@router.post("/start")
async def start_monitoring(
    payload: MonitoringSubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db_service.list_subscriptions_for_user(db, current_user.id)
    if payload.subscription_id is None and len([s for s in existing if s.is_active]) >= settings.MAX_ACTIVE_SUBSCRIPTIONS_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum of {settings.MAX_ACTIVE_SUBSCRIPTIONS_PER_USER} active monitored locations reached.",
        )

    sub = db_service.create_or_update_subscription(
        db,
        user_id=current_user.id,
        label=payload.label,
        email=payload.email,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km,
        alert_threshold=payload.alert_threshold,
        reset_threshold=payload.reset_threshold,
        cooldown_minutes=payload.cooldown_minutes,
        subscription_id=payload.subscription_id,
    )
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found for this user")
    return _serialize(sub)


@router.post("/stop")
async def stop_monitoring(
    payload: MonitoringStopRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db_service.set_subscription_active(db, payload.subscription_id, current_user.id, is_active=False)
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found for this user")
    return _serialize(sub)


@router.get("/status")
async def monitoring_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subs = db_service.list_subscriptions_for_user(db, current_user.id)
    return {
        "monitoring_enabled_globally": settings.MONITORING_ENABLED,
        "check_interval_minutes": settings.MONITORING_INTERVAL_MINUTES,
        "subscriptions": [_serialize(s) for s in subs],
    }
